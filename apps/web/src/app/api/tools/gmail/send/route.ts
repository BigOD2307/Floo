import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { googleApiFetch, getGoogleUserIdByPhone } from "@/lib/google-api"

/**
 * POST /api/tools/gmail/send
 * Envoie un email via Gmail (utilisateur connecté Google).
 * Auth: session NextAuth ou X-Floo-Gateway-Key + phoneNumber (gateway).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    let userId: string | null = null

    if (isGatewayAuthenticated(req)) {
      const phone = body?.phoneNumber ?? body?.phone
      if (!phone) {
        return NextResponse.json({ error: "phoneNumber requis (gateway)" }, { status: 400 })
      }
      userId = await getGoogleUserIdByPhone(phone)
    } else {
      const session = await getServerSession(authOptions)
      userId = session?.user?.id ?? null
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé ou Google non connecté" },
        { status: 401 }
      )
    }
    const to = typeof body?.to === "string" ? body.to.trim() : ""
    const subject = typeof body?.subject === "string" ? body.subject.trim() : ""
    const text = typeof body?.body === "string" ? body.body : typeof body?.text === "string" ? body.text : ""

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Paramètres 'to' et 'subject' requis" },
        { status: 400 }
      )
    }

    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      text,
    ].join("\n")
    const encoded = Buffer.from(message, "utf8").toString("base64url")

    const res = await googleApiFetch(userId, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: encoded }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return NextResponse.json(
        { error: err.error?.message || `Gmail API ${res.status}` },
        { status: res.status }
      )
    }

    const data = (await res.json()) as { id?: string }
    return NextResponse.json({ ok: true, messageId: data.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Erreur envoi email", details: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 500 }
    )
  }
}

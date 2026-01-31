import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { googleApiFetch, getGoogleUserIdByPhone } from "@/lib/google-api"

/**
 * POST /api/tools/gmail/list
 * Liste les derniers emails (max 10).
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

    const maxResults = 10
    const res = await googleApiFetch(
      userId,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`
    )

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      return NextResponse.json(
        { error: err.error?.message || `Gmail API ${res.status}` },
        { status: res.status }
      )
    }

    const list = (await res.json()) as { messages?: Array<{ id: string }> }
    const ids = (list.messages ?? []).map((m) => m.id)

    const emails: Array<{ from: string; subject: string; snippet: string; date: string }> = []
    for (const id of ids.slice(0, 5)) {
      const msgRes = await googleApiFetch(userId, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`)
      if (!msgRes.ok) continue
      const msg = (await msgRes.json()) as {
        payload?: {
          headers?: Array<{ name: string; value: string }>
          snippet?: string
        }
      }
      const headers = msg.payload?.headers ?? []
      const getHeader = (n: string) => headers.find((h) => h.name.toLowerCase() === n.toLowerCase())?.value ?? ""
      emails.push({
        from: getHeader("From"),
        subject: getHeader("Subject"),
        snippet: (msg.payload?.snippet ?? "").slice(0, 200),
        date: getHeader("Date"),
      })
    }

    return NextResponse.json({ ok: true, emails })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Erreur liste emails", details: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 500 }
    )
  }
}

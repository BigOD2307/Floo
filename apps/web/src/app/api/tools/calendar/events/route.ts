import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { googleApiFetch, getGoogleUserIdByPhone } from "@/lib/google-api"

/**
 * POST /api/tools/calendar/events
 * Liste les événements à venir ou crée un événement.
 * Auth: session NextAuth ou X-Floo-Gateway-Key + phoneNumber (gateway).
 * Body: { action: "list" | "create", phoneNumber?, ... }
 * Pour create: { summary, start, end, description? }
 */
export async function POST(req: Request) {
  try {
    let userId: string | null = null

    const body = await req.json().catch(() => ({}))
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

    const action = body?.action ?? "list"

    if (action === "list") {
      const now = new Date().toISOString()
      const res = await googleApiFetch(
        userId,
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=10&singleEvents=true&orderBy=startTime`
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        return NextResponse.json(
          { error: err.error?.message || `Calendar API ${res.status}` },
          { status: res.status }
        )
      }
      const data = (await res.json()) as {
        items?: Array<{
          summary?: string
          start?: { dateTime?: string; date?: string }
          end?: { dateTime?: string; date?: string }
          description?: string
        }>
      }
      const events = (data.items ?? []).map((e) => ({
        summary: e.summary ?? "Sans titre",
        start: e.start?.dateTime ?? e.start?.date,
        end: e.end?.dateTime ?? e.end?.date,
      }))
      return NextResponse.json({ ok: true, events })
    }

    if (action === "create") {
      const summary = typeof body?.summary === "string" ? body.summary.trim() : ""
      const start = body?.start ?? body?.startTime
      const end = body?.end ?? body?.endTime
      const description = typeof body?.description === "string" ? body.description : ""

      if (!summary || !start || !end) {
        return NextResponse.json(
          { error: "Paramètres summary, start et end requis pour créer un événement" },
          { status: 400 }
        )
      }

      const event = {
        summary,
        description: description || undefined,
        start: { dateTime: start, timeZone: "Africa/Abidjan" },
        end: { dateTime: end, timeZone: "Africa/Abidjan" },
      }

      const res = await googleApiFetch(
        userId,
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        { method: "POST", body: JSON.stringify(event) }
      )

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        return NextResponse.json(
          { error: err.error?.message || `Calendar API ${res.status}` },
          { status: res.status }
        )
      }
      const created = (await res.json()) as { id?: string; htmlLink?: string }
      return NextResponse.json({ ok: true, eventId: created.id, link: created.htmlLink })
    }

    return NextResponse.json({ error: "action invalide (list ou create)" }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Erreur Calendar", details: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { searchWeb } from "@/lib/search"

/**
 * POST /api/tools/reservation
 * Recherche des options de réservation (restaurants, etc.) - placeholder.
 * Pour l'instant: recherche web puis retourne les résultats.
 * Auth: session NextAuth ou X-Floo-Gateway-Key (gateway).
 */
export async function POST(req: Request) {
  try {
    const gatewayOk = isGatewayAuthenticated(req)
    if (!gatewayOk) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
      }
    }

    const body = await req.json().catch(() => ({}))
    const query = typeof body?.query === "string" ? body.query.trim() : ""
    const type = (body?.type as string) || "restaurant"

    if (!query) {
      return NextResponse.json(
        { error: "Paramètre 'query' requis (ex: restaurant Abidjan)" },
        { status: 400 }
      )
    }

    const searchQuery = `${type} réservation ${query} avis`
    const { results, provider } = await searchWeb(searchQuery)

    return NextResponse.json({
      ok: true,
      type,
      query,
      results: results.slice(0, 8),
      provider,
      note: "Réservation directe à venir. Résultats de recherche pour l'instant.",
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: "Erreur recherche réservation",
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    )
  }
}

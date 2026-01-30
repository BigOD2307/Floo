import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { searchWeb } from "@/lib/search"

/**
 * POST /api/tools/search
 * Body: { q: string }
 * Recherche web (Serper ou DuckDuckGo). Auth: session NextAuth ou X-Floo-Gateway-Key (gateway).
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
    const q = typeof body?.q === "string" ? body.q.trim() : ""
    if (!q) {
      return NextResponse.json(
        { error: "Paramètre 'q' (requête) requis" },
        { status: 400 }
      )
    }

    const { results, provider } = await searchWeb(q)
    return NextResponse.json({ results, provider })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Recherche échouée", details: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 500 }
    )
  }
}

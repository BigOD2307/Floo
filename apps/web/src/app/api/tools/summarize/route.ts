import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { summarizeContent } from "@/lib/summarize"
import { scrapeUrl } from "@/lib/scrape"

/**
 * POST /api/tools/summarize
 * Résume un texte ou le contenu d'une URL.
 * Auth: session NextAuth ou X-Floo-Gateway-Key (gateway).
 * Body: { content? } ou { url? } — si url, on scrape puis résume
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
    let content = typeof body?.content === "string" ? body.content.trim() : ""
    const url = typeof body?.url === "string" ? body.url.trim() : ""

    if (url && !content) {
      const scrape = await scrapeUrl(url)
      if (!scrape.success) {
        return NextResponse.json(
          { error: scrape.error || "Impossible de récupérer la page" },
          { status: 400 }
        )
      }
      content = [scrape.title, scrape.text].filter(Boolean).join("\n\n")
    }

    if (!content) {
      return NextResponse.json(
        { error: "Paramètre 'content' ou 'url' requis" },
        { status: 400 }
      )
    }

    const result = await summarizeContent(content)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Échec résumé" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, summary: result.summary })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: "Erreur résumé",
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { generatePresentation } from "@/lib/presentation-generate"

/**
 * POST /api/tools/presentation
 * Génère une présentation PowerPoint (.pptx).
 * Auth: session NextAuth ou X-Floo-Gateway-Key (gateway).
 * Body: { title, slides: [{ title?, content }] }
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
    const title = typeof body?.title === "string" ? body.title.trim() : "Présentation"
    const slidesRaw = body?.slides
    const slides = Array.isArray(slidesRaw)
      ? (slidesRaw as Array<{ title?: string; content?: string }>).map((s) => ({
          title: typeof s?.title === "string" ? s.title : "",
          content: typeof s?.content === "string" ? s.content : String(s ?? ""),
        }))
      : []

    if (slides.length === 0) {
      return NextResponse.json(
        { error: "Paramètre 'slides' requis (array non vide)" },
        { status: 400 }
      )
    }

    const result = await generatePresentation(title, slides)
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || "Échec génération présentation",
          hint:
            result.error?.includes("BLOB") || result.error?.includes("blob")
              ? "Configure BLOB_READ_WRITE_TOKEN sur Vercel."
              : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      pptxUrl: result.pptxUrl,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: "Erreur génération présentation",
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    )
  }
}

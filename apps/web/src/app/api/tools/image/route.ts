import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { generateImage } from "@/lib/image-generate"

/**
 * POST /api/tools/image
 * Génère une image à partir d'un prompt (OpenRouter: Flux.2 Pro / Flex).
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
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""
    if (!prompt) {
      return NextResponse.json(
        { error: "Paramètre 'prompt' requis" },
        { status: 400 }
      )
    }

    const result = await generateImage(prompt)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Échec génération" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      imageUrl: result.imageUrl,
      model: result.model,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: "Erreur génération image",
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    )
  }
}

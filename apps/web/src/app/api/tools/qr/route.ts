import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { generateQr } from "@/lib/qr-generate"

/**
 * POST /api/tools/qr
 * Génère un QR code à partir d'un texte/URL.
 * Auth: session NextAuth ou X-Floo-Gateway-Key (gateway).
 * Body: { data } — texte ou URL à encoder
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
    const data = typeof body?.data === "string" ? body.data.trim() : ""

    if (!data) {
      return NextResponse.json(
        { error: "Paramètre 'data' requis (texte ou URL)" },
        { status: 400 }
      )
    }

    const result = await generateQr(data)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Échec génération QR" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, qrUrl: result.qrUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: "Erreur génération QR",
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    )
  }
}

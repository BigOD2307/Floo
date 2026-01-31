import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"

/**
 * GET /api/credits/check?phoneNumber=+225...
 * Vérifie le solde de crédits d'un utilisateur (par numéro WhatsApp).
 * Auth: X-Floo-Gateway-Key (gateway uniquement).
 */
export async function GET(req: Request) {
  if (!isGatewayAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const rawPhone = searchParams.get("phoneNumber")
    if (!rawPhone) {
      return NextResponse.json(
        { ok: false, error: "phoneNumber requis" },
        { status: 400 }
      )
    }

    const phoneNumber = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: { credits: true },
    })

    if (!user) {
      return NextResponse.json({ ok: false, credits: 0 })
    }

    return NextResponse.json({ ok: true, credits: user.credits })
  } catch (error) {
    console.error("❌ Erreur check crédits:", error)
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

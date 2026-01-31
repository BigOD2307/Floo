import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"

/**
 * POST /api/credits/use
 * Déduit 1 crédit pour un message IA.
 * Auth: X-Floo-Gateway-Key (gateway uniquement).
 * Body: { phoneNumber: string }
 */
export async function POST(req: Request) {
  if (!isGatewayAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const rawPhone = body?.phoneNumber ?? body?.phone
    if (!rawPhone || typeof rawPhone !== "string") {
      return NextResponse.json(
        { ok: false, error: "phoneNumber requis" },
        { status: 400 }
      )
    }

    const phoneNumber = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: { id: true, credits: true },
    })

    if (!user) {
      return NextResponse.json({ ok: false, credits: 0, error: "Utilisateur non trouvé" })
    }

    if (user.credits < 1) {
      return NextResponse.json({ ok: false, credits: user.credits })
    }

    const newCredits = user.credits - 1

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          credits: newCredits,
          lastActivity: new Date(),
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "DEBIT",
          amount: 1,
          balance: newCredits,
          description: "Message IA WhatsApp",
          paymentMethod: null,
        },
      }),
    ])

    return NextResponse.json({ ok: true, credits: newCredits })
  } catch (error) {
    console.error("❌ Erreur déduction crédit:", error)
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

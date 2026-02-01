import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"

/**
 * API pour récupérer les statistiques du dashboard
 * Retourne des données vides pour les nouveaux utilisateurs
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        credits: true,
        whatsappLinked: true,
        createdAt: true,
        lastActivity: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Compter les sessions actives (conversations)
    const activeSessions = await prisma.session.count({
      where: {
        userId: user.id,
        active: true,
      },
    })

    // Compter le total de crédits utilisés
    const totalCreditsUsed = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "DEBIT",
      },
      _sum: {
        amount: true,
      },
    })

    // Calculer le temps économisé (estimation : 1 crédit = 1 minute économisée)
    const estimatedTimeSaved = totalCreditsUsed._sum.amount || 0
    const hours = Math.floor(estimatedTimeSaved / 60)
    const minutes = estimatedTimeSaved % 60

    // Vérifier si c'est un nouvel utilisateur (créé il y a moins de 24h et pas d'activité)
    const isNewUser =
      !user.lastActivity &&
      new Date().getTime() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000

    return NextResponse.json({
      credits: user.credits,
      conversations: isNewUser ? 0 : activeSessions,
      timeSaved: isNewUser
        ? { hours: 0, minutes: 0, formatted: "0m" }
        : {
            hours,
            minutes,
            formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
          },
      isNewUser,
      whatsappLinked: user.whatsappLinked,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des statistiques",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

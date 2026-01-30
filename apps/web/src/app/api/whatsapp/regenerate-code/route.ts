import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"

/**
 * Génère un nouveau code unique pour l'utilisateur
 */
function generateUniqueCode(): string {
  // Format: FL-XXXX où XXXX est un nombre aléatoire
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `FL-${randomNum}`
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    // Générer un nouveau code unique
    let newCode: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      newCode = generateUniqueCode()
      const existing = await prisma.user.findUnique({
        where: { code: newCode },
      })
      if (!existing) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Impossible de générer un code unique. Veuillez réessayer." },
        { status: 500 }
      )
    }

    // Mettre à jour l'utilisateur avec le nouveau code
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        code: newCode!,
        whatsappLinked: false, // Délier le compte si on régénère le code
      },
      select: {
        id: true,
        code: true,
        whatsappLinked: true,
      },
    })

    console.log("✅ Nouveau code généré:", {
      userId: updatedUser.id,
      newCode: updatedUser.code,
    })

    return NextResponse.json({
      success: true,
      code: updatedUser.code,
      message: "Nouveau code généré avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur génération code:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du code",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

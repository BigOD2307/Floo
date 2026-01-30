import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"

/**
 * Nettoie et formate un numéro de téléphone
 * Retire les espaces, tirets, points et autres caractères non numériques
 * Ajoute le préfixe +225 si nécessaire
 */
function formatPhoneNumber(phone: string): string | null {
  if (!phone) return null

  // Retirer tous les caractères non numériques sauf le +
  let cleaned = phone.replace(/[^\d+]/g, "")

  // Si le numéro commence déjà par +225, le retourner tel quel
  if (cleaned.startsWith("+225")) {
    return cleaned
  }

  // Si le numéro commence par 225, ajouter le +
  if (cleaned.startsWith("225")) {
    return `+${cleaned}`
  }

  // Sinon, ajouter +225 au début
  return `+225${cleaned}`
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

    const data = await req.json()

    // Validation du numéro de téléphone
    if (!data.phoneNumber || data.phoneNumber.trim() === "") {
      return NextResponse.json(
        { error: "Le numéro de téléphone est requis" },
        { status: 400 }
      )
    }

    // Formater le numéro de téléphone
    const formattedPhone = formatPhoneNumber(data.phoneNumber)

    if (!formattedPhone || formattedPhone.length < 10) {
      return NextResponse.json(
        { error: "Numéro de téléphone invalide" },
        { status: 400 }
      )
    }

    // Vérifier si ce numéro n'est pas déjà utilisé par un autre utilisateur
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhone },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Ce numéro de téléphone est déjà utilisé" },
        { status: 400 }
      )
    }

    // Mettre à jour l'utilisateur avec les réponses d'onboarding
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboarded: true,
        onboardingData: data as object,
        phoneNumber: formattedPhone, // Toujours sauvegarder le numéro formaté
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        onboarded: true,
      },
    })

    console.log("✅ Numéro sauvegardé:", {
      userId: updatedUser.id,
      phoneNumber: updatedUser.phoneNumber,
      email: updatedUser.email,
    })

    return NextResponse.json({
      success: true,
      user: {
        phoneNumber: updatedUser.phoneNumber,
      },
      redirect: "/pricing", // Rediriger vers la page pricing après l'onboarding
    })
  } catch (error) {
    console.error("❌ Onboarding error:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la sauvegarde",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

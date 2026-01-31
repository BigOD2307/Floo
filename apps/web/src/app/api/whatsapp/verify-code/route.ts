import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * API pour vérifier un code WhatsApp et lier le compte
 * Cette API sera appelée par le backend Floo quand un utilisateur envoie son code
 */
export async function POST(req: Request) {
  try {
    const { code, phoneNumber } = await req.json()

    if (!code || !phoneNumber) {
      return NextResponse.json(
        { error: "Code et numéro de téléphone requis" },
        { status: 400 }
      )
    }

    // Chercher l'utilisateur par code
    const user = await prisma.user.findUnique({
      where: { code },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Code invalide" },
        { status: 404 }
      )
    }

    // Formater le numéro
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`

    // Si l'utilisateur a déjà un numéro différent enregistré, on le met à jour
    // (le code est le secret, donc si l'utilisateur a le bon code, il peut lier son WhatsApp)
    if (user.phoneNumber && user.phoneNumber !== formattedPhone) {
      console.log(`⚠️ Mise à jour du numéro WhatsApp: ${user.phoneNumber} -> ${formattedPhone} (user: ${user.id})`)
    }

    // Lier le compte WhatsApp (met à jour le numéro si différent)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        whatsappLinked: true,
        phoneNumber: formattedPhone,
        lastActivity: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        code: true,
        phoneNumber: true,
        whatsappLinked: true,
        credits: true,
      },
    })

    console.log("✅ Compte WhatsApp lié:", {
      userId: updatedUser.id,
      phoneNumber: updatedUser.phoneNumber,
      code: updatedUser.code,
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Compte WhatsApp lié avec succès",
    })
  } catch (error) {
    console.error("❌ Erreur vérification code:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification du code",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * API pour obtenir les informations d'un utilisateur par son numéro de téléphone
 * Utilisé par le backend Floo pour identifier l'utilisateur lors des conversations
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const phoneNumber = searchParams.get("phoneNumber")

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Numéro de téléphone requis" },
        { status: 400 }
      )
    }

    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`

    const user = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhone },
      select: {
        id: true,
        name: true,
        email: true,
        code: true,
        phoneNumber: true,
        whatsappLinked: true,
        credits: true,
        onboardingData: true,
        lastActivity: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    if (!user.whatsappLinked) {
      return NextResponse.json(
        { error: "Compte WhatsApp non lié", needsCode: true },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        code: user.code,
        credits: user.credits,
        onboardingData: user.onboardingData ?? null,
        lastActivity: user.lastActivity,
      },
    })
  } catch (error) {
    console.error("❌ Erreur récupération utilisateur:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'utilisateur",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

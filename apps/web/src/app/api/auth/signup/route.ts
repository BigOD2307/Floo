import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db"
import { generateUniqueCode } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      )
    }

    // Générer un code unique
    let code = generateUniqueCode()
    let codeExists = await prisma.user.findUnique({ where: { code } })

    // Si le code existe déjà (très rare), en générer un nouveau
    while (codeExists) {
      code = generateUniqueCode()
      codeExists = await prisma.user.findUnique({ where: { code } })
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 12)

    // Créer l'utilisateur avec 50 crédits de bienvenue
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        code,
        credits: 50,
      }
    })

    // Créer une transaction pour le bonus de bienvenue
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BONUS",
        amount: 50,
        balance: 50,
        description: "Bonus de bienvenue",
        paymentMethod: "bonus",
      }
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          code: user.code,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la création du compte"
    console.error("Error details:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === "development" ? String(error) : undefined },
      { status: 500 }
    )
  }
}

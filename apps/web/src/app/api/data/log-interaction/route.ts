import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * API pour logger les interactions utilisateur pour l'entraînement de Floo.
 * Collecte: messages, réponses, outils utilisés, feedback, etc.
 */
export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key")
    if (apiKey !== process.env.FLOO_GATEWAY_API_KEY) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const {
      userId,
      phoneNumber,
      sessionId,
      messageType, // "user" | "assistant" | "tool_call" | "tool_result"
      content,
      toolName,
      toolInput,
      toolOutput,
      model,
      tokensUsed,
      latencyMs,
      success,
      errorMessage,
      metadata,
    } = body

    // Créer l'entrée dans la base de données
    const interaction = await prisma.interaction.create({
      data: {
        userId: userId || null,
        phoneNumber: phoneNumber || null,
        sessionId: sessionId || null,
        messageType: messageType || "unknown",
        content: content || null,
        toolName: toolName || null,
        toolInput: toolInput ? JSON.stringify(toolInput) : null,
        toolOutput: toolOutput ? JSON.stringify(toolOutput) : null,
        model: model || null,
        tokensUsed: tokensUsed || null,
        latencyMs: latencyMs || null,
        success: success ?? true,
        errorMessage: errorMessage || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
    })
  } catch (error) {
    console.error("❌ Erreur log interaction:", error)
    return NextResponse.json(
      { error: "Erreur lors du logging", details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET: Récupérer les interactions pour l'analyse/export
 */
export async function GET(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key")
    if (apiKey !== process.env.FLOO_GATEWAY_API_KEY) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000)
    const offset = parseInt(searchParams.get("offset") || "0")
    const userId = searchParams.get("userId")
    const phoneNumber = searchParams.get("phoneNumber")
    const messageType = searchParams.get("messageType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (phoneNumber) where.phoneNumber = phoneNumber
    if (messageType) where.messageType = messageType
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate)
    }

    const [interactions, total] = await Promise.all([
      prisma.interaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.interaction.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      interactions,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("❌ Erreur récupération interactions:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    )
  }
}

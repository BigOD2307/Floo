import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-utils"

/**
 * API de traduction utilisant OpenAI/OpenRouter
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { text, targetLang, sourceLang } = await req.json()

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "text et targetLang requis" },
        { status: 400 }
      )
    }

    // Utiliser OpenRouter ou OpenAI pour la traduction
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    const isOpenRouter = !!process.env.OPENROUTER_API_KEY

    const baseUrl = isOpenRouter
      ? "https://openrouter.ai/api/v1"
      : "https://api.openai.com/v1"

    const model = isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4o-mini"

    const prompt = sourceLang
      ? `Translate the following text from ${sourceLang} to ${targetLang}. Only output the translation, nothing else.\n\nText: ${text}`
      : `Translate the following text to ${targetLang}. Only output the translation, nothing else.\n\nText: ${text}`

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(isOpenRouter && { "HTTP-Referer": "https://floo.ai" }),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Translation API error:", err)
      return NextResponse.json(
        { error: "Erreur de traduction" },
        { status: 500 }
      )
    }

    const data = await response.json()
    const translation = data.choices?.[0]?.message?.content?.trim() || ""

    return NextResponse.json({
      success: true,
      translation,
      sourceLang: sourceLang || "auto",
      targetLang,
    })
  } catch (error) {
    console.error("❌ Erreur traduction:", error)
    return NextResponse.json(
      { error: "Erreur lors de la traduction" },
      { status: 500 }
    )
  }
}

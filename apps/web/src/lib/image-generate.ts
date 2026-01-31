/**
 * Génération d'images via OpenRouter.
 * Modèles: flux.2-pro (prioritaire), flux.2-flex (fallback).
 * Env: OPENROUTER_API_KEY
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const PRIMARY_MODEL = "black-forest-labs/flux.2-pro"
const FALLBACK_MODEL = "black-forest-labs/flux.2-flex"

export interface ImageGenerateResult {
  ok: boolean
  imageUrl?: string
  error?: string
  model?: string
}

export async function generateImage(prompt: string): Promise<ImageGenerateResult> {
  const key = process.env.OPENROUTER_API_KEY?.trim()
  if (!key) {
    return { ok: false, error: "OPENROUTER_API_KEY manquant" }
  }

  const models = [PRIMARY_MODEL, FALLBACK_MODEL]
  for (const model of models) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXTAUTH_URL || "https://floo-ecru.vercel.app",
        },
        body: JSON.stringify({
          model,
          modalities: ["image", "text"],
          messages: [{ role: "user", content: prompt.slice(0, 2000) }],
          max_tokens: 4096,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.warn(`[image-generate] ${model} failed:`, err.slice(0, 200))
        continue
      }

      const data = (await res.json()) as {
        choices?: Array<{
          message?: {
            content?: Array<{
              type?: string
              image_url?: { url?: string }
            }>
          }
        }>
      }

      const content = data.choices?.[0]?.message?.content
      if (Array.isArray(content)) {
        const img = content.find((c) => c.type === "image" && c.image_url?.url)
        if (img?.image_url?.url) {
          return { ok: true, imageUrl: img.image_url.url, model }
        }
      }
    } catch (e) {
      console.warn(`[image-generate] ${model} error:`, e)
    }
  }

  return { ok: false, error: "Échec de la génération d'image" }
}

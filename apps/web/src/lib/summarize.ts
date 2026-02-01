/**
 * Résumé de contenu via OpenRouter.
 * Env: OPENROUTER_API_KEY
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const MODEL = "openai/gpt-4o-mini"

export interface SummarizeResult {
  ok: boolean
  summary?: string
  error?: string
}

export async function summarizeContent(content: string): Promise<SummarizeResult> {
  const key = process.env.OPENROUTER_API_KEY?.trim()
  if (!key) {
    return { ok: false, error: "OPENROUTER_API_KEY manquant" }
  }

  const text = (content || "").trim().slice(0, 30000)
  if (!text) {
    return { ok: false, error: "Contenu vide" }
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXTAUTH_URL || "https://floo-ecru.vercel.app",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant qui résume des textes de façon concise et claire. Réponds UNIQUEMENT avec le résumé, en français si le texte est en français.",
          },
          {
            role: "user",
            content: `Résume ce texte de façon concise :\n\n${text}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `API ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const summary = data.choices?.[0]?.message?.content?.trim()

    if (!summary) {
      return { ok: false, error: "Réponse vide" }
    }

    return { ok: true, summary }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

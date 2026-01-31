/**
 * Recherche web : Serper (prioritaire) ou DuckDuckGo (fallback gratuit).
 * - Serper : https://serper.dev, clé X-API-KEY (SERPER_API_KEY).
 * - DuckDuckGo : duck-duck-scrape, pas de clé.
 */

export interface SearchResultItem {
  title: string
  link: string
  snippet: string
}

export interface SearchResponse {
  results: SearchResultItem[]
  provider: "serper" | "duckduckgo"
}

const SERPER_ENDPOINT = "https://google.serper.dev/search"
const MAX_RESULTS = 15

async function searchSerper(query: string): Promise<SearchResultItem[]> {
  const key = process.env.SERPER_API_KEY?.trim()
  if (!key) throw new Error("SERPER_API_KEY manquant")

  const res = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: MAX_RESULTS }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Serper API error (${res.status}): ${text || res.statusText}`)
  }

  const data = (await res.json()) as { organic?: Array<{ title?: string; link?: string; snippet?: string }> }
  const organic = data.organic ?? []

  return organic
    .filter((r) => r.title && r.link)
    .slice(0, MAX_RESULTS)
    .map((r) => ({
      title: String(r.title ?? ""),
      link: String(r.link ?? ""),
      snippet: String(r.snippet ?? ""),
    }))
}

async function searchDuckDuckGo(query: string): Promise<SearchResultItem[]> {
  const { search, SafeSearchType } = await import("duck-duck-scrape")
  const raw = await search(query, { safeSearch: SafeSearchType.STRICT })

  const results = (raw.results ?? []) as Array<{ title?: string; url?: string; description?: string }>
  return results
    .filter((r) => r.title && r.url)
    .slice(0, MAX_RESULTS)
    .map((r) => ({
      title: String(r.title ?? ""),
      link: String(r.url ?? ""),
      snippet: String(r.description ?? ""),
    }))
}

/**
 * Effectue une recherche web.
 * Utilise Serper si SERPER_API_KEY est défini, sinon DuckDuckGo.
 */
export async function searchWeb(query: string): Promise<SearchResponse> {
  const q = String(query ?? "").trim()
  if (!q) return { results: [], provider: "duckduckgo" }

  const useSerper = Boolean(process.env.SERPER_API_KEY?.trim())

  if (useSerper) {
    try {
      const results = await searchSerper(q)
      return { results, provider: "serper" }
    } catch (e) {
      console.warn("[search] Serper failed, falling back to DuckDuckGo:", e)
    }
  }

  const results = await searchDuckDuckGo(q)
  return { results, provider: "duckduckgo" }
}

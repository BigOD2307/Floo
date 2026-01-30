/**
 * Scraping web : fetch + Cheerio.
 * Pas de clé API. Pour pages statiques (HTML simple).
 * Pour SPA / JS lourd, envisager Playwright plus tard.
 */

import * as cheerio from "cheerio"

export interface ScrapeResult {
  success: boolean
  title: string
  text: string
  links: string[]
  error?: string
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; FlooBot/1.0; +https://floo.ai)"

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const u = String(url ?? "").trim()
  if (!u) {
    return { success: false, title: "", text: "", links: [], error: "URL vide" }
  }

  let parsed: URL
  try {
    parsed = new URL(u)
  } catch {
    return { success: false, title: "", text: "", links: [], error: "URL invalide" }
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { success: false, title: "", text: "", links: [], error: "Seul http/https accepté" }
  }

  try {
    const res = await fetch(u, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return {
        success: false,
        title: "",
        text: "",
        links: [],
        error: `HTTP ${res.status}`,
      }
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    // Retirer script/style
    $("script, style, noscript").remove()

    const title = $("title").first().text().trim() || ""
    const bodyText = $("body").length ? $("body").text() : $.root().text()
    const text = bodyText.replace(/\s+/g, " ").trim().slice(0, 50_000)

    const links: string[] = []
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return
      try {
        const abs = new URL(href, u).href
        if (abs.startsWith("http")) links.push(abs)
      } catch {
        /* skip invalid */
      }
    })

    const unique = [...new Set(links)].slice(0, 200)

    return { success: true, title, text, links: unique }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, title: "", text: "", links: [], error: msg }
  }
}

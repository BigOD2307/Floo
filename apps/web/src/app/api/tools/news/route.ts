import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-utils"

/**
 * API actualités utilisant la recherche web existante
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { topic, country, lang } = await req.json()

    // Construire la requête de recherche
    const query = topic
      ? `actualités ${topic} ${country || ""} ${new Date().toISOString().split("T")[0]}`
      : `actualités du jour ${country || "Afrique"}`

    // Utiliser Serper pour les actualités
    const serperKey = process.env.SERPER_API_KEY
    if (!serperKey) {
      return NextResponse.json(
        { error: "Service actualités non configuré" },
        { status: 503 }
      )
    }

    const response = await fetch("https://google.serper.dev/news", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": serperKey,
      },
      body: JSON.stringify({
        q: query,
        gl: country?.toLowerCase() || "ci", // Côte d'Ivoire par défaut
        hl: lang || "fr",
        num: 10,
      }),
    })

    if (!response.ok) {
      console.error("Serper news error:", await response.text())
      return NextResponse.json(
        { error: "Erreur récupération actualités" },
        { status: 500 }
      )
    }

    const data = await response.json()
    const articles = (data.news || []).map((item: Record<string, unknown>) => ({
      title: item.title,
      snippet: item.snippet,
      source: item.source,
      link: item.link,
      date: item.date,
      imageUrl: item.imageUrl,
    }))

    return NextResponse.json({
      success: true,
      query,
      articles,
      total: articles.length,
    })
  } catch (error) {
    console.error("❌ Erreur actualités:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des actualités" },
      { status: 500 }
    )
  }
}

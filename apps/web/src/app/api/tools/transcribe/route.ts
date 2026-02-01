import { NextResponse } from "next/server"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"

/**
 * API de transcription audio (Voice-to-Text) utilisant OpenAI Whisper
 * Accepte un fichier audio ou une URL audio.
 * Auth: X-Floo-Gateway-Key (gateway) ou x-api-key (legacy).
 */
export async function POST(req: Request) {
  try {
    const gatewayOk = isGatewayAuthenticated(req)
    const legacyKey = req.headers.get("x-api-key")?.trim()
    const secret = process.env.FLOO_GATEWAY_API_KEY?.trim()
    if (!gatewayOk && (!secret || legacyKey !== secret)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""

    let audioBuffer: Buffer
    let filename = "audio.ogg"

    if (contentType.includes("multipart/form-data")) {
      // Fichier audio uploadé
      const formData = await req.formData()
      const file = formData.get("audio") as File | null
      if (!file) {
        return NextResponse.json({ error: "Fichier audio requis" }, { status: 400 })
      }
      audioBuffer = Buffer.from(await file.arrayBuffer())
      filename = file.name || "audio.ogg"
    } else {
      // URL audio ou base64
      const body = await req.json()
      const { audioUrl, audioBase64, format } = body

      if (audioBase64) {
        audioBuffer = Buffer.from(audioBase64, "base64")
        filename = `audio.${format || "ogg"}`
      } else if (audioUrl) {
        const audioRes = await fetch(audioUrl)
        if (!audioRes.ok) {
          return NextResponse.json(
            { error: "Impossible de télécharger l'audio" },
            { status: 400 }
          )
        }
        audioBuffer = Buffer.from(await audioRes.arrayBuffer())
        // Extraire l'extension de l'URL
        const urlExt = audioUrl.split(".").pop()?.split("?")[0] || "ogg"
        filename = `audio.${urlExt}`
      } else {
        return NextResponse.json(
          { error: "audioUrl ou audioBase64 requis" },
          { status: 400 }
        )
      }
    }

    // Appeler l'API OpenAI Whisper
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json(
        { error: "Service de transcription non configuré" },
        { status: 503 }
      )
    }

    // Créer le FormData pour Whisper (Uint8Array compatible BlobPart)
    const formData = new FormData()
    formData.append("file", new Blob([new Uint8Array(audioBuffer)]), filename)
    formData.append("model", "whisper-1")
    formData.append("language", "fr") // Français par défaut
    formData.append("response_format", "json")

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: formData,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      console.error("Whisper error:", err)
      return NextResponse.json(
        { error: "Erreur de transcription" },
        { status: 500 }
      )
    }

    const result = await whisperRes.json()
    const transcription = result.text || ""

    return NextResponse.json({
      success: true,
      transcription,
      duration: result.duration,
      language: result.language || "fr",
    })
  } catch (error) {
    console.error("❌ Erreur transcription:", error)
    return NextResponse.json(
      { error: "Erreur lors de la transcription" },
      { status: 500 }
    )
  }
}

/**
 * Génération de QR code.
 * Env: BLOB_READ_WRITE_TOKEN (Vercel Blob).
 */

import QRCode from "qrcode"
import { put } from "@vercel/blob"

export interface QrGenerateResult {
  ok: boolean
  qrUrl?: string
  error?: string
}

export async function generateQr(data: string): Promise<QrGenerateResult> {
  try {
    const text = (data || "").trim().slice(0, 2000)
    if (!text) {
      return { ok: false, error: "Contenu vide" }
    }

    const buffer = await QRCode.toBuffer(text, {
      type: "png",
      width: 400,
      margin: 2,
    })

    const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" })
    const filename = `floo-qr-${Date.now()}.png`

    const result = await put(filename, blob, {
      access: "public",
      contentType: "image/png",
    })

    return { ok: true, qrUrl: result.url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/**
 * Génération de PDF via pdf-lib.
 * Env: BLOB_READ_WRITE_TOKEN (Vercel Blob) pour stocker et retourner URL.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { put } from "@vercel/blob"

const MARGIN = 50
const LINE_HEIGHT = 16
const FONT_SIZE = 12
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const CHARS_PER_LINE = Math.floor(CONTENT_WIDTH / (FONT_SIZE * 0.6))

function wrapLines(text: string): string[] {
  const lines: string[] = []
  const paragraphs = text.split(/\n+/)
  for (const p of paragraphs) {
    if (!p.trim()) {
      lines.push("")
      continue
    }
    const words = p.split(/\s+/)
    let current = ""
    for (const w of words) {
      const next = current ? `${current} ${w}` : w
      if (next.length <= CHARS_PER_LINE) {
        current = next
      } else {
        if (current) lines.push(current)
        current = w.length > CHARS_PER_LINE ? w.slice(0, CHARS_PER_LINE) : w
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

export interface PdfGenerateResult {
  ok: boolean
  pdfUrl?: string
  error?: string
}

export async function generatePdf(title: string, content: string): Promise<PdfGenerateResult> {
  try {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

    let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let y = PAGE_HEIGHT - MARGIN

    const drawTitle = () => {
      const titleLines = wrapLines(title.slice(0, 200))
      for (const line of titleLines) {
        if (y < MARGIN + LINE_HEIGHT) {
          page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
          y = PAGE_HEIGHT - MARGIN
        }
        page.drawText(line, {
          x: MARGIN,
          y,
          size: 16,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.1),
        })
        y -= 20
      }
      y -= 10
    }

    drawTitle()

    const contentLines = wrapLines(content.slice(0, 50000))
    for (const line of contentLines) {
      if (y < MARGIN + LINE_HEIGHT) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        y = PAGE_HEIGHT - MARGIN
      }
      page.drawText(line, {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.2, 0.2, 0.2),
      })
      y -= LINE_HEIGHT
    }

    const pdfBytes = await doc.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
    const filename = `floo-${Date.now()}.pdf`

    const result = await put(filename, blob, {
      access: "public",
      contentType: "application/pdf",
    })

    return { ok: true, pdfUrl: result.url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

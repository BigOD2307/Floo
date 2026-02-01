/**
 * Génération de présentation PowerPoint via pptxgenjs.
 * Env: BLOB_READ_WRITE_TOKEN (Vercel Blob).
 */

import pptxgen from "pptxgenjs"
import { put } from "@vercel/blob"

export interface SlideInput {
  title?: string
  content: string
}

export interface PresentationGenerateResult {
  ok: boolean
  pptxUrl?: string
  error?: string
}

export async function generatePresentation(
  title: string,
  slides: SlideInput[]
): Promise<PresentationGenerateResult> {
  try {
    const pptx = new pptxgen()
    pptx.title = title.slice(0, 255)
    pptx.author = "Floo"
    pptx.company = "Floo AI"

    for (const slide of slides) {
      const s = pptx.addSlide()
      const slideTitle = (slide.title || "").trim().slice(0, 200)
      const content = (slide.content || "").trim().slice(0, 2000)

      if (slideTitle) {
        s.addText(slideTitle, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.75,
          fontSize: 24,
          bold: true,
        })
      }

      s.addText(content, {
        x: 0.5,
        y: slideTitle ? 1.5 : 0.5,
        w: 9,
        h: slideTitle ? 5.5 : 6.5,
        fontSize: 14,
        valign: "top",
      })
    }

    const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    })
    const filename = `floo-${Date.now()}.pptx`

    const result = await put(filename, blob, {
      access: "public",
      contentType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    })

    return { ok: true, pptxUrl: result.url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

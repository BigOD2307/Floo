/**
 * Génération de documents formatés (lettre, CV, email) en PDF.
 * Réutilise pdf-generate avec mise en forme selon le type.
 */

import { generatePdf } from "./pdf-generate"

export type DocumentType = "letter" | "cv" | "email" | "general"

export interface DocumentGenerateResult {
  ok: boolean
  pdfUrl?: string
  error?: string
}

function formatContent(type: DocumentType, title: string, content: string): string {
  const date = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  switch (type) {
    case "letter":
      return `Lettre\n\n${date}\n\nObjet : ${title}\n\n${content}\n\nCordialement,`
    case "cv":
      return `Curriculum Vitae\n\n${title}\n\n${content}`
    case "email":
      return `Objet : ${title}\n\n${content}`
    default:
      return `${title}\n\n${content}`
  }
}

export async function generateDocument(
  type: DocumentType,
  title: string,
  content: string
): Promise<DocumentGenerateResult> {
  const formatted = formatContent(type, title, content)
  return generatePdf(title, formatted)
}

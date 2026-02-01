import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { generateDocument, type DocumentType } from "@/lib/document-generate"

/**
 * POST /api/tools/document
 * Génère un document formaté (lettre, CV, email) en PDF.
 * Auth: session NextAuth ou X-Floo-Gateway-Key (gateway).
 * Body: { type?, title, content }
 */
export async function POST(req: Request) {
  try {
    const gatewayOk = isGatewayAuthenticated(req)
    if (!gatewayOk) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
      }
    }

    const body = await req.json().catch(() => ({}))
    const type = (body?.type as DocumentType) || "general"
    const validTypes: DocumentType[] = ["letter", "cv", "email", "general"]
    const docType = validTypes.includes(type) ? type : "general"
    const title = typeof body?.title === "string" ? body.title.trim() : "Document"
    const content = typeof body?.content === "string" ? body.content.trim() : ""

    if (!content) {
      return NextResponse.json(
        { error: "Paramètre 'content' requis" },
        { status: 400 }
      )
    }

    const result = await generateDocument(docType, title, content)
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || "Échec génération document",
          hint:
            result.error?.includes("BLOB") || result.error?.includes("blob")
              ? "Configure BLOB_READ_WRITE_TOKEN sur Vercel."
              : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      pdfUrl: result.pdfUrl,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: "Erreur génération document",
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    )
  }
}

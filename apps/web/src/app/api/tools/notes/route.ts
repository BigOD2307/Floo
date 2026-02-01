import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedUser } from "@/lib/auth-utils"

/**
 * API pour créer et gérer des notes (mémoire persistante)
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { action, title, content, tags, noteId, query } = await req.json()

    if (action === "create" || action === "save") {
      if (!content) {
        return NextResponse.json({ error: "content requis" }, { status: 400 })
      }

      const note = await prisma.note.create({
        data: {
          userId: user.id,
          phoneNumber: user.phoneNumber,
          title: title || null,
          content,
          tags: Array.isArray(tags) ? tags.join(",") : tags || null,
        },
      })

      return NextResponse.json({
        success: true,
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags?.split(",") || [],
          createdAt: note.createdAt,
        },
      })
    }

    if (action === "list") {
      const notes = await prisma.note.findMany({
        where: {
          OR: [
            { userId: user.id },
            { phoneNumber: user.phoneNumber },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      return NextResponse.json({
        success: true,
        notes: notes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content.substring(0, 200) + (n.content.length > 200 ? "..." : ""),
          tags: n.tags?.split(",") || [],
          createdAt: n.createdAt,
        })),
      })
    }

    if (action === "search") {
      if (!query) {
        return NextResponse.json({ error: "query requis" }, { status: 400 })
      }

      const notes = await prisma.note.findMany({
        where: {
          OR: [
            { userId: user.id },
            { phoneNumber: user.phoneNumber },
          ],
          AND: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
              { tags: { contains: query, mode: "insensitive" } },
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })

      return NextResponse.json({
        success: true,
        notes: notes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: n.tags?.split(",") || [],
          createdAt: n.createdAt,
        })),
      })
    }

    if (action === "get") {
      if (!noteId) {
        return NextResponse.json({ error: "noteId requis" }, { status: 400 })
      }

      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { userId: user.id },
            { phoneNumber: user.phoneNumber },
          ],
        },
      })

      if (!note) {
        return NextResponse.json({ error: "Note non trouvée" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags?.split(",") || [],
          createdAt: note.createdAt,
        },
      })
    }

    if (action === "delete") {
      if (!noteId) {
        return NextResponse.json({ error: "noteId requis" }, { status: 400 })
      }

      await prisma.note.deleteMany({
        where: {
          id: noteId,
          OR: [
            { userId: user.id },
            { phoneNumber: user.phoneNumber },
          ],
        },
      })

      return NextResponse.json({ success: true, deleted: noteId })
    }

    return NextResponse.json(
      { error: "action invalide (create, list, search, get, delete)" },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ Erreur notes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la gestion de la note" },
      { status: 500 }
    )
  }
}

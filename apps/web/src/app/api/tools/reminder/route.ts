import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedUser } from "@/lib/auth-utils"

/**
 * API pour créer et gérer des rappels
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { action, message, remindAt, reminderId } = await req.json()

    if (action === "create") {
      if (!message || !remindAt) {
        return NextResponse.json(
          { error: "message et remindAt requis" },
          { status: 400 }
        )
      }

      const reminder = await prisma.reminder.create({
        data: {
          userId: user.id,
          phoneNumber: user.phoneNumber,
          message,
          remindAt: new Date(remindAt),
        },
      })

      return NextResponse.json({
        success: true,
        reminder: {
          id: reminder.id,
          message: reminder.message,
          remindAt: reminder.remindAt,
        },
      })
    }

    if (action === "list") {
      const reminders = await prisma.reminder.findMany({
        where: {
          OR: [
            { userId: user.id },
            { phoneNumber: user.phoneNumber },
          ],
          sent: false,
          remindAt: { gte: new Date() },
        },
        orderBy: { remindAt: "asc" },
        take: 20,
      })

      return NextResponse.json({
        success: true,
        reminders: reminders.map((r) => ({
          id: r.id,
          message: r.message,
          remindAt: r.remindAt,
        })),
      })
    }

    if (action === "delete") {
      if (!reminderId) {
        return NextResponse.json(
          { error: "reminderId requis" },
          { status: 400 }
        )
      }

      await prisma.reminder.deleteMany({
        where: {
          id: reminderId,
          OR: [
            { userId: user.id },
            { phoneNumber: user.phoneNumber },
          ],
        },
      })

      return NextResponse.json({ success: true, deleted: reminderId })
    }

    return NextResponse.json(
      { error: "action invalide (create, list, delete)" },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ Erreur rappel:", error)
    return NextResponse.json(
      { error: "Erreur lors de la gestion du rappel" },
      { status: 500 }
    )
  }
}

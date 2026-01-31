import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"

/**
 * GET /api/integrations
 * Liste les intégrations de l'utilisateur.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const integrations = await prisma.integration.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      scope: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    integrations: integrations.map((i) => ({
      id: i.id,
      provider: i.provider,
      scope: i.scope,
      connected: true,
      connectedAt: i.createdAt,
    })),
  })
}

/**
 * Utilitaires d'authentification pour les routes API.
 * Accepte session NextAuth ou X-Floo-Gateway-Key (gateway).
 */

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { prisma } from "@/lib/db"

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
  phoneNumber?: string | null
}

/**
 * Retourne l'utilisateur authentifié (session ou gateway) ou null.
 */
export async function getAuthenticatedUser(
  req: Request
): Promise<AuthUser | null> {
  if (isGatewayAuthenticated(req)) {
    return { id: "gateway", email: null, name: "Gateway", phoneNumber: null }
  }

  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user?.id) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phoneNumber: true, email: true, name: true },
  })

  return {
    id: user.id,
    email: dbUser?.email ?? user.email ?? null,
    name: dbUser?.name ?? user.name ?? null,
    phoneNumber: dbUser?.phoneNumber ?? null,
  }
}

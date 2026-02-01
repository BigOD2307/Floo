/**
 * Utilitaires d'authentification pour les routes API.
 * Accepte session NextAuth ou X-Floo-Gateway-Key (gateway).
 */

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
}

/**
 * Retourne l'utilisateur authentifié (session ou gateway) ou null.
 */
export async function getAuthenticatedUser(
  req: Request
): Promise<AuthUser | null> {
  if (isGatewayAuthenticated(req)) {
    return { id: "gateway", email: null, name: "Gateway" }
  }

  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user?.id) return null

  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
  }
}

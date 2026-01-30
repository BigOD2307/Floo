/**
 * Auth gateway → Floo (server-to-server).
 * Si X-Floo-Gateway-Key ou Authorization: Bearer correspond à FLOO_GATEWAY_API_KEY, on accepte.
 */

const HEADER_KEY = "x-floo-gateway-key"
const ENV_KEY = "FLOO_GATEWAY_API_KEY"

export function isGatewayAuthenticated(req: Request): boolean {
  const secret = process.env[ENV_KEY]?.trim()
  if (!secret) return false

  const keyHeader = req.headers.get(HEADER_KEY)?.trim()
  if (keyHeader && keyHeader === secret) return true

  const auth = req.headers.get("authorization")?.trim()
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim()
    if (token === secret) return true
  }

  return false
}

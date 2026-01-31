/**
 * Helpers pour appeler les APIs Google (Gmail, Calendar) avec le token OAuth.
 */

import { prisma } from "@/lib/db"

async function getValidAccessToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
  })
  if (!integration?.accessToken) return null

  const expiresAt = integration.expiresAt
  const now = new Date()
  if (expiresAt && expiresAt < new Date(now.getTime() + 60_000)) {
    const refreshed = await refreshGoogleToken(integration.refreshToken, integration.accessToken)
    if (refreshed) {
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? integration.refreshToken,
          expiresAt: refreshed.expires_in
            ? new Date(Date.now() + refreshed.expires_in * 1000)
            : null,
        },
      })
      return refreshed.access_token
    }
  }
  return integration.accessToken
}

async function refreshGoogleToken(
  refreshToken: string | null,
  _fallbackAccessToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
  if (!refreshToken) return null
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }
  return data
}

export async function googleApiFetch(
  userId: string,
  url: string,
  opts: RequestInit = {}
): Promise<Response> {
  const token = await getValidAccessToken(userId)
  if (!token) throw new Error("Google non connecté")

  return fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  })
}

export async function getGoogleUserIdByPhone(phoneNumber: string): Promise<string | null> {
  const formatted = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`
  const user = await prisma.user.findUnique({
    where: { phoneNumber: formatted },
    select: { id: true },
  })
  return user?.id ?? null
}

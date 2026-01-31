import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

/**
 * GET /api/integrations/google/callback
 * Callback OAuth Google - échange le code contre des tokens, stocke en DB.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  const cookieStore = await cookies()
  const savedState = cookieStore.get("floo_google_oauth_state")?.value
  const userId = cookieStore.get("floo_google_oauth_user")?.value

  if (!code || !state || state !== savedState || !userId) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=invalid_callback", process.env.NEXTAUTH_URL || "http://localhost:3000")
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=config", process.env.NEXTAUTH_URL || "http://localhost:3000")
    )
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const redirectUri = `${baseUrl}/api/integrations/google/callback`

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error("[integrations/google] token error:", err)
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=token", process.env.NEXTAUTH_URL || "http://localhost:3000")
    )
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null

  await prisma.integration.upsert({
    where: {
      userId_provider: { userId, provider: "google" },
    },
    create: {
      userId,
      provider: "google",
      scope: "gmail,calendar,sheets,docs,drive",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt,
      updatedAt: new Date(),
    },
  })

  const res = NextResponse.redirect(new URL("/dashboard/integrations?linked=google", baseUrl))
  res.cookies.delete("floo_google_oauth_state")
  res.cookies.delete("floo_google_oauth_user")
  return res
}

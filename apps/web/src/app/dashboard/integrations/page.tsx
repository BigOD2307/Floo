"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Integration {
  id: string
  provider: string
  scope: string
  connected: boolean
  connectedAt: string
}

const AVAILABLE_INTEGRATIONS = [
  {
    id: "google",
    name: "Google",
    description: "Gmail, Google Calendar",
    icon: "logos:google-icon",
    status: "available",
    authUrl: "/api/integrations/google/connect",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Outlook, calendrier, OneDrive",
    icon: "logos:microsoft-outlook-icon",
    status: "coming",
  },
  {
    id: "apple",
    name: "Apple",
    description: "iCloud Mail, Calendrier (CalDAV)",
    icon: "logos:apple",
    status: "coming",
  },
  {
    id: "reservation",
    name: "Réservation",
    description: "Restaurants, événements (à venir)",
    icon: "solar:calendar-mark-linear",
    status: "coming",
  },
]

function IntegrationsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const linked = searchParams.get("linked")
    const err = searchParams.get("error")
    if (linked === "google") setMessage({ type: "success", text: "Google connecté avec succès !" })
    if (err) setMessage({ type: "error", text: "Erreur de connexion. Réessaie." })
  }, [searchParams])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetch("/api/integrations")
        .then((r) => r.json())
        .then((d) => setIntegrations(d.integrations ?? []))
        .catch(() => setIntegrations([]))
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const connectedProviders = new Set(integrations.map((i) => i.provider))

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303]">
        <p className="text-white">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[#00ffc4] hover:underline mb-8"
        >
          ← Retour au dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-2">Intégrations</h1>
        <p className="text-white/70 mb-8">
          Connecte tes services pour que Floo accède à ton mail, calendrier et plus.
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {AVAILABLE_INTEGRATIONS.map((int) => {
            const connected = connectedProviders.has(int.id)
            const isComing = int.status === "coming"
            return (
              <div
                key={int.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <iconify-icon icon={int.icon} className="text-2xl"></iconify-icon>
                  </div>
                  <div>
                    <h3 className="font-medium">{int.name}</h3>
                    <p className="text-sm text-white/60">{int.description}</p>
                  </div>
                </div>
                <div>
                  {connected ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Connecté
                    </span>
                  ) : isComing ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60">
                      Bientôt
                    </span>
                  ) : int.authUrl ? (
                    <a
                      href={int.authUrl}
                      className="px-4 py-2 rounded-lg bg-[#00ffc4] text-black font-medium hover:opacity-90 text-sm"
                    >
                      Connecter
                    </a>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#030303]">
        <p className="text-white">Chargement...</p>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}

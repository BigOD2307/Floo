"use client"

import { useEffect, useState, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardTour } from "@/components/dashboard-tour"

interface UserData {
  name: string
  email: string
  code: string
  credits: number
  whatsappLinked: boolean
  phoneNumber: string | null
}

interface DashboardStats {
  credits: number
  conversations: number
  timeSaved: {
    hours: number
    minutes: number
    formatted: string
  }
  isNewUser: boolean
  whatsappLinked: boolean
}

type PageId = "dashboard" | "credits" | "whatsapp" | "history" | "analytics" | "settings"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard")
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [codeGenerated, setCodeGenerated] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const tiltCardsRef = useRef<Map<HTMLElement, () => void>>(new Map())

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchUserData()
      // Check if tour should be shown
      const tourCompleted = localStorage.getItem("floo-dashboard-tour-completed")
      if (!tourCompleted) {
        setShowTour(true)
      }
    }
  }, [status, router])

  useEffect(() => {
    initTilt()
    return () => {
      // Cleanup tilt listeners
      tiltCardsRef.current.forEach((cleanup) => cleanup())
      tiltCardsRef.current.clear()
    }
  }, [currentPage])

  const fetchUserData = async () => {
    setFetchError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const [userResponse, statsResponse] = await Promise.all([
        fetch("/api/user", { signal: controller.signal }),
        fetch("/api/dashboard/stats", { signal: controller.signal }),
      ])
      clearTimeout(timeout)

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          setFetchError("Session expirée. Veuillez vous reconnecter.")
          router.push("/auth/signin")
          return
        }
        throw new Error(`Erreur ${userResponse.status}`)
      }
      const userData = await userResponse.json()
      setUserData(userData)

      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setDashboardStats(stats)
      }
    } catch (error) {
      console.error(error)
      const message =
        error instanceof Error
          ? error.name === "AbortError"
            ? "Délai dépassé. Vérifiez votre connexion."
            : error.message
          : "Impossible de charger le dashboard."
      setFetchError(message)
    } finally {
      setLoading(false)
    }
  }

  const switchPage = (pageId: PageId) => {
    setCurrentPage(pageId)
  }

  const initTilt = () => {
    // Cleanup previous listeners
    tiltCardsRef.current.forEach((cleanup) => cleanup())
    tiltCardsRef.current.clear()

    const cards = document.querySelectorAll(".tilt-card")
    cards.forEach((card) => {
      const cardElement = card as HTMLElement

      const handleMouseMove = (e: MouseEvent) => {
        const rect = cardElement.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const rotateX = ((y - centerY) / centerY) * -5
        const rotateY = ((x - centerX) / centerX) * 5

        cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`
      }

      const handleMouseLeave = () => {
        cardElement.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
      }

      cardElement.addEventListener("mousemove", handleMouseMove)
      cardElement.addEventListener("mouseleave", handleMouseLeave)

      const cleanup = () => {
        cardElement.removeEventListener("mousemove", handleMouseMove)
        cardElement.removeEventListener("mouseleave", handleMouseLeave)
      }

      tiltCardsRef.current.set(cardElement, cleanup)
    })
  }

  const generateCode = async () => {
    try {
      // Utiliser le code existant de l'utilisateur
      if (userData?.code) {
        setGeneratedCode(userData.code)
        setCodeGenerated(true)
        setTimeout(() => {
          initTilt()
        }, 100)
        return
      }

      // Régénérer un nouveau code si nécessaire
      setCodeLoading(true)
      const response = await fetch("/api/whatsapp/regenerate-code", {
        method: "POST",
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Erreur lors de la génération du code")
      }

      const data = await response.json()
      setGeneratedCode(data.code)
      setCodeGenerated(true)

      // Mettre à jour les données utilisateur
      if (userData) {
        setUserData({ ...userData, code: data.code })
      }

      setTimeout(() => {
        initTilt()
      }, 100)
    } catch (error) {
      console.error("Erreur génération code:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la génération du code. Veuillez réessayer.")
    } finally {
      setCodeLoading(false)
    }
  }

  const copyCode = () => {
    const codeToCopy = generatedCode || userData?.code || ""
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopyFeedback(true)
      setTimeout(() => {
        setCopyFeedback(false)
      }, 2000)
    })
  }

  const pageTitles: Record<PageId, string> = {
    dashboard: "Vue d'ensemble",
    whatsapp: "Connexion WhatsApp",
    credits: "Crédits & Abonnements",
    history: "Historique",
    analytics: "Analytics",
    settings: "Paramètres",
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303]">
        <p className="text-white">Chargement...</p>
      </div>
    )
  }

  if (fetchError || !userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] gap-6 px-4">
        <p className="text-white/90 text-center max-w-md">
          {fetchError || "Impossible de charger vos données."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setLoading(true)
              fetchUserData()
            }}
            className="px-4 py-2 rounded-lg bg-[#00ffc4] text-black font-medium hover:opacity-90"
          >
            Réessayer
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#030303] text-white h-screen flex relative selection:bg-[#00ffc4] selection:text-black overflow-hidden">
      {/* Background Noise */}
      <div className="bg-noise"></div>

      {/* Animated Ambient Background */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#00ffc4]/5 rounded-full blur-[120px] pointer-events-none blob-anim"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none blob-anim-delayed"></div>
      <div className="fixed top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      {/* SIDEBAR */}
      <aside id="tour-sidebar" className="w-20 lg:w-64 h-full glass-sidebar flex flex-col z-40 relative hidden md:flex transition-all duration-300">
        {/* Logo */}
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#00ffc4] rounded-lg blur opacity-40 animate-pulse"></div>
            <div className="w-full h-full bg-gradient-to-br from-[#00ffc4] to-[#00cc9e] rounded-lg flex items-center justify-center text-black font-bold text-lg relative z-10">
              F
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden lg:block">Floo.</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          <button
            onClick={() => switchPage("dashboard")}
            className={`w-full nav-item ${
              currentPage === "dashboard" ? "active" : "text-neutral-400"
            } flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 group text-left relative overflow-hidden`}
          >
            <iconify-icon
              icon="solar:widget-linear"
              className="text-xl group-hover:scale-110 transition-transform relative z-10"
            ></iconify-icon>
            <span className="hidden lg:block relative z-10">Vue d'ensemble</span>
          </button>
          <button
            onClick={() => switchPage("credits")}
            className={`w-full nav-item ${
              currentPage === "credits" ? "active" : "text-neutral-400"
            } flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 hover:text-white group text-left`}
          >
            <iconify-icon
              icon="solar:wallet-money-linear"
              className="text-xl group-hover:scale-110 transition-transform"
            ></iconify-icon>
            <span className="hidden lg:block">Crédits</span>
          </button>
          <button
            onClick={() => switchPage("whatsapp")}
            className={`w-full nav-item ${
              currentPage === "whatsapp" ? "active" : "text-neutral-400"
            } flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 hover:text-white group text-left`}
          >
            <iconify-icon
              icon="solar:chat-round-dots-linear"
              className="text-xl group-hover:scale-110 transition-transform"
            ></iconify-icon>
            <span className="hidden lg:block">Connexion WhatsApp</span>
            {userData.whatsappLinked && (
              <span className="hidden lg:block ml-auto w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e] animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => switchPage("history")}
            className={`w-full nav-item ${
              currentPage === "history" ? "active" : "text-neutral-400"
            } flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 hover:text-white group text-left`}
          >
            <iconify-icon
              icon="solar:history-linear"
              className="text-xl group-hover:scale-110 transition-transform"
            ></iconify-icon>
            <span className="hidden lg:block">Historique</span>
          </button>
          <button
            onClick={() => switchPage("analytics")}
            className={`w-full nav-item ${
              currentPage === "analytics" ? "active" : "text-neutral-400"
            } flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 hover:text-white group text-left`}
          >
            <iconify-icon
              icon="solar:graph-up-linear"
              className="text-xl group-hover:scale-110 transition-transform"
            ></iconify-icon>
            <span className="hidden lg:block">Analytics</span>
          </button>
          <button
            onClick={() => switchPage("settings")}
            className={`w-full nav-item ${
              currentPage === "settings" ? "active" : "text-neutral-400"
            } flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 hover:text-white group text-left`}
          >
            <iconify-icon
              icon="solar:settings-minimalistic-linear"
              className="text-xl group-hover:scale-110 transition-transform"
            ></iconify-icon>
            <span className="hidden lg:block">Paramètres</span>
          </button>
        </nav>

        {/* Profile */}
        <div id="tour-profile" className="p-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full p-[1px] bg-gradient-to-tr from-[#00ffc4] to-transparent">
              <div className="w-full h-full rounded-full bg-neutral-900 overflow-hidden">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || "User")}&background=00ffc4&color=000`}
                  alt="Avatar"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
            <div className="flex flex-col hidden lg:flex">
              <span className="text-xs font-semibold text-white group-hover:text-[#00ffc4] transition-colors">
                {userData.name || "Utilisateur"}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">PRO MEMBER</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full flex flex-col relative z-10 overflow-hidden bg-gradient-to-b from-transparent to-black/40">
        {/* Top Bar */}
        <header className="w-full h-20 px-8 flex items-center justify-between z-20 sticky top-0">
          <button className="md:hidden text-white text-2xl">
            <iconify-icon icon="solar:hamburger-menu-linear"></iconify-icon>
          </button>

          <div className="hidden md:block">
            <h1 className="text-sm text-neutral-400">
              App <span className="mx-2 text-neutral-600">/</span>{" "}
              <span className="text-white font-medium">{pageTitles[currentPage]}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
              <span className="w-2 h-2 bg-[#00ffc4] rounded-full animate-ping absolute opacity-75"></span>
              <span className="w-2 h-2 bg-[#00ffc4] rounded-full relative"></span>
              <span className="text-xs font-bold text-white tracking-wide">LIVE</span>
        </div>

            <button
              onClick={() => signOut()}
              className="w-10 h-10 rounded-full border border-white/5 bg-white/5 hover:bg-[#00ffc4]/10 hover:text-[#00ffc4] hover:border-[#00ffc4]/30 flex items-center justify-center text-neutral-400 transition-all relative group"
            >
              <iconify-icon
                icon="solar:logout-2-linear"
                className="text-xl group-hover:rotate-12 transition-transform"
              ></iconify-icon>
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div id="main-scroll-area" className="flex-1 overflow-y-auto custom-scroll p-6 md:p-8 relative perspective-container">
          <div className="max-w-7xl mx-auto pb-20">
            {/* 1. DASHBOARD PAGE */}
            <div
              id="page-dashboard"
              className={`page-content ${currentPage === "dashboard" ? "active" : ""}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    Bonjour,{" "}
                    <span className="font-serif-italic text-transparent bg-clip-text bg-gradient-to-r from-[#00ffc4] to-blue-500">
                      {userData.name?.split(" ")[0] || "Utilisateur"}
                    </span>
                  </h2>
                  <p className="text-neutral-400 text-sm max-w-md">
                    Vos assistants IA sont actifs et prêts. Voici votre rapport d'activité en temps réel.
                  </p>
                </div>
                <div className="flex gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <button
                    onClick={() => switchPage("whatsapp")}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-all flex items-center gap-2 group"
                  >
                    <iconify-icon
                      icon="solar:chat-round-line-linear"
                      className="group-hover:text-green-400 transition-colors"
                    ></iconify-icon>{" "}
                    Configurer IA
                  </button>
                  <button
                    id="tour-recharge"
                    onClick={() => switchPage("credits")}
                    className="px-5 py-2.5 rounded-xl bg-[#00ffc4] text-black text-sm font-bold hover:bg-[#00e6b0] hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,196,0.3)] flex items-center gap-2"
                  >
                    <iconify-icon icon="solar:wallet-money-bold"></iconify-icon> Recharger
                  </button>
                </div>
              </div>

                    {/* 3D KPI Grid */}
              <div id="tour-kpi" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Card 1 - Credits */}
                <div className="glass-panel p-8 rounded-3xl tilt-card group relative overflow-hidden cursor-default">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#00ffc4]/10 rounded-full blur-[50px] group-hover:bg-[#00ffc4]/20 transition-all duration-500 tilt-content"></div>
                  <div className="relative z-10 tilt-content">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#00ffc4]/10 border border-[#00ffc4]/20 flex items-center justify-center text-[#00ffc4] shadow-[0_0_15px_rgba(0,255,196,0.1)]">
                        <iconify-icon icon="solar:wallet-bold-duotone" className="text-2xl"></iconify-icon>
                      </div>
                      <span className="text-[10px] font-mono text-[#00ffc4] bg-[#00ffc4]/5 px-2 py-1 rounded border border-[#00ffc4]/10">
                        LIVE
                      </span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2 tracking-tighter">
                      {dashboardStats?.credits ?? userData.credits}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Crédits disponibles</span>
                    </div>
                  </div>
                </div>

                {/* Card 2 - Conversations */}
                <div className="glass-panel p-8 rounded-3xl tilt-card group relative overflow-hidden cursor-default">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[50px] group-hover:bg-purple-500/20 transition-all duration-500 tilt-content"></div>
                  <div className="relative z-10 tilt-content">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <iconify-icon icon="solar:chat-line-bold-duotone" className="text-2xl"></iconify-icon>
                      </div>
                      {!dashboardStats?.isNewUser && dashboardStats && dashboardStats.conversations > 0 && (
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/5 px-2 py-1 rounded border border-purple-500/10">
                          +12%
                        </span>
                      )}
                    </div>
                    <div className="text-4xl font-bold text-white mb-2 tracking-tighter">
                      {showTour ? "42" : dashboardStats?.conversations ?? 0}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Conversations auto</span>
                    </div>
                  </div>
                </div>

                {/* Card 3 - Time Saved */}
                <div className="glass-panel p-8 rounded-3xl tilt-card group relative overflow-hidden cursor-default">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-all duration-500 tilt-content"></div>
                  <div className="relative z-10 tilt-content">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                        <iconify-icon icon="solar:clock-circle-bold-duotone" className="text-2xl"></iconify-icon>
                      </div>
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
                        ESTIMATION
                      </span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2 tracking-tighter">
                      {showTour ? "3h 20m" : dashboardStats?.timeSaved?.formatted ?? "0m"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Économisées ce mois</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Large Action Card */}
              <div
                id="tour-whatsapp-card"
                className="glass-panel p-1 rounded-3xl tilt-card cursor-pointer group mb-10"
                onClick={() => switchPage("whatsapp")}
              >
                <div className="bg-black/40 rounded-[22px] p-8 h-full border border-white/5 relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                      backgroundSize: "30px 30px",
                      transform: "perspective(500px) rotateX(20deg)",
                    }}
                  ></div>

                  <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 tilt-content">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)] group-hover:scale-110 transition-transform duration-500">
                      <iconify-icon icon="solar:whatsapp-bold" className="text-4xl text-black"></iconify-icon>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-white mb-2">Connecter un nouveau numéro</h3>
                      <p className="text-neutral-400 max-w-lg">
                        Synchronisez votre WhatsApp pour permettre à Floo de gérer vos messages. Générez votre code
                        unique et envoyez-le au bot.
                      </p>
                    </div>
                    <div className="px-6 py-3 rounded-full border border-white/10 bg-white/5 group-hover:bg-white/10 group-hover:border-[#00ffc4]/50 group-hover:text-[#00ffc4] transition-all flex items-center gap-2">
                      Commencer <iconify-icon icon="solar:arrow-right-linear"></iconify-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. WHATSAPP PAGE */}
            <div id="page-whatsapp" className={`page-content ${currentPage === "whatsapp" ? "active" : ""}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
                {/* Left: Instructions */}
                <div className="space-y-8 animate-slide-up">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Configuration V2.0</span>
                    </div>
                    <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                      Lier votre compte <br />
                      <span className="text-[#00ffc4]">WhatsApp</span>
                    </h2>
                    <p className="text-neutral-400 text-lg leading-relaxed max-w-md">
                      Pour sécuriser la connexion, Floo utilise un système de vérification par code unique. Suivez ces
                      3 étapes simples.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/10 font-mono text-lg group-hover:bg-[#00ffc4] group-hover:text-black transition-colors">
                        1
                      </div>
                      <div>
                        <div className="text-white font-medium">Générez votre code</div>
                        <div className="text-sm text-neutral-500">Cliquez sur le bouton pour créer une clé unique.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/10 font-mono text-lg group-hover:bg-[#00ffc4] group-hover:text-black transition-colors">
                        2
                      </div>
                      <div>
                        <div className="text-white font-medium">Copiez le code</div>
                        <div className="text-sm text-neutral-500">Utilisez le bouton de copie automatique.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/10 font-mono text-lg group-hover:bg-[#00ffc4] group-hover:text-black transition-colors">
                        3
                      </div>
                      <div>
                        <div className="text-white font-medium">Envoyez à Floo</div>
                        <div className="text-sm text-neutral-500">Ouvrez WhatsApp et collez le code dans la conversation.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Interactive Generator Card */}
                <div className="relative perspective-container">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00ffc4] to-blue-600 rounded-3xl blur-[80px] opacity-20 animate-pulse"></div>

                  <div className="glass-panel p-1 rounded-3xl tilt-card relative z-10">
                    <div className="bg-[#050505] rounded-[20px] p-8 md:p-10 border border-white/10 relative overflow-hidden min-h-[400px] flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-8 tilt-content">
                        <div className="flex items-center gap-3">
                          <iconify-icon icon="logos:whatsapp-icon" className="text-3xl"></iconify-icon>
                          <span className="text-sm font-mono text-neutral-500">API GATEWAY</span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            userData.whatsappLinked
                              ? "bg-green-500 shadow-[0_0_10px_green]"
                              : codeGenerated
                              ? "bg-orange-500 shadow-[0_0_10px_orange] animate-pulse"
                              : "bg-red-500 shadow-[0_0_10px_red]"
                          }`}
                          id="status-dot"
                        ></div>
                      </div>

                      {/* Code Area */}
                      <div className="my-auto tilt-content">
                        {codeGenerated ? (
                          <div id="code-display-area" className="text-center space-y-6">
                            <div className="text-xs text-[#00ffc4] font-mono mb-2 tracking-widest uppercase">
                              Votre code unique
                            </div>

                            <div className="relative group cursor-pointer" onClick={copyCode}>
                              <div className="absolute -inset-2 bg-[#00ffc4]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center gap-4 hover:border-[#00ffc4]/50 transition-colors">
                                <span
                                  id="generated-code"
                                  className="text-4xl md:text-5xl font-mono-code font-bold text-white tracking-wider"
                                >
                                  {generatedCode}
                                </span>
                                <iconify-icon
                                  icon="solar:copy-linear"
                                  className="text-neutral-400 group-hover:text-white transition-colors"
                                ></iconify-icon>
                              </div>
                              {copyFeedback && (
                                <div className="absolute -bottom-6 left-0 w-full text-center text-xs text-[#00ffc4] opacity-100 transition-opacity">
                                  Copié dans le presse-papier !
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-neutral-500 mt-4">Ce code expire dans 10 minutes.</p>
                          </div>
                        ) : (
                          <div id="generator-intro" className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-full border border-white/10 flex items-center justify-center mb-6 relative">
                              <iconify-icon
                                icon="solar:shield-keyhole-linear"
                                className="text-4xl text-neutral-500"
                              ></iconify-icon>
                            </div>
                            <button
                              onClick={generateCode}
                              disabled={codeLoading}
                              id="btn-generate"
                              className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-[#00ffc4] hover:shadow-[0_0_30px_rgba(0,255,196,0.4)] transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:pointer-events-none"
                            >
                              {codeLoading ? "Génération..." : "Générer mon code"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      {codeGenerated && (
                        <div id="action-buttons" className="mt-8 pt-6 border-t border-white/5 tilt-content">
                          <a
                            href={`https://wa.me/2250703894368?text=${encodeURIComponent(generatedCode)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-[#25D366] text-black font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)]"
                          >
                            <iconify-icon icon="solar:chat-square-call-bold"></iconify-icon>
                            Ouvrir WhatsApp Floo
                          </a>
                          <p className="text-[10px] text-center text-neutral-500 mt-3">
                            En cliquant, vous ouvrirez une discussion avec Floo.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CREDITS PAGE */}
            <div id="page-credits" className={`page-content ${currentPage === "credits" ? "active" : ""}`}>
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-8">Recharger votre compte</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Small Pack */}
                  <div className="glass-panel p-8 rounded-3xl tilt-card flex flex-col items-center text-center hover:border-white/30 transition-all">
                    <div className="text-sm font-bold tracking-widest text-neutral-500 mb-4 uppercase">Starter</div>
                    <div className="text-5xl font-bold text-white mb-2">15€</div>
                    <div className="text-[#00ffc4] mb-8 font-mono">500 crédits</div>
                    <ul className="space-y-3 mb-8 text-sm text-neutral-400 w-full text-left pl-4">
                      <li className="flex items-center gap-2">
                        <iconify-icon icon="solar:check-circle-linear" className="text-white"></iconify-icon> Accès
                        basique
                      </li>
                      <li className="flex items-center gap-2">
                        <iconify-icon icon="solar:check-circle-linear" className="text-white"></iconify-icon> Support
                        Email
                </li>
                    </ul>
                    <button
                      onClick={() => router.push("/payment")}
                      className="w-full py-3 rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all font-medium mt-auto"
                    >
                      Choisir
                    </button>
                  </div>

                  {/* Pro Pack */}
                  <div className="glass-panel p-8 rounded-3xl tilt-card flex flex-col items-center text-center border-[#00ffc4]/50 shadow-[0_0_30px_rgba(0,255,196,0.1)] relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00ffc4] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Populaire
                    </div>
                    <div className="text-sm font-bold tracking-widest text-[#00ffc4] mb-4 uppercase">Pro</div>
                    <div className="text-6xl font-bold text-white mb-2">60€</div>
                    <div className="text-[#00ffc4] mb-8 font-mono">2,500 crédits</div>
                    <ul className="space-y-3 mb-8 text-sm text-neutral-300 w-full text-left pl-4">
                      <li className="flex items-center gap-2">
                        <iconify-icon icon="solar:check-circle-bold" className="text-[#00ffc4]"></iconify-icon> Accès
                        prioritaire
                      </li>
                      <li className="flex items-center gap-2">
                        <iconify-icon icon="solar:check-circle-bold" className="text-[#00ffc4]"></iconify-icon> Réponses
                        rapides
                      </li>
                      <li className="flex items-center gap-2">
                        <iconify-icon icon="solar:check-circle-bold" className="text-[#00ffc4]"></iconify-icon> Support
                        WhatsApp
                </li>
                    </ul>
                    <button
                      onClick={() => router.push("/payment")}
                      className="w-full py-3 rounded-xl bg-[#00ffc4] text-black font-bold hover:shadow-[0_0_20px_#00ffc4] transition-all mt-auto scale-105"
                    >
                      Choisir
                    </button>
                  </div>

                  {/* Enterprise */}
                  <div className="glass-panel p-8 rounded-3xl tilt-card flex flex-col items-center text-center hover:border-purple-500/50 transition-all">
                    <div className="text-sm font-bold tracking-widest text-purple-400 mb-4 uppercase">Business</div>
                    <div className="text-5xl font-bold text-white mb-2">200€</div>
                    <div className="text-purple-400 mb-8 font-mono">10,000 crédits</div>
                    <ul className="space-y-3 mb-8 text-sm text-neutral-400 w-full text-left pl-4">
                      <li className="flex items-center gap-2">
                        <iconify-icon icon="solar:check-circle-linear" className="text-white"></iconify-icon> API Access
                      </li>
                      <li className="flex items-center gap-2">
                        <iconify-icon icon="solar:check-circle-linear" className="text-white"></iconify-icon> Account
                        Manager
                </li>
                    </ul>
                    <button
                      onClick={() => router.push("/payment")}
                      className="w-full py-3 rounded-xl border border-white/10 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all font-medium mt-auto"
                    >
                      Choisir
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. HISTORY PAGE */}
            <div id="page-history" className={`page-content ${currentPage === "history" ? "active" : ""}`}>
              <h2 className="text-2xl font-semibold text-white mb-6">Historique des tâches</h2>
              <div className="glass-panel rounded-2xl overflow-hidden p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 text-xs text-neutral-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Tâche</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right pr-6">Coût</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-medium text-white">Analyse Vocale</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs">Audio</span>
                      </td>
                      <td className="p-4 text-neutral-500">Aujourd'hui, 10:23</td>
                      <td className="p-4 text-right pr-6 font-mono text-white">-12</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-medium text-white">Génération Image</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs">DALL-E</span>
                      </td>
                      <td className="p-4 text-neutral-500">Hier, 14:45</td>
                      <td className="p-4 text-right pr-6 font-mono text-white">-45</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-medium text-white">Résumé PDF</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs">Texte</span>
                      </td>
                      <td className="p-4 text-neutral-500">12 Oct, 09:00</td>
                      <td className="p-4 text-right pr-6 font-mono text-white">-8</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. ANALYTICS PAGE */}
            <div id="page-analytics" className={`page-content ${currentPage === "analytics" ? "active" : ""}`}>
              <div className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl text-neutral-500">
                Module Analytics en maintenance...
              </div>
            </div>

            {/* 6. SETTINGS PAGE */}
            <div id="page-settings" className={`page-content ${currentPage === "settings" ? "active" : ""}`}>
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold mb-6">Paramètres</h2>
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Mode Sombre</span>
                    <div className="w-10 h-6 bg-[#00ffc4] rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span>Notifications Email</span>
                    <div className="w-10 h-6 bg-white/10 rounded-full relative">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dashboard Tour */}
      {showTour && <DashboardTour onComplete={() => setShowTour(false)} />}
    </div>
  )
}

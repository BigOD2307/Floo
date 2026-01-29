"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthModal } from "@/components/auth-modal"

export default function Home() {
  const router = useRouter()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup")
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const toggleAuth = (mode: "signup" | "signin") => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const closeAuth = () => {
    setAuthModalOpen(false)
  }

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible")
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // 3D Tilt Effect for Wall of Love cards
  useEffect(() => {
    const cards = document.querySelectorAll(".glass-card")
    if (cards.length === 0) return

    const handleMouseMove = (e: MouseEvent) => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect()
        const cardX = rect.left + rect.width / 2
        const cardY = rect.top + rect.height / 2

        const mouseXRel = e.clientX - cardX
        const mouseYRel = e.clientY - cardY

        const rotateX = mouseYRel / -20
        const rotateY = mouseXRel / 20

        ;(card as HTMLElement).style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
      })
    }

    const handleMouseLeave = () => {
      cards.forEach((card) => {
        ;(card as HTMLElement).style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`
      })
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    // Scroll reveal animation for cards
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              ;(entry.target as HTMLElement).style.opacity = "1"
              ;(entry.target as HTMLElement).style.transform = "translateY(0)"
            }, index * 200)
          }
        })
      },
      { threshold: 0.1 }
    )

    cards.forEach((card) => {
      ;(card as HTMLElement).style.opacity = "0"
      ;(card as HTMLElement).style.transform = "translateY(50px)"
      ;(card as HTMLElement).style.transition = "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      cardObserver.observe(card)
    })

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      cardObserver.disconnect()
    }
  }, [])

  return (
    <>
      {/* Background Grid */}
      <div className="fixed top-0 w-full h-screen -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Top Bar */}
      <div className="bg-[#00332a] text-[#00ffc4] border-b border-[#00ffc4]/20 py-3 px-4 flex items-center justify-center text-sm relative z-50">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
          <span className="text-neutral-300">Disponible dès maintenant en Côte d'Ivoire 🇨🇮</span>
          <button
            onClick={() => toggleAuth("signup")}
            className="hover:bg-[#00ffc4]/20 transition-colors flex group text-xs font-semibold text-[#00ffc4] bg-[#00ffc4]/10 border-[#00ffc4]/30 border rounded-full px-4 py-1 gap-1 items-center"
          >
            Obtenir 20 crédits gratuits
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex max-w-7xl mx-auto px-6 h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ffc4] to-[#047857] flex items-center justify-center text-black">
                <iconify-icon icon="solar:chat-round-line-linear" width="20" stroke-width="2" />
              </div>
              Floo.
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
              <a href="#features" className="hover:text-white transition-colors">
                Fonctionnalités
              </a>
              <a href="#how-it-works" className="flex items-center gap-2 hover:text-white transition-colors">
                Comment ça marche
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Tarifs
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleAuth("signin")}
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors hidden sm:block"
            >
              Se connecter
            </button>
            <button
              onClick={() => toggleAuth("signup")}
              className="hover:bg-neutral-200 transition-all flex text-sm font-medium text-black bg-white rounded-lg py-2.5 px-5 shadow-[0_0_15px_rgba(255,255,255,0.1)] items-center"
            >
              Commencer
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="overflow-hidden pt-20 pb-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#00ffc4] rounded-full blur-[120px] opacity-10 -z-10 pointer-events-none" />

        <div className="z-10 text-center max-w-5xl mx-auto px-6 relative">
          <div className="inline-flex items-center gap-2 bg-neutral-900/50 border border-white/10 rounded-full pl-1 pr-4 py-1 shadow-sm mb-8 hover:border-[#00ffc4]/30 transition-colors cursor-default backdrop-blur-sm">
            <span className="text-[10px] flex items-center gap-1 font-semibold text-white bg-[#047857] rounded-full px-2 py-0.5 shadow-sm">
              Nouveau <iconify-icon icon="solar:star-bold" className="text-[#00ffc4]" />
            </span>
            <span className="text-sm font-medium text-neutral-300">L'IA directement dans ton WhatsApp</span>
          </div>

          <h1 className="leading-[1.1] md:text-6xl text-5xl font-semibold text-white tracking-tight max-w-5xl mx-auto mb-6">
            Ton assistant personnel, <br className="hidden md:block" />
            <span className="font-normal text-[#00ffc4] font-serif-italic drop-shadow-[0_0_15px_rgba(0,255,196,0.3)]">
              disponible 24h/24 et 7j/7.
            </span>
          </h1>

          <p className="md:text-xl leading-relaxed text-lg font-normal text-neutral-400 max-w-2xl mx-auto mb-10">
            Plus d'app à télécharger. Floo gère tes emails, tes résumés et ton planning directement depuis WhatsApp. Simple, rapide, efficace.
          </p>

          <div className="flex flex-col items-center gap-4 mb-20">
            <button
              onClick={() => toggleAuth("signup")}
              className="group relative bg-[#047857] hover:bg-[#059669] text-white text-lg font-medium px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(4,120,87,0.4)] transition-all flex items-center gap-3 w-full sm:w-auto justify-center overflow-hidden border border-[#10b981]/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <iconify-icon icon="solar:brand-whatsapp-linear" width="24" />
              <span className="relative">Essayer sur WhatsApp</span>
              <iconify-icon icon="solar:arrow-right-linear" className="transition-transform group-hover:translate-x-1" width="20" />
            </button>
            <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-900/80 px-3 py-1 rounded-md border border-white/5 backdrop-blur-sm">
              <span className="bg-[#00ffc4]/10 text-[#00ffc4] border border-[#00ffc4]/20 text-[10px] font-bold px-1.5 py-0.5 rounded">
                GRATUIT
              </span>
              <span className="font-medium text-neutral-400">Aucune carte bancaire requise pour tester.</span>
            </div>
          </div>

          {/* Trusted By Ticker */}
          <div className="w-full max-w-7xl mx-auto px-6 mb-20 relative z-10">
            <div className="text-center mb-8">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.2em]">
                Utilisé par les pros chez
              </p>
            </div>
            <div
              className="relative overflow-hidden w-full"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              }}
            >
              <div className="flex items-center gap-16 animate-ticker w-max">
                <div className="flex gap-16 shrink-0 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="text-2xl font-bold text-white">Orange</span>
                  <span className="text-2xl font-bold text-white">MTN</span>
                  <span className="text-2xl font-bold text-white">Wave</span>
                  <span className="text-2xl font-bold text-white">Canal+</span>
                  <span className="text-2xl font-bold text-white">Jumia</span>
                  <span className="text-2xl font-bold text-white">CIE</span>
                  <span className="text-2xl font-bold text-white">SODECI</span>
                </div>
                <div className="flex gap-16 shrink-0 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="text-2xl font-bold text-white">Orange</span>
                  <span className="text-2xl font-bold text-white">MTN</span>
                  <span className="text-2xl font-bold text-white">Wave</span>
                  <span className="text-2xl font-bold text-white">Canal+</span>
                  <span className="text-2xl font-bold text-white">Jumia</span>
                  <span className="text-2xl font-bold text-white">CIE</span>
                  <span className="text-2xl font-bold text-white">SODECI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center group hover:bg-white/[0.02] transition-colors">
              <div className="md:text-5xl group-hover:text-[#00ffc4] transition-colors text-4xl font-semibold text-white tracking-tight mb-2">
                2h+
              </div>
              <div className="uppercase flex gap-2 text-sm font-medium text-neutral-500 tracking-wide items-center">
                Gagnées par jour <iconify-icon icon="solar:clock-circle-linear" />
              </div>
            </div>
            <div className="flex flex-col group hover:bg-white/[0.02] transition-colors text-center py-12 px-6 items-center justify-center">
              <div className="md:text-5xl group-hover:text-[#00ffc4] transition-colors text-4xl font-semibold text-white tracking-tight mb-2">
                100%
              </div>
              <div className="uppercase flex gap-2 text-sm font-medium text-neutral-500 tracking-wide items-center">
                Sur WhatsApp
              </div>
            </div>
            <div className="flex flex-col group hover:bg-white/[0.02] transition-colors text-center py-12 px-6 items-center justify-center">
              <div className="md:text-5xl group-hover:text-[#00ffc4] transition-colors text-4xl font-semibold text-white tracking-tight mb-2">
                0
              </div>
              <div className="uppercase flex gap-2 text-sm font-medium text-neutral-500 tracking-wide items-center">
                App à installer
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Grid */}
      <section className="bg-[#050505] border-white/5 border-b pt-32 pb-32 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl z-10 mx-auto px-6 relative">
          <div className="text-center mb-20 reveal-on-scroll">
            <h2 className="md:text-6xl leading-[1.1] text-5xl font-semibold text-white tracking-tight">
              Si tu te reconnais dans <br />
              <span className="font-normal font-serif-italic text-[#00ffc4]">ces situations...</span>
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-20">
            <div className="md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-neutral-900/50 w-full border-white/5 border rounded-2xl p-8 hover:bg-neutral-900 hover:border-[#00ffc4]/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#00ffc4]/10 border border-[#00ffc4]/20 flex items-center justify-center text-[#00ffc4] mb-6 group-hover:scale-110 transition-transform">
                <iconify-icon icon="solar:letter-unread-linear" width="24" />
              </div>
              <p className="leading-relaxed text-lg font-medium text-neutral-300">
                Tes emails s'empilent et tu passes tes soirées à essayer de répondre à tout le monde.
              </p>
            </div>

            <div className="md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-neutral-900/50 w-full border-white/5 border rounded-2xl p-8 hover:bg-neutral-900 hover:border-purple-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <iconify-icon icon="solar:document-text-linear" width="24" />
              </div>
              <p className="leading-relaxed text-lg font-medium text-neutral-300">
                Tu reçois des PDF de 50 pages sur WhatsApp et tu n'as jamais le temps de les lire.
              </p>
            </div>

            <div className="md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-neutral-900/50 w-full border-white/5 border rounded-2xl p-8 hover:bg-neutral-900 hover:border-orange-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform">
                <iconify-icon icon="solar:calendar-date-linear" width="24" />
              </div>
              <p className="leading-relaxed text-lg font-medium text-neutral-300">
                Tu oublies de rappeler tes clients ou de noter tes rendez-vous importants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Split Section */}
      <section className="bg-[#050505] border-white/5 border-b pt-24 pb-24" id="features">
        <div className="w-full max-w-7xl mx-auto px-6">
          <h1 className="md:text-5xl md:mb-20 text-4xl font-semibold text-white tracking-tight text-center mb-16">
            Deux façons de gagner du temps
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Card 1: Redaction */}
            <div className="group md:p-12 overflow-hidden flex flex-col transition-all duration-500 hover:border-white/20 hover:bg-[#0f0f0f] bg-[#0A0A0A] h-full border-white/10 border rounded-[32px] pt-8 pr-8 pb-8 pl-8 relative">
              <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse-slow mix-blend-screen" />

              <div className="relative h-40 mb-2 flex items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm z-0">
                  <iconify-icon icon="solar:pen-new-square-linear" className="text-[#00ffc4]" width="28" />
                </div>
                <div className="absolute left-8 md:left-10 bg-[#1A1D21] border border-white/10 shadow-2xl rounded-xl p-4 flex items-start gap-4 w-full max-w-[340px] animate-float-card backdrop-blur-md z-10 top-2">
                  <div className="shrink-0 bg-[#25D366] rounded-lg p-1.5 mt-0.5 shadow-sm text-black flex items-center justify-center">
                    <iconify-icon icon="solar:brand-whatsapp-bold" width="20" />
                  </div>
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-semibold text-white">Floo</span>
                      <span className="text-[10px] text-neutral-500">À l'instant</span>
                    </div>
                    <span className="text-sm text-neutral-300 leading-snug">
                      Email envoyé au DG. J'ai confirmé ta présence pour jeudi 14h.
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-0 mt-auto pt-6">
                <h2 className="text-3xl font-semibold text-white tracking-tight mb-3">Rédaction Intelligente</h2>
                <p className="text-xs font-semibold tracking-[0.15em] text-emerald-500 uppercase mb-6">
                  TU PARLES. IL ÉCRIT.
                </p>
                <p className="leading-relaxed text-lg font-normal text-neutral-400 max-w-md mb-8">
                  Envoie une note vocale à Floo : "Dis à M. Kouassi que je serai en retard". Il rédige un message pro
                  et poli instantanément.
                </p>
                <div className="w-full h-px bg-white/10 mb-8" />
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-neutral-400 items-center">
                    <iconify-icon icon="solar:check-circle-linear" className="text-[#00ffc4]" /> Emails formels
                  </li>
                  <li className="flex gap-3 text-sm text-neutral-400 items-center">
                    <iconify-icon icon="solar:check-circle-linear" className="text-[#00ffc4]" /> Posts LinkedIn
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Synthesis */}
            <div className="group md:p-12 overflow-hidden flex flex-col transition-all duration-500 hover:border-white/20 hover:bg-[#0f0f0f] bg-[#0A0A0A] h-full border-white/10 border rounded-[32px] pt-8 pr-8 pb-8 pl-8 relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse-slow mix-blend-screen" />

              <div className="relative h-40 mb-2 flex items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm z-0">
                  <iconify-icon icon="solar:document-add-linear" className="text-blue-400" width="28" />
                </div>
                <div
                  className="absolute left-10 md:left-12 bg-[#1A1D21]/95 border border-white/10 shadow-2xl rounded-xl p-3 w-[220px] animate-float-card backdrop-blur-md z-10 top-0"
                  style={{ animationDelay: "-2s" }}
                >
                  <div className="flex items-center gap-2.5 mb-3 border-b border-white/5 pb-2.5">
                    <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center text-red-500">
                      <iconify-icon icon="solar:file-pdf-bold" width="18" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-white truncate">Rapport_Annuel_2024.pdf</div>
                      <div className="text-[10px] text-neutral-500">45 Pages • 12MB</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-neutral-400">Analyse en cours...</div>
                    <div className="h-1 w-full bg-neutral-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00ffc4] w-[80%]" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#00ffc4] pt-1">
                      <iconify-icon icon="solar:magic-stick-3-linear" /> Résumé généré
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-0 mt-auto pt-6">
                <h2 className="text-3xl font-semibold text-white tracking-tight mb-3">Synthèse Instantanée</h2>
                <p className="uppercase text-xs font-semibold text-blue-500 tracking-[0.15em] mb-6">
                  LIRE C'EST SURCOTÉ.
                </p>
                <p className="leading-relaxed text-lg font-normal text-neutral-400 mb-8">
                  Transfère un PDF, une image ou un long texte à Floo. En 10 secondes, il te donne l'essentiel : les
                  points clés, les chiffres et les actions à prendre.
                </p>
                <div className="w-full h-px bg-white/10 mb-8" />
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-neutral-400 items-center">
                    <iconify-icon icon="solar:check-circle-linear" className="text-blue-500" /> Contrats & Rapports
                  </li>
                  <li className="flex items-center gap-3 text-neutral-400 text-sm">
                    <iconify-icon icon="solar:check-circle-linear" className="text-blue-500" /> Extraction de données
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engine Section (Orbit) */}
      <section className="overflow-hidden flex flex-col text-white bg-[#050505] w-full border-white/5 border-b pt-20 pb-40 relative items-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] mask-radial pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ffc4] rounded-full blur-[150px] opacity-[0.05] pointer-events-none" />

        <div className="text-center w-full max-w-4xl z-10 relative mb-12 px-6 reveal-on-scroll">
          <h2 className="md:text-6xl text-4xl font-semibold text-white tracking-tight mb-6">
            Le cerveau de tes opérations
          </h2>
          <p className="leading-relaxed text-lg font-light text-neutral-400 max-w-2xl mx-auto">
            Floo connecte tout ton écosystème digital.
          </p>
        </div>

        <div className="relative flex flex-col items-center w-full max-w-[1400px]">
          <div className="relative w-[500px] h-[500px] flex items-center justify-center z-20 scale-75 md:scale-100 origin-bottom">
            <div className="absolute inset-0 animate-spin-slow">
              <svg className="absolute inset-0 w-full h-full text-white/5" viewBox="0 0 600 600">
                <g className="stroke-current stroke-[1]">
                  <circle cx="300" cy="300" r="150" fill="none" />
                  <circle cx="300" cy="300" r="250" fill="none" />
                </g>
              </svg>

              <div className="absolute top-[50px] left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                <div className="w-14 h-14 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <iconify-icon icon="solar:letter-linear" className="text-[#00ffc4]" width="24" />
                </div>
              </div>
              <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 translate-y-1/2 animate-spin-slow-reverse">
                <div className="w-14 h-14 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
                  <iconify-icon icon="solar:calendar-linear" className="text-[#00ffc4]" width="24" />
                </div>
              </div>
              <div className="absolute top-1/2 right-[50px] translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                <div className="w-14 h-14 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
                  <iconify-icon icon="solar:file-text-linear" className="text-[#00ffc4]" width="24" />
                </div>
              </div>
              <div className="absolute top-1/2 left-[50px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse">
                <div className="w-14 h-14 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
                  <iconify-icon icon="solar:magnifer-linear" className="text-[#00ffc4]" width="24" />
                </div>
              </div>
            </div>

            <div className="absolute z-30 flex items-center justify-center">
              <div className="w-28 h-28 bg-[#0a0a0a] rounded-3xl border border-[#00ffc4]/30 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,196,0.2)] relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute inset-0 bg-[#00ffc4]/10 animate-pulse" />
                <iconify-icon icon="solar:chat-round-line-linear" className="text-white z-10" width="48" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section (Sticky) */}
      <section className="bg-[#050505] pt-24 pb-24 relative" id="how-it-works">
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-24 reveal-on-scroll">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#00ffc4] animate-pulse" />
              <span className="text-xs font-medium text-white tracking-wide uppercase">Workflow Simple</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-[1.1]">
              Comment ça marche ?
            </h2>
          </div>

          <div className="relative w-full">
            {/* Step 1 */}
            <div className="sticky top-24 z-10 mb-12">
              <div className="bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl ring-1 ring-white/5 flex flex-col md:flex-row gap-12 relative overflow-hidden min-h-[400px] border border-white/5">
                <div className="md:w-1/2 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#00ffc4]/10 text-[#00ffc4] p-2 rounded-lg border border-[#00ffc4]/20">
                      <iconify-icon icon="solar:microphone-linear" width="24" />
                    </div>
                    <span className="uppercase text-sm font-semibold text-[#00ffc4] tracking-wide">Étape 1</span>
                  </div>
                  <h3 className="text-3xl font-semibold text-white tracking-tight mb-4">Tu envoies une note</h3>
                  <p className="leading-relaxed text-neutral-400">
                    Pas besoin d'écrire. Envoie simplement une note vocale à Floo comme si tu parlais à un collègue.
                  </p>
                </div>
                <div className="md:w-1/2 bg-black/40 rounded-2xl border border-white/10 p-6 flex items-center justify-center">
                  <div className="bg-neutral-800 p-4 rounded-xl border border-white/10 flex items-center gap-3 w-full max-w-xs">
                    <div className="w-8 h-8 rounded-full bg-[#00ffc4]/20 flex items-center justify-center text-[#00ffc4]">
                      <iconify-icon icon="solar:microphone-bold" width="16" />
                    </div>
                    <div className="h-1 bg-neutral-600 flex-1 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00ffc4] w-2/3 animate-pulse" />
                    </div>
                    <span className="text-xs text-neutral-400">0:12</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="sticky top-32 z-20 mb-12">
              <div className="bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl ring-1 ring-white/5 flex flex-col md:flex-row gap-12 relative overflow-hidden min-h-[400px] border border-white/5">
                <div className="md:w-1/2 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-900/30 text-purple-400 p-2 rounded-lg border border-purple-500/20">
                      <iconify-icon icon="solar:cpu-linear" width="24" />
                    </div>
                    <span className="uppercase text-sm font-semibold text-purple-400 tracking-wide">Étape 2</span>
                  </div>
                  <h3 className="text-3xl font-semibold text-white tracking-tight mb-4">Floo analyse et comprend</h3>
                  <p className="leading-relaxed text-neutral-400">
                    L'IA transcrit, comprend le contexte, recherche les infos nécessaires et prépare le travail.
                  </p>
                </div>
                <div className="md:w-1/2 bg-black/40 rounded-2xl border border-white/10 p-6 flex flex-col justify-center font-mono">
                  <div className="text-xs text-green-500 mb-1">&gt; Analyse de la demande...</div>
                  <div className="bg-neutral-800/50 p-3 rounded mb-2 border-l-2 border-[#00ffc4]">
                    <div className="text-xs text-white">Action: Rédaction Email</div>
                    <div className="text-xs text-neutral-400">Ton: Professionnel</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="sticky top-40 z-30 mb-12">
              <div className="bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl ring-1 ring-white/5 flex flex-col md:flex-row gap-12 relative overflow-hidden min-h-[400px] border border-white/5">
                <div className="md:w-1/2 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-900/30 text-blue-400 p-2 rounded-lg border border-blue-500/20">
                      <iconify-icon icon="solar:plain-linear" width="24" />
                    </div>
                    <span className="uppercase text-sm font-semibold text-blue-400 tracking-wide">Étape 3</span>
                  </div>
                  <h3 className="text-3xl font-semibold text-white tracking-tight mb-4">Tu valides, il envoie</h3>
                  <p className="leading-relaxed text-neutral-400">
                    Floo te propose le résultat. Tu peux demander des modifications ou valider. C'est fait.
                  </p>
                </div>
                <div className="md:w-1/2 bg-black/40 rounded-2xl border border-white/10 p-6 flex flex-col justify-center items-center">
                  <div className="bg-neutral-800 w-full rounded-xl border border-[#00ffc4]/20 p-3 shadow-sm flex items-center gap-3">
                    <iconify-icon icon="solar:check-circle-bold" className="text-[#00ffc4]" width="24" />
                    <div>
                      <div className="text-xs font-bold text-white">Tâche terminée</div>
                      <div className="text-[10px] text-neutral-400">Email envoyé à 14:02</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wall of Love / Testimonials */}
      <section className="relative py-32 bg-[#030303] border-t border-white/5 overflow-hidden">
        {/* Background Noise */}
        <div className="bg-noise"></div>

        {/* Ambient Glows */}
        <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#00ffc4]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-32 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00ffc4]/30 bg-[#00ffc4]/5 text-[#00ffc4] text-xs uppercase tracking-widest font-semibold mb-6 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc4]"></span>
              Hall of Fame
            </div>
            <h2 className="text-5xl md:text-7xl font-semibold text-white tracking-tight leading-[1.1] mb-6">
              Ils ont arrêté de{" "}
              <span className="font-serif-italic text-transparent bg-clip-text bg-gradient-to-r from-[#00ffc4] to-[#059669] text-glow">
                travailler.
              </span>
              <br />
              Floo bosse pour eux.
            </h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto">
              Ne nous croyez pas sur parole. Croyez ceux qui ont regagné leurs nuits de sommeil et leurs week-ends.
            </p>
          </div>

          {/* Reviews Container */}
          <div id="reviews-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* CARD 1: ELISEE (Prospection) */}
            <div className="card-container lg:mt-0">
              <div className="glass-card rounded-3xl p-1 relative overflow-hidden group">
                {/* Visual Header */}
                <div className="h-48 bg-[#0a0a0a] rounded-t-[20px] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                  <div className="radar-circle w-32 h-32"></div>
                  <div className="radar-circle w-32 h-32" style={{ animationDelay: "0.5s" }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>

                  {/* Floating Badges */}
                  <div
                    className="absolute flex flex-col items-center gap-2 transition-transform group-hover:scale-110"
                    style={{ transform: "translateZ(10px)" }}
                  >
                    <iconify-icon
                      icon="solar:user-rounded-bold-duotone"
                      className="text-[#00ffc4] text-4xl"
                    ></iconify-icon>
                    <div className="bg-[#00ffc4]/10 text-[#00ffc4] text-[10px] uppercase font-bold px-2 py-1 rounded border border-[#00ffc4]/20 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00ffc4] rounded-full animate-ping"></span>
                      12 Prospects trouvés
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 relative">
                  <div className="mb-6">
                    <iconify-icon
                      icon="solar:quote-up-square-bold"
                      className="text-neutral-700 text-4xl absolute top-6 right-6 opacity-20 group-hover:opacity-50 transition-opacity"
                    ></iconify-icon>
                    <p className="text-neutral-200 text-lg leading-relaxed font-medium">
                      "J'étais nul en vente. Vraiment. J'ai demandé à Floo de gérer ma prospection. Le mec a scanné le
                      web, trouvé mes cibles et envoyé des messages ultra-personnalisés.{" "}
                      <span className="text-white border-b border-[#00ffc4]">Il drague mieux que moi.</span> C'est
                      flippant d'efficacité."
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]">
                      <img
                        src="https://i.pravatar.cc/150?u=elisee"
                        alt="Elisee"
                        className="w-full h-full rounded-full object-cover border-2 border-black"
                      />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Elisée Kouao</div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">CEO @ E-Agency</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: RUTH (Vocal -> Email) */}
            <div className="card-container lg:mt-16">
              <div className="glass-card rounded-3xl p-1 relative overflow-hidden group">
                {/* Visual Header */}
                <div className="h-48 bg-[#0a0a0a] rounded-t-[20px] relative overflow-hidden flex flex-col items-center justify-center border-b border-white/5">
                  <div className="flex items-center gap-1.5 mb-4 h-10">
                    <div className="voice-bar" style={{ animationDuration: "0.8s" }}></div>
                    <div className="voice-bar" style={{ animationDuration: "1.2s" }}></div>
                    <div className="voice-bar" style={{ animationDuration: "0.5s" }}></div>
                    <div className="voice-bar" style={{ animationDuration: "1.0s" }}></div>
                    <div className="voice-bar" style={{ animationDuration: "0.7s" }}></div>
                    <div className="voice-bar" style={{ animationDuration: "1.1s" }}></div>
                  </div>
                  <div className="flex items-center gap-3 bg-neutral-900 px-4 py-2 rounded-full border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-[#00ffc4] flex items-center justify-center">
                      <iconify-icon icon="solar:microphone-bold" className="text-black text-xs"></iconify-icon>
                    </div>
                    <iconify-icon icon="solar:arrow-right-linear" className="text-neutral-500"></iconify-icon>
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <iconify-icon icon="solar:letter-bold" className="text-black text-xs"></iconify-icon>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 relative">
                  <div className="mb-6">
                    <p className="text-neutral-200 text-lg leading-relaxed font-medium">
                      "Depuis Floo, j'ai oublié comment taper un mail. Genre, vraiment. J'envoie un vocal pourri en
                      mangeant un croissant, et Floo me sort{" "}
                      <span className="text-white border-b border-[#00ffc4]">une masterclass littéraire</span>. C'est
                      limite indécent de gagner autant de temps."
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 p-[2px]">
                      <img
                        src="https://i.pravatar.cc/150?u=ruth"
                        alt="Ruth"
                        className="w-full h-full rounded-full object-cover border-2 border-black"
                      />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Ruth Dolo</div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">Freelance & Mom</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: DAVID (Excel Panic) */}
            <div className="card-container lg:mt-32">
              <div className="glass-card rounded-3xl p-1 relative overflow-hidden group">
                {/* Visual Header */}
                <div className="h-48 bg-[#0a0a0a] rounded-t-[20px] relative overflow-hidden flex items-center justify-center border-b border-white/5" style={{ perspective: "500px" }}>
                  {/* 3D Grid Effect */}
                  <div
                    className="grid grid-cols-6 gap-1 w-full max-w-[80%] opacity-60"
                    style={{
                      transform: "rotateX(12deg) rotateY(-10deg) scale(0.9)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full bg-[#00ffc4]/30"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full bg-[#00ffc4]/30"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full bg-[#00ffc4]/30"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                    <div className="grid-cell h-6 w-full"></div>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-green-900/20 text-green-400 px-2 py-1 rounded text-[10px] font-mono border border-green-500/20">
                    .XLSX GÉNÉRÉ
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 relative">
                  <div className="mb-6">
                    <p className="text-neutral-200 text-lg leading-relaxed font-medium">
                      "L'autre jour, panique totale. 4h du mat, un Excel de 4 pages à livrer. J'ai failli pleurer. J'ai
                      filé le bébé à Floo. En 3 secondes,{" "}
                      <span className="text-white border-b border-[#00ffc4]">
                        le fichier était prêt, formaté, parfait.
                      </span>{" "}
                      Ce truc devrait être illégal tellement c'est puissant."
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-[2px]">
                      <img
                        src="https://i.pravatar.cc/150?u=david"
                        alt="David"
                        className="w-full h-full rounded-full object-cover border-2 border-black"
                      />
                    </div>
                    <div>
                      <div className="text-white font-semibold">David Tchimou</div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">Consultant Financier</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Bottom */}
          <div className="mt-32 text-center">
            <p className="text-neutral-500 mb-6 font-serif-italic text-xl">
              Et vous ? Vous aimez perdre votre temps ?
            </p>
            <button
              onClick={() => toggleAuth("signup")}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#00ffc4] text-black rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(0,255,196,0.4)]"
            >
              Tester Floo maintenant
              <iconify-icon
                icon="solar:arrow-right-line-duotone"
                className="group-hover:translate-x-1 transition-transform text-xl"
              ></iconify-icon>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#050505] border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-2">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            <div
              className={`faq-item group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#00ffc4]/20 ${
                activeFaq === 0 ? "active" : ""
              }`}
            >
              <button
                className="flex text-left w-full p-6 items-center justify-between"
                onClick={() => toggleFaq(0)}
              >
                <span className="group-hover:text-[#00ffc4] transition-colors text-lg font-medium text-white">
                  Est-ce que c'est sécurisé ?
                </span>
                <iconify-icon
                  icon="solar:add-circle-linear"
                  className={`faq-icon text-neutral-500 transition-transform duration-300 ${
                    activeFaq === 0 ? "rotate-45" : ""
                  }`}
                  width="24"
                />
              </button>
              <div className={`faq-answer ${activeFaq === 0 ? "active" : ""}`}>
                <div className="px-6 pb-6 text-neutral-400 leading-relaxed">
                  Absolument. Tes données sont chiffrées de bout en bout, comme sur WhatsApp. Nous ne partageons jamais
                  tes informations avec des tiers.
                </div>
              </div>
            </div>
            <div
              className={`faq-item group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#00ffc4]/20 ${
                activeFaq === 1 ? "active" : ""
              }`}
            >
              <button
                className="flex text-left w-full p-6 items-center justify-between"
                onClick={() => toggleFaq(1)}
              >
                <span className="group-hover:text-[#00ffc4] transition-colors text-lg font-medium text-white">
                  Comment fonctionnent les crédits ?
                </span>
                <iconify-icon
                  icon="solar:add-circle-linear"
                  className={`faq-icon text-neutral-500 transition-transform duration-300 ${
                    activeFaq === 1 ? "rotate-45" : ""
                  }`}
                  width="24"
                />
              </button>
              <div className={`faq-answer ${activeFaq === 1 ? "active" : ""}`}>
                <div className="px-6 pb-6 text-neutral-400 leading-relaxed">
                  C'est du "Pay-as-you-go". 1 crédit = 1 requête simple. 3 crédits = 1 tâche complexe (rédaction
                  email, synthèse PDF). Pas d'abonnement forcé.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="overflow-hidden flex flex-col text-center border-white/5 border-t pt-32 pb-32 relative items-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#047857]/20 to-transparent opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00ffc4] rounded-full blur-[150px] opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl px-6">
          <h2 className="md:text-7xl text-5xl font-semibold text-white tracking-tight mb-8">
            Rejoins le futur du travail.
          </h2>
          <p className="leading-relaxed text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
            Arrête de perdre du temps sur des tâches répétitives. <span className="text-white font-medium">Laisse Floo gérer.</span>
          </p>

          <button
            onClick={() => toggleAuth("signup")}
            className="group hover:bg-[#059669] hover:text-white hover:shadow-[0_0_60px_rgba(0,255,196,0.5)] transition-all flex gap-3 text-xl font-bold text-black bg-[#00ffc4] rounded-full mx-auto px-10 py-5 relative shadow-[0_0_40px_rgba(0,255,196,0.3)] items-center justify-center"
          >
            <span>Démarrer Gratuitement</span>
            <iconify-icon icon="solar:arrow-right-linear" className="transition-transform group-hover:translate-x-1" width="24" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-lg">Floo.</div>
          <div className="text-sm text-neutral-500">© 2024 Floo Abidjan. Tous droits réservés.</div>
          <div className="flex gap-6 text-neutral-500">
            <a href="#" className="hover:text-white transition-colors">
              <iconify-icon icon="solar:brand-twitter-linear" width="20" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <iconify-icon icon="solar:brand-linkedin-linear" width="20" />
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={closeAuth} defaultMode={authMode} />
    </>
  )
}

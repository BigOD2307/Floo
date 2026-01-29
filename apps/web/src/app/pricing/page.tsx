"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const router = useRouter()
  const [scrambleText, setScrambleText] = useState("Pourquoi payer")
  const scrambleElRef = useRef<HTMLSpanElement>(null)

  // Text Scramble Effect
  useEffect(() => {
    if (!scrambleElRef.current) return

    class TextScramble {
      el: HTMLElement
      chars: string
      frame: number
      frameRequest: number | null
      queue: Array<{ from: string; to: string; start: number; end: number; char?: string }>
      resolve?: () => void

      constructor(el: HTMLElement) {
        this.el = el
        this.chars = "!<>-_\\/[]{}—=+*^?#________"
        this.frame = 0
        this.frameRequest = null
        this.queue = []
      }

      setText(newText: string) {
        const oldText = this.el.innerText
        const length = Math.max(oldText.length, newText.length)
        const promise = new Promise<void>((resolve) => {
          this.resolve = resolve
        })
        this.queue = []
        for (let i = 0; i < length; i++) {
          const from = oldText[i] || ""
          const to = newText[i] || ""
          const start = Math.floor(Math.random() * 40)
          const end = start + Math.floor(Math.random() * 40)
          this.queue.push({ from, to, start, end })
        }
        if (this.frameRequest) {
          cancelAnimationFrame(this.frameRequest)
        }
        this.frame = 0
        this.update()
        return promise
      }

      update = () => {
        let output = ""
        let complete = 0
        for (let i = 0, n = this.queue.length; i < n; i++) {
          let { from, to, start, end, char } = this.queue[i]
          if (this.frame >= end) {
            complete++
            output += to
          } else if (this.frame >= start) {
            if (!char || Math.random() < 0.28) {
              char = this.randomChar()
              this.queue[i].char = char
            }
            output += `<span class="text-[#00ffc4] opacity-50">${char}</span>`
          } else {
            output += from
          }
        }
        this.el.innerHTML = output
        if (complete === this.queue.length) {
          if (this.resolve) this.resolve()
        } else {
          this.frameRequest = requestAnimationFrame(this.update)
          this.frame++
        }
      }

      randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)]
      }
    }

    const fx = new TextScramble(scrambleElRef.current)
    setTimeout(() => {
      fx.setText("Arrête de payer")
    }, 200)
  }, [])

  // 3D Tilt Effect for Main Card
  useEffect(() => {
    const card = document.getElementById("pricing-card")
    const container = card?.parentElement
    if (!card || !container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / 30) * -1
      const rotateY = (x - centerX) / 30

      ;(card as HTMLElement).style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    }

    const handleMouseLeave = () => {
      ;(card as HTMLElement).style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`
    }

    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  const handleCreditAccount = () => {
    router.push("/payment")
  }

  return (
    <div className="pricing-page min-h-screen relative selection:bg-[#00ffc4] selection:text-black flex flex-col items-center bg-[#030303]">
      {/* Background Noise */}
      <div className="bg-noise"></div>

      {/* Background Orbs */}
      <div className="fixed top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#00ffc4]/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header / Nav */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-20">
        <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-[#00ffc4] rounded-full shadow-[0_0_10px_#00ffc4]"></span>
          Floo.
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-500 font-mono">ONBOARDING TERMINÉ</span>
          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
            <iconify-icon icon="solar:user-rounded-linear" className="text-neutral-400"></iconify-icon>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-12 pb-24 flex flex-col items-center">
        {/* Hero Text */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00ffc4]/20 bg-[#00ffc4]/5 text-[#00ffc4] text-[11px] uppercase tracking-widest font-bold mb-8 animate-slide-up opacity-0">
            Liberté Totale
          </div>

          <h1 className="text-5xl md:text-7xl font-semibold text-white tracking-tight leading-[1.1] mb-6 min-h-[160px] md:min-h-[auto]">
            <span ref={scrambleElRef} className="scramble-text">
              Pourquoi payer
            </span>{" "}
            <br />
            <span className="font-serif-italic text-transparent bg-clip-text bg-gradient-to-r from-[#00ffc4] to-emerald-500 text-glow">
              pour du vent ?
            </span>
          </h1>

          <p className="text-neutral-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed animate-slide-up opacity-0 delay-200">
            Tu détestes les abonnements inutiles. Nous aussi.
            <br />
            Ici, tu ne sors ta carte que quand Floo bosse vraiment pour toi.
          </p>
        </div>

        {/* The Pricing Experience Container */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-slide-up opacity-0 delay-300">
          {/* LEFT: The Main Card (Pay As You Go) */}
          <div className="lg:col-span-7 relative group perspective-container">
            <div
              id="pricing-card"
              className="glass-panel glass-accent rounded-[32px] p-1 transition-all duration-500 transform-style-3d hover:scale-[1.01]"
            >
              <div className="relative bg-[#050505] rounded-[28px] overflow-hidden p-8 md:p-12 h-full border border-white/5">
                {/* Visual Header */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-[#00ffc4]/10 to-transparent blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-[#00ffc4] text-black flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(0,255,196,0.3)]">
                        <iconify-icon icon="solar:wallet-money-bold-duotone"></iconify-icon>
                      </div>
                      <div className="bg-neutral-900 border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-neutral-300">
                        Modèle unique
                      </div>
                    </div>

                    <h2 className="text-3xl font-semibold text-white mb-2">Pay as you go.</h2>
                    <p className="text-neutral-400 mb-8">Zéro engagement. Zéro frais cachés.</p>

                    {/* Interactive Usage Visualizer */}
                    <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5 mb-8">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-sm text-neutral-400">Ton solde</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-white tabular-nums tracking-tight">100%</span>
                          <span className="text-xs text-[#00ffc4] block">de rentabilité</span>
                        </div>
                      </div>
                      {/* Progress Bar Metaphor */}
                      <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full w-3/4 bg-gradient-to-r from-[#00ffc4] to-emerald-600 rounded-full shadow-[0_0_15px_#00ffc4]"></div>
                        {/* Dotted overlay */}
                        <div
                          className="absolute inset-0 opacity-50"
                          style={{
                            backgroundImage:
                              "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8L3N2Zz4=')",
                          }}
                        ></div>
                      </div>
                      <div className="mt-3 flex justify-between text-[10px] text-neutral-500 font-mono uppercase">
                        <span>Pas d'abonnement</span>
                        <span>Crédits à vie</span>
                      </div>
                    </div>

                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <iconify-icon icon="solar:check-circle-bold" className="text-[#00ffc4] text-xl mt-0.5"></iconify-icon>
                        <span className="text-neutral-300 text-sm">Tu payes uniquement les tâches exécutées.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <iconify-icon icon="solar:check-circle-bold" className="text-[#00ffc4] text-xl mt-0.5"></iconify-icon>
                        <span className="text-neutral-300 text-sm">
                          Tes crédits n'expirent <span className="text-white font-medium border-b border-white/20">jamais</span>.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <iconify-icon icon="solar:check-circle-bold" className="text-[#00ffc4] text-xl mt-0.5"></iconify-icon>
                        <span className="text-neutral-300 text-sm">Démarre petit, scale quand tu veux.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-10">
                    <button
                      onClick={handleCreditAccount}
                      className="group relative w-full py-4 bg-[#00ffc4] hover:bg-[#00e6b0] text-black font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
                    >
                      <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <span className="relative z-10 text-lg">Créditer mon compte</span>
                      <iconify-icon
                        icon="solar:card-send-bold"
                        className="relative z-10 text-xl group-hover:translate-x-1 transition-transform"
                      ></iconify-icon>
                    </button>
                    <p className="text-center text-xs text-neutral-500 mt-4">Paiement sécurisé par Stripe. Satisfait ou remboursé.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: The Value Stack */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-full">
            {/* Anti-SaaS Card */}
            <div className="glass-panel rounded-[28px] p-8 flex-1 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="mb-6">
                <div className="text-sm font-mono text-neutral-500 mb-2 uppercase tracking-wide">Le vieux monde</div>
                <h3 className="text-xl font-semibold text-white leading-relaxed">
                  Pourquoi payer <br />
                  <span className="font-serif-italic text-[#00ffc4] text-3xl">32,900 fcfa</span>/mois...
                </h3>
              </div>

              {/* Graph Comparison */}
              <div className="flex items-end gap-4 h-32 w-full mt-2">
                {/* Them */}
                <div className="flex-1 flex flex-col justify-end gap-2 group/bar">
                  <div className="text-center text-xs text-neutral-500">Eux</div>
                  <div className="w-full bg-neutral-800 rounded-t-lg relative overflow-hidden h-full border-t border-x border-white/5 transition-all group-hover/bar:bg-red-900/20">
                    {/* Usage part (small) */}
                    <div className="absolute bottom-0 left-0 w-full h-[20%] bg-neutral-600"></div>
                    {/* Waste label */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-neutral-400 rotate-90 whitespace-nowrap opacity-50">
                      Argent perdu
                    </div>
                  </div>
                </div>
                {/* Us */}
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <div className="text-center text-xs text-[#00ffc4] font-bold">Floo</div>
                  <div className="w-full h-[20%] bg-[#00ffc4] rounded-t-lg shadow-[0_0_20px_rgba(0,255,196,0.3)] relative group/floo">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover/floo:opacity-100 transition-opacity">
                      Juste prix
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-sm text-neutral-400">
                ...si tu n'utilises l'outil que 3 fois ? <br />
                Avec Floo, le gaspillage, c'est fini.
              </p>
            </div>

            {/* Reassurance Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-2xl p-5 hover:bg-white/5 transition-colors cursor-default">
                <iconify-icon icon="solar:shield-check-bold-duotone" className="text-2xl text-purple-400 mb-3"></iconify-icon>
                <h4 className="font-medium text-white text-sm mb-1">Secure</h4>
                <p className="text-xs text-neutral-500">Données chiffrées & privées.</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 hover:bg-white/5 transition-colors cursor-default">
                <iconify-icon icon="solar:history-bold-duotone" className="text-2xl text-blue-400 mb-3"></iconify-icon>
                <h4 className="font-medium text-white text-sm mb-1">Historique</h4>
                <p className="text-xs text-neutral-500">Suivi précis de ta conso.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Ticker */}
        <div className="mt-16 w-full overflow-hidden opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center justify-center gap-8 md:gap-16 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <iconify-icon icon="simple-icons:stripe"></iconify-icon> Stripe
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <iconify-icon icon="simple-icons:openai"></iconify-icon> OpenAI
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <iconify-icon icon="solar:verified-check-bold"></iconify-icon> SOC2 Certified
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

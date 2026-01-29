"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

interface Operator {
  id: string
  name: string
  color: string
  icon: string
  type: "logo" | "icon"
}

interface Region {
  name: string
  flag: string
  dial: string
  ops: Operator[]
}

const regions: Record<string, Region> = {
  ci: {
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    dial: "+225",
    ops: [
      { id: "orange", name: "Orange Money", color: "#f97316", icon: "logos:orange", type: "logo" },
      { id: "mtn", name: "MTN MoMo", color: "#fbbf24", icon: "logos:mtn", type: "logo" },
      { id: "wave", name: "Wave", color: "#3b82f6", icon: "logos:wave", type: "logo" },
      { id: "moov", name: "Moov Money", color: "#22c55e", icon: "logos:etisalat", type: "logo" },
      { id: "djamo", name: "Djamo", color: "#10b981", icon: "solar:wallet-bold", type: "icon" },
    ],
  },
  sn: {
    name: "Sénégal",
    flag: "🇸🇳",
    dial: "+221",
    ops: [
      { id: "orange", name: "Orange Money", color: "#f97316", icon: "logos:orange", type: "logo" },
      { id: "wave", name: "Wave", color: "#3b82f6", icon: "logos:wave", type: "logo" },
      { id: "free", name: "Free Money", color: "#ef4444", icon: "simple-icons:free", type: "logo" },
      { id: "wizall", name: "Wizall", color: "#0ea5e9", icon: "solar:hand-money-bold", type: "icon" },
    ],
  },
  cm: {
    name: "Cameroun",
    flag: "🇨🇲",
    dial: "+237",
    ops: [
      { id: "orange", name: "Orange Money", color: "#f97316", icon: "logos:orange", type: "logo" },
      { id: "mtn", name: "MTN MoMo", color: "#fbbf24", icon: "logos:mtn", type: "logo" },
    ],
  },
  bf: {
    name: "Burkina Faso",
    flag: "🇧🇫",
    dial: "+226",
    ops: [
      { id: "orange", name: "Orange Money", color: "#f97316", icon: "logos:orange", type: "logo" },
      { id: "moov", name: "Moov Money", color: "#22c55e", icon: "logos:etisalat", type: "logo" },
      { id: "coris", name: "Coris Money", color: "#dc2626", icon: "solar:banknote-bold", type: "icon" },
    ],
  },
  bj: {
    name: "Bénin",
    flag: "🇧🇯",
    dial: "+229",
    ops: [
      { id: "mtn", name: "MTN MoMo", color: "#fbbf24", icon: "logos:mtn", type: "logo" },
      { id: "moov", name: "Moov Money", color: "#22c55e", icon: "logos:etisalat", type: "logo" },
      { id: "celtiis", name: "Celtiis Cash", color: "#6366f1", icon: "solar:wad-of-money-bold", type: "icon" },
    ],
  },
  ml: {
    name: "Mali",
    flag: "🇲🇱",
    dial: "+223",
    ops: [
      { id: "orange", name: "Orange Money", color: "#f97316", icon: "logos:orange", type: "logo" },
      { id: "moov", name: "Moov Money", color: "#22c55e", icon: "logos:etisalat", type: "logo" },
      { id: "sama", name: "Sama Money", color: "#ec4899", icon: "solar:safe-circle-bold", type: "icon" },
    ],
  },
  tg: {
    name: "Togo",
    flag: "🇹🇬",
    dial: "+228",
    ops: [
      { id: "tmoney", name: "T-Money", color: "#ca8a04", icon: "solar:sim-card-bold", type: "icon" },
      { id: "moov", name: "Moov Money", color: "#22c55e", icon: "logos:etisalat", type: "logo" },
    ],
  },
}

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [mode, setMode] = useState<"momo" | "card">("momo")
  const [selectedCountry, setSelectedCountry] = useState("ci")
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardDate, setCardDate] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [cardName, setCardName] = useState("")
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const perspectiveContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, router])

  useEffect(() => {
    // Initialize operators
    if (regions[selectedCountry]?.ops.length > 0) {
      setSelectedOp(regions[selectedCountry].ops[0])
    }
  }, [selectedCountry])

  useEffect(() => {
    // 3D card mouse effect
    if (!perspectiveContainerRef.current || !cardRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (mode !== "card" || !cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -10
      const rotateY = ((x - centerX) / centerX) * 10

      const baseRotateY = isCardFlipped ? 180 : 0
      cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${baseRotateY + rotateY}deg)`
    }

    const handleMouseLeave = () => {
      if (cardRef.current) {
        cardRef.current.style.transform = isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
      }
    }

    perspectiveContainerRef.current.addEventListener("mousemove", handleMouseMove)
    perspectiveContainerRef.current.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      perspectiveContainerRef.current?.removeEventListener("mousemove", handleMouseMove)
      perspectiveContainerRef.current?.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [mode, isCardFlipped])

  const switchMode = (newMode: "momo" | "card") => {
    setMode(newMode)
  }

  const selectOperator = (op: Operator) => {
    setSelectedOp(op)
  }

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim()
  }

  const formatCardDate = (value: string) => {
    let formatted = value.replace(/\D/g, "")
    if (formatted.length >= 2) {
      formatted = formatted.substring(0, 2) + "/" + formatted.substring(2, 4)
    }
    return formatted
  }

  const formatPhoneNumber = (value: string) => {
    if (value.length === 0) return "-- -- -- --"
    return value.replace(/(\d{2})(?=\d)/g, "$1 ")
  }

  const handleSubmit = async () => {
    // TODO: Implement payment processing
    // For now, redirect to dashboard
    router.push("/dashboard")
  }

  const currentRegion = regions[selectedCountry]

  return (
    <div className="flex flex-col min-h-screen selection:bg-[#5E6AD2]/30 bg-[#050505] text-[#e5e5e5]">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            maskImage: "radial-gradient(circle at center, black 40%, transparent 100%)",
          }}
        ></div>
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-glow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-glow"></div>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 h-20 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg shadow-black/50">
            <iconify-icon icon="solar:wallet-money-bold-duotone" className="text-white text-xl"></iconify-icon>
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-none">Floo</span>
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">Secure Checkout</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
          <span className="text-xs text-neutral-400 font-medium">Système Opérationnel</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-32 pb-12 px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
        {/* Left: Form */}
        <div className="lg:col-span-7 flex flex-col space-y-8 animate-slide-up">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">Money Time 💸</h1>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-md">
              Remplissez ça vite fait qu'on puisse décoller. Promis, c'est sécurisé comme Fort Knox.
            </p>
          </div>

          {/* Tabs */}
          <div className="p-1.5 bg-neutral-900/50 rounded-xl flex relative border border-white/5 backdrop-blur-sm">
            <div
              id="tab-bg"
              className="absolute top-1.5 left-1.5 w-[calc(50%-6px)] h-[calc(100%-12px)] bg-[#1A1A1A] border border-white/10 rounded-lg shadow-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{ left: mode === "momo" ? "6px" : "50%" }}
            ></div>

            <button
              onClick={() => switchMode("momo")}
              className={`relative z-10 flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2.5 ${
                mode === "momo" ? "text-white" : "text-neutral-500 hover:text-white"
              }`}
            >
              <iconify-icon icon="solar:smartphone-line-duotone" className="text-lg"></iconify-icon>
              Mobile Money
            </button>
            <button
              onClick={() => switchMode("card")}
              className={`relative z-10 flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2.5 ${
                mode === "card" ? "text-white" : "text-neutral-500 hover:text-white"
              }`}
            >
              <iconify-icon icon="solar:card-linear" className="text-lg"></iconify-icon>
              Carte Bancaire
            </button>
          </div>

          {/* Form Container */}
          <div className="glass-card rounded-2xl p-6 lg:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* MOMO FORM */}
            {mode === "momo" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Country */}
                  <div>
                    <label className="floo-label">D'où envoyez-vous la moulah ?</label>
                    <div className="relative group">
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="floo-input appearance-none pl-11 cursor-pointer hover:border-white/20"
                      >
                        {Object.entries(regions).map(([code, region]) => (
                          <option key={code} value={code} style={{ background: "#111" }}>
                            {region.flag} {region.name}
                          </option>
                        ))}
                      </select>
                      <iconify-icon
                        icon="solar:globe-linear"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg pointer-events-none transition-colors group-hover:text-white"
                      ></iconify-icon>
                      <iconify-icon
                        icon="solar:alt-arrow-down-linear"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                      ></iconify-icon>
                    </div>
                  </div>

                  {/* Operators Grid */}
                  <div className="space-y-2">
                    <label className="floo-label flex justify-between">
                      <span>Choisissez votre écurie</span>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-neutral-500">
                        {currentRegion?.ops.length || 0} Dispo
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {currentRegion?.ops.map((op) => (
                        <div
                          key={op.id}
                          onClick={() => selectOperator(op)}
                          className={`op-btn ${selectedOp?.id === op.id ? "selected" : ""}`}
                        >
                          {op.type === "logo" ? (
                            <iconify-icon icon={op.icon} className="text-3xl"></iconify-icon>
                          ) : (
                            <iconify-icon icon={op.icon} className="text-3xl" style={{ color: op.color }}></iconify-icon>
                          )}
                          <span className="text-[10px] text-neutral-400 font-medium">{op.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="floo-label">Votre 06 (ou 07, on juge pas)</label>
                    <div className="flex gap-3">
                      <div className="w-20 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-sm text-neutral-300 font-mono tracking-wider">
                        {currentRegion?.dial || "+225"}
                      </div>
                      <div className="relative flex-1 group">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          className="floo-input pl-11 font-mono tracking-wider"
                          placeholder="01 02 03 04"
                        />
                        <iconify-icon
                          icon="solar:phone-calling-linear"
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg group-hover:text-white transition-colors"
                        ></iconify-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CARD FORM */}
            {mode === "card" && (
              <div className="space-y-6">
                <div>
                  <label className="floo-label">Numéro de la carte (La gold ?)</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="floo-input pl-11 font-mono tracking-widest"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                    <iconify-icon
                      icon="brandico:visa"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-xl"
                    ></iconify-icon>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="floo-label">Date (MM/AA)</label>
                    <input
                      type="text"
                      value={cardDate}
                      onChange={(e) => setCardDate(formatCardDate(e.target.value))}
                      className="floo-input font-mono text-center"
                      placeholder="12 / 28"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="floo-label">CVC (Le secret 🤫)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").substring(0, 3))}
                        onFocus={() => setIsCardFlipped(true)}
                        onBlur={() => setIsCardFlipped(false)}
                        className="floo-input font-mono text-center"
                        placeholder="123"
                        maxLength={3}
                      />
                      <iconify-icon
                        icon="solar:lock-password-linear"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600"
                      ></iconify-icon>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="floo-label">Nom sur la carte</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="floo-input uppercase"
                    placeholder="JEAN DUPONT"
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleSubmit}
              className="group w-full h-14 mt-2 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden relative"
            >
              <span className="relative z-10">{mode === "momo" ? "Envoyer la sauce 🚀" : "Valider la carte 💳"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>

          {/* Footer Trust */}
          <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <iconify-icon icon="logos:visa" className="text-xl"></iconify-icon>
            <iconify-icon icon="logos:mastercard" className="text-xl"></iconify-icon>
            <iconify-icon icon="logos:pci-dss" className="text-2xl"></iconify-icon>
            <span className="text-[10px] text-neutral-500 font-mono">SSL 256-BIT ENCRYPTED</span>
          </div>
        </div>

        {/* Right: Visualization */}
        <div
          ref={perspectiveContainerRef}
          className="lg:col-span-5 h-[600px] sticky top-24 flex items-center justify-center perspective-container"
        >
          {/* MOMO VISUALIZATION */}
          {mode === "momo" && selectedOp && (
            <div className="relative w-[300px] h-[580px] bg-[#111] rounded-[48px] border-[6px] border-[#222] shadow-2xl transition-all duration-500 animate-float-slow overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-32 bg-[#222] rounded-b-2xl z-30 flex items-center justify-center gap-3">
                <div className="w-16 h-4 bg-black rounded-full flex items-center justify-end px-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="w-full h-full bg-[#050505] relative flex flex-col pt-12">
                <div
                  className="absolute top-0 left-0 w-full h-48 transition-colors duration-500 opacity-20 z-0"
                  style={{ background: selectedOp.color }}
                ></div>
                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-transparent to-[#050505] z-1"></div>

                <div className="relative z-10 px-6 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                      <iconify-icon icon="solar:arrow-left-linear" className="text-white"></iconify-icon>
                    </div>
                    <div className="text-xs font-medium text-white/50 tracking-widest uppercase">Confirmation</div>
                  </div>

                  <div className="mx-auto w-24 h-24 rounded-3xl bg-[#111] border border-white/10 flex items-center justify-center shadow-2xl mb-4 relative group cursor-pointer">
                    <div className="absolute inset-0 bg-white/5 rounded-3xl animate-pulse-glow"></div>
                    {selectedOp.type === "logo" ? (
                      <iconify-icon id="phone-logo" icon={selectedOp.icon} className="text-5xl drop-shadow-lg transition-transform duration-300 group-hover:scale-110"></iconify-icon>
                    ) : (
                      <iconify-icon
                        id="phone-logo"
                        icon={selectedOp.icon}
                        className="text-5xl drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                        style={{ color: selectedOp.color }}
                      ></iconify-icon>
                    )}
                  </div>

                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-white mb-1">{selectedOp.name}</h3>
                    <p className="text-xs text-neutral-500 font-mono">Paiement marchand</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-0 backdrop-blur-md">
                    <div className="tx-row">
                      <span className="text-xs text-neutral-400">Montant</span>
                      <span className="text-sm font-bold text-white font-mono">15.000 FCFA</span>
                    </div>
                    <div className="tx-row">
                      <span className="text-xs text-neutral-400">Frais</span>
                      <span className="text-xs font-medium text-green-400">Gratuit</span>
                    </div>
                    <div className="tx-row border-none pb-0">
                      <span className="text-xs text-neutral-400">Compte</span>
                      <span className="text-xs font-mono text-white/80">{formatPhoneNumber(phoneNumber)}</span>
                    </div>
                  </div>

                  <div className="mt-auto mb-8 relative h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1/3 bg-white blur-[2px] animate-[shimmer_2s_infinite]"></div>
                  </div>

                  <div className="mb-6 mx-auto">
                    <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                      <iconify-icon icon="solar:shield-check-bold"></iconify-icon>
                      Transaction Sécurisée
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARD VISUALIZATION */}
          {mode === "card" && (
            <div className="scene flex items-center justify-center">
              <div
                ref={cardRef}
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="card-3d"
                style={{ transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* FRONT */}
                <div className="card-face card-front p-6 flex flex-col justify-between relative group">
                  <div className="holo-shine"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md shadow-sm opacity-90 flex items-center justify-center border border-white/20">
                      <div className="w-8 h-6 border border-black/10 rounded-sm opacity-50"></div>
                    </div>
                    <iconify-icon icon="solar:wifi-bold" className="text-white/60 text-2xl rotate-90"></iconify-icon>
                  </div>

                  <div className="space-y-1 relative z-10 mt-2">
                    <div className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Numéro de carte</div>
                    <div className="text-xl font-mono font-medium text-white tracking-widest shadow-black drop-shadow-md">
                      {cardNumber || "•••• •••• •••• 4242"}
                    </div>
                  </div>

                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <div className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Titulaire</div>
                      <div className="text-xs font-bold text-white tracking-wider uppercase">
                        {cardName.toUpperCase() || "JEAN DUPONT"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Expire</div>
                      <div className="text-xs font-mono text-white">{cardDate || "12/28"}</div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/30 flex items-center gap-1">
                    <iconify-icon icon="solar:refresh-linear"></iconify-icon> Flip
                  </div>
                </div>

                {/* BACK */}
                <div className="card-face card-back relative">
                  <div className="w-full h-12 bg-[#1a1a1a] mt-6 border-y border-black/50"></div>

                  <div className="px-6 mt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-10 bg-white/10 rounded flex items-center justify-end px-3">
                        <span className="font-mono text-black bg-white px-2 py-0.5 rounded text-sm font-bold tracking-widest">
                          {cardCvc || "123"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-[8px] text-white/30 text-justify leading-tight">
                      Cette carte est la propriété de l'émetteur. Si trouvée, merci de la renvoyer ou de la détruire.
                      L'utilisation frauduleuse est punie par la loi. Ou pas.
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-6">
                    <iconify-icon icon="logos:visa" className="text-4xl opacity-70 grayscale"></iconify-icon>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/60 blur-xl rounded-full"></div>
            </div>
          )}
        </div>
      </main>

    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">Chargement...</div>}>
      <PaymentPageContent />
    </Suspense>
  )
}

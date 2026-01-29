"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import "@/styles/onboarding.css"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingData, setOnboardingData] = useState({
    role: "",
    painPoint: "",
    volume: "",
    tools: [] as string[],
    phoneNumber: "",
  })
  const [loading, setLoading] = useState(false)
  const [inputMode, setInputMode] = useState<"text" | "voice">("text")
  const [isRecording, setIsRecording] = useState(false)
  const [otherText, setOtherText] = useState("")

  const dismissIntro = () => {
    const introScreen = document.getElementById("intro-screen")
    const mainInterface = document.getElementById("main-interface")
    if (introScreen && mainInterface) {
      introScreen.classList.add("dismissed")
      mainInterface.classList.add("visible")
      setShowOnboarding(true)
    }
  }

  const updateDots = () => {
    for (let i = 1; i <= 5; i++) {
      const dot = document.getElementById(`step-dot-${i}`)
      if (dot) {
        if (i <= currentStep) {
          dot.classList.remove("bg-neutral-800")
          dot.classList.add("bg-[#00ffc4]")
          if (i === currentStep) {
            dot.classList.add("scale-125")
          } else {
            dot.classList.remove("scale-125")
          }
    } else {
          dot.classList.remove("bg-[#00ffc4]", "scale-125")
          dot.classList.add("bg-neutral-800")
        }
      }
    }
  }

  useEffect(() => {
    updateDots()
  }, [currentStep])

  const selectOption = (element: HTMLElement, step: number) => {
    const container = element.parentElement
    if (!container) return

    const options = container.querySelectorAll(".option-card")
    options.forEach((opt) => opt.classList.remove("selected"))
    element.classList.add("selected")

    if (step === 1) {
      const role = element.querySelector("h3")?.textContent || ""
      setOnboardingData((prev) => ({ ...prev, role }))
      if (step !== 2 && step !== 4) {
        setTimeout(() => nextStep(), 400)
      }
    } else if (step === 2) {
      if (!element.id.includes("other")) {
        const painPoint = element.querySelector("span")?.textContent || ""
        setOnboardingData((prev) => ({ ...prev, painPoint }))
        setTimeout(() => nextStep(), 400)
      }
    } else if (step === 3) {
      const volume = element.querySelector("h3")?.textContent || ""
      setOnboardingData((prev) => ({ ...prev, volume }))
      setTimeout(() => nextStep(), 400)
    }
  }

  const nextStep = () => {
    if (currentStep >= 5) return
    setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => {
    if (currentStep <= 1) return
    setCurrentStep((prev) => prev - 1)
  }

  const expandOther = () => {
    const otherContent = document.getElementById("other-content")
    const otherCard = document.getElementById("other-card")
    if (otherContent && otherCard) {
      otherContent.classList.remove("hidden")
      otherCard.classList.add("selected", "bg-neutral-800")
      const container = otherCard.parentElement
      if (container) {
        const options = container.querySelectorAll(".option-card:not(#other-card)")
        options.forEach((opt) => opt.classList.remove("selected"))
      }
    }
  }

  const switchInput = (type: "text" | "voice") => {
    setInputMode(type)
  }

  const toggleRecord = () => {
    setIsRecording((prev) => !prev)
  }

  const confirmOther = () => {
    setOnboardingData((prev) => ({ ...prev, painPoint: otherText || "Autre" }))
    nextStep()
  }

  const toggleTool = (tool: string) => {
    setOnboardingData((prev) => {
      const tools = prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool]
      return { ...prev, tools }
    })
  }

  const handleSubmit = async () => {
    // Validation du numéro de téléphone
    if (!onboardingData.phoneNumber || onboardingData.phoneNumber.trim() === "") {
      alert("Veuillez entrer votre numéro de téléphone")
      return
    }

    // Nettoyer le numéro (retirer les espaces)
    const cleanedPhone = onboardingData.phoneNumber.replace(/\s/g, "")
    if (cleanedPhone.length < 8) {
      alert("Le numéro de téléphone semble invalide")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...onboardingData,
          phoneNumber: cleanedPhone, // Envoyer le numéro nettoyé
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde")
      }

      // Confirmer que le numéro a été sauvegardé
      console.log("✅ Numéro sauvegardé avec succès:", data.user?.phoneNumber)

      // Rediriger vers la page pricing
      router.push(data.redirect || "/pricing")
    } catch (error: any) {
      console.error("❌ Erreur onboarding:", error)
      alert(error.message || "Une erreur est survenue lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#030303] text-neutral-200 antialiased h-screen w-full relative overflow-hidden">
      {/* INTRO STORYTELLING SCREEN */}
      <div
        id="intro-screen"
        className="fixed inset-0 z-[100] bg-[#030303] flex items-center justify-center overflow-hidden transition-all duration-[1200ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
      >
        {/* Ambient BG */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#00ffc4]/10 rounded-full blur-[140px] mix-blend-screen animate-[flow_15s_infinite_ease-in-out]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black)]"></div>
        </div>

        <div className="relative z-10 max-w-2xl px-8 text-center">
          <div className="mb-12 opacity-0 animate-[fadeIn_1s_ease_0.5s_forwards]">
            <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[#00ffc4] to-[#059669] flex items-center justify-center text-black shadow-[0_0_50px_rgba(0,255,196,0.3)]">
              <iconify-icon icon="solar:infinity-bold" width="32"></iconify-icon>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mb-8 leading-[1.1] opacity-0 animate-[fadeIn_1s_ease_0.8s_forwards]">
            Bienvenue dans l'univers <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00ffc4] to-[#059669]">
              Floo.
            </span>
          </h1>

          <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl mb-12 transform opacity-0 animate-[slideUp_1s_ease_1.5s_forwards]">
            <iconify-icon
              icon="solar:quote-up-bold"
              className="absolute -top-4 -left-4 text-[#00ffc4] bg-[#030303] p-2 rounded-lg text-2xl"
            ></iconify-icon>
            <p className="font-serif-italic text-xl text-neutral-300 mb-6 leading-relaxed">
              "L'humain est fait pour créer, rêver et inspirer. Pas pour gérer de la paperasse. J'ai conçu Floo avec
              une mission simple : vous redonner votre ressource la plus précieuse — votre temps. Parce que vous avez
              mieux à faire que répondre à des emails."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 overflow-hidden">
                <img
                  src="https://i.pravatar.cc/150?u=ousmane"
                  alt="Creator"
                  className="w-full h-full object-cover grayscale opacity-70"
                />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold text-sm">Ousmane Dicko</div>
                <div className="text-[#00ffc4] text-xs uppercase tracking-wider">Fondateur</div>
              </div>
            </div>
          </div>

          <button
            onClick={dismissIntro}
            className="opacity-0 animate-[fadeIn_1s_ease_2.5s_forwards] group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Commencer l'expérience
            <iconify-icon
              icon="solar:arrow-right-line-duotone"
              className="group-hover:translate-x-1 transition-transform"
            ></iconify-icon>
          </button>
        </div>
      </div>

      {/* MAIN INTERFACE */}
      <div
        id="main-interface"
        className="h-full w-full flex flex-col relative opacity-0 scale-[0.95] transition-all duration-1000 delay-500"
      >
        {/* Top Bar */}
        <nav className="w-full px-8 py-8 flex justify-between items-center z-50 absolute top-0">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white opacity-80">Floo.</div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-semibold text-[#00ffc4] uppercase tracking-widest bg-[#00ffc4]/10 px-3 py-1 rounded-full border border-[#00ffc4]/20">
              Configuration IA
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  id={`step-dot-${i}`}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i <= currentStep ? "bg-[#00ffc4]" : "bg-neutral-800"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </nav>

        {/* Content Grid */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 h-full">
          {/* Left: Ambient Context */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-end p-12 relative border-r border-white/5">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00ffc4] rounded-full blur-[180px] opacity-[0.07] animate-[flow_15s_infinite_ease-in-out]"></div>
            </div>

            <div id="context-text" className="relative z-10 mb-12 transition-all duration-700">
              <h2 className="text-4xl font-semibold text-white mb-4 tracking-tight">Personnalisation en cours</h2>
              <p className="text-neutral-500 text-lg leading-relaxed max-w-sm">
                Chaque réponse que vous donnez affine l'intelligence de Floo pour qu'elle réfléchisse exactement comme
                vous. Plus vous êtes précis, plus elle devient utile.
              </p>
            </div>

            {/* Footer Stats */}
            <div className="relative z-10 flex gap-8 border-t border-white/10 pt-8 opacity-60">
              <div>
                <div className="text-2xl font-bold text-white">0.2s</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">Latence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">AES-256</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">Chiffré</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Form */}
          <div className="lg:col-span-7 relative flex flex-col justify-center px-6 sm:px-16 lg:px-24">
            {/* STEP 1: Profession */}
            <div
              id="step-1"
              className={`step-panel ${currentStep === 1 ? "active" : ""}`}
            >
              <span className="text-[#00ffc4] font-serif-italic text-xl mb-2 block">01. Qui êtes-vous ?</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8 tracking-tight">
                Dans quel rôle excellez-vous ?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={(e) => selectOption(e.currentTarget, 1)}
                  className="option-card group text-left p-6 rounded-2xl bg-[#0a0a0a]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <iconify-icon
                      icon="solar:case-minimalistic-linear"
                      className="text-neutral-400 group-hover:text-[#00ffc4] transition-colors"
                      width="28"
                    ></iconify-icon>
                    <iconify-icon
                      icon="solar:arrow-right-up-linear"
                      className="text-neutral-600 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1"
                      width="20"
                    ></iconify-icon>
                  </div>
                  <h3 className="text-lg font-medium text-white">Entrepreneur</h3>
                </button>
                <button
                  onClick={(e) => selectOption(e.currentTarget, 1)}
                  className="option-card group text-left p-6 rounded-2xl bg-[#0a0a0a]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <iconify-icon
                      icon="solar:user-speak-rounded-linear"
                      className="text-neutral-400 group-hover:text-[#00ffc4] transition-colors"
                      width="28"
                    ></iconify-icon>
                  </div>
                  <h3 className="text-lg font-medium text-white">Cadre / Manager</h3>
                </button>
                <button
                  onClick={(e) => selectOption(e.currentTarget, 1)}
                  className="option-card group text-left p-6 rounded-2xl bg-[#0a0a0a]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <iconify-icon
                      icon="solar:shop-2-linear"
                      className="text-neutral-400 group-hover:text-[#00ffc4] transition-colors"
                      width="28"
                    ></iconify-icon>
                  </div>
                  <h3 className="text-lg font-medium text-white">Commerçant</h3>
                </button>
                <button
                  onClick={(e) => selectOption(e.currentTarget, 1)}
                  className="option-card group text-left p-6 rounded-2xl bg-[#0a0a0a]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <iconify-icon
                      icon="solar:book-2-linear"
                      className="text-neutral-400 group-hover:text-[#00ffc4] transition-colors"
                      width="28"
                    ></iconify-icon>
                  </div>
                  <h3 className="text-lg font-medium text-white">Étudiant</h3>
                </button>
              </div>
            </div>

            {/* STEP 2: Pain Point */}
            <div id="step-2" className={`step-panel ${currentStep === 2 ? "active" : ""}`}>
              <button
                onClick={prevStep}
                className="absolute top-0 -mt-16 text-neutral-500 hover:text-white flex items-center gap-2 text-sm transition-colors"
              >
                <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Retour
              </button>
              <span className="text-[#00ffc4] font-serif-italic text-xl mb-2 block">02. Le problème</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2 tracking-tight">
                Qu'est-ce qui vous fait perdre le plus de temps ?
              </h2>
              <p className="text-neutral-500 mb-8">
                Soyez honnête. C'est comme ça qu'on va le résoudre ensemble, une fois pour toutes.
              </p>

              <div className="space-y-3">
                <button
                  onClick={(e) => selectOption(e.currentTarget, 2)}
                  className="option-card w-full p-5 rounded-2xl bg-[#0a0a0a] flex items-center gap-4 text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-[#00ffc4]/20 transition-colors">
                    <iconify-icon icon="solar:inbox-unread-linear" width="20"></iconify-icon>
                  </div>
                  <span className="text-lg text-white">Emails et messages qui s'accumulent</span>
                </button>

                <button
                  onClick={(e) => selectOption(e.currentTarget, 2)}
                  className="option-card w-full p-5 rounded-2xl bg-[#0a0a0a] flex items-center gap-4 text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-[#00ffc4]/20 transition-colors">
                    <iconify-icon icon="solar:document-add-linear" width="20"></iconify-icon>
                  </div>
                  <span className="text-lg text-white">Paperasse administrative sans fin</span>
                </button>

                {/* The "Other" Magic Card */}
                <div
                  id="other-card"
                  className="option-card w-full p-5 rounded-2xl bg-[#0a0a0a] transition-all overflow-hidden border border-white/10"
                >
                  {/* Collapsed State */}
                  <div
                    id="other-header"
                    className="flex items-center justify-between cursor-pointer"
                    onClick={expandOther}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400">
                        <iconify-icon icon="solar:magic-stick-3-linear" width="20"></iconify-icon>
                      </div>
                      <span className="text-lg text-white">C'est autre chose...</span>
                    </div>
                    <iconify-icon icon="solar:add-circle-linear" className="text-neutral-500"></iconify-icon>
                  </div>

                  {/* Expanded State */}
                  <div id="other-content" className="hidden mt-6 animate-[fadeIn_0.3s_ease]">
                    <div className="flex gap-4 mb-4 border-b border-white/5 pb-4">
                      <button
                        onClick={() => switchInput("text")}
                        id="tab-text"
                        className={`text-sm font-medium pb-1 ${
                          inputMode === "text"
                            ? "text-white border-b-2 border-[#00ffc4]"
                            : "text-neutral-500 hover:text-white"
                        }`}
                      >
                        Écrire
                      </button>
                      <button
                        onClick={() => switchInput("voice")}
                        id="tab-voice"
                        className={`text-sm font-medium pb-1 ${
                          inputMode === "voice"
                            ? "text-white border-b-2 border-[#00ffc4]"
                            : "text-neutral-500 hover:text-white"
                        }`}
                      >
                        Vocal
                      </button>
                    </div>

                    {/* Text Input */}
                    <div id="input-text-area" className={inputMode === "text" ? "" : "hidden"}>
                      <textarea
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        className="w-full bg-neutral-900 rounded-xl p-4 text-white placeholder:text-neutral-600 resize-none h-24 text-sm focus:outline-none focus:border-[#00ffc4] focus:ring-0"
                        placeholder="Dites-nous tout. On est là pour vous aider, pas pour vous juger."
                      ></textarea>
                    </div>

                    {/* Voice Input with Visualizer */}
                    <div
                      id="input-voice-area"
                      className={`${inputMode === "voice" ? "flex" : "hidden"} h-24 items-center justify-center flex-col gap-3 bg-neutral-900 rounded-xl relative overflow-hidden`}
                    >
                      <div
                        id="wave-container"
                        className={`flex items-end justify-center gap-1 h-8 ${isRecording ? "" : "hidden"}`}
                      >
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="audio-wave-bar w-1 bg-[#00ffc4] rounded-full"
                            style={{
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: `${0.7 + i * 0.1}s`,
                            }}
                          ></div>
                        ))}
                      </div>
                      <button
                        onClick={toggleRecord}
                        className={`z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                          isRecording
                            ? "bg-red-500 text-white scale-110 border-red-500/20"
                            : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"
                        }`}
                      >
                        <iconify-icon icon="solar:microphone-bold" width="24"></iconify-icon>
                      </button>
                      <span
                        className={`text-xs font-mono ${
                          isRecording ? "text-red-400 animate-pulse" : "text-neutral-500"
                        }`}
                        id="record-text"
                      >
                        {isRecording ? "Enregistrement en cours..." : "Appuyez pour enregistrer"}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={confirmOther}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00ffc4] transition-colors"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Volume */}
            <div id="step-3" className={`step-panel ${currentStep === 3 ? "active" : ""}`}>
              <button
                onClick={prevStep}
                className="absolute top-0 -mt-16 text-neutral-500 hover:text-white flex items-center gap-2 text-sm transition-colors"
              >
                <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Retour
              </button>
              <span className="text-[#00ffc4] font-serif-italic text-xl mb-2 block">03. L'intensité</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8 tracking-tight">
                À quel point c'est chargé ?
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={(e) => selectOption(e.currentTarget, 3)}
                  className="option-card p-6 rounded-2xl bg-[#0a0a0a] text-left hover:border-blue-500/50"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-medium text-white">Tranquille</h3>
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">~1h / jour</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    Quelques messages par-ci par-là. Rien de dramatique, mais ça prend quand même du temps.
                  </p>
                </button>

                <button
                  onClick={(e) => selectOption(e.currentTarget, 3)}
                  className="option-card p-6 rounded-2xl bg-[#0a0a0a] text-left hover:border-orange-500/50"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-medium text-white">Ça commence à chauffer</h3>
                    <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded">2-4h / jour</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    Le flux ne s'arrête jamais. Emails, notifications, demandes... Vous courez après.
                  </p>
                </button>

                <button
                  onClick={(e) => selectOption(e.currentTarget, 3)}
                  className="option-card p-6 rounded-2xl bg-[#0a0a0a] text-left hover:border-red-500/50"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-medium text-white">Noyé sous les tâches</h3>
                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">4h+ / jour</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    Vous êtes submergé. L'opérationnel prend tout votre temps. Il faut de l'aide, et vite.
                  </p>
                </button>
              </div>
            </div>

            {/* STEP 4: Ecosystem */}
            <div id="step-4" className={`step-panel ${currentStep === 4 ? "active" : ""}`}>
              <button
                onClick={prevStep}
                className="absolute top-0 -mt-16 text-neutral-500 hover:text-white flex items-center gap-2 text-sm transition-colors"
              >
                <iconify-icon icon="solar:arrow-left-linear"></iconify-icon> Retour
              </button>
              <span className="text-[#00ffc4] font-serif-italic text-xl mb-2 block">04. Vos outils</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8 tracking-tight">
                Qu'est-ce que vous utilisez déjà ?
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "logos:whatsapp-icon", label: "WhatsApp" },
                  { icon: "logos:google-gmail", label: "Gmail" },
                  { icon: "logos:slack-icon", label: "Slack" },
                  { icon: "logos:notion-icon", label: "Notion" },
                ].map((tool, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleTool(tool.label)}
                    className={`option-card p-4 rounded-xl bg-[#0a0a0a] flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      onboardingData.tools.includes(tool.label) ? "selected" : ""
                    }`}
                  >
                    <iconify-icon
                      icon={tool.icon}
                      width="32"
                      className={`${
                        tool.icon === "logos:notion-icon" ? "invert opacity-60" : "grayscale"
                      } hover:grayscale-0 hover:opacity-100 transition-all`}
                    ></iconify-icon>
                    <span className="text-sm text-neutral-400">{tool.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={nextStep}
                  className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-[#00ffc4] transition-colors flex items-center gap-2"
                >
                  Valider <iconify-icon icon="solar:check-circle-linear"></iconify-icon>
                </button>
              </div>
            </div>

            {/* STEP 5: Final Activation */}
            <div id="step-5" className={`step-panel ${currentStep === 5 ? "active" : ""}`}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-[#00ffc4]/10 border border-[#00ffc4]/20 rounded-full px-4 py-1.5 mb-6 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#00ffc4]"></span>
                  <span className="uppercase text-xs font-bold text-[#00ffc4] tracking-widest">
                    Prêt à démarrer
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
                  Activez Floo maintenant
                </h2>
                <p className="text-neutral-400 max-w-md mx-auto">
                  Floo vit directement dans votre WhatsApp. Aucune app à télécharger, aucune interface à apprendre.
                  Entrez votre numéro et commencez votre première conversation dès maintenant.
                </p>
          </div>

              <div className="max-w-sm mx-auto w-full relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00ffc4] to-[#059669] rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-[#0a0a0a] rounded-xl p-1 flex items-center border border-white/10">
                  <div className="pl-4 pr-2 text-neutral-500 font-mono text-lg border-r border-white/10 select-none">
                    +225
                  </div>
                  <input
                    type="tel"
                    value={onboardingData.phoneNumber}
                    onChange={(e) =>
                      setOnboardingData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                    className="w-full bg-transparent border-none text-white text-lg px-4 py-3 placeholder:text-neutral-700 focus:ring-0 focus:outline-none"
                    placeholder="07 07 00 00 00"
                  />
            <button
                    onClick={handleSubmit}
                    disabled={loading || !onboardingData.phoneNumber}
                    className="bg-[#00ffc4] hover:bg-[#047857] text-black rounded-lg p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <iconify-icon icon="solar:plain-bold" width="24"></iconify-icon>
            </button>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">
                  Ils font confiance à Floo
                </p>
                <div className="flex justify-center gap-6 opacity-30 grayscale">
                  <iconify-icon icon="simple-icons:uber" width="24"></iconify-icon>
                  <iconify-icon icon="simple-icons:airbnb" width="24"></iconify-icon>
                  <iconify-icon icon="simple-icons:stripe" width="24"></iconify-icon>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        #intro-screen.dismissed {
          transform: translateY(-100vh);
          pointer-events: none;
        }
        #main-interface.visible {
          opacity: 1;
          transform: scale(1);
        }
        .step-panel {
          opacity: 0;
          transform: translateY(30px) scale(0.98);
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .step-panel.active {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }
        .step-panel.previous {
          opacity: 0;
          transform: translateY(-40px) scale(0.95);
          position: absolute;
          filter: blur(4px);
        }
        .option-card {
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .option-card:hover {
          border-color: rgba(0, 255, 196, 0.4);
          background-color: rgba(255, 255, 255, 0.03);
          transform: translateY(-4px);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .option-card.selected {
          border-color: #00ffc4;
          background-color: rgba(0, 255, 196, 0.03);
          box-shadow: 0 0 0 1px #00ffc4, 0 20px 40px -20px rgba(0, 255, 196, 0.1);
        }
        .audio-wave-bar {
          width: 4px;
          background: #00ffc4;
          border-radius: 999px;
          animation: wave 1s ease-in-out infinite;
        }
        @keyframes wave {
          0%,
          100% {
            height: 10%;
            opacity: 0.3;
          }
          50% {
            height: 100%;
            opacity: 1;
          }
        }
        @keyframes flow {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

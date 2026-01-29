"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface TourStep {
  target: string
  title: string
  desc: string
  position: "left" | "right" | "bottom" | "top"
}

const steps: TourStep[] = [
  {
    target: "#tour-sidebar",
    title: "Menu Principal",
    desc: "Naviguez entre le Dashboard, vos Crédits et la configuration WhatsApp ici.",
    position: "right",
  },
  {
    target: "#tour-kpi",
    title: "Statistiques Live",
    desc: "Suivez vos crédits restants, le volume de conversations et le temps économisé.",
    position: "bottom",
  },
  {
    target: "#tour-whatsapp-card",
    title: "Connexion Rapide",
    desc: "C'est ici que tout commence. Connectez votre numéro pour activer l'IA.",
    position: "left",
  },
  {
    target: "#tour-recharge",
    title: "Gestion Crédits",
    desc: "Besoin de plus de puissance ? Rechargez votre compte en un clic.",
    position: "bottom",
  },
  {
    target: "#tour-profile",
    title: "Profil Pro",
    desc: "Gérez votre abonnement et vos préférences personnelles.",
    position: "right",
  },
]

interface DashboardTourProps {
  onComplete: () => void
}

export function DashboardTour({ onComplete }: DashboardTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const animationFrameIdRef = useRef<number | null>(null)
  const focusBoxRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const updateTourPosition = useCallback(() => {
    if (!isActive || currentStepIndex >= steps.length) return

    const step = steps[currentStepIndex]
    const targetEl = document.querySelector(step.target)

    if (!targetEl || (targetEl as HTMLElement).offsetParent === null) {
      if (step.target === "#tour-sidebar") {
        setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
      }
      return
    }

    const rect = targetEl.getBoundingClientRect()
    const padding = 8

    if (focusBoxRef.current) {
      focusBoxRef.current.style.width = `${rect.width + padding * 2}px`
      focusBoxRef.current.style.height = `${rect.height + padding * 2}px`
      focusBoxRef.current.style.top = `${rect.top - padding}px`
      focusBoxRef.current.style.left = `${rect.left - padding}px`
    }

    if (tooltipRef.current && arrowRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const boxRect = focusBoxRef.current?.getBoundingClientRect() || { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }
      let topPos = 0
      let leftPos = 0
      const gap = 16

      arrowRef.current.style.left = ""
      arrowRef.current.style.top = ""
      arrowRef.current.style.right = ""
      arrowRef.current.style.bottom = ""

      if (step.position === "right") {
        topPos = boxRect.top
        leftPos = boxRect.right + gap
        arrowRef.current.style.left = "-6px"
        arrowRef.current.style.top = "24px"
      } else if (step.position === "bottom") {
        topPos = boxRect.bottom + gap
        leftPos = boxRect.left + boxRect.width / 2 - tooltipRect.width / 2
        arrowRef.current.style.top = "-6px"
        arrowRef.current.style.left = "50%"
        arrowRef.current.style.marginLeft = "-6px"
      } else if (step.position === "left") {
        topPos = boxRect.top
        leftPos = boxRect.left - tooltipRect.width - gap
        arrowRef.current.style.right = "-6px"
        arrowRef.current.style.top = "24px"
      }

      if (leftPos < 10) leftPos = 10
      if (leftPos + tooltipRect.width > window.innerWidth) leftPos = window.innerWidth - tooltipRect.width - 10
      if (topPos < 10) topPos = 10
      if (topPos + tooltipRect.height > window.innerHeight) topPos = window.innerHeight - tooltipRect.height - 10

      tooltipRef.current.style.top = `${topPos}px`
      tooltipRef.current.style.left = `${leftPos}px`
    }
  }, [isActive, currentStepIndex])

  const endTour = useCallback(() => {
    setIsActive(false)
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
    }
    localStorage.setItem("floo-dashboard-tour-completed", "true")
    onComplete()
  }, [onComplete])

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      endTour()
    }
  }, [currentStepIndex, endTour])

  useEffect(() => {
    if (!isActive) return

    const timeout = setTimeout(() => {
      if (focusBoxRef.current && tooltipRef.current) {
        focusBoxRef.current.style.display = "block"
        tooltipRef.current.style.display = "block"
        requestAnimationFrame(() => {
          if (focusBoxRef.current && tooltipRef.current) {
            focusBoxRef.current.style.opacity = "1"
            tooltipRef.current.style.opacity = "1"
            updateTourPosition()
            // Start animation loop
            const loop = () => {
              if (isActive && currentStepIndex < steps.length) {
                updateTourPosition()
                animationFrameIdRef.current = requestAnimationFrame(loop)
              }
            }
            animationFrameIdRef.current = requestAnimationFrame(loop)
          }
        })
      }
    }, 1000)

    return () => {
      clearTimeout(timeout)
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [isActive, currentStepIndex, updateTourPosition])

  useEffect(() => {
    if (!isActive) return

    const handleResize = () => {
      updateTourPosition()
    }

    const handleScroll = () => {
      updateTourPosition()
    }

    window.addEventListener("resize", handleResize)
    const scrollArea = document.getElementById("main-scroll-area")
    scrollArea?.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("resize", handleResize)
      scrollArea?.removeEventListener("scroll", handleScroll)
    }
  }, [isActive, currentStepIndex])

  useEffect(() => {
    if (isActive) {
      updateTourPosition()
    }
  }, [currentStepIndex, isActive, updateTourPosition])

  if (!isActive) return null

  const currentStep = steps[currentStepIndex]

  return (
    <>
      <div
        ref={focusBoxRef}
        id="tour-focus-box"
        className="fixed z-[60] rounded-xl transition-all duration-300 opacity-0 hidden"
        style={{
          boxShadow:
            "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 2px rgba(0, 255, 196, 0.8), 0 0 40px rgba(0, 255, 196, 0.2)",
          pointerEvents: "none",
          willChange: "top, left, width, height",
        }}
      ></div>
      <div
        ref={tooltipRef}
        id="tour-tooltip"
        className="fixed z-[70] w-80 opacity-0 hidden transition-opacity duration-300 bg-[#171717]/90 backdrop-blur-md border border-white/10 rounded-2xl p-0 shadow-2xl flex flex-col pointer-events-auto"
      >
        <div ref={arrowRef} className="tour-arrow absolute w-3 h-3 bg-[#171717] border-t border-l border-white/10 rotate-45 -z-10"></div>
        <div className="p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono text-[#00ffc4] bg-[#00ffc4]/10 px-2 py-0.5 rounded uppercase tracking-wider">
              ÉTAPE {currentStepIndex + 1}/{steps.length}
            </span>
            <button
              onClick={endTour}
              className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            >
              <iconify-icon icon="solar:close-circle-linear" className="text-lg block"></iconify-icon>
            </button>
          </div>
          <h3 className="text-base font-semibold text-white mb-2 tracking-tight">{currentStep.title}</h3>
          <p className="text-sm text-neutral-400 leading-relaxed mb-4">{currentStep.desc}</p>
        </div>
        <div className="p-4 border-t border-white/5 bg-white/[0.02] rounded-b-2xl flex justify-between items-center">
          <button
            onClick={endTour}
            className="text-xs text-neutral-500 hover:text-white font-medium transition-colors px-2 py-1"
          >
            Passer
          </button>
          <div className="flex gap-2">
            {currentStepIndex === steps.length - 1 ? (
              <button
                onClick={endTour}
                className="px-4 py-1.5 rounded-lg bg-[#00ffc4] text-black text-xs font-semibold hover:bg-[#00e6b0] transition-colors shadow-[0_0_10px_rgba(0,255,196,0.2)] flex items-center gap-1 cursor-pointer"
              >
                Terminer <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-4 py-1.5 rounded-lg bg-[#00ffc4] text-black text-xs font-semibold hover:bg-[#00e6b0] transition-colors shadow-[0_0_10px_rgba(0,255,196,0.2)] flex items-center gap-1 cursor-pointer"
              >
                Suivant <iconify-icon icon="solar:arrow-right-linear"></iconify-icon>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

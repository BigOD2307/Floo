"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "signup" | "signin"
}

export function AuthModal({ isOpen, onClose, defaultMode = "signup" }: AuthModalProps) {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(defaultMode === "signup")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setIsSignUp(defaultMode === "signup")
  }, [defaultMode])

  if (!isOpen) return null

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error("Compte créé mais connexion échouée")
      }

      onClose()
      router.push("/onboarding")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Email ou mot de passe incorrect")
      }

      onClose()
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-neutral-900 rounded-3xl shadow-2xl border border-white/10 w-full max-w-4xl h-[600px] overflow-hidden flex flex-col md:flex-row animate-float-card">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-neutral-800 p-2 rounded-full text-neutral-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Panel */}
        <div className="md:w-5/12 bg-[#047857]/10 p-8 border-r border-white/5 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00ffc4]/10 via-transparent to-[#059669]/20 opacity-60" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ffc4] to-[#047857] flex items-center justify-center text-black mb-6">
              <span className="text-2xl font-bold">F</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Bienvenue sur Floo</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8">
              Connecte ton WhatsApp et commence à automatiser tes tâches dès aujourd'hui.
            </p>
            <div className="bg-black/40 backdrop-blur border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-neutral-300 font-medium">Communauté</span>
              </div>
              <div className="text-2xl font-bold text-white">2,000+</div>
              <div className="text-[10px] text-neutral-500">Professionnels actifs en CI</div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="md:w-7/12 p-8 flex flex-col justify-center">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                isSignUp
                  ? "bg-white shadow text-green-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                !isSignUp
                  ? "bg-white shadow text-green-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Se connecter
            </button>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </h3>
          <p className="text-neutral-400 text-sm mb-6">
            {isSignUp
              ? "Commencez avec 50 crédits gratuits"
              : "Accédez à votre compte Floo"}
          </p>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Nom complet
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jean Kouadio"
                  required
                  disabled={loading}
                  className="bg-neutral-800 border-white/10 text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jean@example.com"
                required
                disabled={loading}
                className="bg-neutral-800 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Mot de passe
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
                className="bg-neutral-800 border-white/10 text-white"
              />
              {isSignUp && (
                <p className="text-xs text-neutral-500">Minimum 8 caractères</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#047857] hover:bg-[#059669] text-white"
              disabled={loading}
            >
              {loading
                ? "Chargement..."
                : isSignUp
                ? "Créer mon compte"
                : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

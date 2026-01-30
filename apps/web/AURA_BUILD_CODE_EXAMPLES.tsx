// ============================================
// EXEMPLES DE CODE POUR AURA BUILD
// ============================================

// ============================================
// 1. LANDING PAGE - src/app/page.tsx
// ============================================

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-xl font-bold">Floo</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium transition-colors hover:text-green-600">
              Fonctionnalités
            </Link>
            <Link href="#pricing" className="text-sm font-medium transition-colors hover:text-green-600">
              Tarifs
            </Link>
            <Link href="/auth" className="text-sm font-medium transition-colors hover:text-green-600">
              Connexion
            </Link>
            <Link href="/auth">
              <Button>Commencer</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 md:py-32">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Votre Assistant IA Personnel
            <span className="text-green-600"> sur WhatsApp</span>
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Automatisez vos tâches quotidiennes, gérez vos rendez-vous, et bien plus encore.
            Tout ça directement depuis WhatsApp.
          </p>
          <div className="flex gap-4">
            <Link href="/auth">
              <Button size="lg" className="gap-2">
                Essayer gratuitement
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Fonctionnalités
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tout ce dont vous avez besoin pour être plus productif
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Gestion de tâches"
            description="Créez, gérez et suivez vos tâches directement via WhatsApp"
          />
          <FeatureCard
            title="Rappels intelligents"
            description="Ne manquez plus jamais un rendez-vous important"
          />
          <FeatureCard
            title="Recherche web"
            description="Obtenez des informations instantanément sans quitter WhatsApp"
          />
          <FeatureCard
            title="Traduction"
            description="Traduisez du texte dans plus de 100 langues"
          />
          <FeatureCard
            title="Résumés"
            description="Résumez des articles, documents et conversations"
          />
          <FeatureCard
            title="Et bien plus"
            description="Découvrez toutes les possibilités avec Floo"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tarifs simples
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Payez uniquement ce que vous utilisez avec notre système de crédits
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <PricingCard
            name="Starter"
            price="2 000 FCFA"
            credits="50 crédits"
            features={[
              "50 crédits",
              "Support par email",
              "Toutes les fonctionnalités",
            ]}
          />
          <PricingCard
            name="Pro"
            price="5 000 FCFA"
            credits="150 crédits"
            features={[
              "150 crédits (+20% bonus)",
              "Support prioritaire",
              "Toutes les fonctionnalités",
            ]}
            highlighted
          />
          <PricingCard
            name="Business"
            price="10 000 FCFA"
            credits="350 crédits"
            features={[
              "350 crédits (+40% bonus)",
              "Support dédié",
              "Toutes les fonctionnalités",
            ]}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Floo. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PricingCard({
  name,
  price,
  credits,
  features,
  highlighted = false,
}: {
  name: string
  price: string
  credits: string
  features: string[]
  highlighted?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-6 rounded-lg border p-8 ${
        highlighted ? "border-green-500 shadow-lg" : ""
      }`}
    >
      <div>
        <h3 className="text-2xl font-bold">{name}</h3>
        <p className="mt-2 text-3xl font-bold">{price}</p>
        <p className="text-sm text-muted-foreground">{credits}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 rounded-full bg-green-500/20" />
            {feature}
          </li>
        ))}
      </ul>
      <Link href="/auth" className="mt-auto">
        <Button className="w-full" variant={highlighted ? "default" : "outline"}>
          Commencer
        </Button>
      </Link>
    </div>
  )
}

// ============================================
// 2. AUTH PAGE - src/app/auth/page.tsx
// ============================================

"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      // 1. Créer le compte
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      // 2. Auto-login
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error("Compte créé mais connexion échouée. Veuillez vous connecter manuellement.")
      }

      // 3. Redirection
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

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">F</span>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-4">
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

          <CardTitle className="text-2xl text-center">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Commencez avec 50 crédits gratuits"
              : "Accédez à votre compte Floo"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jean Kouadio"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jean@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
              />
              {isSignUp && (
                <p className="text-xs text-gray-500">Minimum 8 caractères</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Chargement..."
                : isSignUp
                ? "Créer mon compte"
                : "Se connecter"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

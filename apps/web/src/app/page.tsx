import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="text-xl font-bold">Floo</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Fonctionnalités
            </Link>
            <Link href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Tarifs
            </Link>
            <Link href="/auth/signin" className="text-sm font-medium transition-colors hover:text-primary">
              Connexion
            </Link>
            <Link href="/auth/signup">
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
            <span className="text-primary"> sur WhatsApp</span>
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Automatisez vos tâches quotidiennes, gérez vos rendez-vous, et bien plus encore.
            Tout ça directement depuis WhatsApp.
          </p>
          <div className="flex gap-4">
            <Link href="/auth/signup">
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
        highlighted ? "border-primary shadow-lg" : ""
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
            <div className="h-4 w-4 rounded-full bg-primary/20" />
            {feature}
          </li>
        ))}
      </ul>
      <Link href="/auth/signup" className="mt-auto">
        <Button className="w-full" variant={highlighted ? "default" : "outline"}>
          Commencer
        </Button>
      </Link>
    </div>
  )
}

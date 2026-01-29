# Brief Technique pour Aura Build - Floo Frontend

## 📋 Contexte du Projet

**Floo** est un assistant IA personnel accessible via WhatsApp, conçu spécifiquement pour les professionnels africains (Côte d'Ivoire). L'application web permet aux utilisateurs de:
- Créer un compte et gérer leur profil
- Obtenir un code unique pour lier leur WhatsApp
- Acheter et gérer des crédits
- Suivre leurs conversations et leur utilisation

---

## 🎯 Objectif de cette Phase

Créer **2 pages uniquement** pour commencer:
1. **Landing Page** - Page d'accueil avec présentation et CTA
2. **Page Auth combinée** - Sign Up et Sign In sur la même page avec toggle

---

## 🛠 Stack Technique (OBLIGATOIRE)

### Framework et Versions
```json
{
  "framework": "Next.js 14.2.18",
  "runtime": "React 18.3.1",
  "language": "TypeScript 5.7.3",
  "styling": "Tailwind CSS 3.4.17",
  "ui-library": "Shadcn/ui (Radix UI)"
}
```

### Structure de Dossiers Existante
```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Layout racine (NE PAS MODIFIER)
│   │   ├── page.tsx           # Landing page (À CRÉER)
│   │   ├── auth/
│   │   │   ├── page.tsx       # Page auth combinée (À CRÉER)
│   │   └── api/               # Routes API (DÉJÀ CRÉÉES)
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts
│   │       │   └── signup/route.ts
│   │       └── onboarding/route.ts
│   ├── components/
│   │   └── ui/                # Composants Shadcn (DÉJÀ CRÉÉS)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── utils.ts           # Utilitaires (DÉJÀ CRÉÉ)
│   │   └── db.ts              # Prisma client (DÉJÀ CRÉÉ)
│   └── styles/
│       └── globals.css        # Styles globaux (DÉJÀ CRÉÉ)
└── prisma/
    └── schema.prisma          # Schéma DB (DÉJÀ CRÉÉ)
```

---

## 🎨 Design System

### Couleurs (Brand Floo)
```css
/* Couleur principale - Vert Floo */
--primary: 142 76% 36%        /* #22c55e - Green-500 */
--primary-foreground: 0 0% 100%

/* Couleurs secondaires */
--background: 0 0% 100%
--foreground: 0 0% 3.9%
--muted: 0 0% 96.1%
--muted-foreground: 0 0% 45.1%
--border: 0 0% 89.8%

/* Classes Tailwind à utiliser */
bg-green-500     /* Boutons primaires */
text-green-600   /* Texte accentué */
border-green-500 /* Bordures actives */
```

### Typographie
```
Font: Inter (Google Fonts)
Tailles:
- Titre H1: text-4xl sm:text-6xl font-bold
- Titre H2: text-3xl sm:text-4xl font-bold
- Titre H3: text-2xl font-bold
- Body: text-base
- Small: text-sm
```

### Logo
```
Simple logo circulaire vert avec lettre "F"
<div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
  <span className="text-white text-2xl font-bold">F</span>
</div>
```

---

## 📄 Page 1: Landing Page

### Route
- Path: `/` (apps/web/src/app/page.tsx)

### Structure
```tsx
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        {/* Nav avec logo Floo + liens + bouton CTA */}
      </header>

      {/* Hero Section */}
      <section className="container py-24">
        {/* Titre principal + Description + 2 CTA */}
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        {/* Grille de 6 features */}
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        {/* 3 cartes de pricing */}
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        {/* Copyright */}
      </footer>
    </div>
  )
}
```

### Contenu Exact

#### Header
- Logo: Cercle vert avec "F" + Texte "Floo"
- Navigation:
  - Fonctionnalités (href="#features")
  - Tarifs (href="#pricing")
  - Connexion (href="/auth")
  - Bouton "Commencer" (href="/auth")

#### Hero
- **Titre**: "Votre Assistant IA Personnel **sur WhatsApp**" (mot "sur WhatsApp" en vert)
- **Description**: "Automatisez vos tâches quotidiennes, gérez vos rendez-vous, et bien plus encore. Tout ça directement depuis WhatsApp."
- **CTA 1**: Bouton vert "Essayer gratuitement" → /auth
- **CTA 2**: Bouton outline "En savoir plus" → #features

#### Features (6 cartes)
1. **Gestion de tâches** - Créez, gérez et suivez vos tâches directement via WhatsApp
2. **Rappels intelligents** - Ne manquez plus jamais un rendez-vous important
3. **Recherche web** - Obtenez des informations instantanément sans quitter WhatsApp
4. **Traduction** - Traduisez du texte dans plus de 100 langues
5. **Résumés** - Résumez des articles, documents et conversations
6. **Et bien plus** - Découvrez toutes les possibilités avec Floo

#### Pricing (3 cartes)
```
Starter - 2 000 FCFA
- 50 crédits
- Support par email
- Toutes les fonctionnalités

Pro - 5 000 FCFA (highlighted)
- 150 crédits (+20% bonus)
- Support prioritaire
- Toutes les fonctionnalités

Business - 10 000 FCFA
- 350 crédits (+40% bonus)
- Support dédié
- Toutes les fonctionnalités
```

---

## 📄 Page 2: Authentication (Sign Up / Sign In combinés)

### Route
- Path: `/auth` (apps/web/src/app/auth/page.tsx)

### Structure
```tsx
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        {/* Toggle Sign Up / Sign In */}
        {/* Formulaire conditionnel */}
      </Card>
    </div>
  )
}
```

### Fonctionnalité

#### Mode Sign Up (par défaut)
```tsx
Formulaire:
- Nom complet (input text, required)
- Email (input email, required)
- Mot de passe (input password, required, minLength=8)
- Bouton "Créer mon compte"
- Lien "Vous avez déjà un compte? Se connecter" → toggle vers Sign In

Soumission:
POST /api/auth/signup
Body: { name, email, password }

En cas de succès (201):
1. Auto-login avec signIn("credentials", { email, password, redirect: false })
2. Redirection vers /onboarding
```

#### Mode Sign In
```tsx
Formulaire:
- Email (input email, required)
- Mot de passe (input password, required)
- Bouton "Se connecter"
- Lien "Pas encore de compte? Créer un compte" → toggle vers Sign Up

Soumission:
signIn("credentials", { email, password, redirect: false })

En cas de succès:
Redirection vers /dashboard
```

### UI Toggle
```tsx
// En haut de la card, avant le formulaire
<div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
  <button
    onClick={() => setIsSignUp(true)}
    className={isSignUp ? "bg-white shadow" : ""}
  >
    Créer un compte
  </button>
  <button
    onClick={() => setIsSignUp(false)}
    className={!isSignUp ? "bg-white shadow" : ""}
  >
    Se connecter
  </button>
</div>
```

---

## 🔌 Intégration Backend (CRITIQUE)

### NextAuth Configuration
Le backend utilise **NextAuth.js** pour l'authentification. **NE PAS** toucher aux fichiers suivants:
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/providers.tsx`
- `src/app/layout.tsx`

### Imports Obligatoires
```tsx
// Pour les pages client-side
"use client"

// Pour l'authentification
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

// Pour les composants UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```

### API Calls - Exemples Complets

#### Sign Up
```tsx
async function handleSignUp(name: string, email: string, password: string) {
  try {
    // 1. Créer le compte
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la création du compte")
    }

    // 2. Auto-login
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (signInResult?.error) {
      throw new Error("Compte créé mais connexion échouée")
    }

    // 3. Redirection
    router.push("/onboarding")
    router.refresh()
  } catch (error) {
    console.error(error)
    // Afficher l'erreur à l'utilisateur
  }
}
```

#### Sign In
```tsx
async function handleSignIn(email: string, password: string) {
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
  } catch (error) {
    console.error(error)
    // Afficher l'erreur à l'utilisateur
  }
}
```

---

## ✅ Checklist de Compatibilité

Avant de générer le code, vérifier:

- [ ] Next.js 14 App Router (pas Pages Router)
- [ ] TypeScript strict
- [ ] "use client" sur toutes les pages avec hooks/événements
- [ ] Imports depuis "@/..." (path alias configuré)
- [ ] Composants Shadcn existants (ne pas recréer)
- [ ] Couleur primaire = green-500 (#22c55e)
- [ ] Font Inter via next/font/google
- [ ] Classes Tailwind (pas de CSS inline)
- [ ] Responsive (mobile-first)
- [ ] Accessibilité (labels, aria-*)

---

## 🚫 À NE PAS FAIRE

1. **NE PAS** modifier `layout.tsx`, `providers.tsx`, ou les fichiers API
2. **NE PAS** créer de nouvelles routes API
3. **NE PAS** changer la structure Prisma ou la config Next.js
4. **NE PAS** utiliser d'autres bibliothèques UI (Material-UI, Ant Design, etc.)
5. **NE PAS** créer de pages supplémentaires (onboarding, dashboard) - déjà créées
6. **NE PAS** modifier les couleurs du thème (rester sur le vert Floo)

---

## 📦 Composants Shadcn Disponibles

Ces composants sont **déjà installés** et prêts à l'emploi:

```tsx
import { Button } from "@/components/ui/button"
// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon

import { Input } from "@/components/ui/input"
// Props: type, placeholder, disabled, required, etc.

import { Label } from "@/components/ui/label"
// Utilisé avec Input pour l'accessibilité

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
// Structure de carte réutilisable
```

### Exemples d'utilisation
```tsx
// Bouton primaire
<Button>Cliquez ici</Button>

// Bouton outline
<Button variant="outline">Annuler</Button>

// Formulaire
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="vous@exemple.com"
  />
</div>

// Card
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>
```

---

## 🎯 Résumé des Livrables

### Fichiers à Créer
1. `src/app/page.tsx` - Landing page complète
2. `src/app/auth/page.tsx` - Page auth avec toggle Sign Up/Sign In

### Fichiers à NE PAS Toucher
- Tous les autres fichiers existants
- Layout, providers, API routes, composants UI

### Spécifications Visuelles
- Couleur: Vert Floo #22c55e
- Font: Inter
- Style: Moderne, épuré, professionnel
- Responsive: Mobile-first

### Fonctionnalités
- Landing: Navigation fluide, CTA clairs, sections features/pricing
- Auth: Toggle Sign Up/Sign In, validation, auto-login, redirection

---

## 💡 Notes Importantes

1. **NextAuth** gère automatiquement les sessions - pas besoin de localStorage
2. Les **redirections** se font via `useRouter()` de Next.js
3. Les **erreurs API** doivent être affichées à l'utilisateur (toast ou message inline)
4. La **validation** côté client doit matcher celle du backend (password min 8 chars)
5. Le **responsive** est prioritaire (beaucoup d'utilisateurs sur mobile en Afrique)

---

## 📞 Support Technique

Si des questions sur l'intégration backend ou des bugs:
- Les routes API sont déjà testées et fonctionnelles
- Le schéma de base de données est configuré (SQLite local pour dev)
- NextAuth est configuré avec credentials provider

**Objectif**: Pages frontend qui s'intègrent parfaitement avec le backend Next.js existant sans modifications des API ou de la configuration.

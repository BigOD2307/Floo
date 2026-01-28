# Floo Web Application

Application web Next.js pour Floo - Assistant IA Personnel.

## Stack Technique

- **Framework**: Next.js 14
- **UI**: React + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js
- **State**: React Query

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier .env
cp .env.example .env

# Configurer la base de données
npm run db:push

# Lancer en développement
npm run dev
```

## Structure

```
src/
├── app/              # Pages Next.js (App Router)
├── components/       # Composants React
│   └── ui/          # Composants UI (Shadcn)
├── lib/             # Utilitaires
└── styles/          # Styles globaux
```

## Fonctionnalités

- ✅ Landing page
- 🚧 Authentification (sign-up/sign-in)
- 🚧 Onboarding
- 🚧 Dashboard
- 🚧 Configuration WhatsApp
- 🚧 Système de crédits
- 🚧 Paiement (Wave/Orange Money)

## Développement

```bash
# Dev
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint

# Database studio
npm run db:studio
```

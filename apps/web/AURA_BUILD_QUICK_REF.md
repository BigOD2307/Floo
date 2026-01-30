# Quick Reference - Aura Build

## 🎯 Mission
Créer **2 pages** pour Floo (Assistant IA WhatsApp):
1. Landing Page (`/`)
2. Auth Page (`/auth`) - Sign Up + Sign In combinés

## ⚡ Stack
- Next.js 14 + TypeScript + Tailwind CSS
- Shadcn/ui (Radix UI)
- NextAuth.js (déjà configuré)

## 🎨 Brand
- **Couleur**: Vert #22c55e (green-500)
- **Font**: Inter
- **Logo**: Cercle vert avec "F"

## 📁 Fichiers à Créer
```
src/app/page.tsx          → Landing page
src/app/auth/page.tsx     → Auth combinée
```

## 🔌 API Calls Essentiels

### Sign Up
```tsx
POST /api/auth/signup
{ name, email, password }

Puis auto-login:
signIn("credentials", { email, password, redirect: false })
→ Redirection /onboarding
```

### Sign In
```tsx
signIn("credentials", { email, password, redirect: false })
→ Redirection /dashboard
```

## ✅ Composants Disponibles
```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```

## 🚫 NE PAS Toucher
- `layout.tsx`, `providers.tsx`
- Routes API (`/api/*`)
- Composants UI existants
- Config Next.js/Prisma

## 📋 Checklist
- [ ] "use client" sur pages avec hooks
- [ ] Imports depuis "@/..."
- [ ] Couleur green-500 partout
- [ ] Mobile-first responsive
- [ ] Validation frontend = backend

Voir [AURA_BUILD_BRIEF.md](./AURA_BUILD_BRIEF.md) pour détails complets.

# Déployer Floo Web sur Vercel

L’app Next.js Floo (`apps/web`) peut être déployée sur **Vercel**. Le **gateway** (WhatsApp, agent IA) reste sur ton VPS ; il appelle l’API Floo hébergée sur Vercel.

---

## 1. Base de données PostgreSQL

Vercel ne supporte pas SQLite. Il faut une base **PostgreSQL** :

- **Supabase (déjà configuré)**  
  Projet : `https://nsvksuvdqnnukersbsoy.supabase.co`. Tables : users, transactions, sessions (sans RLS).  
  → **Voir [apps/web/SUPABASE_FLOO.md](apps/web/SUPABASE_FLOO.md)** pour la **connection string** (Project Settings → Database → URI) et les variables d’env.

- **[Neon](https://neon.tech)** (gratuit, simple)  
  1. Crée un projet → récupère la **connection string** (Format: **Prisma**).  
  2. Exemple : `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

- **[Vercel Postgres](https://vercel.com/storage/postgres)**  
  Dans ton projet Vercel : Storage → Create Database → Postgres. Les variables sont ajoutées automatiquement.

---

## 2. Projet Vercel

1. Va sur [vercel.com](https://vercel.com) → **Add New Project**.
2. **Import** ton repo GitHub (Floo).
3. **Root Directory** : `apps/web` (obligatoire).
4. **Framework Preset** : Next.js (détecté).
5. **Build Command** : `prisma generate && next build` (ou laisser par défaut si `package.json` le contient).
6. **Install Command** : `npm install`.

Ne déploie pas tout de suite ; configure d’abord les variables d’environnement.

---

## 3. Variables d’environnement (Vercel)

Dans **Project → Settings → Environment Variables**, ajoute :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string Postgres | `postgresql://...` (Neon, Vercel Postgres, Supabase) |
| `NEXTAUTH_URL` | URL publique de l’app | `https://ton-projet.vercel.app` (ou domaine custom) |
| `NEXTAUTH_SECRET` | Secret pour les sessions | `openssl rand -base64 32` |
| `FLOO_GATEWAY_API_KEY` | Clé partagée gateway ↔ app | Une même valeur secrète (ex. `openssl rand -hex 24`) |
| `SERPER_API_KEY` | (Optionnel) Recherche web Serper | Clé [serper.dev](https://serper.dev) ; sinon DuckDuckGo |

Pour **Preview** (branches), tu peux réutiliser les mêmes variables ou une autre `DATABASE_URL` / `NEXTAUTH_URL` si tu veux un env de test.

---

## 4. Créer les tables (Prisma)

Une fois `DATABASE_URL` configurée :

```bash
cd apps/web
npm install
npx prisma generate
npx prisma db push
```

Tu peux le faire en local (avec la même `DATABASE_URL` que sur Vercel) ou via une action CI qui se connecte à la DB. Après ça, les tables `users`, `transactions`, `sessions` existent.

---

## 5. Déployer

- **Deploy** depuis le dashboard Vercel, ou **push** sur la branche connectée (souvent `main`).
- Vercel build : `prisma generate` puis `next build`, puis déploiement.

---

## 6. Gateway (VPS) → pointer vers Vercel

Le gateway sur le VPS appelle l’app Floo (search, scrape, verify-code, etc.). Il doit utiliser l’**URL Vercel** :

1. Sur le VPS, édite la config du service Floo (ou `floo.service`) et mets :
   - `FLOO_API_BASE_URL=https://ton-projet.vercel.app`  
   (ou ton domaine custom, ex. `https://floo.digital` si tu le pointes vers Vercel.)
2. `FLOO_GATEWAY_API_KEY` : **exactement la même** valeur que sur Vercel.
3. Redémarre le gateway :
   ```bash
   sudo systemctl restart floo
   ```

Les scripts qui injectent `FLOO_API_BASE_URL` / `FLOO_GATEWAY_API_KEY` (ex. `setup-websearch-complete`, `ready-to-test`) devront utiliser l’URL Vercel au lieu de `http://127.0.0.1:3000` si tu bascules tout l’app sur Vercel.

---

## 7. Domaine personnalisé (optionnel)

- **Vercel** : Project → Settings → Domains → Add `floo.digital` (ou autre).
- **DNS** : enregistrement **CNAME** ou **A** vers Vercel (comme indiqué dans le dashboard).
- Dans Vercel, mets `NEXTAUTH_URL` (et si besoin l’API) sur ce domaine (ex. `https://floo.digital`).

---

## 8. Résumé

1. Créer une base Postgres (Neon / Vercel Postgres / Supabase).  
2. Projet Vercel, Root Directory `apps/web`, variables d’env ci‑dessus.  
3. `npx prisma db push` une fois pour créer les tables.  
4. Déployer sur Vercel.  
5. Configurer le gateway (VPS) avec `FLOO_API_BASE_URL` = URL Vercel et la même `FLOO_GATEWAY_API_KEY`.

Après ça, **Floo Web** tourne sur Vercel et le **gateway** sur le VPS communique avec cette app pour la recherche, le linking WhatsApp, etc.

---

## 9. Dev local (avec Postgres)

L’app utilise **PostgreSQL** uniquement (plus de SQLite). En local :

1. Base Postgres : **Neon** (gratuit), **Docker** (`docker run -e POSTGRES_PASSWORD=local -p 5432:5432 postgres`), ou Supabase.
2. `apps/web/.env.local` :
   ```
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="dev-secret-change-in-prod"
   FLOO_GATEWAY_API_KEY="..."  # si tu testes les APIs tools
   ```
3. `npx prisma db push` puis `npm run dev`.

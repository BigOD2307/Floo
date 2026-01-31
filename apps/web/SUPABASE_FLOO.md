# Floo Web avec Supabase (PostgreSQL)

Projet Supabase : **https://nsvksuvdqnnukersbsoy.supabase.co**  
Tables : **users**, **transactions**, **sessions** — sans RLS.

---

## 1. Connection string (DATABASE_URL)

Pour Prisma et Vercel, il faut l’**URL de connexion PostgreSQL** (pas l’anon key).

**Sur Vercel : utilise toujours l’URL du pooler** (port 6543, avec `?pgbouncer=true`). La connexion directe (port 5432) échoue souvent depuis Vercel (« Can't reach database server »). Voir **DATABASE_VERCEL_FIX.md** si tu as cette erreur.

**Où la trouver dans Supabase :**

- **Option A** : Dans le dashboard de ton projet, clique sur **« Connect »** (en haut à droite ou dans le menu). Tu vois les chaînes de connexion (Direct, Pooler Session, Pooler Transaction). Pour **Vercel** : choisis **Transaction** ou **Session** pooler (port **6543**).
- **Option B** : Menu de gauche → **Project Settings** (icône engrenage en bas) → onglet **Database**. Tu y trouves le mot de passe et les **Connection string** (Direct / Pooler).
- **Lien direct** :  
  `https://supabase.com/dashboard/project/nsvksuvdqnnukersbsoy/settings/database`

Remplace `[YOUR-PASSWORD]` par le **mot de passe de la base** (rôle `postgres`). Si tu l’as oublié, réinitialise-le sur la même page Database.

**Format pooler (pour Vercel, recommandé) — URL prête à l’emploi :**
```txt
postgresql://postgres.nsvksuvdqnnukersbsoy:DRuJhvoNAk61ki5H@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Format direct (local uniquement, pas Vercel) :**
```txt
postgresql://postgres:[MOT_DE_PASSE]@db.nsvksuvdqnnukersbsoy.supabase.co:5432/postgres
```

---

## 2. Variables d’environnement

### En local (`.env.local` dans `apps/web`)

```env
DATABASE_URL="postgresql://postgres:[MOT_DE_PASSE]@db.nsvksuvdqnnukersbsoy.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="un-secret-long-aleatoire"
FLOO_GATEWAY_API_KEY="ta-cle-partagee-gateway"
```

### Sur Vercel

Dans **Project → Settings → Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | L’URI Supabase (avec le mot de passe DB) |
| `NEXTAUTH_URL` | `https://ton-projet.vercel.app` (ou ton domaine) |
| `NEXTAUTH_SECRET` | Secret fort (ex. `openssl rand -base64 32`) |
| `FLOO_GATEWAY_API_KEY` | Même valeur que sur le gateway (VPS) |

Les clés **anon** et **publishable** Supabase servent pour Supabase Auth / client. Pour Floo (Prisma + NextAuth), seule **DATABASE_URL** (Postgres) est nécessaire.

---

## 3. Tables déjà créées

Tu as déjà **users**, **transactions**, **sessions** (sans RLS).  
Le schéma Prisma est aligné (JSONB → `Json`, enum `TransactionType`).

- Si les tables ont été créées avec `create_tables.sql` ou `create_tables_clean.sql`, rien à faire.
- Si tu repartais de zéro : dans Supabase **SQL Editor**, exécuter `create_tables_clean.sql` (dans `apps/web/`).

---

## 4. Vérifier la connexion

```bash
cd apps/web
npm install
npx prisma generate
npx prisma db pull   # optionnel : vérifie que Prisma voit les tables
npm run build
```

---

## 5. Déploiement Vercel

1. **Root Directory** : `apps/web`.
2. Variables d’env ci‑dessus (surtout `DATABASE_URL` Supabase).
3. Déployer. Le build fait `prisma generate && next build`.

Ensuite, sur le **gateway (VPS)** :  
`FLOO_API_BASE_URL=https://ton-projet.vercel.app` et la même `FLOO_GATEWAY_API_KEY`.  
Voir [DEPLOY_VERCEL.md](../../DEPLOY_VERCEL.md) et [CONFIG_GATEWAY.md](../../CONFIG_GATEWAY.md).

---

## Résumé rapide

1. **Config locale** : dans `apps/web`, exécuter une fois :
   ```bash
   SUPABASE_DB_PASSWORD='ton_mot_de_passe' bash setup-env-supabase.sh
   ```
   Cela crée `.env.local` (gitignored) avec `DATABASE_URL` et les autres variables.
2. **Supabase** : si la connexion directe échoue (P1001), le projet peut être en pause (free tier) — ouvre le dashboard Supabase pour le réveiller. Sinon utilise l’**URI Session pooler** (Connect → Session pooler) à la place de l’URI directe.
3. **Vercel** : Nouveau projet, Root Directory `apps/web`, ajoute `DATABASE_URL` (l’URI Supabase avec le mot de passe), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `FLOO_GATEWAY_API_KEY`.
4. **Déployer** sur Vercel.
5. **VPS** : `FLOO_API_BASE_URL` = URL Vercel, même `FLOO_GATEWAY_API_KEY`, puis `systemctl restart floo`.

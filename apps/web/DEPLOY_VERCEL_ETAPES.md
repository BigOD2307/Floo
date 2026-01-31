# Déployer Floo sur Vercel — étapes détaillées

Guide pas à pas pour déployer l’app Floo (Next.js) sur Vercel à partir de ton GitHub.

---

## 1. Pousser le code sur GitHub

Si ce n’est pas déjà fait :

```bash
cd /chemin/vers/Floo
git push origin main
```

Vercel va lire le code depuis ce dépôt.

---

## 2. Créer un compte Vercel

1. Va sur **https://vercel.com**
2. Clique sur **Sign Up**
3. Choisis **Continue with GitHub**
4. Autorise Vercel à accéder à ton compte GitHub

---

## 3. Importer le projet Floo

1. Une fois connecté, clique sur **Add New…** → **Project**
2. Tu vois la liste de tes repos GitHub
3. Trouve **Floo** (ou BigOD2307/Floo) et clique sur **Import**
4. Ne clique pas tout de suite sur **Deploy** — on configure d’abord

---

## 4. Configurer le projet (important)

Sur la page de configuration :

### 4.1 Root Directory

- Clique sur **Edit** à côté de **Root Directory**
- Coche **Include source files outside of the Root Directory** (si proposé)
- Saisis : **`apps/web`**
- Valide

→ Vercel ne build que le dossier de l’app Next.js.

### 4.2 Variables d’environnement

Clique sur **Environment Variables** et ajoute **une par une** :

| Name | Value | Environnement |
|------|--------|----------------|
| `DATABASE_URL` | **URL pooler** (voir ci‑dessous) — **pas** la connexion directe 5432 | Production, Preview |
| `NEXTAUTH_URL` | `https://ton-projet.vercel.app` | Production (à modifier après le 1er deploy) |
| `NEXTAUTH_SECRET` | Une longue chaîne aléatoire (voir ci‑dessous) | Production, Preview |
| `FLOO_GATEWAY_API_KEY` | Une clé secrète (ex. `floo-gateway-xxx`) | Production, Preview |

**DATABASE_URL** (obligatoire : pooler pour Vercel) — copie-colle cette valeur :

```text
postgresql://postgres.nsvksuvdqnnukersbsoy:DRuJhvoNAk61ki5H@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Ne pas** utiliser l’URL directe `db....supabase.co:5432` sur Vercel — elle échoue (voir **DATABASE_VERCEL_FIX.md** si erreur « Can't reach database server »).

**NEXTAUTH_SECRET** : génère une valeur avec :

```bash
openssl rand -base64 32
```

Copie le résultat et colle-le dans la valeur de `NEXTAUTH_SECRET`.

**NEXTAUTH_URL** : pour le premier deploy tu peux mettre une URL temporaire, par ex. `https://floo-xxx.vercel.app`. Après le deploy, Vercel te donne l’URL réelle (ex. `https://floo-abc123.vercel.app`). Tu pourras alors revenir dans **Settings → Environment Variables**, modifier `NEXTAUTH_URL` avec cette URL, puis **Redeploy**.

---

## 5. Lancer le deploy

1. Clique sur **Deploy**
2. Attends 1 à 3 minutes (build + deploy)
3. Si tout est vert : **Visit** pour ouvrir l’app

---

## 6. Après le premier deploy

1. **Récupère l’URL** de l’app (ex. `https://floo-xyz.vercel.app`)
2. **Mets à jour NEXTAUTH_URL** :
   - Vercel → ton projet → **Settings** → **Environment Variables**
   - Modifie `NEXTAUTH_URL` et mets exactement cette URL (ex. `https://floo-xyz.vercel.app`)
   - Sauvegarde
3. **Redéploie** : onglet **Deployments** → **…** sur le dernier deploy → **Redeploy**

---

## 7. Résumé visuel

```
Vercel.com → Sign up with GitHub
    → Add New → Project
    → Import "Floo"
    → Root Directory: apps/web
    → Environment Variables: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, FLOO_GATEWAY_API_KEY
    → Deploy
    → Visit (puis mettre NEXTAUTH_URL à jour et Redeploy)
```

---

## En cas d’erreur au build

- **"DATABASE_URL is not set"** : vérifie que la variable est bien ajoutée (Production + Preview) et **Redeploy**.
- **"Prisma" / "schema"** : normalement le build fait `prisma generate` (défini dans `package.json`). Si une erreur Prisma s’affiche, envoie le message d’erreur.
- **Build failed** : dans Vercel, ouvre le **deploy** en erreur, regarde les **Build Logs** et copie l’erreur pour la partager.

## Erreur « Can't reach database server » (création de compte / requêtes DB)

Si l'app se déploie mais que la **création de compte** (ou toute requête DB) échoue avec un message du type « Can't reach database server at `db....supabase.co:5432` » :

1. Utilise l'**URL du pooler** Supabase (port **6543** + `?pgbouncer=true`) dans **DATABASE_URL** sur Vercel, pas l'URL directe (5432).
2. Vérifie que le projet Supabase n'est pas **en pause** (dashboard → Restore project si besoin).

→ Guide détaillé : **DATABASE_VERCEL_FIX.md** (dans ce dossier).

---

## Récap des variables (à avoir sous la main)

- **DATABASE_URL** : `postgresql://postgres.nsvksuvdqnnukersbsoy:DRuJhvoNAk61ki5H@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **NEXTAUTH_URL** : l’URL Vercel de l’app (après le 1er deploy)
- **NEXTAUTH_SECRET** : sortie de `openssl rand -base64 32`
- **FLOO_GATEWAY_API_KEY** : une clé de ton choix (ex. `floo-gw-secret-123`), à réutiliser sur le gateway (VPS) plus tard

Tu peux déployer en suivant ces étapes ; si tu bloques à une étape précise (écran ou message d’erreur), dis-moi où et on fait la suite ensemble.

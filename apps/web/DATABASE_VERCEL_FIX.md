# Erreur « Can't reach database server » sur Vercel

Si la création de compte (ou toute requête DB) échoue avec :

```text
Invalid `prisma.user.findUnique()` invocation: Can't reach database server at `db.nsvksuvdqnnukersbsoy.supabase.co:5432`
```

c’est que **Vercel ne peut pas joindre la base en connexion directe** (port 5432). Il faut utiliser le **pooler Supabase** et, si besoin, réveiller le projet.

---

## 1. Réveiller le projet Supabase (free tier)

Les projets gratuits Supabase se mettent en **pause** après une période d’inactivité.

1. Ouvre **https://supabase.com/dashboard**
2. Ouvre ton projet (**nsvksuvdqnnukersbsoy**)
3. Si tu vois « Project paused », clique sur **Restore project** et attends quelques minutes

---

## 2. Utiliser l’URL du pooler (obligatoire pour Vercel)

Sur Vercel, il faut utiliser l’**URI du pooler** (port **6543** + `?pgbouncer=true`), pas la connexion directe (5432).

**URL à mettre dans Vercel (DATABASE_URL) — copie-colle telle quelle :**

```text
postgresql://postgres.nsvksuvdqnnukersbsoy:DRuJhvoNAk61ki5H@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Si tu as changé le mot de passe de la base Supabase, remplace `DRuJhvoNAk61ki5H` par ton mot de passe (Settings → Database → Reset database password si besoin).

---

## 3. Mettre à jour Vercel

1. Vercel → ton projet Floo → **Settings** → **Environment Variables**
2. Modifie **DATABASE_URL** : supprime l’ancienne valeur et colle exactement :
   ```text
   postgresql://postgres.nsvksuvdqnnukersbsoy:DRuJhvoNAk61ki5H@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
3. Sauvegarde
4. **Deployments** → **…** sur le dernier deploy → **Redeploy**

---

## 4. Vérifier

Après le redeploy, réessaie de **créer un compte** sur https://floo-ecru.vercel.app (ou ton URL).  
Si l’erreur revient, vérifie que :

- Le projet Supabase n’est pas en pause
- L’URL contient bien **.pooler.supabase.com** et le port **6543**
- L’URL se termine par **?pgbouncer=true**
- Le mot de passe ne contient pas de caractères spéciaux non échappés (si oui, réinitialise le mot de passe dans Supabase)

---

## Récap

| Problème | Action |
|----------|--------|
| « Can't reach database server » | Utiliser l’URI **pooler** (port 6543, `?pgbouncer=true`) dans **DATABASE_URL** sur Vercel |
| Projet en pause | Dashboard Supabase → **Restore project** |
| Connexion directe (5432) | Ne pas l’utiliser sur Vercel ; garder la connexion directe pour le dev local si tu veux |

Voir aussi **SUPABASE_FLOO.md** (§ 1) pour les détails sur les chaînes de connexion.

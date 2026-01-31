# Floo — Lance et teste (tout configurer puis tester)

Guide en une page : push → Vercel → config gateway VPS → tests.

**URL de prod :** [https://floo-ecru.vercel.app](https://floo-ecru.vercel.app)

---

## 1. Pousser le code

```bash
cd "/Users/ousmanedicko/Desktop/Dicken AI/AI Product/Floo"
git push origin main
```

(Vercel lit le dépôt GitHub.)

---

## 2. Générer les secrets (une fois)

Dans un terminal :

```bash
# NEXTAUTH_SECRET (pour Vercel)
openssl rand -base64 32

# FLOO_GATEWAY_API_KEY (pour Vercel + VPS) — ex. ou génère une autre :
echo "floo-gw-$(openssl rand -hex 16)"
```

Note les deux valeurs : tu les utiliseras dans Vercel (étape 4) et sur le VPS (étape 6).

---

## 3. Déployer sur Vercel

1. Va sur **https://vercel.com** → **Add New…** → **Project**.
2. Importe le repo **Floo** (GitHub).
3. **Root Directory** : clique **Edit** → saisis **`apps/web`** → valide.
4. **Environment Variables** — ajoute (Production + Preview) :

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | `postgresql://postgres.nsvksuvdqnnukersbsoy:DRuJhvoNAk61ki5H@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
   | `NEXTAUTH_URL` | `https://floo-xxx.vercel.app` (temporaire ; tu corrigeras après le 1er deploy) |
   | `NEXTAUTH_SECRET` | *(valeur de l’étape 2)* |
   | `FLOO_GATEWAY_API_KEY` | *(valeur de l’étape 2)* |

5. Clique **Deploy** et attends la fin du build.

---

## 4. Après le premier deploy

1. Récupère l’**URL réelle** (ex. `https://floo-abc123.vercel.app`).
2. Vercel → ton projet → **Settings** → **Environment Variables**.
3. Modifie **NEXTAUTH_URL** avec cette URL exacte → Save.
4. **Deployments** → **…** sur le dernier deploy → **Redeploy**.

Tu as maintenant l’app Floo en ligne sur cette URL.

---

## 5. Pointer le gateway (VPS) vers Vercel

Le service `floo` sur le VPS doit appeler ton app Vercel (liaison WhatsApp, recherche, etc.).

**Pour floo-ecru.vercel.app (une seule commande)**

Si ta clé sur Vercel est **`floo-gateway-ma-cle-2026-secret`** (même valeur sur VPS) :

```bash
cd "/Users/ousmanedicko/Desktop/Dicken AI/AI Product/Floo"
VPS_PASSWORD='<ton_mot_de_passe_VPS>' FLOO_GATEWAY_API_KEY='floo-gateway-ma-cle-2026-secret' ./scripts/run-set-gateway-floo-ecru.sh
```

Sinon, mets ta clé dans `apps/web/.env` (`FLOO_GATEWAY_API_KEY=...`) et lance :

```bash
VPS_PASSWORD='<ton_mot_de_passe_VPS>' ./scripts/run-set-gateway-floo-ecru.sh
```

Sur Vercel, **FLOO_GATEWAY_API_KEY** doit être **exactement la même** que sur le VPS (sinon recherche / verify-code échouent).

**Option A — URL personnalisée**

```bash
cd "/Users/ousmanedicko/Desktop/Dicken AI/AI Product/Floo"

export VPS_PASSWORD='<ton_mot_de_passe_VPS>'
export FLOO_VERCEL_URL='https://ton-projet.vercel.app'   # ou https://floo-ecru.vercel.app
export FLOO_GATEWAY_API_KEY='<même_clé_que_sur_Vercel>'  # ou laisse le script la lire depuis apps/web/.env

./scripts/run-set-gateway-vercel.sh
```

**Option B — En SSH sur le VPS**

```bash
ssh root@38.180.244.104

# Remplace URL et KEY par tes valeurs (ex. https://floo-ecru.vercel.app et la clé dans apps/web/.env)
URL="https://floo-ecru.vercel.app"
KEY="<même_clé_que_FLOO_GATEWAY_API_KEY_sur_Vercel>"
sudo sed -i "s|^Environment=FLOO_API_BASE_URL=.*|Environment=FLOO_API_BASE_URL=$URL|" /etc/systemd/system/floo.service
sudo sed -i "s|^Environment=FLOO_GATEWAY_API_KEY=.*|Environment=FLOO_GATEWAY_API_KEY=$KEY|" /etc/systemd/system/floo.service
sudo systemctl daemon-reload && sudo systemctl restart floo
```

---

## 6. Tests à faire

1. **Dashboard**  
   Ouvre [https://floo-ecru.vercel.app/dashboard](https://floo-ecru.vercel.app/dashboard) → connecte-toi (ou inscris-toi).

2. **Code WhatsApp**  
   Dans le dashboard [floo-ecru.vercel.app/dashboard](https://floo-ecru.vercel.app/dashboard), génère un code (ex. `FL-1234`). Sur WhatsApp, envoie ce code au numéro Floo. Tu dois recevoir une confirmation du type « Compte lié avec succès ! ».

3. **Recherche web**  
   Envoie par exemple : « Cherche les meilleurs restaurants garba Abidjan pas chers ». Floo doit répondre en utilisant la recherche (pas « je ne peux pas chercher »).

4. **Inscription / Connexion**  
   Vérifie que signup et signin fonctionnent et que les données sont bien enregistrées (Supabase).

---

## Si ton app est déjà sur floo-ecru.vercel.app

1. **Vercel** (Dashboard → ton projet → Settings → Environment Variables)  
   - `NEXTAUTH_URL` = `https://floo-ecru.vercel.app`  
   - `FLOO_GATEWAY_API_KEY` = **exactement la même** valeur que dans `apps/web/.env` (sinon le gateway ne pourra pas appeler l’API).  
   Si tu modifies une variable, fais **Redeploy** (Deployments → … → Redeploy).

2. **Gateway VPS (une commande)**  
   Depuis ta machine, dans le repo Floo (remplace `<ton_mdp_VPS>` par ton mot de passe VPS) :
   ```bash
   VPS_PASSWORD='<ton_mdp_VPS>' FLOO_GATEWAY_API_KEY='floo-gateway-ma-cle-2026-secret' ./scripts/run-set-gateway-floo-ecru.sh
   ```
   Le script configure `FLOO_API_BASE_URL=https://floo-ecru.vercel.app` et `FLOO_GATEWAY_API_KEY=floo-gateway-ma-cle-2026-secret` dans le service `floo` sur le VPS. La clé doit être **identique** à celle sur Vercel.

3. **Tester** : [floo-ecru.vercel.app/dashboard](https://floo-ecru.vercel.app/dashboard) → code WhatsApp → recherche web (voir § 6).

---

## Récap des URLs et clés

| Où | Quoi |
|----|------|
| **Vercel** | `DATABASE_URL` (Supabase), `NEXTAUTH_URL` = `https://floo-ecru.vercel.app`, `NEXTAUTH_SECRET`, `FLOO_GATEWAY_API_KEY` (= même que apps/web/.env) |
| **VPS (floo.service)** | `FLOO_API_BASE_URL` = `https://floo-ecru.vercel.app`, `FLOO_GATEWAY_API_KEY` = même valeur que Vercel |

En cas d’erreur au build Vercel : voir **apps/web/DEPLOY_VERCEL_ETAPES.md** (section « En cas d’erreur au build »).  
Pour le gateway : **CONFIG_GATEWAY.md** et **scripts/verify-websearch-ready.sh**.

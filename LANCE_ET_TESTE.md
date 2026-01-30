# Floo — Lance et teste (tout configurer puis tester)

Guide en une page : push → Vercel → config gateway VPS → tests.

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
   | `DATABASE_URL` | `postgresql://postgres:DRuJhvoNAk61ki5H@db.nsvksuvdqnnukersbsoy.supabase.co:5432/postgres` |
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

**Option A — Depuis ta machine (recommandé)**

```bash
cd "/Users/ousmanedicko/Desktop/Dicken AI/AI Product/Floo"

export VPS_PASSWORD='<ton_mot_de_passe_VPS>'
export FLOO_VERCEL_URL='https://ton-projet.vercel.app'   # l’URL réelle de l’étape 4
export FLOO_GATEWAY_API_KEY='<même_clé_que_sur_Vercel>'

./scripts/run-set-gateway-vercel.sh
```

**Option B — En SSH sur le VPS**

```bash
ssh root@38.180.244.104

sudo bash -c 'cat > /tmp/set-vercel.sh << "EOF"
SVC=/etc/systemd/system/floo.service
URL="https://ton-projet.vercel.app"   # remplace par ton URL Vercel
KEY="ta-meme-cle-que-sur-vercel"
sed -i "s|^Environment=FLOO_API_BASE_URL=.*|Environment=FLOO_API_BASE_URL=$URL|" "$SVC"
sed -i "s|^Environment=FLOO_GATEWAY_API_KEY=.*|Environment=FLOO_GATEWAY_API_KEY=$KEY|" "$SVC"
systemctl daemon-reload && systemctl restart floo
EOF'
sudo bash /tmp/set-vercel.sh
```

---

## 6. Tests à faire

1. **Dashboard**  
   Ouvre `https://ton-projet.vercel.app/dashboard` → connecte-toi (ou inscris-toi).

2. **Code WhatsApp**  
   Dans le dashboard, génère un code (ex. `FL-1234`). Sur WhatsApp, envoie ce code au numéro Floo. Tu dois recevoir une confirmation du type « Compte lié avec succès ! ».

3. **Recherche web**  
   Envoie par exemple : « Cherche les meilleurs restaurants garba Abidjan pas chers ». Floo doit répondre en utilisant la recherche (pas « je ne peux pas chercher »).

4. **Inscription / Connexion**  
   Vérifie que signup et signin fonctionnent et que les données sont bien enregistrées (Supabase).

---

## Récap des URLs et clés

| Où | Quoi |
|----|------|
| **Vercel** | `DATABASE_URL` (Supabase), `NEXTAUTH_URL` (URL Vercel finale), `NEXTAUTH_SECRET`, `FLOO_GATEWAY_API_KEY` |
| **VPS (floo.service)** | `FLOO_API_BASE_URL` = URL Vercel, `FLOO_GATEWAY_API_KEY` = même valeur que Vercel |

En cas d’erreur au build Vercel : voir **apps/web/DEPLOY_VERCEL_ETAPES.md** (section « En cas d’erreur au build »).  
Pour le gateway : **CONFIG_GATEWAY.md** et **scripts/verify-websearch-ready.sh**.

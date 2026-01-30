# Recherche Web & Scraping – Guide d’intégration

Comment obtenir et utiliser les APIs **recherche web** et **scraping** dans Floo, une par une.

---

## 1. Recherche Web

### Option A : Serper (recommandé – payant après essai)

- **Site** : [serper.dev](https://serper.dev)
- **Inscription** : compte gratuit, pas de carte requise.
- **Essai** : 2 500 requêtes gratuites.
- **Après essai** : ~0,30 $/1 000 requêtes (très bon marché).
- **Format** : API REST, clé dans l’en-tête `X-API-KEY`.

**Obtenir la clé :**

1. Va sur [serper.dev](https://serper.dev).
2. Crée un compte (email + mot de passe).
3. Dans le dashboard : **API Key** → copie la clé (ex. `a1b2c3d4e5...`).
4. Dans ton projet Floo, ajoute dans `.env` ou `.env.local` :

   ```bash
   SERPER_API_KEY=ta_cle_ici
   ```

Floo utilise Serper en priorité quand `SERPER_API_KEY` est défini.

---

### Option B : DuckDuckGo (gratuit – fallback)

- **Coût** : 0 €.
- **Limites** : pas d’API officielle ; on utilise le package `duck-duck-scrape` (scraping). Rate limiting possible si trop de requêtes.
- **Configuration** : aucune clé nécessaire.

Si `SERPER_API_KEY` est absent, Floo bascule automatiquement sur DuckDuckGo.

---

### Résumé recherche web

| Fournisseur   | Clé API      | Coût              | Utilisation dans Floo      |
|---------------|-------------|-------------------|----------------------------|
| **Serper**    | Oui         | 2 500 gratis puis ~0,30 $/1k | Prioritaire si `SERPER_API_KEY` défini |
| **DuckDuckGo**| Non         | Gratuit           | Fallback automatique       |

---

## 2. Scraping Web

- **Outils** : `cheerio` (parsing HTML) + `fetch` (téléchargement de la page).
- **Coût** : 0 €, pas d’API externe.
- **Configuration** : aucune clé.

**Cas d’usage :**

- Pages **statiques** (HTML simple) : « Va sur cette URL et extrais le texte / les prix / les liens ».
- Pour des pages **très dynamiques** (SPA, beaucoup de JS) : on pourra ajouter plus tard **Playwright** ou **Puppeteer** (navigation réelle). Pour l’instant, on reste sur fetch + Cheerio.

**Limites à respecter :**

- Vérifier les `robots.txt` et conditions d’utilisation des sites.
- Ne pas surcharger les serveurs (rate limiting, pas de boucles agressives).
- Utiliser un `User-Agent` raisonnable (déjà géré dans le module).

---

## 3. Variables d’environnement

À mettre dans `apps/web/.env` ou `apps/web/.env.local` :

```bash
# Recherche web (optionnel)
# Si présent → Serper. Si absent → DuckDuckGo.
SERPER_API_KEY=ta_cle_serper

# Scraping : aucune variable requise

# Gateway → Floo (pour search/scrape sur WhatsApp, § 10)
# Génère une clé secrète, même valeur côté gateway et Next.js.
FLOO_GATEWAY_API_KEY=une_longue_cle_secrete
```

**Important :** Ne committe **jamais** les clés (Serper, `FLOO_GATEWAY_API_KEY`). Le fichier `.env` est ignoré par Git.

**DuckDuckGo et Scraping :** il n’y a **aucune clé** à créer.  
- DuckDuckGo = fallback gratuit (package `duck-duck-scrape`).  
- Scraping = `cheerio` + `fetch`, sans API externe.

---

## 4. Utilisation dans le code

### Recherche web

```ts
import { searchWeb } from "@/lib/search"

const results = await searchWeb("meilleurs restaurants Abidjan")
// → { results: [{ title, link, snippet }, ...], provider: "serper" | "duckduckgo" }
```

### Scraping

```ts
import { scrapeUrl } from "@/lib/scrape"

const data = await scrapeUrl("https://example.com/page")
// → { title, text, links, success }
```

### Routes API (pour appels depuis le front ou WhatsApp, etc.)

- **POST** `/api/tools/search`  
  - Body : `{ "q": "ta requête" }`  
  - Réponse : `{ results, provider }`

- **POST** `/api/tools/scrape`  
  - Body : `{ "url": "https://..." }`  
  - Réponse : `{ title, text, links, success }`

**Exemples curl** (remplace `BASE` par l’URL de ton app, ex. `http://localhost:3000`, et envoie un cookie de session NextAuth si tu protèges les routes) :

```bash
# Recherche (avec auth)
curl -X POST http://localhost:3000/api/tools/search \
  -H "Content-Type: application/json" \
  -d '{"q":"meilleurs restaurants Abidjan"}'

# Scraping (avec auth)
curl -X POST http://localhost:3000/api/tools/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Les routes exigent une session NextAuth (utilisateur connecté). Depuis le front, utilise `fetch` avec les mêmes cookies (same-origin) ou ton client API habituel.

---

## 5. Dépendances npm

À installer dans `apps/web` :

```bash
cd apps/web
npm install duck-duck-scrape cheerio
```

- `duck-duck-scrape` : fallback recherche DuckDuckGo.
- `cheerio` : parsing HTML pour le scraping.

---

## 6. Récap

| Intégration     | API / outil    | Clé requise | Où l’obtenir        |
|-----------------|----------------|------------|---------------------|
| **Recherche**   | Serper         | Oui        | [serper.dev](https://serper.dev) |
| **Recherche**   | DuckDuckGo     | **Non**    | Fallback automatique |
| **Scraping**    | Cheerio + fetch| **Non**    | Aucune              |

On commence par **recherche** (Serper ou DuckDuckGo) + **scraping** (Cheerio). Ensuite on pourra enchaîner avec email, images, etc. une par une.

---

## 7. Plateforme vs utilisateur (qui paie quoi)

**Intégrations plateforme (Floo paie, non personnelles) :**
- Recherche web (Serper ou DuckDuckGo), scraping, éventuellement recherche d’images, etc.
- Ce sont **nos** comptes / **nos** APIs. Pas celles de l’utilisateur.

**Intégrations utilisateur (leurs comptes) :**
- Gmail, WhatsApp, calendrier, etc. = ce que **l’utilisateur** connecte à Floo (OAuth, lien de compte).
- Floo utilise **leur** token pour agir en leur nom.

Pour la **recherche** et le **scraping**, tout est côté plateforme : on paie Serper si on l’utilise ; DuckDuckGo et Cheerio ne coûtent rien.

---

## 8. Qui décide d’utiliser un outil (recherche, scrape, etc.) ?

La **décision** « utiliser ou pas » vient d’un **agent** (LLM + orchestration) qui :
- analyse la demande de l’utilisateur ;
- choisit d’appeler ou non un outil (search, scrape, email, etc.) ;
- agrège les résultats et formule la réponse.

Dans ce repo, cet agent existe dans **Clawdbot** (gateway, prompts, tools comme `web_search`, `web_fetch`). Les APIs Floo (`/api/tools/search`, `/api/tools/scrape`) sont des **outils** appelables : quelqu’un doit les invoquer (l’agent Clawdbot, ou un futur orchestrateur Floo).

**Pour que Floo ait vraiment cette « intelligence » :**
- soit on **branche** l’agent Clawdbot sur nos APIs (il appelle `/api/tools/search` et `/api/tools/scrape` au lieu de / en plus de ses outils internes) ;
- soit on ajoute un **orchestrateur** dans Floo (LLM + tools) qui reçoit les messages, décide quels outils utiliser, et appelle nos APIs.

Les **outils** (search, scrape) sont prêts. La **réflexion** (analyse, décision, synthèse) est dans l’agent ; il faut s’assurer que cet agent utilise bien ces outils quand c’est pertinent.

---

## 9. Tester sur WhatsApp & actualiser

### Actualiser (redémarrer après déploiement ou config)

| Composant | Où | Commande / action |
|-----------|-----|-------------------|
| **Gateway Floo** (WhatsApp + agent) | VPS | `ssh root@38.180.244.104` puis `systemctl restart floo` |
| **Next.js** (dashboard, verify-code, search, scrape) | Local ou VPS | Redémarrer le serveur : `npm run dev` ou `npm run start` |

- Après un **déploiement** ou un changement de **config** (ex. clés API, env) : redémarrer le service concerné.
- Pour **WhatsApp** : c’est le **gateway** qui reçoit les messages. Pas besoin de “rafraîchir” WhatsApp côté app.

### Tester sur WhatsApp (avec floo_search / floo_scrape)

1. **Gateway** qui tourne : `systemctl status floo` → `active (running)`.
2. **Floo web** (Next.js) déployé et **atteignable** depuis le VPS (même machine, autre host, ou tunnel).
3. **Variables d’env gateway** : `FLOO_API_BASE_URL` + `FLOO_GATEWAY_API_KEY` (voir § 10).
4. **Variables d’env Next.js** : `FLOO_GATEWAY_API_KEY` (même valeur que le gateway).
5. **WhatsApp** lié (QR scanné). Tu envoies un message au numéro Floo (ex. « Recherche les meilleurs restaurants d’Abidjan »).
6. L’**agent** peut utiliser **floo_search** et **floo_scrape** (Serper/DuckDuckGo + Cheerio) pour répondre.

### Tester search / scrape sans WhatsApp

- **Next.js** lancé (`npm run dev` dans `apps/web`).
- Utilisateur **connecté** (session NextAuth), puis :

```bash
# Recherche
curl -X POST http://localhost:3000/api/tools/search \
  -H "Content-Type: application/json" \
  -d '{"q":"meilleurs restaurants Abidjan"}' \
  -b "ton_cookie_session_si_besoin"

# Scraping
curl -X POST http://localhost:3000/api/tools/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Ou depuis le **dashboard** / une page qui appelle ces APIs en `fetch` (avec les mêmes cookies).

---

## 10. Gateway ↔ Floo (search / scrape sur WhatsApp)

Le **gateway** (VPS) appelle les APIs Floo (**search**, **scrape**) via auth par clé. À configurer des deux côtés.

### Côté Next.js (Floo web)

Dans `apps/web/.env` (ou `.env.local`) :

```bash
# Clé partagée gateway ↔ Floo (génère une valeur secrète, même partout)
FLOO_GATEWAY_API_KEY=une_longue_cle_secrete_identique
```

- Les routes `/api/tools/search` et `/api/tools/scrape` acceptent soit une **session NextAuth**, soit l’en-tête **`X-Floo-Gateway-Key`** (ou `Authorization: Bearer <clé>`).
- Ne jamais committer cette clé.

### Côté Gateway (VPS)

Variables d’environnement pour le service Floo (systemd, ou `.env` dans le répertoire du gateway) :

```bash
# URL de base de l’app Floo (atteignable depuis le VPS)
FLOO_API_BASE_URL=https://ton-domaine.com
# Ou si Floo web tourne sur le même VPS : http://localhost:3000

# Même clé que FLOO_GATEWAY_API_KEY dans Next.js
FLOO_GATEWAY_API_KEY=une_longue_cle_secrete_identique
```

- **FLOO_API_BASE_URL** : l’app Next.js doit être **joignable depuis le VPS** (même serveur, autre host, ou tunnel type ngrok). `localhost` depuis ta machine ne marche pas pour le gateway sur le VPS.
- **FLOO_GATEWAY_API_KEY** : même valeur que dans Next.js.

**Exemple systemd** : ajouter dans `[Service]` du unit `floo.service` :

```ini
Environment="FLOO_API_BASE_URL=https://ton-domaine.com"
Environment="FLOO_GATEWAY_API_KEY=ta_cle_secrete"
```

Puis `systemctl daemon-reload` et `systemctl restart floo`.

### Redémarrer après config

1. **Next.js** : redémarrer le serveur (`npm run dev` ou process prod).
2. **Gateway** : `systemctl restart floo` sur le VPS.

### Outils ajoutés

- **floo_search** : recherche web via Floo (Serper ou DuckDuckGo). Paramètre `q`.
- **floo_scrape** : scraping d’une URL via Floo (Cheerio). Paramètre `url`.

L’agent les utilise quand c’est pertinent (ex. « recherche les meilleurs restaurants d’Abidjan » → `floo_search`).

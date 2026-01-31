# Outils Floo sur WhatsApp — déjà intégrés et checklist

**Si l’IA ne peut rien faire** (recherche, actions) : voir **[DIAGNOSTIC_IA_NE_FAIT_RIEN.md](./DIAGNOSTIC_IA_NE_FAIT_RIEN.md)** pour la chaîne complète et les deux causes réelles (env VPS + policy floo.json). **Pour tout configurer en une fois** depuis ta machine : `VPS_PASSWORD='...' ./scripts/run-floo-ready-to-test.sh`

---

## Outils déjà intégrés (gateway → Vercel)

| Outil | Rôle | API Vercel |
|-------|------|------------|
| **floo_search** | Recherche web (Serper/DuckDuckGo) — lieux, actualités, infos à jour | `POST /api/tools/search` avec `{ q }` |
| **floo_scrape** | Récupérer le contenu d’une page (titre, texte, liens) | `POST /api/tools/scrape` avec `{ url }` |

L’IA les utilise quand l’utilisateur demande une recherche, des restos, une synthèse d’URL, etc. Aucun autre outil à intégrer pour ces tâches : ils sont déjà dans le gateway (floo-api-tools) et dans la policy (group:web).

---

## Si les tâches / compétences ne fonctionnent pas

Vérifier dans l’ordre :

### 1. Gateway (VPS) — variables d’environnement

Le service `floo` doit avoir :

- **FLOO_API_BASE_URL** = URL de l’app Floo (ex. `https://floo-ecru.vercel.app`)
- **FLOO_GATEWAY_API_KEY** = **exactement la même** valeur que sur Vercel

Sans ces deux variables, les outils `floo_search` et `floo_scrape` ne sont pas créés (ils retournent `null`) et l’IA ne peut pas les appeler.

Vérifier : `systemctl show floo --property=Environment` sur le VPS.

### 2. Vercel — variable d’environnement

- **FLOO_GATEWAY_API_KEY** = même valeur que sur le VPS

Les routes `/api/tools/search` et `/api/tools/scrape` acceptent les appels du gateway uniquement si l’en-tête `X-Floo-Gateway-Key` (ou `Authorization: Bearer`) correspond à cette variable.

### 3. Policy des outils (floo.json sur le VPS)

Les outils web doivent être **autorisés** pour l’agent WhatsApp. En général :

- **tools.alsoAllow** doit contenir `group:web` (ou `floo_search` et `floo_scrape`).

Script déjà utilisé : `scripts/ensure-floo-websearch-config.mjs` (ou `setup-websearch-complete.sh`) qui ajoute `group:web` à `tools.alsoAllow`. Si tu as un profil restrictif (ex. `messaging`), sans `alsoAllow` les outils web peuvent être exclus.

Vérifier : dans `floo.json` (ou le config chargé), `tools.alsoAllow` doit inclure `group:web`.

### 4. Utilisateur lié (WhatsApp)

Depuis la mise en place du « numéro public » : seuls les utilisateurs qui ont **envoyé leur code FL-XXXX** et sont liés peuvent accéder à l’IA. Si quelqu’un écrit sans avoir envoyé son code, il reçoit le message « Pour utiliser Floo, envoie ton code de liaison… ». Donc pour tester les tâches, il faut d’abord lier le compte (dashboard → code → envoyer le code à Floo sur WhatsApp).

---

## « L’IA dit qu’elle ne peut pas effectuer de recherche »

Causes possibles : les outils **floo_search** / **floo_scrape** ne sont pas créés (env manquants sur le VPS) ou sont exclus par la policy.

1. **Sur le VPS** : vérifier que le service a bien les variables :
   - `systemctl show floo --property=Environment`
   - Doit contenir `FLOO_API_BASE_URL=https://floo-ecru.vercel.app` (ou ton URL Vercel) et `FLOO_GATEWAY_API_KEY=...`
   - Si absentes : les outils ne sont pas créés du tout ; configurer le service (voir scripts `set-gateway-vercel-env.sh` / `run-set-gateway-vercel.sh`) puis `systemctl daemon-reload && systemctl restart floo`.

2. **floo.json** : `tools.alsoAllow` doit inclure `group:web`. Exécuter si besoin : `node scripts/ensure-floo-websearch-config.mjs /home/floo/.floo/floo.json` (ou le chemin de ton floo.json), puis redémarrer le service.

3. Après toute modification : `systemctl restart floo` et retester sur WhatsApp.

---

## Récap

| Problème | Vérification |
|----------|--------------|
| L’IA ne fait pas de recherche / ne scrape pas | FLOO_API_BASE_URL + FLOO_GATEWAY_API_KEY sur VPS ; FLOO_GATEWAY_API_KEY sur Vercel ; `tools.alsoAllow` avec `group:web` |
| « Non authentifié » sur /api/tools/search ou /api/tools/scrape | Clé gateway sur Vercel = clé sur VPS (X-Floo-Gateway-Key) |
| L’IA dit qu’elle ne peut pas chercher | 1) VPS : vérifier que **FLOO_API_BASE_URL** et **FLOO_GATEWAY_API_KEY** sont bien définis (sans eux les outils ne sont pas créés). 2) Ajouter `group:web` dans `tools.alsoAllow` (floo.json). 3) Redémarrer le service `floo`. |
| Message « Envoie ton code FL-XXXX » alors que j’ai déjà lié | Vérifier que GET /api/whatsapp/verify-code?phoneNumber=+... renvoie bien success (compte lié dans Supabase) |

---

## Autres outils possibles (non intégrés par défaut)

Pour aller plus loin, tu peux ajouter d’autres outils côté gateway (nouveaux fichiers dans `src/agents/tools/`) qui appellent de nouvelles routes sur l’app (ex. résumé PDF, envoi d’email). Pour l’instant, **floo_search** et **floo_scrape** sont les seuls outils « Floo » branchés sur Vercel ; le reste (message, sessions, cron, etc.) vient du gateway existant.

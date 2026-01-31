# Outils Floo — État et prochaines intégrations

## ✅ Déjà intégrés et actifs (WhatsApp)

| Tool | Rôle | API / Backend |
|------|------|---------------|
| **floo_search** | Recherche web (Serper/DuckDuckGo) | POST /api/tools/search |
| **floo_scrape** | Scraper une URL (titre, texte, liens) | POST /api/tools/scrape |
| **floo_image_generate** | Génération d'images (Flux.2 Pro/Flex via OpenRouter) | POST /api/tools/image |
| **floo_reservation** | Recherche réservation (restaurants, hôtels) | POST /api/tools/reservation |
| **message** | Envoyer un message (réponse WhatsApp) | Gateway natif |
| **sessions_list** | Lister les sessions | Gateway natif |
| **sessions_history** | Historique d'une session | Gateway natif |
| **sessions_send** | Envoyer dans une session | Gateway natif |
| **sessions_spawn** | Créer un sous-agent | Gateway natif |
| **session_status** | Statut de session | Gateway natif |
| **memory_search** | Rechercher en mémoire | Gateway (fichiers locaux) |
| **memory_get** | Lire une entrée mémoire | Gateway (fichiers locaux) |
| **cron** | Rappels / tâches planifiées | Gateway natif |
| **web_search** | Recherche web alternative | Perplexity/OpenRouter si configuré |
| **web_fetch** | Récupérer contenu d'une URL | Gateway natif |

---

## 🚀 À intégrer en priorité

### 1. **Email** (envoyer / lire emails)
- **Utilité** : Envoyer des mails, lire la boîte de réception.
- **Backend** : Nouvelle route Vercel `POST /api/tools/email/send`, `POST /api/tools/email/read`.
- **Complexité** : Moyenne (OAuth Gmail ou SMTP).

### 2. **Calendrier** (Google Calendar)
- **Utilité** : Créer événements, lister les rendez-vous.
- **Backend** : `POST /api/tools/calendar/events` (Google Calendar API).
- **Complexité** : Moyenne (OAuth, scopes Calendar).

### 3. **Paiement / Wave / Orange Money**
- **Utilité** : Démarrer un paiement, vérifier un statut.
- **Backend** : `POST /api/tools/payment/init` (Wave API, Orange Money, etc.).
- **Complexité** : Élevée (KYC, conformité, webhooks).

### 4. ~~**Images**~~ ✅ FAIT (Flux.2 Pro + Flex via OpenRouter)

### 5. ~~**Réservation**~~ ✅ Placeholder (recherche web pour l'instant)

### 6. **Réservation avancée** (APIs dédiées)
- **Utilité** : Chercher et suggérer des réservations.
- **Backend** : Intégration type OpenTable, ou scraping ciblé.
- **Complexité** : Élevée (APIs souvent payantes ou fermées).

---

## 📋 Ordre recommandé

1. **Email** — Très demandé, impact fort.
2. **Calendrier** — Complète email pour la productivité.
3. **Images** — Bonus visuel, impact UX.
4. **Paiement** — Pour un vrai assistant pro ivoirien.
5. **Réservation** — Nice-to-have, plus complexe.

---

## 🔧 Procédure pour ajouter un nouvel outil

1. Créer la route API dans `apps/web/src/app/api/tools/<nom>/route.ts`.
2. Créer l’outil dans `src/agents/tools/<nom>-tool.ts` qui appelle l’API Floo.
3. Ajouter au groupe approprié dans `src/agents/tool-policy.ts` (ex. `group:email`).
4. Mettre à jour `ensure-floo-websearch-config.mjs` pour inclure le groupe dans `alsoAllow`.
5. Redéployer gateway et web app.

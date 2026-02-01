# Intégrations Floo — Configuration

## Variables d'environnement requises

### Vercel (apps/web)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Clé API OpenRouter (génération d'images Flux.2) |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google (intégration Gmail/Calendar) |
| `GOOGLE_CLIENT_SECRET` | Client secret OAuth Google |
| `NEXTAUTH_URL` | URL de l'app (ex: https://floo-ecru.vercel.app) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (PDF, présentation, document) — créer sur vercel.com/storage |
| `OPENAI_API_KEY` | Transcription vocale (Whisper) — obligatoire pour les messages vocaux WhatsApp |

### Base de données

Exécuter la migration pour créer la table `integrations` :

```bash
cd apps/web && pnpm prisma db push
```

---

## Génération d'images

- **Modèle principal** : `black-forest-labs/flux.2-pro`
- **Fallback** : `black-forest-labs/flux.2-flex`
- **API** : POST `/api/tools/image` avec `{ "prompt": "..." }`
- **Tool agent** : `floo_image_generate`

---

## Intégration Google (Gmail, Calendar)

1. Créer un projet dans [Google Cloud Console](https://console.cloud.google.com)
2. Activer les APIs : Gmail API, Google Calendar API
3. Créer des identifiants OAuth 2.0 (type Application Web)
4. URI de redirection autorisée : `https://floo-ecru.vercel.app/api/integrations/google/callback`
5. Configurer `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sur Vercel

---

## PDF, Présentation, Document

- **floo_pdf_generate** : POST `/api/tools/pdf` avec `{ title, content }`
- **floo_presentation** : POST `/api/tools/presentation` avec `{ title, slides: [{ title?, content }] }`
- **floo_document** : POST `/api/tools/document` avec `{ type?, title, content }` (type: letter, cv, email, general)

Les fichiers générés sont stockés sur Vercel Blob. **BLOB_READ_WRITE_TOKEN** requis : créer un store sur [vercel.com/storage](https://vercel.com/storage) et ajouter le token en variable d'environnement.

---

## QR, Résumé, Graphiques

- **floo_qr** : POST `/api/tools/qr` avec `{ data }` — texte ou URL à encoder (Blob pour l'image)
- **floo_summarize** : POST `/api/tools/summarize` avec `{ content? }` ou `{ url? }` — résumé via OpenRouter (GPT-4o-mini)
- **floo_chart** : POST `/api/tools/chart` avec `{ type, title?, labels, data }` — graphique via QuickChart.io (gratuit)

---

## Calendriers iOS / Android (à venir)

- **iOS** : CalDAV (iCloud) ou API Calendar
- **Android** : Google Calendar (même OAuth que ci-dessus)
- Une intégration CalDAV permettrait d'accéder aux calendriers Apple

---

## Autres emails (Outlook, etc.)

- **Outlook** : OAuth 2.0 Microsoft (à implémenter)
- **IMAP/SMTP** : Pour les emails génériques (à implémenter)

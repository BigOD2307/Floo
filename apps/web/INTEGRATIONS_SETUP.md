# Intégrations Floo — Configuration

## Variables d'environnement requises

### Vercel (apps/web)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Clé API OpenRouter (génération d'images Flux.2) |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google (intégration Gmail/Calendar) |
| `GOOGLE_CLIENT_SECRET` | Client secret OAuth Google |
| `NEXTAUTH_URL` | URL de l'app (ex: https://floo-ecru.vercel.app) |

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

## Calendriers iOS / Android (à venir)

- **iOS** : CalDAV (iCloud) ou API Calendar
- **Android** : Google Calendar (même OAuth que ci-dessus)
- Une intégration CalDAV permettrait d'accéder aux calendriers Apple

---

## Autres emails (Outlook, etc.)

- **Outlook** : OAuth 2.0 Microsoft (à implémenter)
- **IMAP/SMTP** : Pour les emails génériques (à implémenter)

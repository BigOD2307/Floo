# Workflow de Connexion WhatsApp - Floo

## Vue d'ensemble

Ce document décrit le workflow complet de connexion WhatsApp pour les utilisateurs Floo, depuis l'inscription jusqu'à la première conversation avec l'IA.

---

## Flux Utilisateur Complet

### 1. Inscription et Onboarding

1. **Inscription** (`/auth/signup`)
   - L'utilisateur crée un compte avec email et mot de passe
   - Un code unique est généré automatiquement (format: `FL-XXXX`)
   - Le code est stocké dans la base de données (`User.code`)

2. **Onboarding** (`/onboarding`)
   - L'utilisateur répond à 3 questions de personnalisation
   - Il entre son numéro de téléphone
   - Le numéro est formaté et sauvegardé (`User.phoneNumber`)
   - `User.onboarded` est mis à `true`
   - Redirection vers `/pricing`

3. **Pricing** (`/pricing`)
   - L'utilisateur voit les options de paiement
   - Redirection vers `/payment` pour recharger

4. **Payment** (`/payment`)
   - L'utilisateur choisit Mobile Money ou Carte Bancaire
   - Après paiement, redirection vers `/dashboard`

### 2. Dashboard Initial (Vide)

5. **Premier Accès au Dashboard** (`/dashboard`)
   - Le dashboard affiche des données **vides** pour les nouveaux utilisateurs :
     - Crédits : 50 (bonus de bienvenue)
     - Conversations : 0
     - Temps économisé : 0m
   - Un **tour guidé** s'affiche automatiquement (si pas déjà complété)
   - Pendant le tour, des données d'exemple sont affichées pour la démonstration

### 3. Connexion WhatsApp

6. **Génération du Code** (`/dashboard` → Section WhatsApp)
   - L'utilisateur clique sur "Générer mon code"
   - Le code unique est affiché (ex: `FL-1234`)
   - Option de copie automatique
   - Lien direct vers WhatsApp Floo avec le code pré-rempli

7. **Envoi du Code à Floo**
   - L'utilisateur ouvre WhatsApp
   - Il envoie son code à Floo (ex: `FL-1234`)
   - Floo reçoit le message

### 4. Vérification et Liaison (Backend Floo)

8. **Traitement du Message par Floo**
   - Le backend Floo détecte un message contenant un code (format `FL-XXXX`)
   - Il appelle l'API `/api/whatsapp/verify-code` avec :
     - `code`: Le code reçu
     - `phoneNumber`: Le numéro WhatsApp de l'expéditeur

9. **Vérification et Liaison**
   - L'API vérifie que le code existe dans la base de données
   - Elle vérifie que le numéro correspond (ou est vide)
   - Elle met à jour l'utilisateur :
     - `whatsappLinked = true`
     - `phoneNumber = numéro WhatsApp`
     - `lastActivity = maintenant`

10. **Confirmation**
    - Floo répond à l'utilisateur : "Compte lié avec succès ! Bonjour [Nom] 👋"
    - La conversation peut maintenant commencer

### 5. Conversations Suivantes

11. **Identification Automatique**
    - Pour chaque nouveau message, Floo appelle `/api/whatsapp/verify-code?phoneNumber=+225...`
    - L'API retourne les informations de l'utilisateur
    - Floo utilise ces informations pour personnaliser les réponses

12. **Utilisation Normale**
    - L'utilisateur envoie des messages à Floo
    - Floo répond en utilisant le contexte de l'utilisateur (onboarding, préférences)
    - Les crédits sont débités selon l'utilisation
    - Les sessions sont enregistrées dans la base de données

---

## APIs Créées

### POST `/api/whatsapp/verify-code`
**Description**: Vérifie un code et lie le compte WhatsApp

**Body**:
```json
{
  "code": "FL-1234",
  "phoneNumber": "+2250703894368"
}
```

**Réponse Succès**:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "code": "FL-1234",
    "phoneNumber": "+2250703894368",
    "whatsappLinked": true,
    "credits": 50
  },
  "message": "Compte WhatsApp lié avec succès"
}
```

**Réponse Erreur**:
```json
{
  "error": "Code invalide"
}
```

### GET `/api/whatsapp/verify-code?phoneNumber=+225...`
**Description**: Récupère les informations d'un utilisateur par son numéro

**Réponse Succès**:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "code": "FL-1234",
    "credits": 50,
    "onboardingData": {...},
    "lastActivity": "2026-01-29T..."
  }
}
```

### POST `/api/whatsapp/regenerate-code`
**Description**: Génère un nouveau code unique pour l'utilisateur

**Réponse**:
```json
{
  "success": true,
  "code": "FL-5678",
  "message": "Nouveau code généré avec succès"
}
```

### GET `/api/dashboard/stats`
**Description**: Récupère les statistiques du dashboard

**Réponse**:
```json
{
  "credits": 50,
  "conversations": 0,
  "timeSaved": {
    "hours": 0,
    "minutes": 0,
    "formatted": "0m"
  },
  "isNewUser": true,
  "whatsappLinked": false
}
```

---

## Intégration avec le Backend Floo

### Hook à Ajouter dans Floo

Le backend Floo doit être modifié pour :

1. **Détecter les codes dans les messages**
   - Regex: `/^FL-\d{4}$/i`
   - Quand un message correspond, appeler l'API de vérification

2. **Appeler l'API de vérification**
   ```typescript
   // Exemple dans le handler de message WhatsApp
   const codeMatch = message.body.match(/^FL-\d{4}$/i)
   if (codeMatch) {
     const code = codeMatch[0]
     const response = await fetch('http://localhost:3001/api/whatsapp/verify-code', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         code,
         phoneNumber: message.from
       })
     })
     
     if (response.ok) {
       const data = await response.json()
       // Envoyer un message de confirmation
       await sendMessage(`Compte lié avec succès ! Bonjour ${data.user.name} 👋`)
     }
   }
   ```

3. **Identifier l'utilisateur pour chaque message**
   ```typescript
   // Avant de traiter un message
   const userResponse = await fetch(`http://localhost:3001/api/whatsapp/verify-code?phoneNumber=${message.from}`)
   if (userResponse.ok) {
     const { user } = await userResponse.json()
     // Utiliser user.onboardingData pour personnaliser les réponses
     // Utiliser user.credits pour vérifier le solde
   }
   ```

---

## État du Dashboard

### Nouvel Utilisateur (isNewUser = true)
- **Crédits**: Affiche le solde réel (50 par défaut)
- **Conversations**: 0
- **Temps économisé**: 0m
- **Message d'encouragement**: "Commencez votre première conversation avec Floo !"

### Utilisateur Actif (isNewUser = false)
- **Crédits**: Solde réel
- **Conversations**: Nombre de sessions actives
- **Temps économisé**: Calculé depuis les transactions
- **Données réelles**: Toutes les statistiques sont basées sur l'utilisation réelle

### Pendant le Tour Guidé
- Les données d'exemple sont affichées pour la démonstration
- Après le tour, les vraies données (vides pour nouveaux utilisateurs) sont affichées

---

## Sécurité

1. **Codes uniques**: Chaque code est unique dans la base de données
2. **Vérification de numéro**: Un code ne peut être lié qu'à un seul numéro
3. **Expiration**: Les codes peuvent être régénérés, ce qui délie l'ancien compte
4. **Authentification**: Les APIs de régénération nécessitent une session valide

---

## Prochaines Étapes

### Intégrations à Prévoir

1. **Recherche Web**
   - Outil pour rechercher sur Google/DuckDuckGo
   - Navigation dans les résultats
   - Extraction de contenu

2. **Navigation Web**
   - Ouvrir des URLs
   - Scraper du contenu
   - Prendre des captures d'écran

3. **E-commerce**
   - Recherche de produits
   - Comparaison de prix
   - Commandes (si intégration API disponible)

4. **Calendrier et Tâches**
   - Création d'événements
   - Gestion de tâches
   - Rappels

5. **Email**
   - Envoi d'emails
   - Lecture de boîte mail
   - Gestion de contacts

6. **Documents**
   - Génération de PDF
   - Traitement de documents
   - Conversion de formats

7. **Médias**
   - Génération d'images (DALL-E, Midjourney)
   - Traitement audio/vidéo
   - Transcription

8. **APIs Externes**
   - Intégration avec services tiers
   - Webhooks
   - Automatisation

---

## Notes Techniques

- Le code est stocké en format `FL-XXXX` (4 chiffres)
- Le numéro de téléphone est toujours formaté en E.164 (`+225...`)
- Les sessions WhatsApp sont créées automatiquement lors de la première conversation
- Les crédits sont débités après chaque utilisation de l'IA
- Le dashboard se met à jour en temps réel via polling ou WebSocket (à implémenter)

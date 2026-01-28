# Configuration de la Base de Données

## 🎯 Qu'est-ce qu'une Base de Données?

La base de données va stocker:
- ✅ **Utilisateurs** (email, password, nom)
- ✅ **Codes d'accès** (code unique par user)
- ✅ **Crédits** (solde de chaque user)
- ✅ **Transactions** (historique des achats/utilisations)
- ✅ **Sessions** (conversations WhatsApp)

---

## 🔧 Options de Base de Données

### Option 1: Supabase (RECOMMANDÉ) ⭐

**Pourquoi?**
- ✅ Gratuit pour commencer (500 MB)
- ✅ PostgreSQL dans le cloud
- ✅ Configuration en 5 minutes
- ✅ Interface web jolie
- ✅ Pas besoin d'installer localement

**Comment configurer:**

1. Va sur **https://supabase.com**
2. Crée un compte gratuit
3. Clique "New Project"
4. Choisis:
   - **Name**: floo-db
   - **Password**: Choisis un mot de passe fort
   - **Region**: Europe (West) - le plus proche de la Côte d'Ivoire
5. Attends 2 minutes que le projet se créé
6. Dans "Project Settings" → "Database", copie la **Connection string**
7. Colle-la dans ton fichier `.env`:

```env
DATABASE_URL="postgresql://postgres:[TON-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

---

### Option 2: Local (PostgreSQL sur Mac)

**Pourquoi?**
- ✅ Gratuit et illimité
- ✅ Contrôle total
- ❌ Plus complexe à installer
- ❌ Seulement sur ton Mac (pas accessible depuis le VPS)

**Comment installer:**

```bash
# Installer PostgreSQL avec Homebrew
brew install postgresql@15

# Démarrer PostgreSQL
brew services start postgresql@15

# Créer la base de données
createdb floo

# Dans .env
DATABASE_URL="postgresql://localhost:5432/floo"
```

---

### Option 3: Neon (Alternative à Supabase)

**Pourquoi?**
- ✅ Gratuit (512 MB)
- ✅ PostgreSQL serverless
- ✅ Très rapide

**Comment configurer:**

1. Va sur **https://neon.tech**
2. Crée un compte
3. Crée un projet "floo-db"
4. Copie la connection string
5. Colle dans `.env`

---

## 🚀 Mon Conseil

**Utilise Supabase** car:
1. C'est le plus facile pour commencer
2. Ton app web ET ton VPS pourront y accéder
3. L'interface web te permet de voir tes données facilement
4. Gratuit jusqu'à beaucoup d'utilisateurs

---

## 📊 Après avoir la Database URL

Une fois que tu as ta `DATABASE_URL` dans le fichier `.env`:

```bash
# Crée les tables automatiquement
npm run db:push

# Ouvre l'interface pour voir tes données
npm run db:studio
```

Prisma va créer automatiquement toutes les tables dont on a besoin!

---

## ❓ Questions Fréquentes

### C'est quoi Prisma?
C'est l'outil qui:
- Crée les tables dans la base de données
- Permet de lire/écrire des données facilement
- Génère du code TypeScript automatiquement

### Je peux changer de base de données plus tard?
Oui! Il suffit de:
1. Changer la `DATABASE_URL`
2. Relancer `npm run db:push`
3. Tes données seront dans la nouvelle base

### Combien d'utilisateurs peut gérer Supabase gratuit?
- **Supabase gratuit**: ~50,000 utilisateurs
- **Neon gratuit**: ~10,000 utilisateurs
- **Local**: Illimité

---

## 🎬 Prochaines Étapes

1. Configure ta base de données (Supabase recommandé)
2. Copie la `DATABASE_URL` dans `.env`
3. Lance `npm install` puis `npm run db:push`
4. Les tables seront créées automatiquement!

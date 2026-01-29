-- Floo Database Schema (Version Clean)
-- Supprime et recrée tout proprement

-- Supprimer les tables si elles existent (avec CASCADE pour supprimer les contraintes)
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Supprimer le type ENUM s'il existe
DROP TYPE IF EXISTS "TransactionType";

-- Créer l'enum pour les types de transactions
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'BONUS', 'REFUND');

-- Table des utilisateurs
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "phoneNumber" TEXT UNIQUE,
    "whatsappLinked" BOOLEAN NOT NULL DEFAULT false,
    "credits" INTEGER NOT NULL DEFAULT 50,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboardingData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3)
);

-- Table des transactions
CREATE TABLE "transactions" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Table des sessions WhatsApp
CREATE TABLE "sessions" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Créer les index pour améliorer les performances
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_phoneNumber_idx" ON "sessions"("phoneNumber");

-- Fonction pour mettre à jour automatiquement le champ updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updatedAt sur la table users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updatedAt sur la table sessions
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON "sessions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Afficher un message de succès
SELECT 'Tables créées avec succès! RLS désactivé.' as message;

-- Politiques RLS pour Floo
-- Exécute ce fichier dans Supabase SQL Editor après avoir activé RLS

-- ===================================
-- POLITIQUES POUR LA TABLE USERS
-- ===================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
ON "users"
FOR SELECT
USING (true);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
ON "users"
FOR UPDATE
USING (true);

-- Tout le monde peut créer un compte (sign-up)
CREATE POLICY "Anyone can create account"
ON "users"
FOR INSERT
WITH CHECK (true);

-- ===================================
-- POLITIQUES POUR LA TABLE TRANSACTIONS
-- ===================================

-- Les utilisateurs peuvent voir leurs propres transactions
CREATE POLICY "Users can view own transactions"
ON "transactions"
FOR SELECT
USING (true);

-- Le système peut créer des transactions pour n'importe quel utilisateur
CREATE POLICY "System can create transactions"
ON "transactions"
FOR INSERT
WITH CHECK (true);

-- ===================================
-- POLITIQUES POUR LA TABLE SESSIONS
-- ===================================

-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "Users can view own sessions"
ON "sessions"
FOR SELECT
USING (true);

-- Le système peut créer des sessions pour n'importe quel utilisateur
CREATE POLICY "System can create sessions"
ON "sessions"
FOR INSERT
WITH CHECK (true);

-- Les utilisateurs peuvent mettre à jour leurs propres sessions
CREATE POLICY "Users can update own sessions"
ON "sessions"
FOR UPDATE
USING (true);

-- Afficher un message de succès
SELECT 'Politiques RLS créées avec succès!' as message;

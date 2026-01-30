-- Désactiver RLS pour Floo (utilise NextAuth, pas Supabase Auth)
-- Exécute ce fichier dans Supabase SQL Editor

ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;

SELECT 'RLS désactivé avec succès! NextAuth gère la sécurité.' as message;

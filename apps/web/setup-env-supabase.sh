#!/usr/bin/env bash
# Crée .env.local avec la config Supabase (DATABASE_URL, etc.).
# Usage : cd apps/web && SUPABASE_DB_PASSWORD='ton_mot_de_passe' bash setup-env-supabase.sh

set -e
cd "$(dirname "$0")"

PASSWORD="${SUPABASE_DB_PASSWORD:?Définir SUPABASE_DB_PASSWORD (ex. export SUPABASE_DB_PASSWORD='...')}"
ENV_FILE=".env.local"

# Échapper les caractères spéciaux pour l'URL si besoin
SAFE_PASSWORD=$(printf '%s' "$PASSWORD" | sed "s/'/'\\\\''/g")

cat > "$ENV_FILE" << ENVEOF
# Floo Web — config locale (Supabase)
# Ce fichier est dans .gitignore, ne sera pas commité.

DATABASE_URL="postgresql://postgres:${SAFE_PASSWORD}@db.nsvksuvdqnnukersbsoy.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="floo-dev-secret-change-in-production"
FLOO_GATEWAY_API_KEY=""
SERPER_API_KEY=""
ENVEOF

echo "✅ $ENV_FILE créé."
echo "   Vérifier la connexion : npx prisma db pull"

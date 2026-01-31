#!/usr/bin/env bash
# Configure le gateway VPS pour pointer vers https://floo-ecru.vercel.app
# Usage: VPS_PASSWORD='ton_mot_de_passe_VPS' ./scripts/run-set-gateway-floo-ecru.sh
# La clé FLOO_GATEWAY_API_KEY est lue depuis apps/web/.env (ou export FLOO_GATEWAY_API_KEY=...).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export FLOO_VERCEL_URL="${FLOO_VERCEL_URL:-https://floo-ecru.vercel.app}"

# Lire la clé depuis apps/web/.env si pas déjà définie
if [[ -z "${FLOO_GATEWAY_API_KEY:-}" ]] && [[ -f "$REPO_ROOT/apps/web/.env" ]]; then
  FLOO_GATEWAY_API_KEY=$(grep -E '^FLOO_GATEWAY_API_KEY=' "$REPO_ROOT/apps/web/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'") || true
  export FLOO_GATEWAY_API_KEY
fi

exec "$REPO_ROOT/scripts/run-set-gateway-vercel.sh"

#!/usr/bin/env bash
# Configure le VPS pour que l'IA Floo puisse enfin faire des recherches (env + floo.json).
# À lancer depuis ta machine : une seule commande, tout est fait sur le VPS.
#
# Usage:
#   VPS_PASSWORD='ton_mot_de_passe_VPS' ./scripts/run-floo-ready-to-test.sh
#
# Optionnel : VPS_HOST, VPS_USER, FLOO_VERCEL_URL, FLOO_GATEWAY_API_KEY
# (FLOO_GATEWAY_API_KEY est lue depuis apps/web/.env si pas définie)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
FLOO_VERCEL_URL="${FLOO_VERCEL_URL:-https://floo-ecru.vercel.app}"
APPS_WEB="${REPO_ROOT}/apps/web"
FLOO_JSON="${FLOO_JSON:-/home/floo/.floo/floo.json}"
FLOO_JSON_DIR="$(dirname "$FLOO_JSON")"

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD (ex. export VPS_PASSWORD=...)" >&2
  exit 1
fi

FLOO_GW_KEY="${FLOO_GATEWAY_API_KEY:-}"
if [[ -z "$FLOO_GW_KEY" ]] && [[ -f "$APPS_WEB/.env" ]]; then
  FLOO_GW_KEY=$(grep -E '^FLOO_GATEWAY_API_KEY=' "$APPS_WEB/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'") || true
fi
if [[ -z "$FLOO_GW_KEY" ]]; then
  echo "Erreur: définir FLOO_GATEWAY_API_KEY ou l'ajouter dans apps/web/.env" >&2
  exit 1
fi

export VPS_PASSWORD VPS_USER VPS_HOST FLOO_VERCEL_URL FLOO_GW_KEY REPO_ROOT FLOO_JSON FLOO_JSON_DIR

echo ">>> Copie des scripts vers le VPS..."
expect -c '
set timeout 90
set local_env [file join $env(REPO_ROOT) scripts set-gateway-vercel-env.sh]
set local_mjs [file join $env(REPO_ROOT) scripts ensure-floo-websearch-config.mjs]
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $local_env $local_mjs $env(VPS_USER)@$env(VPS_HOST):/tmp/
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ">>> Sur le VPS: floo.json (group:web) + floo.service (FLOO_API_BASE_URL, FLOO_GATEWAY_API_KEY) + redémarrage..."
expect -c '
set timeout 90
set cmd "mkdir -p $env(FLOO_JSON_DIR) && node /tmp/ensure-floo-websearch-config.mjs $env(FLOO_JSON) && FLOO_VERCEL_URL=$env(FLOO_VERCEL_URL) FLOO_GATEWAY_API_KEY=$env(FLOO_GW_KEY) bash /tmp/set-gateway-vercel-env.sh"
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) $cmd
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ""
echo "✅ VPS prêt pour les tests."
echo "   - FLOO_API_BASE_URL=$FLOO_VERCEL_URL"
echo "   - FLOO_GATEWAY_API_KEY configurée"
echo "   - floo.json: tools.alsoAllow contient group:web"
echo "   - Service floo redémarré"
echo ""
echo "   Tu peux tester sur WhatsApp (message lié avec ton code FL-XXXX puis demande une recherche)."

#!/usr/bin/env bash
# Depuis la machine locale : copie set-gateway-vercel-env.sh sur le VPS et l’exécute
# avec l’URL Vercel et la clé FLOO_GATEWAY_API_KEY.
# Env: VPS_PASSWORD (requis), FLOO_VERCEL_URL (requis), FLOO_GATEWAY_API_KEY (requis ou apps/web/.env).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
APPS_WEB="${REPO_ROOT}/apps/web"

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD (ex. export VPS_PASSWORD=...)" >&2
  exit 1
fi

FLOO_VERCEL_URL="${FLOO_VERCEL_URL:-}"
if [[ -z "$FLOO_VERCEL_URL" ]]; then
  echo "Erreur: définir FLOO_VERCEL_URL (ex. export FLOO_VERCEL_URL=https://ton-projet.vercel.app)" >&2
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

export VPS_PASSWORD VPS_USER VPS_HOST FLOO_VERCEL_URL FLOO_GW_KEY REPO_ROOT

echo ">>> Copie set-gateway-vercel-env.sh -> VPS"
expect -c '
set timeout 90
set local_path [file join $env(REPO_ROOT) scripts set-gateway-vercel-env.sh]
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $local_path $env(VPS_USER)@$env(VPS_HOST):/tmp/
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ">>> Exécution sur VPS: FLOO_VERCEL_URL=... FLOO_GATEWAY_API_KEY=... set-gateway-vercel-env.sh"
expect -c '
set timeout 90
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) "FLOO_VERCEL_URL=$env(FLOO_VERCEL_URL) FLOO_GATEWAY_API_KEY=$env(FLOO_GW_KEY) bash /tmp/set-gateway-vercel-env.sh"
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo "Gateway (floo.service) configuré vers Vercel: FLOO_API_BASE_URL=$FLOO_VERCEL_URL"

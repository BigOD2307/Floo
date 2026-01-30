#!/usr/bin/env bash
# Depuis la machine locale: copie configure-floo-gateway-env.sh sur le VPS et l'exécute
# avec la clé FLOO_GATEWAY_API_KEY (lue depuis apps/web/.env ou env).
# Env: VPS_HOST (def 38.180.244.104), VPS_USER (def root), VPS_PASSWORD (requis).
# Optionnel: FLOO_GATEWAY_API_KEY (sinon lu depuis apps/web/.env).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
APPS_WEB="${REPO_ROOT}/apps/web"

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

export VPS_PASSWORD VPS_USER VPS_HOST FLOO_GW_KEY REPO_ROOT

echo ">>> Copie configure-floo-gateway-env.sh -> VPS"
expect -c '
set timeout 90
set local_path [file join $env(REPO_ROOT) scripts configure-floo-gateway-env.sh]
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $local_path $env(VPS_USER)@$env(VPS_HOST):/tmp/
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ">>> Exécution sur VPS: configure-floo-gateway-env.sh <FLOO_GATEWAY_API_KEY>"
expect -c '
set timeout 90
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) "bash /tmp/configure-floo-gateway-env.sh $env(FLOO_GW_KEY)"
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo "Gateway (floo.service) configuré avec FLOO_API_BASE_URL et FLOO_GATEWAY_API_KEY."

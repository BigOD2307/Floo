#!/usr/bin/env bash
# Configure tout pour que la recherche web Floo marche (gateway + app web sur VPS).
# Env: VPS_PASSWORD, optionnel VPS_HOST, VPS_USER.
# Génère FLOO_GATEWAY_API_KEY si besoin, met à jour floo.service + floo-web .env, redémarre.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
APPS_WEB="${REPO_ROOT}/apps/web"
SSH_E="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD (ex. export VPS_PASSWORD=...)" >&2
  exit 1
fi

# Clé: .env local > env > générée
FLOO_GW_KEY="${FLOO_GATEWAY_API_KEY:-}"
if [[ -z "$FLOO_GW_KEY" ]] && [[ -f "$APPS_WEB/.env" ]]; then
  FLOO_GW_KEY=$(grep -E '^FLOO_GATEWAY_API_KEY=' "$APPS_WEB/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'") || true
fi
if [[ -z "$FLOO_GW_KEY" ]]; then
  FLOO_GW_KEY=$(openssl rand -hex 24)
  echo ">>> Génération FLOO_GATEWAY_API_KEY"
fi

# Mettre à jour apps/web/.env (ajout ou remplacement)
mkdir -p "$APPS_WEB"
if [[ -f "$APPS_WEB/.env" ]]; then
  if grep -q '^FLOO_GATEWAY_API_KEY=' "$APPS_WEB/.env" 2>/dev/null; then
    tmp="$(mktemp)"
    grep -v '^FLOO_GATEWAY_API_KEY=' "$APPS_WEB/.env" > "$tmp"
    echo "FLOO_GATEWAY_API_KEY=$FLOO_GW_KEY" >> "$tmp"
    mv "$tmp" "$APPS_WEB/.env"
  else
    echo "FLOO_GATEWAY_API_KEY=$FLOO_GW_KEY" >> "$APPS_WEB/.env"
  fi
else
  echo "FLOO_GATEWAY_API_KEY=$FLOO_GW_KEY" > "$APPS_WEB/.env"
fi
echo ">>> FLOO_GATEWAY_API_KEY dans apps/web/.env"

# Script distant: floo.json (group:web) + patcher floo.service + floo-web .env, redémarrer
SVC=/etc/systemd/system/floo.service
WEB_ENV=/home/floo/floo-web/.env
FLOO_JSON=/home/floo/.floo/floo.json
REMOTE_SH="set -e
export PATH=/usr/local/bin:/usr/bin:/bin:\$PATH
KEY='$(echo "$FLOO_GW_KEY" | sed "s/'/'\\\\''/g")'
# floo.json: group:web pour recherche
mkdir -p /home/floo/.floo
if command -v node >/dev/null 2>&1 && [[ -f /tmp/ensure-floo-websearch-config.mjs ]]; then
  node /tmp/ensure-floo-websearch-config.mjs $FLOO_JSON
  chown -R floo:floo /home/floo/.floo
  echo 'floo.json group:web ok'
fi
# floo.service: retirer anciennes lignes FLOO_*, ajouter après dernière ligne Environment=
if [[ -f $SVC ]]; then
  sed -i '/^Environment=FLOO_API_BASE_URL=/d' $SVC
  sed -i '/^Environment=FLOO_GATEWAY_API_KEY=/d' $SVC
  last_env=\$(grep -n '^Environment=' $SVC | tail -1 | cut -d: -f1)
  if [[ -n \"\$last_env\" ]]; then
    sed -i \"\${last_env}a Environment=FLOO_API_BASE_URL=http://127.0.0.1:3000\" $SVC
    sed -i \"\$((last_env+1))a Environment=FLOO_GATEWAY_API_KEY=\$KEY\" $SVC
  else
    sed -i \"/^\[Service\]\$/a Environment=FLOO_API_BASE_URL=http://127.0.0.1:3000\" $SVC
    sed -i \"/^Environment=FLOO_API_BASE_URL=/a Environment=FLOO_GATEWAY_API_KEY=\$KEY\" $SVC
  fi
  systemctl daemon-reload
  systemctl restart floo
  echo 'floo.service mis à jour, floo redémarré'
fi
# floo-web .env
if [[ -f $WEB_ENV ]]; then
  grep -v '^FLOO_GATEWAY_API_KEY=' $WEB_ENV > ${WEB_ENV}.tmp || true
  echo \"FLOO_GATEWAY_API_KEY=\$KEY\" >> ${WEB_ENV}.tmp
  mv ${WEB_ENV}.tmp $WEB_ENV
  chown floo:floo $WEB_ENV
  systemctl restart floo-web 2>/dev/null || true
  echo 'floo-web .env mis à jour, floo-web redémarré'
else
  echo 'Pas de $WEB_ENV, skip'
fi
"

TMP_SH="$(mktemp)"
trap 'rm -f "$TMP_SH"' EXIT
printf '%s' "$REMOTE_SH" > "$TMP_SH"
MJS_PATH="${REPO_ROOT}/scripts/ensure-floo-websearch-config.mjs"
export TMP_SH MJS_PATH VPS_PASSWORD VPS_USER VPS_HOST

echo ">>> Copie scripts -> VPS"
expect -c '
set timeout 120
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(TMP_SH) $env(VPS_USER)@$env(VPS_HOST):/tmp/setup-websearch-remote.sh
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(MJS_PATH) $env(VPS_USER)@$env(VPS_HOST):/tmp/ensure-floo-websearch-config.mjs
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'
echo ">>> Exécution sur VPS: floo.json + floo.service + floo-web .env"
expect -c '
set timeout 120
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) "bash /tmp/setup-websearch-remote.sh"
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ""
echo "✅ Recherche web: gateway + app web configurés (FLOO_GATEWAY_API_KEY)."
echo "   Tester: curl -s -X POST https://floo.digital/api/tools/search -H 'Content-Type: application/json' -H 'X-Floo-Gateway-Key: <clé>' -d '{\"q\":\"test\"}'"

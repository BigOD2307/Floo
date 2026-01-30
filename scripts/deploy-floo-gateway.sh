#!/usr/bin/env bash
# Déploie le gateway Floo (code monorepo) sur le VPS.
# Env: VPS_HOST (def 38.180.244.104), VPS_USER (def root), VPS_PASSWORD (requis).
# Ne jamais committer VPS_PASSWORD.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
REMOTE_DIR="/home/floo/floo"
SSH_E="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD (ex. export VPS_PASSWORD=...)" >&2
  exit 1
fi

export VPS_PASSWORD VPS_USER VPS_HOST REMOTE_DIR SSH_E REPO_ROOT

echo ">>> Build local (build:gateway) pour produire dist/"
(cd "$REPO_ROOT" && pnpm run build:gateway) || true

echo ">>> Rsync dépôt -> ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"
expect -c '
set timeout 300
set rsync_cmd "rsync -avz -e \"$env(SSH_E)\" \
  --exclude node_modules --exclude .next --exclude vendor \
  --exclude .git --exclude apps/web/.next --exclude apps/web/node_modules \
  --exclude apps/web/.env --exclude apps/web/.env.local \
  --exclude \"*.db\" --exclude \"*.db-*\" \
  \"$env(REPO_ROOT)/\" $env(VPS_USER)@$env(VPS_HOST):$env(REMOTE_DIR)/"
eval spawn $rsync_cmd
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0 && $rc != 23} { exit $rc } }
  timeout { exit 1 }
}
'

REMOTE_SH='set -e
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
export CI=true
command -v node >/dev/null 2>&1 || { curl -fsSL https://deb.nodesource.com/setup_22.x | bash -; apt-get install -y nodejs; }
command -v pnpm >/dev/null 2>&1 || npm install -g pnpm
chown -R floo:floo /home/floo/floo
sudo -u floo bash -c "cd /home/floo/floo && CI=true pnpm install --ignore-scripts"
systemctl restart floo
sleep 2
systemctl status floo --no-pager
echo "Gateway Floo redémarré."
'

echo ">>> Build distant et redémarrage du service floo"
TMP_SH=$(mktemp)
trap 'rm -f "$TMP_SH"' EXIT
printf '%s' "$REMOTE_SH" > "$TMP_SH"
export TMP_SH

expect -c '
set timeout 600
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(TMP_SH) $env(VPS_USER)@$env(VPS_HOST):/tmp/deploy-floo-gateway-remote.sh
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

expect -c '
set timeout 600
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) bash /tmp/deploy-floo-gateway-remote.sh
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ""
echo "Gateway déployé. Vérifier que FLOO_API_BASE_URL et FLOO_GATEWAY_API_KEY sont configurés (scripts/configure-floo-gateway-env.sh)."
echo "Tester WhatsApp: envoyer le code FL-XXXX à Floo puis un message."

#!/usr/bin/env bash
# Déploie apps/web (Next.js) sur le VPS Floo.
# Env: VPS_HOST (def 38.180.244.104), VPS_USER (def root), VPS_PASSWORD (requis).
# Ne jamais committer VPS_PASSWORD.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPS_WEB="${REPO_ROOT}/apps/web"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
REMOTE_DIR="/home/floo/floo-web"
SSH_E="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD (ex. export VPS_PASSWORD=...)" >&2
  exit 1
fi

[[ ! -d "$APPS_WEB" ]] && { echo "Erreur: $APPS_WEB introuvable" >&2; exit 1; }

NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -hex 32)}"
FLOO_GATEWAY_KEY="${FLOO_GATEWAY_API_KEY:-$(openssl rand -hex 24)}"
SERPER_KEY=""
[[ -f "$APPS_WEB/.env" ]] && SERPER_KEY=$(grep -E '^SERPER_API_KEY=' "$APPS_WEB/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'") || true

export VPS_PASSWORD VPS_USER VPS_HOST REMOTE_DIR APPS_WEB SSH_E
export NEXTAUTH_SECRET FLOO_GATEWAY_KEY SERPER_KEY

echo ">>> Rsync apps/web -> ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"
expect -c '
set timeout 180
set rsync_cmd "rsync -avz --delete -e \"$env(SSH_E)\" --exclude node_modules --exclude .next --exclude .env --exclude .env.local --exclude prisma/*.db* \"$env(APPS_WEB)/\" $env(VPS_USER)@$env(VPS_HOST):$env(REMOTE_DIR)/"
eval spawn $rsync_cmd
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

TMP_ENV=$(mktemp)
trap 'rm -f "$TMP_ENV"' EXIT
printf 'DATABASE_URL="file:./prisma/prod.db"\nNEXTAUTH_URL="http://38.180.244.104:3000"\nNEXTAUTH_SECRET="%s"\nSERPER_API_KEY="%s"\nFLOO_GATEWAY_API_KEY="%s"\n' \
  "$NEXTAUTH_SECRET" "$SERPER_KEY" "$FLOO_GATEWAY_KEY" > "$TMP_ENV"

echo ">>> Copie .env -> serveur"
export TMP_ENV
expect -c '
set timeout 60
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(TMP_ENV) $env(VPS_USER)@$env(VPS_HOST):$env(REMOTE_DIR)/.env
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

REMOTE_SH='set -e
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
cd /home/floo/floo-web
command -v node >/dev/null 2>&1 || { curl -fsSL https://deb.nodesource.com/setup_22.x | bash -; apt-get install -y nodejs; }
npm ci 2>/dev/null || npm install
npx prisma generate
npm run build
npx prisma db push --accept-data-loss 2>/dev/null || true
chown -R floo:floo /home/floo/floo-web
cat > /etc/systemd/system/floo-web.service << "SVCEOF"
[Unit]
Description=Floo Web (Next.js)
After=network.target

[Service]
Type=simple
User=floo
WorkingDirectory=/home/floo/floo-web
ExecStart=/usr/bin/npx next start -H 0.0.0.0 -p 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF
systemctl daemon-reload
systemctl enable floo-web
systemctl restart floo-web
sleep 2
systemctl status floo-web --no-pager
echo "Floo Web: http://38.180.244.104:3000"
'

echo ">>> Setup distant (install, build, systemd)"
TMP_SH=$(mktemp)
trap 'rm -f "$TMP_ENV" "$TMP_SH"' EXIT
printf '%s' "$REMOTE_SH" > "$TMP_SH"
export TMP_SH

expect -c '
set timeout 600
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(TMP_SH) $env(VPS_USER)@$env(VPS_HOST):/tmp/floo-web-setup.sh
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

expect -c '
set timeout 600
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) bash /tmp/floo-web-setup.sh
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ""
echo "FLOO_GATEWAY_API_KEY (même valeur pour gateway): $FLOO_GATEWAY_KEY"
echo "Ajouter au service floo (gateway):"
echo "  Environment=FLOO_API_BASE_URL=http://127.0.0.1:3000"
echo "  Environment=FLOO_GATEWAY_API_KEY=..."
echo "Puis: systemctl daemon-reload && systemctl restart floo"
echo "Floo Web: http://38.180.244.104:3000"

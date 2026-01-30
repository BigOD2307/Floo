#!/usr/bin/env bash
# Ouvre le firewall (80, 443, 3000), configure nginx+SSL pour floo.digital, redémarre les services.
# Env: VPS_PASSWORD (requis), VPS_HOST (def 38.180.244.104), VPS_USER (def root).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
DOMAIN="floo.digital"
EMAIL="${CERTBOT_EMAIL:-admin@floo.digital}"

[[ -f "$REPO_ROOT/.env.vps" ]] && set -a && source "$REPO_ROOT/.env.vps" && set +a
if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: VPS_PASSWORD requis (export ou .env.vps)" >&2
  exit 1
fi

export VPS_PASSWORD VPS_USER VPS_HOST REPO_ROOT DOMAIN EMAIL

REMOTE_SH='set -e
echo ">>> 1. Firewall (ufw)..."
command -v ufw >/dev/null 2>&1 || apt-get update && apt-get install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable || true
ufw status numbered 2>/dev/null | head -20

echo ""
echo ">>> 2. Nginx + floo.digital..."
if ! command -v nginx >/dev/null 2>&1 || ! grep -q "server_name floo.digital" /etc/nginx/sites-enabled/* 2>/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y nginx certbot python3-certbot-nginx
  cd /home/floo/floo && bash scripts/setup-nginx-domain.sh floo.digital '"$EMAIL"'
else
  nginx -t 2>/dev/null && systemctl reload nginx || true
fi

echo ""
echo ">>> 2b. SSL (Certbot) pour floo.digital..."
if ! grep -q "listen 443" /etc/nginx/sites-enabled/* 2>/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  command -v certbot >/dev/null 2>&1 || (apt-get update && apt-get install -y certbot python3-certbot-nginx)
  certbot --nginx -d floo.digital --non-interactive --agree-tos --email '"$EMAIL"' --redirect || true
  nginx -t && systemctl reload nginx
else
  echo "SSL déjà configuré."
fi

echo ""
echo ">>> 3. NEXTAUTH_URL dans floo-web .env..."
ENV_FILE="/home/floo/floo-web/.env"
if [[ -f "$ENV_FILE" ]]; then
  if grep -q "^NEXTAUTH_URL=" "$ENV_FILE"; then
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=https://floo.digital|" "$ENV_FILE"
  else
    echo "NEXTAUTH_URL=https://floo.digital" >> "$ENV_FILE"
  fi
  echo "NEXTAUTH_URL=https://floo.digital ok"
fi

echo ""
echo ">>> 4. Redémarrage nginx + floo-web..."
systemctl restart nginx
systemctl restart floo-web
sleep 2
systemctl is-active nginx floo-web
echo ""
echo ">>> 5. Ports en écoute..."
ss -tlnp | grep -E ":80 |:443 |:3000 " || true
echo ""
echo ">>> Done."
'

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
printf '%s' "$REMOTE_SH" > "$TMP"
export TMP

expect -c '
set timeout 600
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(TMP) $env(VPS_USER)@$env(VPS_HOST):/tmp/fix-floo-digital-remote.sh
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

expect -c '
set timeout 600
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) "bash /tmp/fix-floo-digital-remote.sh"
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ""
echo "✅ Firewall + nginx + floo.digital configurés."
echo "   → https://floo.digital"
echo "   → http://$VPS_HOST:3000 (direct)"
echo ""
echo "Si floo.digital ne répond toujours pas, vérifie les DNS (A @ → $VPS_HOST) et réessaie après quelques minutes."

#!/usr/bin/env bash
# Configure nginx pour servir Floo Web sur un domaine
# Usage: ./scripts/setup-nginx-domain.sh <domain> [email]
# Exemple: ./scripts/setup-nginx-domain.sh floo.example.com admin@example.com

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN}}"

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain> [email]" >&2
  echo "Exemple: $0 floo.example.com admin@example.com" >&2
  exit 1
fi

echo ">>> Installation nginx et certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

echo ">>> Configuration nginx pour $DOMAIN..."
cat > "/etc/nginx/sites-available/floo" << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/floo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo ">>> Configuration SSL avec Let's Encrypt..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect

echo ">>> Mise à jour de NEXTAUTH_URL dans floo-web.service..."
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|" /etc/systemd/system/floo-web.service 2>/dev/null || true
systemctl daemon-reload
systemctl restart floo-web

echo ""
echo "✅ Configuration terminée!"
echo "Floo Web est accessible sur: https://$DOMAIN"
echo ""
echo "⚠️  N'oublie pas de mettre à jour:"
echo "  - NEXTAUTH_URL dans apps/web/.env sur le VPS"
echo "  - FLOO_API_BASE_URL dans floo.service (si besoin)"

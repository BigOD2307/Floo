#!/usr/bin/env bash
# À exécuter sur le VPS. Met à jour FLOO_API_BASE_URL et FLOO_GATEWAY_API_KEY
# dans floo.service (remplace les lignes existantes ou les ajoute).
# Usage: FLOO_VERCEL_URL=https://... FLOO_GATEWAY_API_KEY=... ./set-gateway-vercel-env.sh
#    ou: ./set-gateway-vercel-env.sh <URL_VERCEL> <API_KEY>

set -euo pipefail

URL="${FLOO_VERCEL_URL:-${1:-}}"
KEY="${FLOO_GATEWAY_API_KEY:-${2:-}}"
if [[ -z "$URL" ]] || [[ -z "$KEY" ]]; then
  echo "Usage: $0 <FLOO_VERCEL_URL> <FLOO_GATEWAY_API_KEY>" >&2
  echo "   ou: FLOO_VERCEL_URL=... FLOO_GATEWAY_API_KEY=... $0" >&2
  exit 1
fi

SVC=/etc/systemd/system/floo.service
if [[ ! -f "$SVC" ]]; then
  echo "Fichier $SVC introuvable." >&2
  exit 1
fi

# Supprimer les anciennes lignes si présentes
sed -i '/^Environment=FLOO_API_BASE_URL=/d' "$SVC"
sed -i '/^Environment=FLOO_GATEWAY_API_KEY=/d' "$SVC"

# Insérer après NODE_ENV=production (ou après [Service])
if grep -q 'Environment=NODE_ENV=production' "$SVC"; then
  sed -i "/^Environment=NODE_ENV=production$/a Environment=FLOO_API_BASE_URL=$URL" "$SVC"
  sed -i "/^Environment=FLOO_API_BASE_URL=/a Environment=FLOO_GATEWAY_API_KEY=$KEY" "$SVC"
else
  sed -i "/^\[Service\]$/a Environment=FLOO_API_BASE_URL=$URL" "$SVC"
  sed -i "/^Environment=FLOO_API_BASE_URL=/a Environment=FLOO_GATEWAY_API_KEY=$KEY" "$SVC"
fi

systemctl daemon-reload
systemctl restart floo
sleep 2
systemctl status floo --no-pager

echo "Gateway configuré: FLOO_API_BASE_URL=$URL"

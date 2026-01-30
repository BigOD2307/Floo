#!/bin/bash
# À exécuter sur le VPS. Ajoute FLOO_API_BASE_URL et FLOO_GATEWAY_API_KEY au service floo.
set -e
FLOO_GW_KEY="${1:-}"
[[ -z "$FLOO_GW_KEY" ]] && { echo "Usage: $0 <FLOO_GATEWAY_API_KEY>"; exit 1; }

SVC=/etc/systemd/system/floo.service
grep -q FLOO_API_BASE_URL "$SVC" 2>/dev/null && { echo "FLOO_* déjà présents"; systemctl restart floo; exit 0; }
# Insérer après Environment=NODE_ENV=production (GNU sed)
sed -i "/^Environment=NODE_ENV=production$/a Environment=FLOO_API_BASE_URL=http://127.0.0.1:3000" "$SVC"
sed -i "/^Environment=FLOO_API_BASE_URL=/a Environment=FLOO_GATEWAY_API_KEY=$FLOO_GW_KEY" "$SVC"
systemctl daemon-reload
systemctl restart floo
sleep 2
systemctl status floo --no-pager

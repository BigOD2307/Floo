#!/usr/bin/env bash
# Tout faire pour pouvoir tester Floo (recherche web sur WhatsApp).
# 1. Déployer le gateway sur le VPS
# 2. Configurer recherche web (floo.json group:web, floo.service, floo-web .env)
# 3. Vérifier la config
#
# Env: VPS_PASSWORD (requis), optionnel VPS_HOST, VPS_USER.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
[[ -f "$REPO_ROOT/.env.vps" ]] && set -a && source "$REPO_ROOT/.env.vps" && set +a

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD (ex. export VPS_PASSWORD=... ou créer .env.vps avec VPS_PASSWORD=...)" >&2
  echo "Puis relancer: ./scripts/ready-to-test.sh" >&2
  exit 1
fi

export VPS_PASSWORD VPS_HOST

echo "=== 1/3 Déploiement gateway sur VPS ==="
"$REPO_ROOT/scripts/deploy-floo-gateway.sh"

echo ""
echo "=== 2/3 Config recherche web (floo.json, floo.service, floo-web) ==="
"$REPO_ROOT/scripts/setup-websearch-complete.sh"

echo ""
echo "=== 3/3 Vérification ==="
"$REPO_ROOT/scripts/verify-websearch-ready.sh" "$VPS_HOST" "${VPS_USER:-root}" 2>/dev/null || true

echo ""
echo "✅ Prêt à tester."
echo "   → Envoie un message à Floo sur WhatsApp (ex: « Cherche les meilleurs restaurants Abidjan garba pas cher »)."
echo "   → Dashboard: https://floo.digital ou http://${VPS_HOST}:3000"

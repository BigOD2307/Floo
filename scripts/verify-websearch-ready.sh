#!/usr/bin/env bash
# Vérifie que la recherche web Floo peut fonctionner (env gateway + config + API).
# Usage: ./scripts/verify-websearch-ready.sh [VPS_HOST] [VPS_USER]
# En local: vérifie ~/.floo/floo.json (tools.sandbox.tools.allow + group:web).
# Si VPS_HOST fourni: SSH pour vérifier floo.service env + /home/floo/.floo/floo.json.

set -euo pipefail

VPS_HOST="${1:-}"
VPS_USER="${2:-root}"
FLOO_JSON_LOCAL="${HOME}/.floo/floo.json"

check_local() {
  echo ">>> Local: $FLOO_JSON_LOCAL"
  if [[ ! -f "$FLOO_JSON_LOCAL" ]]; then
    echo "    Missing floo.json"
    return 1
  fi
  local allow
  allow="$(FLOO_JSON="$FLOO_JSON_LOCAL" node -e "
    const fs = require('fs');
    const p = process.env.FLOO_JSON;
    if (!p) process.exit(1);
    try {
      const c = JSON.parse(fs.readFileSync(p, 'utf8'));
      const a = c?.tools?.sandbox?.tools?.allow || [];
      console.log(JSON.stringify(a));
    } catch { console.log('[]'); }
  " 2>/dev/null)"
  if [[ "$allow" == *"group:web"* ]]; then
    echo "    tools.sandbox.tools.allow includes group:web ✓"
  else
    echo "    tools.sandbox.tools.allow missing group:web. Run: node scripts/ensure-floo-websearch-config.mjs $FLOO_JSON_LOCAL"
    return 1
  fi
  return 0
}

check_vps() {
  echo ">>> VPS: $VPS_USER@$VPS_HOST"
  local env line
  env="$(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=5 \
    "$VPS_USER@$VPS_HOST" "systemctl show floo --property=Environment --no-pager 2>/dev/null" 2>/dev/null)" || true
  if [[ -z "${env:-}" ]] || [[ "$env" == *"Permission denied"* ]] || [[ "$env" == *"Could not resolve"* ]]; then
    echo "    VPS check skipped (SSH key auth or connect). Si deploy/setup OK, tu peux tester."
    return 0
  fi
  if [[ "$env" == *"FLOO_API_BASE_URL"* ]]; then
    echo "    floo.service has FLOO_API_BASE_URL ✓"
  else
    echo "    floo.service missing FLOO_API_BASE_URL. Run scripts/run-configure-gateway-env.sh"
    return 1
  fi
  if [[ "$env" == *"FLOO_GATEWAY_API_KEY"* ]]; then
    echo "    floo.service has FLOO_GATEWAY_API_KEY ✓"
  else
    echo "    floo.service missing FLOO_GATEWAY_API_KEY. Run scripts/run-configure-gateway-env.sh"
    return 1
  fi
  local allow
  allow="$(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_HOST" \
    "cat /home/floo/.floo/floo.json 2>/dev/null | node -e \"
      const d = require('fs').readFileSync(0, 'utf8');
      try {
        const c = JSON.parse(d);
        const a = c?.tools?.sandbox?.tools?.allow || [];
        console.log(JSON.stringify(a));
      } catch { console.log('[]'); }
    \"" 2>/dev/null || echo "[]")"
  if [[ "$allow" == *"group:web"* ]]; then
    echo "    /home/floo/.floo/floo.json tools.sandbox.tools.allow includes group:web ✓"
  else
    echo "    /home/floo/.floo/floo.json missing group:web. Run scripts/run-integrate-skills-on-vps.sh"
    return 1
  fi
  return 0
}

ok=0
check_local || ok=1
if [[ -n "$VPS_HOST" ]]; then
  check_vps || ok=1
fi

if [[ $ok -eq 0 ]]; then
  echo ""
  echo "✅ Web search config OK. Si ça ne marche toujours pas:"
  echo "   - Next.js .env doit avoir FLOO_GATEWAY_API_KEY (même valeur que gateway)."
  echo "   - Tester: curl -X POST https://floo.digital/api/tools/search -H 'Content-Type: application/json' -H 'X-Floo-Gateway-Key: <TA_CLE>' -d '{\"q\":\"test\"}'"
else
  echo ""
  echo "⚠️  Corriger les éléments ci‑dessus puis relancer."
  exit 1
fi

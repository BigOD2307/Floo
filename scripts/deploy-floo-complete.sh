#!/usr/bin/env bash
# Deploiement complet de Floo: commit + push + mise à jour VPS + config env
#
# Ce script:
# 1. Commit les changements locaux (si présents)
# 2. Push vers GitHub
# 3. Pull sur le VPS
# 4. Rebuild sur le VPS
# 5. Configure FLOO_API_BASE_URL et FLOO_GATEWAY_API_KEY
# 6. Configure floo.json avec group:web
# 7. Redémarre le service floo
#
# Usage:
#   VPS_PASSWORD='ton_mot_de_passe_VPS' ./scripts/deploy-floo-complete.sh
#
# Variables optionnelles:
#   VPS_HOST (défaut: 38.180.244.104)
#   VPS_USER (défaut: root)
#   FLOO_VERCEL_URL (défaut: https://floo-ecru.vercel.app)
#   FLOO_GATEWAY_API_KEY (lue depuis apps/web/.env si pas définie)
#   VPS_FLOO_DIR (défaut: /root/floo)
#   SKIP_GIT (défaut: false) - mettre à 1 pour skip git commit/push

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
FLOO_VERCEL_URL="${FLOO_VERCEL_URL:-https://floo-ecru.vercel.app}"
APPS_WEB="${REPO_ROOT}/apps/web"
FLOO_JSON="${FLOO_JSON:-/home/floo/.floo/floo.json}"
FLOO_JSON_DIR="$(dirname "$FLOO_JSON")"
VPS_FLOO_DIR="${VPS_FLOO_DIR:-/root/floo}"
SKIP_GIT="${SKIP_GIT:-}"

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD (ex. export VPS_PASSWORD=...)" >&2
  exit 1
fi

# Lire la clé depuis apps/web/.env si pas définie
FLOO_GW_KEY="${FLOO_GATEWAY_API_KEY:-}"
if [[ -z "$FLOO_GW_KEY" ]] && [[ -f "$APPS_WEB/.env" ]]; then
  FLOO_GW_KEY=$(grep -E '^FLOO_GATEWAY_API_KEY=' "$APPS_WEB/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'") || true
fi
if [[ -z "$FLOO_GW_KEY" ]]; then
  echo "Erreur: définir FLOO_GATEWAY_API_KEY ou l'ajouter dans apps/web/.env" >&2
  exit 1
fi

export VPS_PASSWORD VPS_USER VPS_HOST FLOO_VERCEL_URL FLOO_GW_KEY REPO_ROOT FLOO_JSON FLOO_JSON_DIR VPS_FLOO_DIR

cd "$REPO_ROOT"

# ========== ÉTAPE 1: Git commit + push (local) ==========
if [[ -z "$SKIP_GIT" ]]; then
  echo ""
  echo "=========================================="
  echo "ÉTAPE 1: Commit et push des changements"
  echo "=========================================="

  if [[ -n "$(git status --porcelain)" ]]; then
    echo ">>> Changements détectés, commit en cours..."
    git add -A
    git commit -m "fix(floo): regex code utilisateur + exiger compte lié

- Regex du code: FL-XXXX ou 6 caractères alphanumériques uniquement
- Exiger que l'utilisateur soit lié avant d'accéder à l'IA
- Ne plus matcher 'bonjour', 'test', etc. comme des codes

Co-Authored-By: Claude <noreply@anthropic.com>"
    echo ">>> Push vers GitHub..."
    git push origin main
  else
    echo ">>> Pas de changements locaux à commit."
    echo ">>> Vérification que la branche est à jour avec origin..."
    git fetch origin main
    if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
      echo ">>> Push des commits locaux..."
      git push origin main
    fi
  fi
else
  echo ">>> SKIP_GIT=1 - git commit/push ignoré"
fi

# ========== ÉTAPE 2: Copie des scripts vers VPS ==========
echo ""
echo "=========================================="
echo "ÉTAPE 2: Copie des scripts vers le VPS"
echo "=========================================="
expect -c '
set timeout 90
set local_env [file join $env(REPO_ROOT) scripts set-gateway-vercel-env.sh]
set local_mjs [file join $env(REPO_ROOT) scripts ensure-floo-websearch-config.mjs]
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $local_env $local_mjs $env(VPS_USER)@$env(VPS_HOST):/tmp/
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

# ========== ÉTAPE 3: Pull + build sur VPS ==========
echo ""
echo "=========================================="
echo "ÉTAPE 3: Pull et rebuild sur le VPS"
echo "=========================================="
expect -c '
set timeout 300
set cmd "cd $env(VPS_FLOO_DIR) && git pull origin main && pnpm install && pnpm build"
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) $cmd
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

# ========== ÉTAPE 4: Config floo.json + env + restart ==========
echo ""
echo "=========================================="
echo "ÉTAPE 4: Configuration env + floo.json + restart"
echo "=========================================="
expect -c '
set timeout 90
set cmd "mkdir -p $env(FLOO_JSON_DIR) && node /tmp/ensure-floo-websearch-config.mjs $env(FLOO_JSON) && FLOO_VERCEL_URL=$env(FLOO_VERCEL_URL) FLOO_GATEWAY_API_KEY=$env(FLOO_GW_KEY) bash /tmp/set-gateway-vercel-env.sh"
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) $cmd
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

# ========== ÉTAPE 5: Vérification ==========
echo ""
echo "=========================================="
echo "ÉTAPE 5: Vérification du service"
echo "=========================================="
expect -c '
set timeout 30
set cmd "systemctl status floo --no-pager | head -20 && echo && echo '=== Derniers logs ===' && journalctl -u floo -n 10 --no-pager"
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) $cmd
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { }
  timeout { }
}
'

echo ""
echo "=========================================="
echo "DÉPLOIEMENT TERMINÉ"
echo "=========================================="
echo ""
echo "Configuration appliquée:"
echo "  - FLOO_API_BASE_URL = $FLOO_VERCEL_URL"
echo "  - FLOO_GATEWAY_API_KEY = configurée"
echo "  - floo.json: tools.alsoAllow contient group:web"
echo "  - Service floo redémarré"
echo ""
echo "PROCHAINES ÉTAPES:"
echo "  1. Vérifie que Vercel a SERPER_API_KEY et FLOO_GATEWAY_API_KEY"
echo "     → https://vercel.com/dashboard → ton projet → Settings → Environment Variables"
echo ""
echo "  2. Teste sur WhatsApp:"
echo "     - Envoie ton code FL-XXXX pour lier ton compte"
echo "     - Demande: 'Quels sont les meilleurs restaurants à Abidjan?'"
echo ""

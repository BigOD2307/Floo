#!/usr/bin/env bash
# Intègre les skills antfu/skills + VoltAgent awesome-moltbot-skills (via moltbot/skills).
# Usage: ./scripts/integrate-external-skills.sh [ROOT_DIR]
#   ROOT_DIR = dossier de travail (défaut: .skills-external à la racine du repo).
# Crée ROOT/antfu-skills, ROOT/moltbot-skills, ROOT/moltbot-flat, met à jour ~/.floo/floo.json.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${1:-$REPO_ROOT/.skills-external}"
mkdir -p "$ROOT"
ROOT="$(cd "$ROOT" && pwd)"

echo ">>> Skills root: $ROOT"

# --- antfu/skills ---
ANTFU_DIR="$ROOT/antfu-skills"
if [[ ! -d "$ANTFU_DIR/.git" ]]; then
  echo ">>> Clone antfu/skills..."
  rm -rf "$ANTFU_DIR"
  git clone --depth 1 https://github.com/antfu/skills.git "$ANTFU_DIR"
fi
ANTFU_SKILLS="$ANTFU_DIR/skills"
[[ -d "$ANTFU_SKILLS" ]] || { echo "Erreur: $ANTFU_SKILLS introuvable"; exit 1; }
echo ">>> antfu skills: $ANTFU_SKILLS"

# --- moltbot/skills ---
MOLT_DIR="$ROOT/moltbot-skills"
if [[ ! -d "$MOLT_DIR/.git" ]]; then
  echo ">>> Clone moltbot/skills..."
  rm -rf "$MOLT_DIR"
  git clone --depth 1 https://github.com/moltbot/skills.git "$MOLT_DIR"
fi
MOLT_SKILLS="$MOLT_DIR/skills"
[[ -d "$MOLT_SKILLS" ]] || { echo "Erreur: $MOLT_SKILLS introuvable"; exit 1; }

# --- flat moltbot (owner/slug -> slug) ---
FLAT="$ROOT/moltbot-flat"
rm -rf "$FLAT"
mkdir -p "$FLAT"
echo ">>> Build moltbot flat..."
n=0
while IFS= read -r -d '' f; do
  skill_dir="$(cd "$(dirname "$f")" && pwd)"
  slug="$(basename "$skill_dir")"
  t="$FLAT/$slug"
  if [[ ! -e "$t" ]]; then
    ln -sf "$skill_dir" "$t"
    (( n++ )) || true
  fi
done < <(find "$MOLT_SKILLS" -name "SKILL.md" -print0 2>/dev/null)
echo ">>> moltbot-flat: $FLAT ($n skills)"

EXTRA_DIRS=("$ANTFU_SKILLS" "$FLAT")

# --- update ~/.floo/floo.json ---
FLOO_JSON="${FLOO_CONFIG_PATH:-}"
[[ -z "$FLOO_JSON" ]] && FLOO_JSON="${FLOO_STATE_DIR:-$HOME/.floo}/floo.json"
if [[ -f "$FLOO_JSON" ]]; then
  echo ">>> Update $FLOO_JSON (skills.load.extraDirs)..."
else
  echo ">>> Création $FLOO_JSON avec skills.load.extraDirs..."
fi
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/update-floo-config-extra-dirs.mjs" "$FLOO_JSON" "${EXTRA_DIRS[@]}"
node "$SCRIPT_DIR/ensure-floo-websearch-config.mjs" "$FLOO_JSON"

echo ""
echo "✅ Intégration terminée."
echo "   antfu:    $ANTFU_SKILLS"
echo "   moltbot:  $FLAT"
echo "   config:   $FLOO_JSON"
echo "   Redémarre le gateway pour charger les skills."

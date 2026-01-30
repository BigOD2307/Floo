#!/usr/bin/env bash
# Lance integrate-external-skills sur le VPS (antfu + moltbot), met à jour ~/.floo et redémarre floo.
# Env: VPS_HOST, VPS_USER, VPS_PASSWORD.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-38.180.244.104}"
VPS_USER="${VPS_USER:-root}"
SSH_E="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
SKILLS_ROOT="/home/floo/skills-external"
FLOO_JSON="/home/floo/.floo/floo.json"

if [[ -z "${VPS_PASSWORD:-}" ]]; then
  echo "Erreur: définir VPS_PASSWORD" >&2
  exit 1
fi

export VPS_PASSWORD VPS_USER VPS_HOST REPO_ROOT SSH_E

echo ">>> Copie scripts -> VPS"
expect -c '
set timeout 60
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  "$env(REPO_ROOT)/scripts/integrate-external-skills.sh" \
  "$env(REPO_ROOT)/scripts/update-floo-config-extra-dirs.mjs" \
  "$env(REPO_ROOT)/scripts/ensure-floo-websearch-config.mjs" \
  $env(VPS_USER)@$env(VPS_HOST):/tmp/
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

REMOTE_SH='set -e
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH
mkdir -p /home/floo/skills-external /home/floo/.floo
FLOO_STATE_DIR=/home/floo/.floo bash /tmp/integrate-external-skills.sh /home/floo/skills-external
chown -R floo:floo /home/floo/skills-external /home/floo/.floo
systemctl restart floo
sleep 2
systemctl status floo --no-pager
echo ""
echo "Skills intégrés. extraDirs dans /home/floo/.floo/floo.json"
'

TMP_SH="$(mktemp)"
trap 'rm -f "$TMP_SH"' EXIT
printf '%s' "$REMOTE_SH" > "$TMP_SH"
export TMP_SH

expect -c '
set timeout 600
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(TMP_SH) $env(VPS_USER)@$env(VPS_HOST):/tmp/run-integrate-remote.sh
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

expect -c '
set timeout 600
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $env(VPS_USER)@$env(VPS_HOST) "bash /tmp/run-integrate-remote.sh"
expect {
  -re "password:|Password:" { send "$env(VPS_PASSWORD)\r"; exp_continue }
  eof { catch wait r; set rc [lindex $r 3]; if {$rc != 0} { exit $rc } }
  timeout { exit 1 }
}
'

echo ""
echo "✅ Skills intégrés sur le VPS. Gateway redémarré."

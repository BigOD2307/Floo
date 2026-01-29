#!/bin/bash
# Script pour changer le provider par défaut d'Anthropic à OpenAI

set -e

echo "🔧 Modification du provider par défaut..."

# En tant que floo
su - floo << 'EOFLOO'
cd ~/floo

# Modification du fichier defaults.ts
cat > src/agents/defaults.ts << 'EOFDEFAULTS'
// Defaults for agent metadata when upstream does not supply them.
// Model id uses OpenAI by default for Floo
export const DEFAULT_PROVIDER = "openai";
export const DEFAULT_MODEL = "gpt-4o-mini";
// Context window: GPT-4o-mini supports 128k tokens
export const DEFAULT_CONTEXT_TOKENS = 128_000;
EOFDEFAULTS

echo "✅ Fichier modifié!"
echo "🔨 Rebuild du projet..."

# Rebuild
pnpm build

echo "✅ Build terminé!"
EOFLOO

# Redémarrage du service
echo "🔄 Redémarrage de Floo..."
systemctl restart floo
sleep 5

echo ""
echo "✅ TERMINÉ!"
echo "📱 Envoie maintenant un message WhatsApp pour tester!"

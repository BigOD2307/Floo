#!/bin/bash
# Script de configuration complète OpenAI pour Floo

set -e

echo "🔧 Configuration complète d'OpenAI pour Floo..."

# Configuration en tant que floo
su - floo << 'EOFLOO'
cd ~/floo

# Configuration OpenAI via models auth
echo "📝 Configuration de l'authentification OpenAI..."
pnpm clawdbot models auth --provider openai --mode api_key --api-key "YOUR_OPENAI_API_KEY_HERE" --profile openai-main

# Configuration du modèle par défaut
echo "📝 Configuration du modèle par défaut..."
pnpm clawdbot config set agents.defaults.model "openai/gpt-4o-mini"

# Création du répertoire agent si nécessaire
mkdir -p ~/.floo/agents/main/agent

# Copie du fichier auth vers l'agent
if [ -f ~/.floo/auth-profiles.json ]; then
    echo "📋 Copie de la configuration auth vers l'agent..."
    cp ~/.floo/auth-profiles.json ~/.floo/agents/main/agent/auth-profiles.json
fi

echo "✅ Configuration OpenAI terminée!"
EOFLOO

# Redémarrage du service
echo "🔄 Redémarrage de Floo..."
systemctl restart floo
sleep 5

# Vérification
systemctl status floo --no-pager | head -20

echo ""
echo "✅ Configuration terminée!"
echo "📱 Envoie maintenant un message WhatsApp pour tester!"

#!/bin/bash
# Configuration de la clé API OpenAI pour Floo

su - floo << 'ENDSU'
cd ~/floo

# Configuration avec clé OpenAI
cat > ~/.floo/floo.json << 'EOFCONFIG'
{
  "auth": {
    "profiles": {
      "openai-main": {
        "provider": "openai",
        "mode": "api_key",
        "apiKey": "YOUR_OPENAI_API_KEY_HERE"
      }
    },
    "order": {
      "openai": ["openai-main"]
    }
  },
  "agent": {
    "defaultModel": "openai/gpt-4o-mini",
    "contextTokens": 128000
  },
  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "lan",
    "auth": {
      "token": "floo-secure-token-2026"
    }
  },
  "plugins": {
    "entries": {
      "whatsapp": {
        "enabled": true
      }
    }
  },
  "channels": {
    "whatsapp": {
      "enabled": true,
      "dmPolicy": "open",
      "accounts": {
        "default": {
          "enabled": true,
          "allowFrom": ["*"]
        }
      }
    }
  },
  "identity": {
    "name": "Floo",
    "timezone": "Africa/Abidjan"
  },
  "messages": {
    "ackReaction": true,
    "ackReactionEmoji": "eyes"
  }
}
EOFCONFIG

echo "✅ Configuration OpenAI ajoutée!"
echo "📍 Config: ~/.floo/floo.json"
ENDSU

echo "🚀 Prêt à démarrer Floo!"

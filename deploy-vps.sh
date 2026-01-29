#!/bin/bash
# Script de déploiement automatique de Floo sur VPS
# Usage: bash deploy-vps.sh

set -e

echo "🚀 Déploiement de Floo sur VPS..."

# Variables
VPS_IP="38.180.244.104"
VPS_USER="root"
VPS_PASSWORD="EEQ6nsbirN"
REPO_URL="https://github.com/BigOD2307/Floo.git"

echo "📦 Installation de sshpass pour automatiser SSH..."
if ! command -v sshpass &> /dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass
    fi
fi

echo "🔌 Connexion au VPS et déploiement..."

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" << 'ENDSSH'
set -e

echo "📦 Mise à jour du système..."
apt update && apt upgrade -y

echo "📦 Installation de Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git build-essential

echo "📦 Installation de pnpm..."
npm install -g pnpm

echo "👤 Création de l'utilisateur floo..."
if ! id "floo" &>/dev/null; then
    useradd -m -s /bin/bash floo
    echo "floo:FlooSecure2026!" | chpasswd
    usermod -aG sudo floo
fi

echo "📥 Clone du projet Floo..."
su - floo << 'ENDSU'
cd ~
if [ -d "floo" ]; then
    rm -rf floo
fi
git clone https://github.com/BigOD2307/Floo.git floo
cd floo

echo "📦 Installation des dépendances..."
pnpm install

echo "🔨 Build du projet..."
pnpm build

echo "🔧 Activation du plugin WhatsApp..."
pnpm clawdbot plugins enable whatsapp

echo "📝 Création de la configuration..."
mkdir -p ~/.floo
if [ ! -f ~/.floo/floo.json ]; then
    cat > ~/.floo/floo.json << 'EOF'
{
  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "lan"
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
      "dmPolicy": "open"
    }
  }
}
EOF
fi

echo "🎉 Installation terminée!"
echo "📍 Floo est installé dans: /home/floo/floo"
ENDSU

echo "🔧 Configuration du service systemd..."
cat > /etc/systemd/system/floo.service << 'EOF'
[Unit]
Description=Floo AI Assistant Gateway
After=network.target

[Service]
Type=simple
User=floo
WorkingDirectory=/home/floo/floo
ExecStart=/usr/bin/node dist/entry.js gateway run --bind lan --port 18789
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable floo

echo "✅ Déploiement terminé!"
echo "Pour démarrer Floo: systemctl start floo"
echo "Pour voir les logs: journalctl -u floo -f"

ENDSSH

echo "🎉 Déploiement terminé avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Connecte-toi au VPS: ssh root@38.180.244.104"
echo "2. Configure ta clé API Anthropic"
echo "3. Scanne le QR WhatsApp"
echo ""

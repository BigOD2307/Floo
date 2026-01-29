#!/bin/bash
# Script d'installation Floo sur VPS
# À exécuter directement sur le serveur VPS

set -e

echo "🚀 Installation de Floo..."

# Mise à jour système
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y

# Installation Node.js 22
echo "📦 Installation de Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git build-essential

# Installation pnpm
echo "📦 Installation de pnpm..."
npm install -g pnpm

# Vérification
node --version
pnpm --version

# Création utilisateur floo
echo "👤 Création de l'utilisateur floo..."
if ! id "floo" &>/dev/null; then
    useradd -m -s /bin/bash floo
    echo "floo:FlooSecure2026!" | chpasswd
    usermod -aG sudo floo
    echo "✅ Utilisateur floo créé!"
else
    echo "ℹ️  Utilisateur floo existe déjà"
fi

# Installation Floo en tant que floo
echo "📥 Installation de Floo..."
sudo -u floo bash << 'EOF'
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
cat > ~/.floo/floo.json << 'EOFCONFIG'
{
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
          "enabled": true
        }
      }
    }
  },
  "identity": {
    "name": "Floo",
    "timezone": "Africa/Abidjan"
  }
}
EOFCONFIG

echo "✅ Configuration créée!"
EOF

# Service systemd
echo "🔧 Configuration du service systemd..."
cat > /etc/systemd/system/floo.service << 'EOFSVC'
[Unit]
Description=Floo AI Assistant Gateway
After=network.target

[Service]
Type=simple
User=floo
WorkingDirectory=/home/floo/floo
ExecStart=/usr/bin/node dist/entry.js gateway run --bind lan --port 18789 --force
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSVC

# Activation du service
systemctl daemon-reload
systemctl enable floo

# Configuration du pare-feu
echo "🔥 Configuration du pare-feu..."
ufw allow 18789/tcp || true
ufw allow 22/tcp || true
ufw --force enable || true

echo ""
echo "🎉 Installation terminée avec succès!"
echo ""
echo "📋 Commandes utiles:"
echo "  Démarrer Floo:     systemctl start floo"
echo "  Arrêter Floo:      systemctl stop floo"
echo "  Statut Floo:       systemctl status floo"
echo "  Logs Floo:         journalctl -u floo -f"
echo ""
echo "🔐 Pour scanner WhatsApp QR code:"
echo "  1. Connecte-toi en tant que floo: su - floo"
echo "  2. Va dans le dossier: cd ~/floo"
echo "  3. Lance: pnpm clawdbot channels login --channel whatsapp"
echo ""
echo "📍 Configuration: /home/floo/.floo/floo.json"
echo "📂 Projet: /home/floo/floo"
echo ""

#!/bin/bash
# Installation finale de Floo depuis GitHub public

su - floo << 'ENDSU'
# Nettoyage
rm -rf ~/floo

# Clone du repo public
echo "📥 Clone du repo GitHub..."
git clone https://github.com/BigOD2307/Floo.git floo
cd floo

# Installation des dépendances
echo "📦 Installation des dépendances..."
pnpm install

# Build du projet
echo "🔨 Build du projet..."
pnpm build

# Activation WhatsApp
echo "🔧 Activation du plugin WhatsApp..."
pnpm clawdbot plugins enable whatsapp

echo ""
echo "✅ Installation terminée!"
echo "📱 Pour scanner le QR WhatsApp:"
echo "   pnpm clawdbot channels login --channel whatsapp"
ENDSU

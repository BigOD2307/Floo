#!/bin/bash
# Script de correction du service Floo

set -e

echo "🛠️ Correction du service Floo..."

# Arrêt du service
systemctl stop floo 2>/dev/null || true

# Création du fichier service corrigé avec token
cat > /etc/systemd/system/floo.service << 'EOFSVC'
[Unit]
Description=Floo AI Assistant Gateway
After=network.target

[Service]
Type=simple
User=floo
WorkingDirectory=/home/floo/floo
ExecStart=/usr/bin/node dist/entry.js gateway run --bind lan --port 18789 --token floo-secure-token-2026
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSVC

# Rechargement systemd
systemctl daemon-reload

# Démarrage du service
systemctl start floo

# Attente de 5 secondes
sleep 5

# Vérification du statut
echo ""
echo "✅ Service corrigé et démarré!"
echo ""
systemctl status floo --no-pager -l

echo ""
echo "🌐 Accès au dashboard: http://38.180.244.104:18789"
echo "📱 WhatsApp est prêt à recevoir des messages"
echo ""
echo "Pour voir les logs en direct: journalctl -u floo -f"

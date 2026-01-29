# 🚀 GUIDE DE DÉPLOIEMENT FLOO - COPIE-COLLE DIRECT

## Étape 1: Ouvre ton Terminal sur Mac
Appuie sur `Cmd + Espace`, tape "Terminal", appuie sur Entrée.

## Étape 2: Copie-colle cette SEULE commande

```bash
ssh root@38.180.244.104 << 'ENDSSH'
# Mise à jour système
apt update && apt upgrade -y

# Installation Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git build-essential

# Installation pnpm
npm install -g pnpm

# Création utilisateur floo
useradd -m -s /bin/bash floo 2>/dev/null || true
echo "floo:FlooSecure2026!" | chpasswd
usermod -aG sudo floo

# Déploiement en tant que floo
su - floo << 'ENDSU'
cd ~
rm -rf floo 2>/dev/null || true
git clone https://github.com/BigOD2307/Floo.git floo
cd floo
pnpm install
pnpm build
pnpm clawdbot plugins enable whatsapp

# Configuration
mkdir -p ~/.floo
cat > ~/.floo/floo.json << 'EOFCONFIG'
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
EOFCONFIG

echo "✅ Installation terminée!"
ENDSU

# Service systemd
cat > /etc/systemd/system/floo.service << 'EOFSVC'
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
EOFSVC

systemctl daemon-reload
systemctl enable floo

echo "🎉 Floo est installé!"
echo "Pour démarrer: systemctl start floo"
ENDSSH
```

Quand il te demande le mot de passe, tape: `EEQ6nsbirN`

---

## C'EST TOUT!

Une fois que cette commande est terminée, Floo sera installé sur ton VPS.

## Pour tester:
```bash
ssh root@38.180.244.104
systemctl start floo
systemctl status floo
```

Mot de passe: `EEQ6nsbirN`

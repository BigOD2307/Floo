# 🚀 DÉMARRAGE FINAL DE FLOO - GUIDE COMPLET

## Étape 1: Ouvre ton Terminal sur Mac

1. Appuie sur **Cmd + Espace** (la touche pomme + barre d'espace)
2. Tape: **Terminal**
3. Appuie sur **Entrée**

Une fenêtre noire/blanche s'ouvre, c'est le terminal.

---

## Étape 2: Connecte-toi au VPS

Dans le terminal, copie-colle cette commande et appuie sur Entrée:

```bash
ssh root@38.180.244.104
```

Il va te demander un mot de passe. Tape: **EEQ6nsbirN** (tu ne verras pas les caractères s'afficher, c'est normal)

Appuie sur Entrée.

Tu devrais voir quelque chose comme:
```
root@a65266045:~#
```

C'est bon, tu es connecté au serveur!

---

## Étape 3: Lance Floo (COMMANDE UNIQUE)

Copie-colle cette **SEULE ET UNIQUE** commande:

```bash
bash << 'ENDFIX'
systemctl stop floo 2>/dev/null || true
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
systemctl daemon-reload
systemctl start floo
sleep 3
systemctl status floo --no-pager
echo ""
echo "✅ Floo est démarré!"
echo "🌐 Dashboard: http://38.180.244.104:18789"
echo "📱 Envoie un message WhatsApp pour tester!"
ENDFIX
```

Appuie sur **Entrée** et attends 5-10 secondes.

---

## Étape 4: Que vas-tu voir?

Tu devrais voir quelque chose comme:

```
● floo.service - Floo AI Assistant Gateway
   Loaded: loaded
   Active: active (running)
   ...
```

Si tu vois **"Active: active (running)"** en VERT, c'est BON! ✅

---

## Étape 5: Test WhatsApp

1. Prends ton téléphone
2. Ouvre WhatsApp
3. Envoie un message au numéro que tu as scanné avec le QR code
4. Floo devrait te répondre! 🎉

---

## Étape 6: Accès au Dashboard Web

Ouvre ton navigateur et va sur:
**http://38.180.244.104:18789**

Tu verras le dashboard de Floo.

---

## 🆘 En cas de problème

Si tu vois **"Active: failed"** en ROUGE:

Lance cette commande pour voir les logs:
```bash
journalctl -u floo -n 100 --no-pager
```

Envoie-moi les 20 dernières lignes.

---

## ✅ C'EST TOUT!

Une fois que tu vois "active (running)", Floo est opérationnel!

Tu peux te déconnecter du VPS en tapant:
```bash
exit
```

---

## 📋 Résumé des accès

- **VPS IP**: 38.180.244.104
- **Dashboard**: http://38.180.244.104:18789
- **Token**: floo-secure-token-2026
- **WhatsApp**: Lié à ton numéro scanné
- **Domaine à configurer**: floo.digital (prochaine étape)

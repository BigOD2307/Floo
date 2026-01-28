# 🌿 Floo — Assistant IA Personnel

<p align="center">
  <strong>Ton assistant IA personnel. Made in Africa.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

**Floo** est un assistant IA personnel accessible via **WhatsApp**. Concu pour les professionnels africains, il te permet d'automatiser tes taches quotidiennes directement depuis ta messagerie preferee.

## Fonctionnalites

- **WhatsApp natif** - Envoie un message, recois une reponse IA
- **Systeme de credits** - Pay-as-you-go, 50 credits offerts
- **Contexte africain** - FCFA, Mobile Money, fuseaux horaires africains
- **Francais par defaut** - Interface et reponses en francais

## Installation

**Prerequis:** Node.js 22+

```bash
# Cloner le projet
git clone https://github.com/dickenai/floo.git
cd floo

# Installer les dependances
npm install

# Build
npm run build

# Lancer l'assistant de configuration
npm run floo -- onboard
```

## Demarrage rapide

```bash
# 1. Connecter WhatsApp
npm run floo -- channels login --channel whatsapp

# 2. Lancer le serveur
npm run floo -- gateway run

# 3. Envoie un message WhatsApp au numero connecte!
```

## Commandes CLI

```bash
floo onboard              # Assistant de configuration
floo gateway run          # Lancer le serveur
floo channels login       # Connecter WhatsApp
floo channels status      # Voir le statut
floo update               # Mettre a jour
floo doctor               # Diagnostic
```

## Systeme de credits

| Action | Credits |
|--------|---------|
| Question simple | 1 |
| Traduction | 2 |
| Email professionnel | 3 |
| Resume document | 5-10 |

**Tarifs de recharge:**
- 100 credits = 500 FCFA
- 500 credits = 2000 FCFA
- 1000 credits = 3500 FCFA

## Configuration

Le fichier de configuration se trouve dans `~/.clawdbot/clawdbot.json` (sera renomme `~/.floo/floo.json` prochainement).

```json
{
  "gateway": {
    "mode": "local"
  },
  "plugins": {
    "entries": {
      "whatsapp": {
        "enabled": true
      }
    }
  }
}
```

## Deploiement VPS

```bash
# Sur le VPS (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cloner et configurer
git clone https://github.com/dickenai/floo.git
cd floo
npm install && npm run build

# Lancer en arriere-plan
nohup npm run floo -- gateway run --port 18789 > /tmp/floo.log 2>&1 &
```

## Stack technique

- **Runtime:** Node.js 22+
- **Language:** TypeScript
- **WhatsApp:** Baileys (WhatsApp Web)
- **IA:** OpenAI GPT-4o / Claude

## Contribuer

Les contributions sont bienvenues! Ouvre une issue ou une PR.

## Licence

MIT License - Voir [LICENSE](LICENSE)

---

**Floo** - Fait avec ❤️ en Cote d'Ivoire 🇨🇮

Contact: [@dickenai](https://twitter.com/dickenai)

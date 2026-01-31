# 🔧 Fix Floo WhatsApp - Problèmes identifiés et solutions

## 📋 Problèmes identifiés

### Problème 1: Recherche web ne fonctionne pas
**Cause**: Les outils `floo_search` et `floo_scrape` ne sont pas actifs car les variables d'environnement ne sont pas configurées sur le VPS.

### Problème 2: Code utilisateur (FL-XXXX) ne fonctionne pas
**Cause 1**: La regex était trop permissive (matchait tous les mots de 4-8 caractères) → **CORRIGÉ**
**Cause 2**: `FLOO_API_BASE_URL` n'est pas configuré sur le VPS

### Problème 3: L'IA dit "Je ne peux pas effectuer de recherche"
**Cause**: Les outils de recherche ne sont pas chargés car les variables d'environnement manquent.

---

## ✅ Corrections appliquées

### 1. Regex du code utilisateur (process-message.ts)
- Avant: `/^[A-Za-z0-9]{4,8}$/i` (matchait "bonjour", "test", etc.)
- Après: `/^FL-[A-Z0-9]{4}$/i` ou `/^[A-Z2-9]{6}$/i` (format exact)

---

## 🚀 Actions à faire

### Étape 1: Configurer Vercel (si pas déjà fait)

Sur le dashboard Vercel (https://vercel.com/dashboard), va dans ton projet `floo-ecru` → Settings → Environment Variables:

```
SERPER_API_KEY = 76895fbe5b6256773dc6eae266d6492717b759fb
FLOO_GATEWAY_API_KEY = a21b9b1b5fa9ff5d71cc3842851494658cf2bf0abb50c5e4
```

**IMPORTANT**: Ces variables DOIVENT être définies pour que la recherche fonctionne!

### Étape 2: Redéployer sur Vercel

Après avoir ajouté les variables, redéploie l'app sur Vercel pour qu'elles prennent effet.

### Étape 3: Déployer tout automatiquement (RECOMMANDÉ)

**Script tout-en-un** qui fait: commit → push → pull VPS → build → config env → restart
```bash
cd "/Users/ousmanedicko/Desktop/Dicken AI/AI Product/Floo"
export VPS_PASSWORD="ton_mot_de_passe_VPS"
./scripts/deploy-floo-complete.sh
```

Ce script:
1. Commit et push les changements locaux vers GitHub
2. Pull sur le VPS et rebuild
3. Configure `FLOO_API_BASE_URL` et `FLOO_GATEWAY_API_KEY` dans le service systemd
4. Configure `floo.json` avec `tools.alsoAllow: ["group:web"]`
5. Redémarre le service floo

---

### Alternative: Configuration manuelle du VPS

**Option A: Via le script de config uniquement** (depuis ton Mac)
```bash
cd "/Users/ousmanedicko/Desktop/Dicken AI/AI Product/Floo"
export VPS_PASSWORD="ton_mot_de_passe_VPS"
./scripts/run-floo-ready-to-test.sh
```

**Option B: Manuellement sur le VPS** (via SSH)
```bash
ssh root@38.180.244.104

# Éditer le service systemd
sudo nano /etc/systemd/system/floo.service

# Ajouter ces lignes dans la section [Service] (après Environment=NODE_ENV=production):
Environment=FLOO_API_BASE_URL=https://floo-ecru.vercel.app
Environment=FLOO_GATEWAY_API_KEY=a21b9b1b5fa9ff5d71cc3842851494658cf2bf0abb50c5e4

# Sauvegarder (Ctrl+X, Y, Enter)

# Recharger et redémarrer
sudo systemctl daemon-reload
sudo systemctl restart floo
sudo systemctl status floo
```

### Étape 4: Mettre à jour le code sur le VPS (si fait manuellement)

```bash
ssh root@38.180.244.104
cd /root/floo   # ou /path/to/floo selon ton installation
git pull origin main
pnpm install
pnpm build
sudo systemctl restart floo
```

### Étape 5: Vérifier que tout fonctionne

1. Envoie un message WhatsApp à Floo: "Quels sont les meilleurs restaurants à Abidjan?"
2. Floo devrait maintenant utiliser `floo_search` et te donner des résultats réels
3. Envoie ton code (FL-XXXX ou code 6 caractères) pour lier ton compte

---

## 🔍 Comment vérifier la configuration

### Sur le VPS
```bash
# Voir les variables d'environnement du service
grep -E "FLOO_API|FLOO_GATEWAY" /etc/systemd/system/floo.service

# Vérifier les logs du gateway
journalctl -u floo -n 50 --no-pager
```

### Sur Vercel
- Va dans Project Settings → Environment Variables
- Vérifie que `SERPER_API_KEY` et `FLOO_GATEWAY_API_KEY` sont définis

---

## 📊 Résumé des variables d'environnement

| Variable | Où | Valeur |
|----------|-----|--------|
| `SERPER_API_KEY` | Vercel | `76895fbe5b6256773dc6eae266d6492717b759fb` |
| `FLOO_GATEWAY_API_KEY` | Vercel + VPS | `a21b9b1b5fa9ff5d71cc3842851494658cf2bf0abb50c5e4` |
| `FLOO_API_BASE_URL` | VPS seulement | `https://floo-ecru.vercel.app` |

---

## 🎯 Ce qui devrait fonctionner après ces corrections

1. ✅ Recherche web via Floo (restaurants, actualités, etc.)
2. ✅ Scraping de pages web
3. ✅ Liaison du compte WhatsApp via code FL-XXXX
4. ✅ Vérification des utilisateurs liés
5. ✅ L'IA ne dira plus "Je ne peux pas effectuer de recherche"

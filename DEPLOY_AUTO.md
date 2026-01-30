# 🚀 Déploiement Automatique Floo (GitHub Actions)

## Configuration Initiale

### 1. Ajouter le secret GitHub

1. Va sur https://github.com/BigOD2307/Floo/settings/secrets/actions
2. Clique sur **"New repository secret"**
3. Nom : `VPS_PASSWORD`
4. Valeur : `EEQ6nsbirN`
5. Clique sur **"Add secret"**

### 2. Comment ça marche

Dès que tu **push sur `main`**, GitHub Actions va automatiquement :
- ✅ Build l'app web (Next.js)
- ✅ Build le gateway
- ✅ Déployer sur le VPS
- ✅ Redémarrer les services

**Plus besoin de lancer les scripts manuellement !**

---

## Configuration du Domaine

**Pour floo.digital (Hostinger)** → voir **[DOMAIN_FLOO_DIGITAL.md](DOMAIN_FLOO_DIGITAL.md)**.

### Résumé rapide (tout domaine)

1. **DNS** : Ajoute un enregistrement **A** pointant vers `38.180.244.104` (nom `@` pour la racine, ou `www`).
2. **VPS** : `ssh root@38.180.244.104` puis :
   ```bash
   cd /home/floo/floo && git pull && bash scripts/setup-nginx-domain.sh ton-domaine.com ton-email@example.com
   ```
3. **NEXTAUTH_URL** : Dans `/home/floo/floo-web/.env` mets `NEXTAUTH_URL=https://ton-domaine.com`, puis `systemctl restart floo-web`.

---

## Vérification

### App Web
- ✅ https://ton-domaine.com → doit afficher la page Floo

### Gateway
- ✅ `systemctl status floo` → doit être `active (running)`

### WhatsApp
- ✅ Envoie ton code (ex. `FL-1234`) → doit répondre "Compte lié avec succès !"

---

## Troubleshooting

### Le déploiement GitHub échoue
- Vérifie que le secret `VPS_PASSWORD` est bien configuré
- Regarde les logs dans l'onglet "Actions" de GitHub

### Le domaine ne fonctionne pas
- Vérifie les DNS (ping ton-domaine.com doit retourner 38.180.244.104)
- Vérifie nginx : `systemctl status nginx`
- Vérifie les logs : `journalctl -u nginx -n 50`

### WhatsApp ne répond pas
- Vérifie le gateway : `journalctl -u floo -f`
- Vérifie que `FLOO_API_BASE_URL` est dans `/etc/systemd/system/floo.service`
- Teste l'API : `curl http://127.0.0.1:3000/api/tools/search -X POST -H "Content-Type: application/json" -d '{"q":"test"}'`

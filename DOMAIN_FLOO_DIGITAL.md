# 🌐 Configurer floo.digital (Hostinger)

Guide pour pointer **floo.digital** vers ton VPS et activer HTTPS.

---

## Étape 1 : DNS sur Hostinger

1. Connecte-toi à **https://hpanel.hostinger.com**
2. Va dans **Domaines** → clique sur **floo.digital**
3. Ouvre **DNS / Nameservers** (ou **Zone DNS**)
4. Ajoute ou modifie un **enregistrement A** :

   | Type | Nom  | Valeur (Points vers) | TTL  |
   |------|------|----------------------|------|
   | **A** | **@** | **38.180.244.104**   | 3600 |

   - **@** = racine du domaine (floo.digital)
   - Si tu veux aussi **www.floo.digital**, ajoute un 2ᵉ enregistrement :
     - Type **A**, Nom **www**, Valeur **38.180.244.104**, TTL 3600

5. **Enregistre** et attends 5 à 30 minutes que les DNS se propagent.

Vérification : `ping floo.digital` doit répondre avec **38.180.244.104**.

---

## Étape 2 : Nginx + SSL sur le VPS

Connecte-toi au VPS puis exécute le script (remplace l’email par le tien) :

```bash
ssh root@38.180.244.104
```

Mot de passe : `EEQ6nsbirN`

Puis sur le VPS :

```bash
cd /home/floo/floo
git pull origin main
bash scripts/setup-nginx-domain.sh floo.digital ton-email@example.com
```

Le script va :
- Installer nginx et certbot
- Configurer le reverse proxy (floo.digital → port 3000)
- Obtenir un certificat SSL Let's Encrypt (HTTPS)
- Redémarrer l’app web

---

## Étape 3 : NEXTAUTH_URL pour floo.digital

Sur le VPS, édite le fichier `.env` de l’app web :

```bash
nano /home/floo/floo-web/.env
```

Modifie ou ajoute :

```
NEXTAUTH_URL=https://floo.digital
```

Sauvegarde (Ctrl+O, Entrée, Ctrl+X), puis redémarre :

```bash
systemctl restart floo-web
```

---

## Vérification

- **https://floo.digital** → page d’accueil Floo
- **https://floo.digital/dashboard** → dashboard (après connexion)
- Connexion / cookies OK grâce à `NEXTAUTH_URL=https://floo.digital`

---

## En cas de problème

### Le domaine n’affiche rien
- Vérifie les DNS : `ping floo.digital` → doit être 38.180.244.104
- Sur le VPS : `systemctl status nginx` et `systemctl status floo-web`

### Certificat SSL refusé
- Vérifie que le A record @ pointe bien vers 38.180.244.104
- Port 80 ouvert : `ufw allow 80` puis `ufw reload` si besoin

### Session / connexion ne marche pas
- Vérifie que `NEXTAUTH_URL=https://floo.digital` est bien dans `/home/floo/floo-web/.env`
- Redémarre : `systemctl restart floo-web`

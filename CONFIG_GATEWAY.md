# Configuration du gateway Floo (VPS)

Ce guide permet de configurer le gateway sur le VPS pour que l’app web (Next.js) et WhatsApp fonctionnent ensemble (recherche, scraping, liaison compte).

## Tout faire d'un coup pour tester

```bash
export VPS_PASSWORD='<ton_mot_de_passe_VPS>'
# ou créer .env.vps avec: VPS_PASSWORD=...
./scripts/ready-to-test.sh
```

Enchaîne : déploiement gateway → config recherche web (floo.json, floo.service, floo-web) → vérification. Ensuite teste sur WhatsApp (ex. « Cherche les meilleurs restaurants Abidjan garba pas cher »).

## Prérequis

- App web déployée **sur le VPS** (`http://38.180.244.104:3000`) **ou sur Vercel** (`https://ton-projet.vercel.app`).  
  Si Vercel : voir **[DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)** et mettre `FLOO_API_BASE_URL` sur l’URL Vercel.
- Même clé `FLOO_GATEWAY_API_KEY` dans l’app web (Vercel env ou `.env`) et côté gateway (voir ci‑dessous).

## 1. Configurer les variables d’environnement du service `floo`

Le service systemd `floo` doit connaître l’URL de l’app web et la clé partagée.

**Depuis ta machine locale :**

```bash
cd "/Users/ousmanedicko/Desktop/Dicken AI/AI Product/Floo"
export VPS_PASSWORD='<ton_mot_de_passe_VPS>'
# Optionnel si la clé est déjà dans apps/web/.env :
# export FLOO_GATEWAY_API_KEY='<même_valeur_que_dans_apps_web/.env>'
./scripts/run-configure-gateway-env.sh
```

Le script copie `configure-floo-gateway-env.sh` sur le VPS et l’exécute. Il ajoute dans `/etc/systemd/system/floo.service` :

- `Environment=FLOO_API_BASE_URL=http://127.0.0.1:3000`
- `Environment=FLOO_GATEWAY_API_KEY=<clé>`

puis redémarre le service `floo`.

## 2. Mettre à jour le code du gateway sur le VPS

Pour déployer la dernière version du dépôt (outils `floo_search`, `floo_scrape`, etc.) :

```bash
export VPS_PASSWORD='<ton_mot_de_passe_VPS>'
./scripts/deploy-floo-gateway.sh
```

Le script fait un rsync du dépôt vers `/home/floo/floo`, puis sur le VPS : `pnpm install`, `pnpm build`, `systemctl restart floo`.

## 3. Vérifier que tout tourne

- **Web :** ouvrir http://38.180.244.104:3000
- **Gateway :** sur le VPS : `systemctl status floo` et `journalctl -u floo -n 50 -f`
- **WhatsApp :** voir [WORKFLOW_WHATSAPP.md](apps/web/WORKFLOW_WHATSAPP.md)

## 4. Tester WhatsApp

1. Se connecter au dashboard : http://38.180.244.104:3000/dashboard  
2. Générer son code (ex. `FL-1234`) et le copier.  
3. Sur WhatsApp, envoyer ce code au numéro Floo.  
4. Attendre la confirmation « Compte lié avec succès ! ».  
5. Envoyer un message normal : Floo doit répondre (et peut utiliser recherche/scraping si les outils sont configurés).

En cas de problème : vérifier les logs du gateway (`journalctl -u floo -f`) et que `FLOO_API_BASE_URL` / `FLOO_GATEWAY_API_KEY` sont bien définis (`systemctl show floo --property=Environment`).

## 5. Tout configurer d’un coup (recherche web)

```bash
export VPS_PASSWORD='<ton_mot_de_passe>'
./scripts/setup-websearch-complete.sh
```

Ce script : génère ou réutilise `FLOO_GATEWAY_API_KEY`, met à jour `apps/web/.env`, patch `floo.service` et `floo-web` sur le VPS, redémarre les services. Ensuite, vérifier avec `./scripts/verify-websearch-ready.sh` (et optionnellement `./scripts/verify-websearch-ready.sh 38.180.244.104` si SSH configuré).

## 6. « Je n’ai pas accès à la recherche web » sur WhatsApp

Si Floo répond mais dit qu’il ne peut pas faire de recherche :

1. **Gateway → app web**  
   Le service `floo` doit avoir :
   - `FLOO_API_BASE_URL` (ex. `http://127.0.0.1:3000` ou `https://floo.digital` si Nginx)
   - `FLOO_GATEWAY_API_KEY` (même valeur que dans Next.js `.env`).  
   → `./scripts/run-configure-gateway-env.sh` (avec la clé dans `apps/web/.env` ou `FLOO_GATEWAY_API_KEY`).

2. **Next.js**  
   `FLOO_GATEWAY_API_KEY` dans `.env` / env du service web (floo-web), même valeur que le gateway.

3. **Config Floo**  
   `~/.floo/floo.json` (ou `/home/floo/.floo/floo.json` sur le VPS) doit autoriser la recherche en sandbox :
   - `tools.sandbox.tools.allow` inclut `group:web`.  
   → `node scripts/ensure-floo-websearch-config.mjs <chemin floo.json>`, ou relancer `./scripts/run-integrate-skills-on-vps.sh` (qui l’applique).

4. **Vérification**  
   ```bash
   ./scripts/verify-websearch-ready.sh              # local
   ./scripts/verify-websearch-ready.sh 38.180.244.104  # VPS
   ```

5. **Tester l’API search**  
   ```bash
   curl -s -X POST https://floo.digital/api/tools/search \
     -H "Content-Type: application/json" -H "X-Floo-Gateway-Key: TA_CLE" \
     -d '{"q":"test"}' | jq .
   ```  
   Si 401 → mauvaise clé ou absente côté Next.js. Si 200 avec `results` → OK.

6. **Redémarrer**  
   Après toute modif de config ou env : `systemctl restart floo` (et floo-web si tu touches son `.env`).

---

Pour **comment l’agent décide, fait des tâches, et comment les skills l’aident** : voir [AGENT_ET_SKILLS.md](AGENT_ET_SKILLS.md).

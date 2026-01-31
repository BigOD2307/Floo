# Pourquoi l’IA ne peut rien faire — diagnostic et solution

Ce doc explique **la chaîne réelle** (message → agent → outils → API) et **les deux seules causes** qui empêchent l’IA de faire des recherches ou d’agir.

---

## Chaîne complète (ce qui doit marcher)

```
1. WhatsApp (utilisateur) → message
2. Gateway (VPS) reçoit le message
3. Vérification : utilisateur lié ? (GET Vercel /api/whatsapp/verify-code) → si non, message fixe "envoie ton code"
4. Si lié : gateway construit la liste d’outils pour l’agent
   → createFlooSearchTool() / createFlooScrapeTool() sont appelés
   → Ils retournent un outil SEULEMENT si FLOO_API_BASE_URL et FLOO_GATEWAY_API_KEY sont définis (process.env du processus gateway)
   → Sinon ils retournent null → floo_search et floo_scrape ne sont PAS dans la liste
5. Liste d’outils filtrée par la policy (floo.json)
   → Si tools.profile = "messaging" SANS tools.alsoAllow contenant "group:web", floo_search et floo_scrape sont RETIRÉS
6. L’agent (LLM) reçoit le message + la liste d’outils (sans floo_search si 4 ou 5 en échec)
7. L’agent répond "je ne peux pas chercher" ou ne fait rien car il n’a pas l’outil
8. Si l’agent a bien floo_search et l’appelle : gateway fait POST vers Vercel /api/tools/search avec X-Floo-Gateway-Key
9. Vercel vérifie la clé (FLOO_GATEWAY_API_KEY), appelle Serper ou DuckDuckGo, renvoie les résultats
```

**Le problème réel** : à l’étape 4 ou 5, les outils `floo_search` / `floo_scrape` ne sont **jamais** donnés à l’agent. Donc l’IA n’a tout simplement pas la possibilité d’agir.

---

## Les deux causes (et uniquement celles-ci)

### Cause 1 : Variables d’environnement absentes sur le VPS

**Où ça casse** : étape 4.  
Le **processus** qui exécute le gateway (souvent le service systemd `floo`) doit avoir dans **son** environnement :

- `FLOO_API_BASE_URL` (ex. `https://floo-ecru.vercel.app`)
- `FLOO_GATEWAY_API_KEY` (exactement la même valeur que sur Vercel)

Si l’une des deux manque, `createFlooSearchTool()` et `createFlooScrapeTool()` retournent `null`. Les outils ne sont jamais ajoutés à la liste. L’IA ne les a donc pas.

**Fréquent** : tu as mis les variables dans un `.env` à la racine du projet, mais le service systemd ne charge pas ce fichier. Il faut les passer dans le fichier de service (Environment= ou EnvironmentFile=).

**Vérification** (sur le VPS) :

```bash
systemctl show floo --property=Environment
```

Tu dois voir `FLOO_API_BASE_URL=...` et `FLOO_GATEWAY_API_KEY=...`.

**Correction** : configurer le service (scripts `set-gateway-vercel-env.sh` / `run-set-gateway-vercel.sh` ou manuellement dans `/etc/systemd/system/floo.service`), puis :

```bash
sudo systemctl daemon-reload && sudo systemctl restart floo
```

---

### Cause 2 : Policy des outils (floo.json) sans `group:web`

**Où ça casse** : étape 5.  
Même si les outils sont créés (cause 1 OK), la config peut les **filtrer**. Si tu as par exemple `tools.profile: "messaging"`, le profil n’autorise que message, sessions_*, etc. Il n’autorise pas `group:web` (floo_search, floo_scrape). Sans `tools.alsoAllow` contenant `group:web`, ces outils sont retirés de la liste avant d’être envoyés à l’agent.

**Vérification** (sur le VPS) :

```bash
cat /home/floo/.floo/floo.json
# ou le chemin de ton floo.json
```

Il faut avoir soit pas de `tools.profile` restrictif, soit `tools.alsoAllow` avec `"group:web"` :

```json
{
  "tools": {
    "profile": "messaging",
    "alsoAllow": ["group:web"]
  }
}
```

**Correction** :

```bash
node scripts/ensure-floo-websearch-config.mjs /home/floo/.floo/floo.json
sudo systemctl restart floo
```

---

## Une seule commande (depuis ta machine)

Depuis ton Mac (avec le mot de passe VPS et `expect` installé) :

```bash
VPS_PASSWORD='ton_mot_de_passe_VPS' ./scripts/run-floo-ready-to-test.sh
```

Le script configure le VPS : floo.json (group:web) + floo.service (FLOO_API_BASE_URL, FLOO_GATEWAY_API_KEY) + redémarrage. Ensuite tu peux tester sur WhatsApp.

Optionnel : `VPS_HOST=...`, `VPS_USER=...`, `FLOO_VERCEL_URL=...`, `FLOO_GATEWAY_API_KEY=...` (sinon lue depuis `apps/web/.env`).

---

## Checklist en 3 étapes (sur le VPS, si tu préfères faire à la main)

1. **Env du service**  
   `systemctl show floo --property=Environment` → doit contenir `FLOO_API_BASE_URL` et `FLOO_GATEWAY_API_KEY`.

2. **floo.json**  
   `tools.alsoAllow` doit contenir `"group:web"`. Si tu as un `tools.profile` (ex. `"messaging"`), c’est indispensable.

3. **Redémarrage**  
   Après toute modif : `sudo systemctl daemon-reload && sudo systemctl restart floo`, puis retester sur WhatsApp.

---

## Côté Vercel (déjà en place normalement)

- **FLOO_GATEWAY_API_KEY** = même valeur que sur le VPS (pour accepter les appels du gateway).
- **SERPER_API_KEY** = optionnel ; s’il est absent, l’app utilise DuckDuckGo pour la recherche.

Tu as le code, les APIs, le déploiement. Le blocage est **uniquement** : env du processus gateway sur le VPS (cause 1) et/ou policy floo.json sans `group:web` (cause 2). Une fois ces deux points corrigés et le service redémarré, l’IA reçoit `floo_search` et `floo_scrape` et peut agir.

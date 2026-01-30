# Intégrer antfu/skills + awesome-moltbot-skills (~600+ skills)

## Déjà fait

- **antfu/skills** : [GitHub](https://github.com/antfu/skills) – Vue/Nuxt/Vite et al.
- **moltbot/skills** (source de [awesome-moltbot-skills](https://github.com/VoltAgent/awesome-moltbot-skills)) : 1500+ skills.

Un flat de `moltbot/skills` est construit et ajouté avec antfu dans `skills.load.extraDirs`.

### Lancer l’intégration

**En local :**
```bash
./scripts/integrate-external-skills.sh [ROOT_DIR]
# défaut ROOT: .skills-external à la racine du repo.
# Met à jour ~/.floo/floo.json (skills.load.extraDirs).
```

**Sur le VPS :**
```bash
export VPS_PASSWORD='...'
./scripts/run-integrate-skills-on-vps.sh
```
Clone dans `/home/floo/skills-external`, met à jour `/home/floo/.floo/floo.json`, chown floo, redémarre le service `floo`.

---

## Skills vs APIs vs MCP – où on en est

| Type | Dans Floo | Rôle |
|------|-----------|------|
| **Skills** | Dossiers avec `SKILL.md` (frontmatter + instructions) | Enseignent à l’agent *comment* utiliser des outils/CLI. Sont injectés dans le prompt. |
| **Tools** | `web_search`, `floo_search`, `floo_scrape`, plugins… | Fonctions appelables par l’agent (APIs, CLI, etc.). |
| **MCP** | Skill **mcporter** : appeler des serveurs MCP via CLI | MCP = serveurs qui exposent des *tools*. On y accède via `mcporter` (ex. `mcporter call <server.tool>`). |

Donc :
- **MCP** = protocole pour exposer des tools ; on peut les utiliser via mcporter ou en ajoutant un client MCP dans Floo.
- **APIs** = on crée des *tools* Floo qui appellent tes APIs (comme `floo_search`).
- **Skills** = instructions en Markdown ; si ton repo c’est ça, on les charge via `skills.load.extraDirs`.

---

## Si ton repo = **skills** (SKILL.md)

Format attendu : un dossier par skill, chaque skill a un `SKILL.md` :

```
repo/
├── skill-a/
│   └── SKILL.md
├── skill-b/
│   └── SKILL.md
└── ...
```

### Intégration

1. **Cloner le repo** sur le VPS (ou sur ta machine) dans un dossier dédié, par ex. :
   - `/home/floo/skills-external` sur le VPS, ou
   - `~/skills-external` en local.

2. **Configurer Floo** pour charger ce dossier en plus des skills du repo :

   Dans `~/.clawdbot/clawdbot.json` (ou la config utilisée par le gateway) :

   ```json
   {
     "skills": {
       "load": {
         "extraDirs": ["/home/floo/skills-external"]
       }
     }
   }
   ```

   En local, tu peux mettre un chemin du type `~/skills-external` ou un chemin absolu.

3. **Redémarrer le gateway** (ou l’agent) pour que les skills soient rechargés.

Ordre de priorité : `workspace > managed > bundled > extraDirs`. Les skills de ton repo externe sont en dernier, sauf si tu en copies dans `workspace/skills` ou `~/.clawdbot/skills`.

---

## Si ton repo = **MCP serveurs** ou **tools MCP**

- On peut utiliser le skill **mcporter** pour lister / configurer / appeler tes serveurs MCP.
- Ou on peut ajouter un **client MCP** dans Floo qui se connecte à tes serveurs et enregistre leurs tools comme tools de l’agent. Ça demande un peu de dev (connexion MCP, mapping → tools).

---

## Si ton repo = **APIs REST** (endpoints à appeler)

- On crée des **tools** Floo (comme `floo_search`) qui font `fetch` vers tes APIs.
- Ces tools sont enregistrés dans l’agent et utilisables par les skills / le prompt.

---

## Pour avancer concrètement

Envoie-moi **l’URL du repo GitHub** (et éventuellement 2–3 exemples de dossiers/files à la racine). On pourra dire si c’est :

- **Skills** → on fait `extraDirs` + config comme au-dessus.
- **MCP** → on part sur mcporter et/ou client MCP.
- **APIs** → on définit quels endpoints exposer et on ajoute les tools Floo correspondants.

Ensuite on pourra détailler les étapes exactes (config, déploiement, redémarrage) selon ton setup (VPS, local, etc.).

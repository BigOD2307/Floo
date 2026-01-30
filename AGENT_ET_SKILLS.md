# Comment l’agent Floo prend des décisions et fait des tâches

Explication courte de ce qui se passe vraiment sous le capot, et du rôle des **skills** vs **tools**.

---

## 1. Le « tour » de l’agent (une tâche = un run)

Quand tu envoies un message (WhatsApp, etc.) :

1. **Entrée**  
   Ton message + l’historique récent de la session sont envoyés au **modèle** (Claude, etc.) avec un **prompt système** (règles, identité, liste d’outils, etc.).

2. **Réponse du modèle**  
   Le modèle produit soit :
   - du **texte** (sa réponse),
   - soit des **appels d’outils** (tool calls), par ex. « appelle `floo_search` avec `q = "restaurants Abidjan"` »,
   - ou les deux (texte + outils).

3. **Exécution des outils**  
   Chaque tool call est exécuté par Floo (recherche web, bash, envoi de message, etc.). Le **résultat** (JSON, texte, etc.) est renvoyé au modèle comme nouveau message « assistant → user ».

4. **Boucle**  
   Le modèle continue : il peut produire encore du texte ou d’autres tool calls. On réinjecte les résultats, et ainsi de suite jusqu’à ce qu’il décide d’arrêter (réponse finale sans nouvel outil).

5. **Sortie**  
   La **dernière réponse texte** du modèle est envoyée vers le canal (ex. WhatsApp). C’est ce que tu vois.

Donc : **décisions** = le modèle choisit à chaque tour quoi dire et quels outils appeler. **Tâches** = tout ce qui se passe pendant ce run (plusieurs appels d’outils possibles avant la réponse finale).

---

## 2. Tools (outils) = les vraies actions

Les **tools** sont des **fonctions** que l’agent peut appeler. Chaque outil a :

- un **nom** (ex. `floo_search`, `exec`, `message`),
- une **description** (résumée dans le prompt),
- des **paramètres** (ex. `q` pour la recherche, `url` pour le scrape).

Le modèle **choisit tout seul** quel outil utiliser selon ta question et ces descriptions. Par exemple :

- « Recherche les meilleurs restos à Abidjan » → il peut appeler `floo_search` avec `q = "meilleurs restaurants Abidjan"`.
- « Envoie un message à X » → il peut appeler `message` avec `action=send`, `to`, etc.

**Donc :** les **actions concrètes** (recherche, bash, envoi de message, etc.) viennent des **tools**. Sans tool, le modèle ne peut que **parler** (texte uniquement).

---

## 3. Skills = « que des mots » ? Oui et non

Les **skills** sont des **dossiers** avec un `SKILL.md` (markdown + frontmatter). On en charge des centaines (antfu, moltbot, etc.) et on les met dans le prompt sous forme de **liste** :

- **Nom** du skill  
- **Courte description** (une phrase)  
- **Emplacement** du `SKILL.md`

Le modèle reçoit donc une liste du genre :

```
- floo_search: Search the web via Floo (Serper/DuckDuckGo)…
- github: Interact with GitHub using the `gh` CLI.
- tavily: AI-optimized web search…
…
```

Et des règles du type :

- « Avant de répondre, parcours les skills. »
- « Si un seul skill s’applique clairement → **lis** son `SKILL.md` avec l’outil `Read`, puis suis ses instructions. »
- « Si aucun ne s’applique → n’utilise aucun skill. »

**Donc :**

- **Les skills, en tant que tels, sont « que des mots »** : du markdown (instructions, exemples, procédures).
- **Mais** ils **orientent** le modèle :
  - vers **quel** skill utiliser (recherche, GitHub, etc.),
  - puis vers **quoi faire** (lire le `SKILL.md`, utiliser tel outil, tel format de réponse).

En pratique : le skill dit par exemple « pour une recherche web, utilise `floo_search` avec le paramètre `q` ». Le modèle lit ça, puis **appelle vraiment** le tool `floo_search`. Les **actions** restent les **tools** ; les **skills** disent **quand / comment** les utiliser.

---

## 4. Pourquoi ça peut sembler « que des mots » ou bloquer

- **Aucun tool ne correspond**  
  Si tu demandes une recherche mais que `floo_search` n’est pas dispo (pas configuré, filtré par la sandbox, etc.), le modèle ne peut pas l’appeler. Il va juste **répondre en texte** (ex. « Je ne peux pas faire de recherche web »). D’où l’impression que « ça ne fait rien ».

- **Skills non utilisés**  
  Si le modèle estime qu’aucun skill ne s’applique, il ne lit aucun `SKILL.md`. Il répond selon son entraînement général, sans suivre nos procédures. Ça reste « que des mots » côté skills.

- **Pas d’outil fait pour la tâche**  
  Certaines demandes (ex. « réserve-moi un vol ») n’ont pas de tool dédié. Le modèle ne peut que discuter ou expliquer. Les skills ne créent pas de nouveaux tools ; ils aident à utiliser ceux qui existent.

- **On n’envoie que la réponse finale**  
  Sur WhatsApp, tu ne vois pas les tool calls ni les étapes intermédiaires. Tu vois uniquement le **texte final**. Donc même quand il a utilisé `floo_search`, tu as l’impression que « il a juste parlé ».

---

## 5. En résumé

| Élément | Rôle |
|--------|------|
| **Modèle** | Prend les décisions : quoi répondre, quels tools appeler. |
| **Tools** | Les vraies actions (recherche, exec, message, etc.). |
| **Skills** | Instructions (markdown) qui guident le modèle : quel skill utiliser, puis lire `SKILL.md` et suivre (souvent « utilise ce tool comme ça »). |

**« Que des mots »** : les skills sont bien du texte. Les **actions** viennent des **tools**. Les skills aident l’agent à **choisir les bons tools** et à **les utiliser correctement**.

Pour que la recherche web marche, il faut notamment :

- que le tool `floo_search` soit **disponible** (config gateway + app web),
- qu’il soit **autorisé** (ex. `group:web` dans la sandbox),
- et que le modèle **décide** de l’appeler (les skills + la description du tool l’y aident).

Voir [CONFIG_GATEWAY.md](CONFIG_GATEWAY.md) et [INTEGRATION_SKILLS_EXTERNES.md](INTEGRATION_SKILLS_EXTERNES.md) pour la config et l’intégration des skills.

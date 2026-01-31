# Inscription, code WhatsApp, Supabase — et faire faire des actions à l’IA

Réponses directes à : est-ce qu’on peut s’inscrire, que tout soit sauvegardé dans Supabase, que le code marche, à quoi servent les skills, et comment faire en sorte que l’IA puisse faire des actions.

---

## 1. S’inscrire, se connecter, tout sauvegardé dans Supabase ?

**Oui.** Dès que l’app Floo (sur Vercel) utilise **DATABASE_URL** vers Supabase :

- **Inscription** : créée dans la table **users** (email, mot de passe hashé, **code** unique type `FL-XXXX`, crédits, etc.).
- **Connexion** : NextAuth vérifie email/mot de passe contre **users** dans Supabase.
- **Code et numéro** : le **code** est enregistré à la création du compte ; le **numéro WhatsApp** est sauvegardé quand tu valides le code (onboarding ou envoi du code à Floo sur WhatsApp).

Donc : inscription, connexion, code, numéro, crédits, etc. sont bien **sauvegardés dans Supabase** (tables `users`, `transactions`, `sessions`).

---

## 2. Le code, est-ce qu’il marche vraiment ? L’IA “saura” si je lui donne le code ?

**Oui, à condition que le gateway Floo (sur le VPS) appelle ton app sur Vercel.**

- Tu reçois ton **code** (ex. `FL-ABCD`) sur le **dashboard** (app Vercel) après inscription.
- Tu envoies ce code à **Floo sur WhatsApp** (ex. : « FL-ABCD »).
- Le **gateway** (VPS) reçoit le message, appelle ton app : **POST** `https://ton-app.vercel.app/api/whatsapp/verify-code` avec `{ code, phoneNumber }`.
- L’API (Vercel) cherche l’utilisateur par **code** dans Supabase, met à jour **phoneNumber** et **whatsappLinked**, et renvoie succès.

Donc oui : si **FLOO_API_BASE_URL** sur le VPS pointe vers ton URL Vercel, quand tu donnes le code à l’IA (Floo sur WhatsApp), le gateway appelle Vercel, et le compte est bien lié ; l’IA “saura” que ce numéro est lié à ce compte (les prochaines requêtes pourront être associées à ton user/crédits, etc.).

---

## 3. À quoi servent les skills ? Est-ce qu’ils “marchent” ?

Les **skills** ne sont **pas** des nouveaux pouvoirs magiques : ce sont des **textes ajoutés au prompt** de l’IA (instructions, exemples, bonnes pratiques).

- Ils **guident** l’IA : quand utiliser quel outil, comment répondre dans un domaine (ex. rédaction, synthèse, recherche).
- Ils **ne créent pas** de nouvelles actions : les vraies actions viennent des **outils** (voir ci‑dessous).

Donc : les skills “marchent” en ce sens qu’ils aident l’IA à mieux choisir et utiliser ce qu’elle peut déjà faire. Ils ne permettent pas à eux seuls de “faire des tâches” si les **outils** ne sont pas disponibles ou pas configurés.

---

## 4. Comment faire pour que l’IA puisse vraiment faire des actions / tâches ?

Les **actions** que l’IA peut faire viennent des **outils** (tools) qu’on lui donne, pas des skills seuls.

### Ce qui existe déjà côté “actions”

- **floo_search** : recherche web (via ton app Vercel → Serper/DuckDuckGo).
- **floo_scrape** : récupérer le contenu d’une page web.
- **message** : envoyer un message (réponse WhatsApp, etc.).
- **sessions_***, **exec**, etc. : selon la config du gateway.

Pour que **floo_search** et **floo_scrape** marchent depuis WhatsApp :

1. **Gateway (VPS)** doit appeler **ton app sur Vercel** :
   - **FLOO_API_BASE_URL** = `https://ton-app.vercel.app` (ta vraie URL Vercel).
   - **FLOO_GATEWAY_API_KEY** = **exactement la même** valeur que sur Vercel (variable d’environnement).
2. Sur Vercel, les routes `/api/tools/search` et `/api/tools/scrape` utilisent **FLOO_GATEWAY_API_KEY** pour accepter les appels du gateway.
3. La config du gateway (floo.json, etc.) doit **autoriser** les outils web (`group:web` / `floo_search`, `floo_scrape`) — normalement déjà fait avec les scripts qu’on a utilisés.

Donc : **pour que l’IA puisse faire des tâches (recherche, scraping, etc.)** :

- Les **outils** sont déjà là.
- Il faut que le **gateway pointe vers Vercel** (FLOO_API_BASE_URL + FLOO_GATEWAY_API_KEY) et que les outils web soient autorisés.
- Les **skills** aident l’IA à *bien utiliser* ces outils (quand faire une recherche, quand résumer, etc.), mais ce qui “fait” l’action, ce sont les outils.

---

## 5. Récap

| Question | Réponse |
|----------|--------|
| S’inscrire / se connecter, tout dans Supabase ? | Oui, si l’app Vercel utilise DATABASE_URL Supabase. |
| Le code (FL-XXXX), il marche ? L’IA “saura” ? | Oui, si le gateway appelle Vercel (FLOO_API_BASE_URL = URL Vercel) et que tu envoies le code à Floo sur WhatsApp. |
| Les skills, à quoi ça sert ? | À guider l’IA dans le prompt (comment/quand utiliser les outils). Ils ne créent pas seuls des “actions”. |
| Comment faire pour que l’IA fasse des actions ? | En s’assurant que le **gateway** appelle **Vercel** (FLOO_API_BASE_URL + FLOO_GATEWAY_API_KEY) et que les **outils** (floo_search, floo_scrape, etc.) sont autorisés. Les skills aident à les utiliser correctement. |

En résumé : **inscription/connexion/code/numéro = Supabase**. **Code reconnu par l’IA = gateway qui appelle Vercel**. **Actions réelles = outils (floo_search, etc.) + gateway configuré vers Vercel**. **Skills = aide au bon usage des outils, pas la source des actions.**

# Vercel déploie un ancien commit — à faire

## Problème

Le build échoue avec « Module not found: pdf-lib, @vercel/blob, pptxgenjs, qrcode » car **Vercel utilise encore le commit `a7da095`** au lieu du dernier (`9d25d7fa9` ou `4c2c3ba28`).

Les dépendances ont été ajoutées dans les commits suivants. Il faut forcer un déploiement à jour.

---

## Étapes à suivre

### 1. Vérifier la branche de production

1. Va sur [vercel.com](https://vercel.com) → ton projet **floo**
2. **Settings** → **Git**
3. Vérifie que **Production Branch** = `main`

### 2. Forcer un nouveau déploiement (pas un « Redeploy »)

**Important :** Ne pas cliquer sur « Redeploy » sur un ancien déploiement (sinon le même commit est redéployé).

À la place :

1. Va dans **Deployments**
2. Clique sur **Create Deployment** (ou **Deploy**)
3. Choisis la branche **main** et le **dernier commit** (9d25d7fa9 ou plus récent)

Ou bien :

1. Va sur GitHub : [github.com/BigOD2307/Floo](https://github.com/BigOD2307/Floo)
2. Vérifie que le dernier commit sur `main` est bien `9d25d7fa9` ou plus récent
3. Sur Vercel : **Deployments** → le déploiement automatique du dernier push devrait apparaître
4. S’il n’y en a pas, clique sur **Redeploy** sur le **dernier** déploiement listé (celui avec le commit le plus récent)

### 3. Vérifier le Root Directory

1. **Settings** → **General**
2. **Root Directory** doit être **`apps/web`**
3. Si c’est vide ou différent, clique sur **Edit** et saisis `apps/web`

### 4. Découpler Git puis reconnecter (si besoin)

1. **Settings** → **Git**
2. **Disconnect** (découpler le repo)
3. **Connect Git Repository** (reconnecter le repo)
4. Sélectionne **BigOD2307/Floo**, branche **main**
5. Vérifie **Root Directory** = `apps/web`
6. Lance un nouveau déploiement

---

## Vérification après déploiement

Le déploiement doit afficher un commit récent (ex. `9d25d7fa9`) et **pas** `a7da095`.

Après un déploiement réussi, les modules `pdf-lib`, `pptxgenjs`, `@vercel/blob`, `qrcode` seront présents et le build devrait passer.

# Alerte Réseau — Déploiement

## 1. Tester en local (optionnel)
```
npm install
npm run dev
```
Ouvre ensuite l'adresse affichée (généralement http://localhost:5173).

## 2. Déployer sur Netlify (le plus simple, sans ligne de commande)
1. Va sur https://app.netlify.com et crée un compte gratuit.
2. Dans ce dossier, lance :
   ```
   npm install
   npm run build
   ```
   Cela crée un dossier `dist/`.
3. Sur Netlify, choisis "Add new site" → "Deploy manually", puis glisse-dépose
   le dossier `dist/`.
4. Netlify te donne un lien public (ex: https://alerte-reseau.netlify.app)
   à partager immédiatement.

## 3. Déployer sur Vercel (alternative)
1. Crée un compte sur https://vercel.com
2. Installe l'outil Vercel : `npm install -g vercel`
3. Depuis ce dossier, lance : `vercel`
4. Suis les instructions à l'écran (elle détecte Vite automatiquement).

## Important : limite actuelle du stockage
Les signalements sont actuellement enregistrés avec `localStorage`, donc
**uniquement dans le navigateur de chaque personne**. Deux utilisateurs sur
deux téléphones différents ne verront pas les mêmes signalements.

Pour un vrai partage entre utilisateurs (toi + les techniciens, par exemple),
il faut ajouter une base de données. Options simples et gratuites pour
démarrer :
- **Supabase** (https://supabase.com) — base de données + API en quelques
  clics, bien documentée en français.
- **Firebase** (https://firebase.google.com) — alternative de Google.

Je peux t'aider à faire cette connexion quand tu es prêt.

# Maze — le livre-labyrinthe

Lecture web de *Maze: Solve the World's Most Challenging Puzzle* (Christopher Manson, 1985) :
45 salles, des portes cliquables, le parcours et le nombre de pas, une carte des salles et un carnet de notes
(par salle et général) enregistré dans le navigateur, avec export Markdown/JSON.

Site non officiel, sans lien avec Christopher Manson ni Henry Holt and Company.
Textes, illustrations et coordonnées des portes proviennent de l'adaptation web d'Al Sweigart :
[asweigart/mazewebsite](https://github.com/asweigart/mazewebsite).

## Développement

```bash
npm install
npm run dev
```

`npm run build` produit le site statique dans `dist/` (déployé automatiquement par Vercel à chaque push).

## Données

- `src/data/rooms.json` : texte et portes de chaque salle (coordonnées en pixels de l'image pleine résolution),
  généré par `scripts/extract.py` depuis un clone de `asweigart/mazewebsite`.
- `public/images/` : illustrations en WebP — `roomN.webp` (affichage, 1400 px), `roomN-full.webp` (zoom),
  `roomN-thumb.webp` (carte).

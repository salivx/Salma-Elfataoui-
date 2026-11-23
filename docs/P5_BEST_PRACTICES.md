# Bonnes pratiques de codage p5.js

Sources téléchargées le 2026-11-23 :
- p5.js — *Documentation Style Guide* : <https://p5js.org/contribute/documentation_style_guide/>
- Daniel Shiffman — *The Nature of Code*, chap. 5 : <https://natureofcode.com/autonomous-agents/>

> **Version de p5 du projet : 1.7.0** (fichier `libraries/p5.min.js` embarqué dans chaque
> sketch). La dernière version stable publiée est la 2.x (2.4.0 en novembre 2026), mais
> **on reste en 1.x** tant que le projet ne décide pas de migrer : `preload()`,
> `p5.Vector` et l'API 1.x sont la référence. Ne pas mélanger du code 2.x (ex.
> `async function setup()` + `await loadImage()`) avec la bibliothèque 1.7.0.

Les règles marquées **[projet]** adaptent le guide officiel, qui vise d'abord les exemples
courts de la documentation.

---

## Structure d'un sketch

- Un dossier par application : `index.html`, `style.css`, `sketch.js`, une classe par
  fichier, `libraries/`, `assets/`.
- `index.html` charge p5, puis les classes **parentes avant les sous-classes**, puis
  `sketch.js` en dernier.
- Ne charger `p5.sound.min.js` **que si le son est utilisé** : ouverte directement depuis
  le disque (`file://`), une page qui le charge reste bloquée sur « Loading... » (écran
  noir). Avec du son, toujours passer par un serveur local (Live Server).
- Les ressources (images, sons, polices) vont dans `assets/` et sont chargées dans
  `preload()` : `loadImage('assets/vaisseau.png')`.
- `setup()` crée le canevas et les objets ; `draw()` met à jour puis dessine.
- Plein écran : `createCanvas(windowWidth, windowHeight)` + `windowResized()` qui appelle
  `resizeCanvas(windowWidth, windowHeight)`.
- Mode global (pas de mode instance) sauf besoin particulier.
- Utiliser `describe('…')` dans `setup()` pour décrire le canevas (accessibilité).

## Nommage

- Noms descriptifs, pas de lettres seules (sauf `i`, `x`, `y` usuels).
- `camelCase` pour variables, fonctions, méthodes, instances.
- `PascalCase` pour les classes (`class Missile extends Vehicle`).
- Pas de `_` en début/fin de nom (`this.secret`, pas `this._secret`).

## Variables

- `let` partout ; jamais `var`. **[projet]** `const` est autorisé pour les vraies constantes
  (`const NB_VEHICULES = 50;`) — le guide officiel l'évite seulement par pédagogie.
- Une déclaration par ligne, au plus près de l'usage.
- `i += 1` plutôt que `i++` dans les exemples pédagogiques.
- Points-virgules obligatoires.

## Fonctions

- Déclarations `function nom() {}` pour les fonctions globales.
- Paramètres par défaut en dernier : `flee(target, detectionRadius = Infinity)`.
- Ne pas modifier les arguments reçus (copier un vecteur avant de le modifier : `v.copy()`).
- Fonctions fléchées pour les callbacks anonymes : `vehicles.forEach((v) => v.show());`.
- Callback complexe → fonction nommée.

## Classes

- Toujours `class` / `extends` / `super(...)` ; jamais `prototype`.
- Pas de constructeur vide ni de constructeur qui ne fait qu'appeler `super` avec les mêmes
  arguments.
- Pas de membre dupliqué.
- `toString()` sans effet de bord.

## Commentaires

- `//` avec un espace puis une majuscule : `// Calcule la force de séparation.`
- Commentaire sur sa propre ligne, au-dessus du code concerné.
- **[projet]** Commentaires en français. JSDoc (`/** … */`) autorisé au-dessus des méthodes
  publiques des classes pour documenter paramètres et valeur de retour.

## Chaînes, tableaux, objets

- Guillemets simples `'…'` ; template literals pour l'interpolation : `` `Score : ${score}` ``.
- Tableaux littéraux `[]`, ajout avec `push()`, copie avec `slice()`.
- Parcours avec `forEach` / `map` / `filter` / `find` / `some`.
  **[projet]** Pour **supprimer** des éléments pendant le parcours, boucle `for` à
  l'envers : `for (let i = arr.length - 1; i >= 0; i -= 1)`.
- Objets littéraux `{}`, notation pointée, virgule finale.

## Conditions et opérateurs

- `===` et `!==` uniquement.
- Comparaisons explicites : `if (targets.length > 0)`, `if (Vehicle.debug === true)`.
- Accolades partout ; `else` sur la ligne de l'accolade fermante.
- Pas de `else` après un `return`.
- Pas de `&&` à la place d'un `if`.
- Parenthèses dès qu'on mélange des opérateurs.

## Mise en forme

- Indentation 2 espaces, espace avant `{`, espaces autour des opérateurs.
- Pas d'espace entre un nom de fonction et `(` : `createCanvas(400, 400);`.
- Pas d'appels chaînés de fonctions de dessin : une instruction par ligne.

## Spécifique p5 / vecteurs

- Vecteurs créés avec `createVector(x, y)`.
- **Méthodes d'instance** (`v.add(w)`) **modifient** `v` ; **méthodes statiques**
  (`p5.Vector.sub(a, b)`) renvoient un **nouveau** vecteur. Utiliser le statique ou
  `copy()` pour ne jamais modifier par erreur `this.pos`, `this.vel` ou ceux d'un autre agent.
- `setMag()`, `limit()`, `heading()`, `dist()`, `magSq()` plutôt que des calculs manuels.
- Toujours encadrer les transformations/styles par `push()` / `pop()`.
- Dessiner un agent orienté : `translate(pos)` puis `rotate(vel.heading())`.
- Mouvement indépendant du framerate : pas obligatoire ici (Reynolds intègre « par frame »),
  mais ne jamais mélanger `deltaTime` et intégration par frame dans un même sketch.
- Mode debug global : `Vehicle.debug` (touche `d`), qui dessine vecteurs, cercles de
  wander, rayons de détection.

## Performance

- Pas de `loadImage()` / `createVector()` inutile dans `draw()` sur des centaines d'agents :
  réutiliser des vecteurs.
- `magSq()` pour les comparaisons de distance.
- Grille spatiale (bin-lattice) au-delà de quelques centaines d'agents.
- Supprimer les agents morts du tableau (missiles hors écran, cibles détruites).

# Steering Behaviors — p5.js (M2 IA2 2025-2026)

Ensemble d'applications [p5.js](https://p5js.org) construites sur les **steering behaviors**
de Craig Reynolds ([article GDC 1999](https://www.red3d.com/cwr/steer/gdc99/)) :
chaque élément animé est un `Vehicle` piloté par des forces (seek, flee, pursue, evade,
arrive, wander, obstacle avoidance, separation, alignment, cohesion…).

## Lancer une application

Chaque dossier numéroté est un sketch autonome (p5.js 1.7.0 embarqué dans `libraries/`).
Ouvrir son `index.html` via un serveur local, par exemple :

- VS Code : extension *Live Server* → clic droit sur `index.html` → *Open with Live Server* ;
- ou en ligne de commande : `npx serve .` puis ouvrir `http://localhost:3000/<dossier>/`.

Touche `d` : mode debug (vecteurs, zones de perception) dans les sketches qui le gèrent.

## Créer une nouvelle application

1. Copier [`_template/`](_template/) vers `N-NomDeLApplication/` (N = numéro suivant).
2. Créer les agents comme **sous-classes de `Vehicle`**, une classe par fichier.
3. Ajouter un `README.md` dans le dossier (`# Titre` puis une ligne de description) :
   il apparaîtra automatiquement dans le tableau ci-dessous.

## Documentation

| Fichier | Contenu |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Règles d'architecture obligatoires (une classe par fichier, tout est `Vehicle`…) |
| [docs/STEERING_BEHAVIORS.md](docs/STEERING_BEHAVIORS.md) | Résumé de l'article de Reynolds, formules, noms de méthodes |
| [docs/P5_BEST_PRACTICES.md](docs/P5_BEST_PRACTICES.md) | Bonnes pratiques de codage p5.js |
| [HANDOFF.md](HANDOFF.md) | État courant du travail, pour passer d'un assistant IA à un autre |
| [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) · [GEMINI.md](GEMINI.md) · [.github/copilot-instructions.md](.github/copilot-instructions.md) | Instructions pour les assistants IA (Codex, Claude, Gemini, Copilot) |

## Applications

<!-- AUTO:PROJECTS:START -->
9 application(s) détectée(s) (tout dossier contenant un `index.html`).

| Dossier | Description | Classes (→ parente) | Comportements implémentés |
|---|---|---|---|
| [_template](_template/) | Template Steering Behaviors — Squelette à copier pour chaque nouvelle application : `Vehicle` de référence (comportements de Reynolds), `Obstacle extends Vehicle`, mode debug (touche `d`), clic pour ajouter un obstacle. | `Obstacle → Vehicle`, `Vehicle` | `seek`, `flee`, `arrive`, `pursue`, `evade`, `wander`, `avoid`, `boundaries`, `separate`, `align`, `cohesion`, `flock` |
| [1-Seek](1-Seek/) | 1-Seek | `Target → Vehicle`, `Vehicle` | `seek`, `flee` |
| [2-PursueEvade](2-PursueEvade/) | 2-PursueEvade | `BouncingBall → Target`, `Target → Vehicle`, `Vehicle` | `seek`, `flee`, `pursue`, `pursuePerfect`, `evade` |
| [2-PursueEvade_correction](2-PursueEvade_correction/) | 2-PursueEvade_correction | `BouncingBall → Target`, `Target → Vehicle`, `Vehicle` | `seek`, `flee`, `pursue`, `pursuePerfect`, `evade` |
| [3-Arrival](3-Arrival/) | 3-Arrival | `Vehicle`, `Target → Vehicle` | `seek`, `flee`, `arrive`, `pursue`, `evade`, `wander`, `boundaries` |
| [3-Arrival_correction](3-Arrival_correction/) | 3-Arrival_correction | `Snake → Vehicle`, `SnakeWander → Snake`, `Vehicle`, `Target → Vehicle` | `seek`, `flee`, `arrive`, `pursue`, `evade`, `wander`, `boundaries` |
| [4-Wander](4-Wander/) | 4-Wander | `Vehicle` | `seek`, `flee`, `arrive`, `pursue`, `evade`, `wander` |
| [5-VaisseauxArcEnCiel](5-VaisseauxArcEnCiel/) | Vaisseaux arc-en-ciel — Vaisseaux (`Ship extends Vehicle`) en errance, réglables depuis un panneau repliable (nombre 1–200, vitesse max, accélération max) ; touche D / case à cocher synchronisées pour le debug (vecteurs vitesse en rouge) ; halo radial arc-en-ciel (`RainbowGradient extends Vehicle`) qui suit la souris avec `arrive()`, entièrement réglable. Spécification : `1-Specification.md`. | `ControlPanel`, `RainbowGradient → Vehicle`, `Ship → Vehicle`, `Vehicle` | `seek`, `flee`, `arrive`, `pursue`, `evade`, `wander`, `avoid`, `boundaries`, `separate`, `align`, `cohesion`, `flock` |
| [6-SnakeIO](6-SnakeIO/) | Snake.io — Jeu façon slither.io entièrement construit sur les steering behaviors : la tête du joueur fait un `seek()` vers la souris, chaque anneau (`Segment extends Vehicle`) suit le précédent avec `arrive()`, les bots (`BotSnake`) combinent `contain`, `avoid`, `evade`, poursuite, `seek` et `wander` par priorités, la nourriture est aspirée par `seek()`, la caméra suit par `arrive()`. Un texte géant animé (`TextFood`, points qui rejoignent leur lettre avec `arrive()`) se mange pour grandir et se reforme. Menu, pause, fin de partie, classement, mini-carte, boost, et mode debug (touche D + panneau de réglages). Spécification : `1-Specification.md`. | `AnimatedText`, `BotSnake → Snake`, `Camera → Vehicle`, `ControlPanel`, `Food → Vehicle`, `Game`, `GameOverScreen`, `Hud`, `Menu`, `PauseScreen`, `PlayerSnake → Snake`, `ScorePopup → Vehicle`, `Segment → Vehicle`, `Snake → Vehicle`, `TextFood → Food`, `Vehicle` | `hide`, `seek`, `flee`, `arrive`, `pursue`, `evade`, `wander`, `avoid`, `boundaries`, `contain`, `separate`, `align`, `cohesion`, `flock` |
<!-- AUTO:PROJECTS:END -->

## Conformité à l'architecture

<!-- AUTO:CONFORMITY:START -->
Écarts à la règle « une classe par fichier, nommé comme la classe » (voir [ARCHITECTURE.md](ARCHITECTURE.md)) :

- 1-Seek : `target.js` devrait s'appeler `Target.js`
- 1-Seek : `vehicle.js` devrait s'appeler `Vehicle.js`
- 2-PursueEvade : `bouncingBall.js` devrait s'appeler `BouncingBall.js`
- 2-PursueEvade : `target.js` devrait s'appeler `Target.js`
- 2-PursueEvade : `vehicle.js` devrait s'appeler `Vehicle.js`
- 2-PursueEvade_correction : `bouncingBall.js` devrait s'appeler `BouncingBall.js`
- 2-PursueEvade_correction : `target.js` devrait s'appeler `Target.js`
- 2-PursueEvade_correction : `vehicle.js` devrait s'appeler `Vehicle.js`
- 3-Arrival : `vehicle.js` contient 2 classes
- 3-Arrival_correction : `snake.js` devrait s'appeler `Snake.js`
- 3-Arrival_correction : `snakeWander.js` devrait s'appeler `SnakeWander.js`
- 3-Arrival_correction : `vehicle.js` contient 2 classes
- 4-Wander : `vehicle.js` devrait s'appeler `Vehicle.js`
<!-- AUTO:CONFORMITY:END -->

## Historique récent

<!-- AUTO:HISTORY:START -->
- 2026-11-23 — 1-Seek: tâches 1 et 2 + documentation du projet (salivx)
<!-- AUTO:HISTORY:END -->

---

### Mise à jour automatique de ce README

Les sections entre marqueurs `<!-- AUTO:… -->` sont **générées** par
[`tools/update-readme.mjs`](tools/update-readme.mjs) (Node ≥ 18) à partir du contenu du
dépôt : ne pas les éditer à la main. Le reste du fichier est libre.

- Automatique : le hook [`.githooks/pre-commit`](.githooks/pre-commit) régénère le README à
  chaque commit. À activer une fois par clone : `git config core.hooksPath .githooks`.
- Manuel : `node tools/update-readme.mjs` (ou `--check` pour vérifier sans écrire).
- Les assistants IA ont pour consigne de le lancer après chaque modification de structure.

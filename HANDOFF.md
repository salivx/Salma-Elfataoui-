# HANDOFF — passation entre assistants IA

Ce fichier permet à un assistant (ou à un humain) de reprendre le travail là où le
précédent l'a laissé. **Le mettre à jour à la fin de chaque session**, en remplaçant les
sections « État actuel » et « Prochaines étapes », et en ajoutant une entrée en tête du
journal.

---

## État actuel

- **Dernière mise à jour :** 2026-11-25 — Claude Code (Claude Opus 5.5)
- **Branche :** `main`
- **Dernière application créée :** `7-NeuroRace/` (course 3D néon contre des IA à réseau de
  neurones, d'après `9-VoitureSuitCircuit` du cours). Spécification `7-NeuroRace/1-Specification.md`,
  tâches 1 (jeu) et 2 (menu « Réseau neuronal ») **faites et testées** (Chrome headless : menu,
  course, 3 caméras, pause, résultats, Labo IA, réglages, debug ; aucune erreur JS).
  - Rendu 3D fait main en p5 2D (`Renderer3D` : projection perspective + algorithme du peintre).
  - Coureurs IA = `Runner extends Vehicle` : 7 rayons (`Ray`) + vitesse → `NeuralNetwork` 8→12→2
    (JS pur, pas TensorFlow) → force `desired - vel`. Cerveaux pré-entraînés dans `brains.js`.
  - Joueur = `PlayerRunner extends Runner` : `arrive()` vers le pointeur, ou flèches (direction écran).
  - `Population` : algorithme génétique configurable via `NeuroSettings` (réglages en localStorage).
  - Ne pas changer `TRACK_W`, `SIGHT`, `RAY_ANGLES`, `MAX_SPEED`, `MAX_FORCE` dans `config.js` :
    les cerveaux pré-entraînés ne sauraient plus conduire.
- **Application précédente :** `6-SnakeIO/` (jeu façon slither.io), spécification
  `6-SnakeIO/1-Specification.md`, tâche 1 **faite et testée** (Chrome headless : menu,
  partie, debug, texte mangé, fin de partie, pause ; aucune erreur JS ; ~60 FPS avec
  15 serpents et ~1600 nourritures).
  - Classes : `Snake`, `Segment`, `PlayerSnake`, `BotSnake`, `Food`, `TextFood`, `Camera`,
    `ScorePopup` (tous des `Vehicle`) ; `AnimatedText`, `Game`, `Hud`, `Menu`,
    `PauseScreen`, `GameOverScreen`, `ControlPanel` (gestion / interface).
  - Le `Vehicle.js` de `6-SnakeIO/` a un comportement en plus : `contain(region, margin,
    prediction)` (containment avec position prédite). À reporter dans `_template/` si utile.
  - Texte animé : `AnimatedText` dessine le mot dans un `p5.Graphics` hors écran et lit ses
    pixels (pas de fichier de police) ; chaque point est un `TextFood` qui `arrive()` à sa
    place, se mange (valeur 2), réapparaît au loin et revient.
- **Application précédente :** `5-VaisseauxArcEnCiel/1-Specification.md`.
  - Tâche 1 (curseurs vaisseaux + debug D/checkbox) : **faite et testée** (Chromium headless :
    D coche la case, la case remet `Vehicle.debug` à false, aucune erreur console).
  - Tâche 2 (dégradé radial arc-en-ciel qui suit la souris) : **faite et testée** (capture OK).
  - Tâche 3 : pas encore spécifiée.
- **Application `5-VaisseauxArcEnCiel/` :**
  - `ControlPanel.js` : panneau DOM fixe en haut, semi-transparent, repliable
    (`<details>` natif pour le panneau et chaque section). API : `addSection()`,
    `addSlider(label, min, max, valeur, step, onChange)`, `addCheckbox(label, coché, onChange)`.
  - `Ship.js` (`Ship extends Vehicle`) : wander + separate + boundaries ; vecteur vitesse
    rouge en debug.
  - `sketch.js` : curseurs nombre (1–200, pas 1), vitesse max (0–20, pas 0.01),
    accélération max = `maxForce` (0–10, pas 0.01). `setDebug()` est le point unique qui
    synchronise touche D (d ou D) et case à cocher.
  - `RainbowGradient.js` (`RainbowGradient extends Vehicle`) : le centre du dégradé suit la
    souris avec `arrive()` ; rendu via `drawingContext.createRadialGradient` (une teinte
    HSL tous les 10°, opacité décroissante vers le bord), rotation des teintes et pulsation
    du rayon. Section « Dégradé arc-en-ciel » du panneau : rayon, cycles, rotation,
    saturation, luminosité, opacité, pulsation (amplitude, vitesse), suivi (vitesse max,
    force max, rayon de freinage). Dessiné avant les vaisseaux (arrière-plan).
- **Ce qui fonctionne (infrastructure) :**
  - Documentation : `ARCHITECTURE.md`, `docs/STEERING_BEHAVIORS.md`, `docs/P5_BEST_PRACTICES.md`.
  - Instructions IA : `AGENTS.md` (commun), `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`.
  - `_template/` : `Vehicle.js` de référence (seek, flee, arrive, pursue, evade, wander,
    avoid, boundaries, separate, align, cohesion, flock), `Obstacle extends Vehicle`,
    `utils.js`, sketch de démonstration (errance + évitement, touche `d`, clic = obstacle).
  - README auto-généré : `tools/update-readme.mjs` + hook `.githooks/pre-commit`.
- **Ce qui ne fonctionne pas / limites connues :**
  - Le hook doit être activé dans chaque clone : `git config core.hooksPath .githooks`.
  - Comportements de Reynolds **pas encore** dans `Vehicle` : `offsetPursue`, `followPath`
    (nécessite une classe `Path`), `follow` (flow field, classe `FlowField`), `followWall`,
    `avoidCollisions`, `followLeader`, `interpose`, `hide`.
  - Les dossiers de cours `1-Seek` … `4-Wander` ne respectent pas le nommage
    (`vehicle.js` en minuscules, deux classes dans certains `vehicle.js`). Volontairement
    non modifiés ; voir la section « Conformité » du README.

## Prochaines étapes suggérées

1. Attendre la tâche 3 de `5-VaisseauxArcEnCiel/1-Specification.md`.
2. `6-SnakeIO` : pistes possibles — sons (attention p5.sound + `file://`), contrôle tactile,
   grille spatiale si on monte à 40 bots / 3000 nourritures, reporter `contain()` dans
   `_template/Vehicle.js`.
3. Ajouter à `Vehicle` les comportements manquants au fur et à mesure des besoins (avec
   les noms de `docs/STEERING_BEHAVIORS.md`).

## Décisions prises (ne pas remettre en cause sans l'utilisatrice)

- p5.js reste en **1.7.0** (fichiers locaux) ; pas de migration 2.x.
- Fichiers nommés comme leur classe en PascalCase : la classe de base est `Vehicle` dans
  `Vehicle.js`.
- Les comportements renvoient des forces ; seule `applyBehaviors()` les applique.
- Pas de npm, pas de bundler : Node sert uniquement au script de README.
- Les spécifications de l'utilisatrice sont rangées dans le dossier de l'application
  (`N-Nom/1-Specification.md`, `2-Specification.md`…).
- L'interface DOM (panneau, curseurs) n'est pas un `Vehicle` ; seuls les éléments dessinés
  sur le canevas le sont.
- **HANDOFF.md est mis à jour après chaque opération** (chaque tâche), pas seulement en
  fin de session.

## Contexte utile / pièges

- **p5.sound bloque `setup()` quand la page est ouverte en `file://`** (double-clic sur
  `index.html`) : écran noir avec « Loading... », sans erreur console. Ne charger
  `p5.sound.min.js` que si l'application utilise le son, et dans ce cas passer par un
  serveur local (Live Server). Retiré de `_template/` et de `5-VaisseauxArcEnCiel/`.
- Pour tester en headless : `page.evaluate` (patchright) s'exécute dans un monde isolé
  et ne voit pas les globales p5 ; injecter un `<script>` (`page.addScriptTag`) à la place.
- `p5.Vector.sub(a, b)` crée un nouveau vecteur ; `a.sub(b)` modifie `a`.
- L'article de Reynolds contient une coquille pour *seek* (`position - target`) : la bonne
  formule est `target - position`.
- `index.html` : charger la classe parente avant les sous-classes, sinon
  `ReferenceError: Vehicle is not defined`.

---

## Journal des sessions (le plus récent en haut)

### 2026-11-25 — Claude Code (Claude Opus 5.5) — 7-NeuroRace, tâches 1 et 2
- Fait : jeu de course 3D (menu, pause, résultats, record, classement, 3 caméras V, cerveau du
  rival en direct N, debug D), Labo IA (neuro-évolution en direct) et menu « Réseau neuronal »
  (neurones cachés, activation, rayons, champ de vision, population, mutation, croisement,
  élitisme, fitness, préréglages).
- Pièges : la caméra (`CameraRig`) appelle `arrive()` avec `Vehicle.debug` coupé, sinon le cercle
  de debug se dessine en coordonnées plan ; `D` sert au debug, donc la conduite clavier est aux
  flèches ; le joueur glisse le long des murs (seuls les blocs pare-feu étourdissent).

### 2026-11-24 — Claude Code (Claude Opus 5.5) — 6-SnakeIO, texte animé
- Fait : le premier mot du texte géant est « SALMA » (au lieu de « SNAKE.IO »), demande de
  l'utilisatrice. Fichiers : `6-SnakeIO/Game.js`, `6-SnakeIO/1-Specification.md`.

### 2026-11-24 — Claude Code (Claude Opus 5.5) — 6-SnakeIO, tâche 1
- Fait : jeu snake.io complet (menu pseudo/couleur/difficulté, pause, fin de partie avec
  record en localStorage, classement, mini-carte, boost, caméra qui suit et dézoome),
  bots à priorités (contain > avoid > evade > chasse > seek nourriture > wander), texte
  géant animé mangeable, mode debug D + panneau de réglages (god mode, G/B/K).
- Fichiers : tout le dossier `6-SnakeIO/` (créé depuis `_template/`, `Obstacle.js` retiré,
  `ControlPanel.js` repris de `5-VaisseauxArcEnCiel/`).
- Pièges : un `Segment` suit avec `arrive(cible, maxSpeed)` (slowRadius = maxSpeed → gain 1,
  pas d'oscillation) ; la saisie du pseudo ne doit pas déclencher les raccourcis
  (test `document.activeElement` dans `keyPressed`) ; le boost souris n'est activé que
  par un clic sur le canevas (`canvas.mousePressed`) pour ignorer les clics du menu.

### 2026-11-23 — Claude Code (Claude Opus 5.5) — Correctif écran noir
- Symptôme : `5-VaisseauxArcEnCiel/index.html` ouvert par double-clic → écran noir.
- Cause : `p5.sound.min.js` empêche p5 d'appeler `setup()` en `file://`.
- Fait : suppression de p5.sound dans `5-VaisseauxArcEnCiel/` et `_template/` ; test
  headless OK (tâches 1 et 2 vérifiées visuellement).

### 2026-11-23 — Claude Code (Claude Opus 5.5) — Spécification 1, tâche 2
- Fait : `RainbowGradient extends Vehicle` (suit la souris par `arrive()`), 11 curseurs
  dans une nouvelle section du panneau.
- Fichiers : `RainbowGradient.js`, `sketch.js`, `index.html`, `README.md` de l'application.
- Reste à faire : test navigateur ; tâche 3 (non spécifiée).
- Pièges : le dégradé est dessiné avec l'API Canvas 2D (`drawingContext`) entre
  `push()`/`pop()` ; ne pas appeler `fill()` de p5 entre l'affectation de `fillStyle` et
  `ctx.fill()`.

### 2026-11-23 — Claude Code (Claude Opus 5.5) — Spécification 1, tâche 1
- Fait : création de `5-VaisseauxArcEnCiel/` depuis `_template/` ; panneau de réglages
  repliable ; curseurs nombre / vitesse / accélération ; debug synchronisé D + case.
- Fichiers : `1-Specification.md`, `ControlPanel.js`, `Ship.js`, `sketch.js`,
  `index.html`, `style.css`, `README.md`, copies de `Vehicle.js` et `utils.js`.
- Reste à faire : tâche 2, test navigateur.
- Pièges : en debug, `Vehicle.wander()` dessine aussi son cercle d'errance (en plus des
  vecteurs vitesse rouges demandés).

### 2026-11-23 — Claude Code (Claude Opus 5.5)
- Lecture de l'article de Reynolds et du guide de style p5.js ; rédaction des docs.
- Création de `ARCHITECTURE.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
  `.github/copilot-instructions.md`, `HANDOFF.md`, `README.md` auto-généré.
- Création de `_template/` (Vehicle de référence + Obstacle).
- Hook git activé localement (`core.hooksPath = .githooks`).

<!--
Modèle d'entrée de journal :

### AAAA-MM-JJ — <assistant> (<modèle>)
- Fait : …
- Fichiers touchés : …
- Reste à faire : …
- Pièges : …
-->

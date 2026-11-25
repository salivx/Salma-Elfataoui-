# NeuroRace — Spécification

## Tâche 1 — Jeu de course contre des réseaux de neurones

Dans l'esprit de `9-VoitureSuitCircuit genetic algo` (M. Buffa), transformer la voiture
qui apprend un circuit par neuro-évolution en **vrai jeu** :

- vue **3D** de tout le circuit, style néon / tech, caméra qu'on peut changer ;
- un **menu** (pseudo, couleur, difficulté, nombre de tours), une **pause**, un écran de **résultats** ;
- le joueur court contre **5 coureurs IA** : chacun a des **rayons-capteurs** et un **réseau de neurones**
  qui choisit direction et vitesse ;
- des obstacles et bonus sur la piste ;
- un **Labo IA** : l'algorithme génétique entraîne une population en direct, puis on court contre son IA ;
- un mode **debug** (touche D) avec panneau de réglages.

### Règles retenues

- Le coureur avance tout seul. ← → braquent, ↓ freine. V change de caméra (3D / dessus / poursuite).
- Mur ou bloc pare-feu touché : crash, 40 frames d'étourdissement, retour au dernier checkpoint.
- Flèches cyan = turbo (×1,55 pendant 70 frames). Zone violette = bug (vitesse ÷ 2).
- Cristaux de data : +1, réapparaissent à chaque tour.
- Classement en direct = checkpoints franchis (comme la fitness du cours), puis distance au prochain.

### Neuro-évolution (comme 9-VoitureSuitCircuit)

- Entrées : 7 rayons (-90°, -50°, -25°, 0°, 25°, 50°, 90°, portée 160) + vitesse → 8 entrées.
- Réseau 8 → 12 (tanh) → 2 : angle de braquage (±0,9 rad) et vitesse (35 à 100 %).
- La sortie devient une force de pilotage de Reynolds : `desired − vel`, limitée à `maxForce`.
- Fitness = checkpoints², sélection par roulette, croisement uniforme, mutation gaussienne, élitisme.
- Mort pendant l'entraînement : mur touché, ou 90 frames sans nouveau checkpoint. Génération : 30 s max.
- Les rivaux utilisent 3 cerveaux pré-entraînés (`brains.js`, générations 3, 4 et 60).
- Réseau de neurones en JavaScript pur (pas TensorFlow.js) : plus rapide, marche hors-ligne.

### Architecture (une classe par fichier)

| Classe | Rôle |
|---|---|
| `Vehicle` | classe de base du cours (`common/vehicle.js`) |
| `Runner extends Vehicle` | coureur IA : rayons, cerveau, checkpoints, crash, rendu androïde 3D |
| `PlayerRunner extends Runner` | le joueur : le clavier remplace le réseau |
| `Obstacle extends Vehicle` | bloc pare-feu (ses 4 côtés sont des murs vus par les rayons) |
| `BoostPad`, `GlitchField`, `DataShard extends Vehicle` | turbo, zone de bug, cristal de data |
| `Building extends Vehicle` | tours de la ville néon (décor) |
| `Particle`, `ScorePopup extends Vehicle` | étincelles, textes « +1 DATA », « TURBO ! » |
| `CameraRig extends Vehicle` | caméra 3D, son point de visée suit la cible avec `arrive()` |
| `Ray`, `Boundary`, `NeuralNetwork`, `Population` | capteur, mur, cerveau, algorithme génétique |
| `Track`, `WallSegment` | circuit (simulation) et rendu d'un mur |
| `Renderer3D` | projection perspective + algorithme du peintre, en p5.js 2D |
| `Game`, `Hud` | états du jeu, boucle, HUD |
| `Menu`, `PauseScreen`, `ResultsScreen`, `LabScreen`, `ControlPanel` | interface DOM |

### Debug (touche D)

Rayons-capteurs, checkpoints, vecteurs vitesse, réseau de neurones du leader (Labo), ville on/off,
taux de mutation, nombre et vitesse des rivaux, FPS et compteurs.

## Tâche 2 — Menu « Réseau neuronal »

Écran accessible depuis le menu principal et le Labo IA (`NeuroSettings`), avec aperçu en direct
(éventail des rayons + schéma du réseau) et 5 préréglages (Équilibré, Rapide, Cerveau XXL, Myope, Chaos) :

- **Réseau** : neurones cachés (2–32), activation (tanh, ReLU, sigmoïde).
- **Capteurs** : nombre de rayons (1–15), champ de vision (30–300°), portée (40–320 px).
- **Algorithme génétique** : population (10–250), taux et force de mutation, croisement oui/non,
  élitisme (0–10), fitness = checkpoints ^ 1, 2 ou 3.
- **Simulation** : durée d'une génération, patience sans checkpoint, vitesse max.

« Lancer le Labo » enregistre les réglages (localStorage) et relance l'évolution. « Mon IA » garde les
capteurs avec lesquels elle a été entraînée. Les rivaux de la course gardent leurs cerveaux pré-entraînés.

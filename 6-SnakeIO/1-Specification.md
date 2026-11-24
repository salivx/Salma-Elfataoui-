# 6-SnakeIO — Spécification

## Tâche 1 — Jeu snake.io

Dans le même esprit que le cours (M. Buffa, steering behaviors de Craig Reynolds), créer un
jeu de snake façon **slither.io** :

- un **menu** (pseudo, couleur, difficulté, bouton Jouer), une pause, un écran de fin ;
- un mode **debug** (touche D) avec panneau de réglages et affichage des forces ;
- un **texte animé** que les serpents peuvent **manger pour grandir**.

### Règles de jeu retenues

- Souris : diriger. Clic maintenu ou Espace : boost (coûte de la longueur, sème de la nourriture).
- Manger la nourriture fait grandir (score, longueur et épaisseur).
- Toucher le corps d'un autre serpent ou le bord du monde = mort ; le serpent mort se
  transforme en nourriture. Tête contre tête : le plus petit meurt.
- Monde de 4000 × 4000 avec caméra qui suit le joueur et dézoome quand il grossit.
- Texte géant au centre du monde (« SNAKE.IO », « MANGE-MOI », « STEERING »…) : ses points
  valent 2, réapparaissent au loin quand ils sont mangés et reviennent reformer la lettre ;
  le mot change régulièrement et les points volent vers leur nouvelle place.

### Architecture (une classe par fichier)

| Classe | Rôle | Comportements |
|---|---|---|
| `Snake extends Vehicle` | tête + liste de segments, croissance, boost, rendu | — |
| `Segment extends Vehicle` | anneau du corps | `arrive()` derrière l'anneau précédent |
| `PlayerSnake extends Snake` | joueur | `seek()` vers la souris |
| `BotSnake extends Snake` | IA | `contain` > `avoid` > `evade` > chasse (`seek` devant la proie) > `seek` nourriture > `wander` |
| `Food extends Vehicle` | nourriture | `seek()` vers la tête proche (aimant), sinon freinage |
| `TextFood extends Food` | point du texte animé | `arrive()` vers sa place dans la lettre |
| `Camera extends Vehicle` | point de vue | `arrive()` vers le joueur |
| `ScorePopup extends Vehicle` | texte « +2 », « Élimine X ! » | `arrive()` vers le haut |
| `AnimatedText` | calcule les points des lettres (p5.Graphics) | — |
| `Game` | états, boucle, collisions, panneau de debug | — |
| `Menu`, `PauseScreen`, `GameOverScreen`, `ControlPanel` | interface DOM | — |
| `Hud` | score, classement, mini-carte, infos debug | — |

Nouveau comportement générique ajouté à `Vehicle` : `contain(region, margin, prediction)`
(containment de Reynolds avec position prédite).

### Debug (touche D)

Panneau de réglages (nombre de bots, nourriture, vitesse joueur / bots, force, perception,
agressivité, durée d'un mot, zoom auto, mini-carte, god mode), vecteurs vitesse, cercles de
collision, rayon de perception et état des bots (« mange », « chasse », « fuit »…),
lignes d'aimantation de la nourriture, FPS et compteurs. Raccourcis : G (+20), B (+1 bot),
K (se tuer).

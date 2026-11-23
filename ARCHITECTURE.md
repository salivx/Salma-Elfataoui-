# ARCHITECTURE

Règles d'architecture **obligatoires** pour toutes les applications p5.js de ce dépôt.
Elles s'appliquent aux humains comme aux assistants IA (Claude, Codex, Gemini, Copilot…).

Références :
- [docs/STEERING_BEHAVIORS.md](docs/STEERING_BEHAVIORS.md) — les comportements de Craig Reynolds et leurs noms de méthode.
- [docs/P5_BEST_PRACTICES.md](docs/P5_BEST_PRACTICES.md) — style de code p5.js.
- [_template/](_template/) — squelette de départ conforme à ces règles.

---

## Règle 1 — Une classe maximum par fichier

- Un fichier `.js` contient **au plus une classe** de premier niveau.
- Le fichier porte **le nom de la classe** en PascalCase : `class Vehicle` → `Vehicle.js`,
  `class Missile extends Vehicle` → `Missile.js`.
- **Exception : les classes internes** — une petite classe d'aide utilisée *uniquement* par
  la classe du fichier (ex. une structure `Node` privée à `Path`) peut rester dans le même
  fichier. Si elle est utilisée ailleurs, elle a son propre fichier.
- `sketch.js` ne contient **aucune classe** : uniquement `preload()`, `setup()`, `draw()`,
  les gestionnaires d'événements (`keyPressed()`, `mousePressed()`, `windowResized()`…) et
  de petites fonctions utilitaires.
- Les fonctions utilitaires de dessin partagées (ex. `drawArrow()`) vont dans un fichier
  dédié (`utils.js`), pas dans un fichier de classe.

## Règle 2 — Tout élément graphique animé est un `Vehicle`

- Tout ce qui bouge à l'écran est une instance de **`Vehicle`** (fichier `Vehicle.js`) ou
  d'une **sous-classe** de `Vehicle`.
- Son mouvement est produit **uniquement par des steering behaviors** : on calcule des
  forces, on les applique avec `applyForce()`, et `update()` intègre.
  **Interdit :** modifier directement `pos` ou `vel` pour animer un objet
  (`this.pos.x += 2`), sauf dans `edges()` (bouclage d'écran), à l'initialisation, ou pour
  un « téléport » explicite et commenté.
- Cela inclut les éléments « décoratifs » animés : score qui rebondit, particules,
  texte qui arrive à sa place (`arrive()`), étoiles qui errent (`wander()`)…

## Règle 3 — Les éléments fixes qui *pourraient* bouger sont aussi des `Vehicle`

- Obstacles, murs, bonus, cibles, bases… sont des `Vehicle` (ou sous-classes) même s'ils
  sont immobiles aujourd'hui. Un obstacle fixe a simplement `maxSpeed = 0` (ou aucun
  comportement actif) ; le jour où il doit dériver, on lui ajoute `wander()` sans rien
  restructurer.
- Avantage : tout objet a `pos`, `vel`, `r`, `show()`, `update()` → les comportements
  (`avoid()`, `pursue()`, `separate()`…) fonctionnent sur **n'importe quel** objet du monde.

## Règle 4 — Les objets spécialisés sont des sous-classes de `Vehicle`

Joueur, ennemi, vaisseau, missile, score animé, obstacle, leader, boid… :

```js
// Missile.js
class Missile extends Vehicle {
  constructor(x, y, target) {
    super(x, y);
    this.target = target;
    this.maxSpeed = 8;
    this.maxForce = 0.4;
  }

  // Sélection d'action : ce que veut faire le missile.
  applyBehaviors() {
    let force = this.pursue(this.target);
    this.applyForce(force);
  }

  // Apparence propre au missile.
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    rect(-this.r, -this.r / 4, this.r * 2, this.r / 2);
    pop();
  }
}
```

- Une sous-classe **réutilise** les comportements de `Vehicle` ; elle ne les ré-implémente
  pas. Elle redéfinit surtout : le constructeur (paramètres), `applyBehaviors()` (quelle
  combinaison de forces), `show()` (apparence).
- Un nouveau comportement générique (utile à plusieurs types d'agents) va dans `Vehicle`.
  Un comportement spécifique à un seul type d'agent va dans la sous-classe.
- Hiérarchie plus profonde autorisée si elle a du sens (`Enemy extends Vehicle`,
  `Boss extends Enemy`).

## Interface utilisateur (DOM)

Les éléments HTML posés par-dessus le canevas (panneau de réglages, curseurs, cases à
cocher) ne sont **pas** des `Vehicle` : ils ne sont pas dessinés sur le canevas.
Ils respectent quand même la règle 1 (ex. `ControlPanel.js` ne contient que
`class ControlPanel`), et leur style va dans `style.css`.

---

## Contrat de la classe `Vehicle`

| Élément | Rôle |
|---|---|
| `pos`, `vel`, `acc` (`p5.Vector`) | État cinématique |
| `maxSpeed`, `maxForce`, `mass`, `r` | Paramètres de locomotion et taille |
| `static debug` | Affichage des vecteurs/zones de debug (touche `d`) |
| **Comportements** `seek()`, `flee()`, `arrive()`, `pursue()`, `evade()`, `wander()`, `avoid()`, `separate()`, `align()`, `cohesion()`, `boundaries()`… | **Renvoient** une force (`p5.Vector`), **n'appliquent rien**, ne modifient pas l'état. Limitent leur résultat à `maxForce`. |
| `applyBehaviors(...)` | Sélection d'action + combinaison pondérée/prioritaire des forces. Redéfinie par les sous-classes. |
| `applyForce(force)` | `acc += force / mass` |
| `update()` | Intégration d'Euler : `vel += acc`, `limit(maxSpeed)`, `pos += vel`, `acc = 0` |
| `show()` | Dessin, toujours dans `push()`/`pop()` ; aucune logique de mouvement. |
| `edges()` | Bouclage aux bords (optionnel ; préférer `boundaries()` qui est un steering behavior). |

Les noms des comportements suivent la table de [docs/STEERING_BEHAVIORS.md](docs/STEERING_BEHAVIORS.md).
Un comportement non encore implémenté doit être ajouté à `Vehicle` **sous ce nom**.

## Boucle de `draw()`

```js
function draw() {
  background(0);

  // 1. Sélection d'action + pilotage : chaque agent calcule et applique ses forces.
  vehicles.forEach((v) => v.applyBehaviors(vehicles, obstacles));

  // 2. Locomotion : tous les agents bougent APRÈS que tous ont décidé.
  vehicles.forEach((v) => v.update());

  // 3. Rendu.
  obstacles.forEach((o) => o.show());
  vehicles.forEach((v) => v.show());
}
```

Séparer « décider » et « bouger » évite qu'un agent réagisse à des voisins déjà déplacés
dans la même frame.

## Combinaison des forces

1. Chaque comportement renvoie une force limitée à `maxForce`.
2. `applyBehaviors()` les pondère (`force.mult(poids)`) puis les applique.
3. Poids et rayons sont des **propriétés** de l'agent (`this.separationWeight`, …), pour
   pouvoir les régler avec des sliders.
4. Pour la survie, utiliser la **priorité** : si `avoid()` renvoie une force non nulle,
   elle domine (poids fort ou seule force appliquée).

## Organisation d'une application

```
N-NomDeLApplication/
├── index.html        # charge p5, utils.js, Vehicle.js, puis les sous-classes, puis sketch.js
├── style.css
├── sketch.js         # setup/draw/événements, aucune classe
├── Vehicle.js        # classe de base (copiée depuis _template/)
├── Obstacle.js       # class Obstacle extends Vehicle
├── <Autre>.js        # une sous-classe par fichier
├── utils.js          # fonctions utilitaires (optionnel)
├── assets/           # images, sons, polices
├── libraries/        # p5.min.js (1.7.0), p5.sound.min.js
└── README.md         # optionnel : 1ʳᵉ ligne « # Titre », puis description (lu par le README racine)
```

- Nouvelle application : copier `_template/` vers `N-Nom/` (N = numéro suivant).
- Ordre des `<script>` : une sous-classe doit être chargée **après** sa classe parente.
- Les dossiers existants de cours (`1-Seek` … `4-Wander`, fichiers en minuscules) sont
  conservés tels quels ; les règles s'appliquent aux nouvelles applications et à tout
  fichier que l'on refactore.

## Checklist avant commit

- [ ] Une seule classe (hors classe interne) par fichier, fichier nommé comme la classe.
- [ ] Tout objet animé ou potentiellement mobile hérite de `Vehicle`.
- [ ] Aucun déplacement par modification directe de `pos`/`vel` (hors exceptions ci-dessus).
- [ ] Les comportements renvoient des forces ; seule `applyBehaviors()` applique.
- [ ] `index.html` charge les classes parentes avant les sous-classes.
- [ ] Le mode debug (`d`) montre les forces/zones utiles.
- [ ] `README.md` racine à jour (`node tools/update-readme.mjs`, automatique via le hook).
- [ ] `HANDOFF.md` mis à jour si le travail est en cours.

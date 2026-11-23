# Steering Behaviors — référence (d'après Craig Reynolds, GDC 1999)

Source : Craig W. Reynolds, *Steering Behaviors For Autonomous Characters*, GDC 1999 —
<https://www.red3d.com/cwr/steer/gdc99/>.
Complément : Daniel Shiffman, *The Nature of Code*, chap. 5 « Autonomous Agents » —
<https://natureofcode.com/autonomous-agents/>.

Ce document résume l'article et fixe **le nom de la méthode** que chaque comportement
doit porter dans la classe `Vehicle` de ce projet (voir [ARCHITECTURE.md](../ARCHITECTURE.md)).

---

## 1. La hiérarchie de mouvement en 3 niveaux

| Niveau | Rôle | Où dans le code |
|---|---|---|
| **Sélection d'action** | Choisit le but (« attraper la cible », « fuir », « errer »). Changements d'état discrets. | `sketch.js` ou méthode `applyBehaviors()` d'une sous-classe (machine à états) |
| **Pilotage (steering)** | Transforme le but en **force de pilotage** (un vecteur). | Méthodes de comportement de `Vehicle` : `seek()`, `arrive()`, `wander()`… |
| **Locomotion** | Transforme la force en mouvement, sous contraintes physiques. | `Vehicle.applyForce()` + `Vehicle.update()` |

Les niveaux sont indépendants : on peut changer de locomotion (vaisseau, serpent, poisson)
sans toucher aux comportements.

## 2. Le modèle de véhicule simple

Un véhicule est un **point matériel** :

| Attribut Reynolds | Propriété JS | Type |
|---|---|---|
| mass | `this.mass` | nombre (1 par défaut) |
| position | `this.pos` | `p5.Vector` |
| velocity | `this.vel` | `p5.Vector` |
| max_force | `this.maxForce` | nombre |
| max_speed | `this.maxSpeed` | nombre |
| orientation | `this.vel.heading()` (2D) | angle |

Intégration d'Euler (une fois par frame) :

```
steering_force = truncate(steering_direction, max_force)
acceleration   = steering_force / mass
velocity       = truncate(velocity + acceleration, max_speed)
position       = position + velocity
```

En p5 :

```js
applyForce(force) {
  this.acc.add(p5.Vector.div(force, this.mass));
}

update() {
  this.vel.add(this.acc);
  this.vel.limit(this.maxSpeed);
  this.pos.add(this.vel);
  this.acc.set(0, 0);
}
```

Règle universelle de pilotage : **`steering = desired_velocity - velocity`**, puis
`limit(maxForce)`.

> ⚠️ L'article imprime `desired_velocity = normalize(position - target) * max_speed` pour
> *seek* : c'est une coquille. Le texte dit que la vitesse désirée pointe **vers** la cible,
> donc `target - position`.

---

## 3. Comportements individuels

### Seek — `seek(target)`
```
desired  = normalize(target - pos) * maxSpeed
steering = desired - vel        → limit(maxForce)
```
Sans freinage, le véhicule dépasse la cible et revient « comme un papillon de nuit ».

### Flee — `flee(target)`
Inverse de seek : `desired` pointe à l'opposé de la cible. Option : n'agir que si la cible
est à moins d'une distance de détection.

### Pursuit — `pursue(vehicle)`
Seek vers la **position future** de la cible, supposée à vitesse constante :
```
T          = distance(pos, target.pos) * c       // ex. c = 1 / maxSpeed
prediction = target.pos + target.vel * T
steering   = seek(prediction)
```
Ramener T vers 0 quand le poursuivant est déjà aligné devant la cible.

### Evasion — `evade(vehicle)`
Même prédiction que pursuit, puis **flee** du point prédit.

### Offset pursuit — `offsetPursue(vehicle, offset)`
Viser un point décalé latéralement de R par rapport à la trajectoire prédite de la cible
(passer à côté, frôler) : localiser la prédiction dans le repère du véhicule, garder la
composante latérale, la normaliser, la multiplier par −R, revenir au repère monde, seek.

### Arrival — `arrive(target, slowRadius)`
Seek loin de la cible, freinage linéaire dans un rayon de ralentissement :
```
offset   = target - pos
d        = |offset|
ramped   = maxSpeed * (d / slowRadius)
clipped  = min(ramped, maxSpeed)
desired  = (clipped / d) * offset
steering = desired - vel
```

### Obstacle avoidance — `avoid(obstacles)`
- Obstacles et véhicule approximés par des cercles (`r`).
- On imagine un **couloir** (cylindre en 3D) devant le véhicule, de largeur = son diamètre et
  de longueur proportionnelle à sa vitesse.
- Pour chaque obstacle : ignorer s'il est derrière, trop loin, ou si sa distance latérale
  à l'axe est > `obstacle.r + this.r`.
- L'obstacle le plus menaçant = le plus proche qui coupe le couloir.
- Force = composante **latérale** opposée au centre de l'obstacle. Zéro si rien à éviter.
- Différent de *flee* : n'agit que si l'obstacle est **devant**, pas quand on le longe.

### Wander — `wander()`
Errance cohérente (pas de hasard pur, qui donne un mouvement saccadé) :
- un cercle placé à `wanderDistance` devant le véhicule, de rayon `wanderRadius` ;
- un point sur ce cercle, à l'angle `wanderTheta`, qui bouge un peu à chaque frame
  (`wanderTheta += random(-displaceRange, displaceRange)`) ;
- la force pointe vers ce point.
Rayon du cercle = force maximale de l'errance ; `displaceRange` = vitesse de variation.
Variante : bruit de Perlin (`noise()`).
Dérivés : *explore* (couvrir une zone), *forage* (errance + recherche de ressources).

### Path following — `followPath(path)`
- Un chemin = une « colonne vertébrale » (polyligne) + un rayon → un tube.
- Prédire la position future, la projeter sur le chemin (point normal).
- Si elle est dans le tube : aucune correction. Sinon : seek vers un point du chemin un peu
  plus loin que la projection (cela impose le sens de parcours).

### Wall following — `followWall(walls, offset)`
S'approcher d'une surface et la longer à une distance fixe (cousin de offset pursuit).

### Containment — `boundaries(margin)` / `contain(region)`
- Prédire la position future. Si elle est dans la zone autorisée : rien.
- Sinon : seek vers un point intérieur, ou utiliser la normale de la paroi comme force latérale.
- Path following = containment dans un tube.

### Flow field following — `follow(flowField)`
Lire le champ de vecteurs à la position future : c'est la vitesse désirée `F`.
`steering = F - vel`.

### Unaligned collision avoidance — `avoidCollisions(vehicles)`
Pour chaque autre véhicule, calculer l'instant et le lieu de **plus proche approche** à
partir des vitesses actuelles. Si cet instant est dans le futur et la distance alors trop
petite : choisir la collision la plus proche, s'écarter latéralement et accélérer/ralentir
pour passer avant/après.

---

## 4. Comportements de groupe

Tous utilisent un **voisinage** : une distance (et éventuellement un angle de vision).
Les véhicules hors voisinage sont ignorés.

### Separation — `separate(vehicles, radius)`
Pour chaque voisin : `(pos - voisin.pos)` normalisé et pondéré par `1/d` ; on somme, puis
`desired - vel`. Évite l'entassement.

### Cohesion — `cohesion(vehicles, radius)`
Seek vers le **centre de gravité** (position moyenne) des voisins.

### Alignment — `align(vehicles, radius)`
Vitesse désirée = **moyenne des vitesses** des voisins ; `steering = moyenne - vel`.

### Flocking — `flock(vehicles)`
Separation + Cohesion + Alignment, chaque force pondérée :
`w_sep * separate + w_ali * align + w_coh * cohesion`.
9 paramètres : poids, distance, angle pour chacun des trois.

### Leader following — `followLeader(leader, followers)`
- Arrival vers un point **derrière** le leader (`leader.pos - leader.vel.setMag(d)`).
- Si un suiveur est dans la zone **devant** le leader : il s'écarte (evade/flee) de sa route.
- Separation entre suiveurs.

### Autres comportements cités
- **Interpose** `interpose(a, b)` : seek vers le milieu des positions futures de deux agents.
- **Hide** `hide(target, obstacles)` : seek vers un point derrière un obstacle, à l'opposé de la menace.
- **Shadow** : approcher puis aligner vitesse et cap.
- **Docking** : arrival avec contrainte d'orientation finale.

---

## 5. Combiner les comportements

| Méthode | Principe | Quand l'utiliser |
|---|---|---|
| **Commutation** (sélection d'action) | Un seul comportement actif selon l'état (errer → fuir). | Machine à états d'un agent |
| **Somme pondérée** | `Σ wᵢ · forceᵢ` | Cas par défaut (flocking, wander + avoid) |
| **Priorité** | On teste dans l'ordre, on garde la 1ʳᵉ force non nulle. | La survie d'abord : `avoid` avant `seek` |
| **Priorité tramée** (*prioritized dithering*) | Le comportement prioritaire est évalué avec une probabilité p. | Performances, beaucoup d'agents |

Dans ce projet : chaque comportement **renvoie** une force ; la combinaison (poids,
priorités) se fait dans `applyBehaviors()` ; puis `applyForce()` une fois par force.

## 6. Performance (beaucoup d'agents)

- Comparer des distances au carré (`magSq()`) plutôt que `mag()` quand c'est possible.
- Partitionner l'espace (grille / *bin-lattice*) pour ne tester que les voisins proches.
- Réutiliser des vecteurs (`set()`) au lieu d'en créer dans les boucles chaudes.

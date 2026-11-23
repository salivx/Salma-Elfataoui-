# Instructions GitHub Copilot

Projet : applications p5.js 1.7.0 (mode global, JavaScript pur, sans build) fondées sur les
steering behaviors de Craig Reynolds. Langue : français (commentaires, docs, commits).
Règles complètes : `AGENTS.md`, `ARCHITECTURE.md`, `docs/STEERING_BEHAVIORS.md`,
`docs/P5_BEST_PRACTICES.md`. État du travail : `HANDOFF.md`.

## Règles d'architecture

- Une classe maximum par fichier (sauf classe interne privée) ; le fichier porte le nom de
  la classe (`Missile.js` → `class Missile`). `sketch.js` ne contient aucune classe.
- Tout élément graphique animé est un `Vehicle` (`Vehicle.js`) ou une sous-classe.
- Les éléments fixes qui pourraient bouger (obstacles, murs, bonus) sont aussi des
  `Vehicle` (`maxSpeed = 0`).
- Joueur, ennemi, vaisseau, missile, score animé… = `class X extends Vehicle`, qui redéfinit
  `applyBehaviors()` et `show()`.
- Le mouvement passe uniquement par les steering behaviors : jamais `this.pos.x += …` pour
  animer (seule exception : `edges()`).

## Steering behaviors

- Les comportements renvoient une force `p5.Vector` et n'appliquent rien :
  `seek`, `flee`, `arrive`, `pursue`, `evade`, `wander`, `avoid`, `separate`, `align`,
  `cohesion`, `flock`, `boundaries`, `followPath`, `follow`, `followLeader`.
- `steering = p5.Vector.sub(desired, this.vel); steering.limit(this.maxForce);`
- Combinaison pondérée dans `applyBehaviors()` : `force.mult(this.poids); this.applyForce(force);`
- `update()` : `vel.add(acc)`, `vel.limit(maxSpeed)`, `pos.add(vel)`, `acc.set(0, 0)`.
- Dans `draw()` : décider (tous), puis bouger (tous), puis dessiner.

## Style p5.js

- `let` (`const` pour les constantes), guillemets simples, `===`, points-virgules,
  indentation 2 espaces.
- `p5.Vector.sub(a, b)` (nouveau vecteur) plutôt que `a.sub(b)` quand `a` ne doit pas être
  modifié ; `copy()` avant de modifier le vecteur d'un autre agent.
- Dessin toujours entre `push()` et `pop()`.
- Ressources dans `assets/`, chargées dans `preload()`.
- Ne pas générer de code p5.js 2.x (`async setup`, etc.).

## Après une modification

Lancer `node tools/update-readme.mjs` et mettre à jour `HANDOFF.md`.

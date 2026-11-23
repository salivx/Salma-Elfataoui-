# AGENTS.md — instructions pour les assistants IA

Fichier de référence commun à tous les assistants (OpenAI Codex, Cursor, Aider… lisent
`AGENTS.md` ; Claude, Gemini et Copilot ont leur propre fichier qui renvoie ici).

## Le projet

Applications p5.js (mode global, **p5.js 1.7.0** embarqué dans `libraries/`) fondées sur les
**steering behaviors** de Craig Reynolds. Langue du projet : **français** (commentaires,
docs, messages de commit). JavaScript pur, sans bundler ni npm ; chaque dossier
`N-Nom/` est une application autonome ouverte via `index.html`.

## À lire avant toute modification

1. [HANDOFF.md](HANDOFF.md) — où en est le travail, ce qui reste à faire.
2. [ARCHITECTURE.md](ARCHITECTURE.md) — règles obligatoires.
3. [docs/STEERING_BEHAVIORS.md](docs/STEERING_BEHAVIORS.md) — comportements et noms de méthodes.
4. [docs/P5_BEST_PRACTICES.md](docs/P5_BEST_PRACTICES.md) — style de code.

## Règles non négociables

1. **Une classe maximum par fichier** (sauf classe interne privée), fichier nommé comme la
   classe : `Missile.js` contient `class Missile`. `sketch.js` ne contient aucune classe.
2. **Tout élément graphique animé est un `Vehicle`** (`Vehicle.js`) ou une sous-classe, et
   se déplace **uniquement via des steering behaviors** (forces → `applyForce()` →
   `update()`). Ne jamais animer en modifiant `pos`/`vel` directement.
3. **Les éléments fixes qui pourraient bouger** (obstacles, murs, bonus…) sont aussi des
   `Vehicle` (ex. `Obstacle extends Vehicle` avec `maxSpeed = 0`).
4. **Objets spécialisés = sous-classes de `Vehicle`** (joueur, ennemi, vaisseau, missile,
   score animé…). Elles redéfinissent `applyBehaviors()` et `show()`, et réutilisent les
   comportements hérités.
5. Les comportements (`seek`, `flee`, `arrive`, `pursue`, `evade`, `wander`, `avoid`,
   `separate`, `align`, `cohesion`, `boundaries`, `followPath`…) **renvoient une force**
   limitée à `maxForce` et n'appliquent rien. Utiliser les noms de
   `docs/STEERING_BEHAVIORS.md`.
6. Formule de pilotage : `steering = desired - velocity`, puis `limit(maxForce)`.
7. Dans `draw()` : tous les agents décident (`applyBehaviors`), puis tous bougent
   (`update`), puis tout est dessiné (`show`).
8. Dans `index.html`, une classe parente est chargée **avant** ses sous-classes ; `sketch.js`
   en dernier.

## Méthode de travail

- Nouvelle application : copier `_template/` vers `N-Nom/`, ajouter un `README.md` local
  (`# Titre` + une ligne de description).
- Ne pas modifier les dossiers de cours existants (`1-Seek` … `4-Wander`) sans demande
  explicite.
- Ne pas mettre à jour p5.js vers 2.x sans demande explicite (API différente).
- Ne pas ajouter de dépendance npm ni d'outil de build.
- Vérifier visuellement le sketch dans un navigateur quand c'est possible (console sans
  erreur, touche `d` pour le debug).

## Après chaque opération (chaque tâche d'une spécification)

Mettre à jour [HANDOFF.md](HANDOFF.md) **immédiatement**, sans attendre la fin de la
session. Les spécifications sont rangées dans le dossier de l'application :
`N-Nom/1-Specification.md`, `N-Nom/2-Specification.md`…

## Après chaque session de travail

1. `node tools/update-readme.mjs` — régénère les sections automatiques du `README.md`
   (également fait par le hook `.githooks/pre-commit`). Ne jamais éditer à la main le
   contenu entre les marqueurs `<!-- AUTO:… -->`.
2. Mettre à jour [HANDOFF.md](HANDOFF.md) : ce qui a été fait, état, prochaines étapes,
   pièges rencontrés.
3. Commits en français, au présent, courts : `Ajoute la sous-classe Missile (pursue)`.

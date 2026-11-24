// PlayerSnake : le serpent du joueur. Sa tête fait un seek vers la souris
// (convertie en coordonnées monde par la caméra). Clic maintenu ou espace = boost.
class PlayerSnake extends Snake {
  constructor(x, y, name, hue) {
    super(x, y, name, hue, 10);
    this.godMode = false;
    this.label = 'joueur';
  }

  applyBehaviors(game) {
    let target = game.mouseWorld();
    let toTarget = p5.Vector.sub(target, this.pos);

    // Souris sur la tête : on continue tout droit (pas de tremblement).
    if (toTarget.mag() < this.r) {
      target = p5.Vector.add(this.pos, p5.Vector.mult(this.vel, 30));
    } else {
      this.lookDir = toTarget.heading();
    }
    this.debugTarget = target;

    this.setBoost(game.boostRequested(), game);
    this.applyForce(this.seek(target));
    this.applyBodyBehaviors();
  }
}

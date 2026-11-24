// Food : une boule de nourriture. Immobile par défaut (elle freine), mais c'est un
// Vehicle : quand une tête de serpent passe près d'elle, elle est aspirée vers
// la bouche par seek() — l'effet « aimant » de slither.io.
class Food extends Vehicle {
  constructor(x, y, value = 1, hue = random(360)) {
    super(x, y);
    this.value = value;
    this.hue = hue;
    this.r = 3 + (value * 1.6) + random(-0.5, 0.5);
    this.vel.set(0, 0);
    this.maxSpeed = 9;
    this.maxForce = 1.2;
    this.attractor = null;
    this.hidden = false;
    this.phase = random(TWO_PI);
  }

  applyBehaviors() {
    if (this.attractor !== null) {
      this.applyForce(this.seek(this.attractor.pos));
    } else {
      // arrive() sur sa propre position = freinage jusqu'à l'arrêt.
      this.applyForce(this.arrive(this.pos));
    }
  }

  /**
   * Appelée quand un serpent la mange.
   * @returns {boolean} true si la nourriture doit être retirée du monde.
   */
  onEaten() {
    return true;
  }

  show(view) {
    if (this.hidden === true || !inView(this.pos, view, this.r * 3)) {
      return;
    }
    let pulse = 1 + (0.15 * sin((frameCount * 0.08) + this.phase));
    push();
    colorMode(HSB, 360, 100, 100, 100);
    noStroke();
    fill(this.hue, 80, 100, 22);
    circle(this.pos.x, this.pos.y, this.r * 4 * pulse);
    fill(this.hue, 60, 100);
    circle(this.pos.x, this.pos.y, this.r * 2 * pulse);
    pop();

    if (Vehicle.debug === true && this.attractor !== null) {
      push();
      stroke(255, 0, 255);
      line(this.pos.x, this.pos.y, this.attractor.pos.x, this.attractor.pos.y);
      pop();
    }
  }
}

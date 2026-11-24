// ScorePopup : texte animé (« +2 », « Élimine Bob ! »). Score animé = Vehicle :
// il monte vers un point au-dessus de sa naissance avec arrive() puis s'efface.
class ScorePopup extends Vehicle {
  constructor(x, y, message, hue = 50, size = 18) {
    super(x, y);
    this.message = message;
    this.hue = hue;
    this.size = size;
    this.vel.set(0, -2);
    this.maxSpeed = 3;
    this.maxForce = 0.3;
    this.goal = createVector(x + random(-20, 20), y - 70);
    this.life = 60;
  }

  applyBehaviors() {
    this.applyForce(this.arrive(this.goal, 60));
  }

  update() {
    super.update();
    this.life -= 1;
  }

  isDead() {
    return this.life <= 0;
  }

  show() {
    let alpha = map(this.life, 0, 60, 0, 100);
    let grow = map(this.life, 60, 45, 0.6, 1, true);
    push();
    colorMode(HSB, 360, 100, 100, 100);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(this.size * grow);
    stroke(0, 0, 0, alpha);
    strokeWeight(3);
    fill(this.hue, 70, 100, alpha);
    text(this.message, this.pos.x, this.pos.y);
    pop();
  }
}

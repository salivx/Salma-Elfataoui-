// TextFood : un point du texte animé géant. C'est de la nourriture (plus nourrissante)
// qui rejoint sa place dans la lettre avec arrive() et y frémit légèrement.
// Mangé, il disparaît un moment, puis réapparaît au loin et revient en volant
// reformer la lettre. Quand le mot change, tous les points volent vers leur
// nouvelle place.
class TextFood extends Food {
  constructor(x, y, home) {
    super(x, y, 2, 0);
    this.home = home.copy();
    this.r = 5;
    this.maxSpeed = 7;
    this.maxForce = 0.5;
    this.respawnTimer = 0;
  }

  applyBehaviors() {
    if (this.hidden === true) {
      this.respawnTimer -= 1;
      if (this.respawnTimer <= 0) {
        this.reappear();
      }
      return;
    }
    if (this.attractor !== null) {
      this.maxSpeed = 10;
      this.applyForce(this.seek(this.attractor.pos));
      return;
    }
    this.maxSpeed = 7;
    // Petite cible qui tourne autour de la place : la lettre « respire ».
    let t = (frameCount * 0.05) + this.phase;
    let target = createVector(this.home.x + (3 * cos(t)), this.home.y + (3 * sin(t)));
    this.applyForce(this.arrive(target, 120));
  }

  /** Ne quitte jamais le monde : se cache puis reviendra. */
  onEaten() {
    this.hidden = true;
    this.respawnTimer = floor(random(240, 480));
    return false;
  }

  /** Téléport explicite (autorisé, voir ARCHITECTURE.md) loin de sa place, puis arrive(). */
  reappear() {
    let away = p5.Vector.random2D().mult(random(300, 700));
    this.pos = p5.Vector.add(this.home, away);
    this.vel.set(0, 0);
    this.hidden = false;
  }

  show(view) {
    if (this.hidden === true || !inView(this.pos, view, 20)) {
      return;
    }
    // Arc-en-ciel qui défile le long du texte.
    let hue = ((this.home.x * 0.15) + (frameCount * 2)) % 360;
    let pulse = 1 + (0.25 * sin((frameCount * 0.1) + (this.home.x * 0.02)));
    push();
    colorMode(HSB, 360, 100, 100, 100);
    noStroke();
    fill(hue, 90, 100, 20);
    circle(this.pos.x, this.pos.y, this.r * 4.5 * pulse);
    fill(hue, 70, 100);
    circle(this.pos.x, this.pos.y, this.r * 2 * pulse);
    pop();

    if (Vehicle.debug === true && p5.Vector.dist(this.pos, this.home) > 10) {
      push();
      stroke(255, 255, 255, 50);
      line(this.pos.x, this.pos.y, this.home.x, this.home.y);
      pop();
    }
  }
}

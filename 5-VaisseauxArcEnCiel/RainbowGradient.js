// Dégradé radial arc-en-ciel dont le centre est un Vehicle :
// il suit la souris avec le comportement arrive() (Reynolds), donc avec inertie
// et freinage, réglables par maxSpeed / maxForce / slowRadius.
class RainbowGradient extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel.set(0, 0);
    this.maxSpeed = 15;
    this.maxForce = 1;
    this.slowRadius = 150;

    // Apparence.
    this.radius = 350;
    this.cycles = 1;
    this.hueSpeed = 1;
    this.saturation = 100;
    this.lightness = 55;
    this.alpha = 0.8;
    this.pulseAmount = 0.1;
    this.pulseSpeed = 0.03;

    // État d'animation des couleurs (pas un déplacement).
    this.huePhase = 0;
    this.pulsePhase = 0;
  }

  // Le centre du dégradé rejoint la cible (la souris) en freinant à l'approche.
  applyBehaviors(target) {
    this.applyForce(this.arrive(target, this.slowRadius));
  }

  update() {
    super.update();
    this.huePhase = (this.huePhase + this.hueSpeed) % 360;
    this.pulsePhase += this.pulseSpeed;
  }

  // Rayon courant, qui « respire » autour de this.radius.
  currentRadius() {
    return this.radius * (1 + (this.pulseAmount * sin(this.pulsePhase)));
  }

  show() {
    let radius = max(this.currentRadius(), 1);
    let ctx = drawingContext;
    let gradient = ctx.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, radius);

    // Une teinte tous les 10°, répétée this.cycles fois du centre vers le bord ;
    // l'opacité décroît jusqu'à 0 sur le bord.
    let stops = max(2, ceil(36 * this.cycles));
    for (let i = 0; i <= stops; i += 1) {
      let t = i / stops;
      let hue = (((this.huePhase + (t * 360 * this.cycles)) % 360) + 360) % 360;
      let alpha = this.alpha * (1 - t);
      gradient.addColorStop(t, `hsla(${hue}, ${this.saturation}%, ${this.lightness}%, ${alpha})`);
    }

    push();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, radius, 0, TWO_PI);
    ctx.fill();
    pop();

    if (Vehicle.debug === true) {
      drawArrow(this.pos, p5.Vector.mult(this.vel, 10), 'red');
    }
  }
}

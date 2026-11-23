// Vaisseau : un Vehicle qui erre, se sépare de ses voisins et reste dans l'écran.
class Ship extends Vehicle {
  constructor(x, y, maxSpeed, maxForce) {
    super(x, y);
    this.maxSpeed = maxSpeed;
    this.maxForce = maxForce;
    this.r = 12;
    this.color = color(random(180, 255), random(180, 255), 255);
  }

  // Sélection d'action : errance + séparation + rester à l'écran.
  applyBehaviors(ships) {
    let wanderForce = this.wander();
    let separationForce = this.separate(ships);
    let boundariesForce = this.boundaries();

    wanderForce.mult(this.wanderWeight);
    separationForce.mult(this.separationWeight);
    boundariesForce.mult(this.boundariesWeight);

    this.applyForce(wanderForce);
    this.applyForce(separationForce);
    this.applyForce(boundariesForce);
  }

  // Coque de vaisseau orientée selon la vitesse ; vecteur vitesse rouge en debug.
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    stroke(this.color);
    strokeWeight(2);
    fill(0, 150);
    beginShape();
    vertex(this.r, 0);
    vertex(-this.r, -this.r * 0.7);
    vertex(-this.r * 0.5, 0);
    vertex(-this.r, this.r * 0.7);
    endShape(CLOSE);
    pop();

    if (Vehicle.debug === true) {
      drawArrow(this.pos, p5.Vector.mult(this.vel, 10), 'red');
    }
  }
}

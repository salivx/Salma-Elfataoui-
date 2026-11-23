// Obstacle : un Vehicle immobile par défaut (maxSpeed = 0).
// Pour le faire dériver plus tard, il suffit de lui donner une vitesse
// et un comportement dans applyBehaviors() (ex. wander()).
class Obstacle extends Vehicle {
  constructor(x, y, r, color = 'gray') {
    super(x, y);
    this.r = r;
    this.color = color;
    this.vel.set(0, 0);
    this.maxSpeed = 0;
  }

  // Immobile : aucune force pour l'instant.
  applyBehaviors() {
  }

  show() {
    push();
    noStroke();
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}

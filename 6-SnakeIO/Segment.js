// Segment : un anneau du corps d'un serpent.
// Comme dans le cours (3-Arrival_correction/snake.js), chaque anneau suit l'anneau
// précédent avec arrive(). Ici, la cible est un point situé à distance `spacing`
// derrière l'anneau précédent : l'écart entre anneaux reste constant, même en boost.
class Segment extends Vehicle {
  constructor(x, y, snake) {
    super(x, y);
    this.snake = snake;
    this.vel.set(0, 0);
    // Très réactif : maxSpeed = slowRadius => l'anneau rejoint sa cible en ~1 frame
    // sans dépasser (gain de 1 dans arrive()).
    this.maxSpeed = 30;
    this.maxForce = 30;
  }

  /** Suit le véhicule `leader` (la tête ou l'anneau précédent). */
  applyBehaviors(leader) {
    let offset = p5.Vector.sub(this.pos, leader.pos);
    if (offset.magSq() < 0.0001) {
      offset = p5.Vector.mult(leader.vel, -1);
      if (offset.magSq() < 0.0001) {
        offset = createVector(-1, 0);
      }
    }
    offset.setMag(this.snake.spacing);
    let target = p5.Vector.add(leader.pos, offset);
    this.r = this.snake.r;
    this.applyForce(this.arrive(target, this.maxSpeed));
  }
}

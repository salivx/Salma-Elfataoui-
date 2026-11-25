// Particle — étincelle (crash, ramassage). Vehicle avec gravité verticale.
class Particle extends Vehicle {
  constructor(x, y, col) {
    super(x, y, 4, 0.5);
    this.vel = p5.Vector.random2D().mult(0.6 + Math.random() * 2.2);
    this.z = 8; this.vz = 1 + Math.random() * 2.5;
    this.life = 40; this.col = col;
    this.pathMaxLength = 0;
  }

  step() {
    this.applyForce(p5.Vector.mult(this.vel, -0.07));   // frottement = force
    this.update();
    this.z += this.vz; this.vz -= 0.18;
    if (this.z < 0) { this.z = 0; this.vz *= -0.4; }
    this.life--;
  }

  depth(view) { return view.depthOf(this.pos.x, this.pos.y, this.z); }

  show(view) {
    const c = color(this.col); c.setAlpha(this.life * 6);
    view.dot(this.pos.x, this.pos.y, this.z, 1.5 + this.life * 0.05, c);
  }
}

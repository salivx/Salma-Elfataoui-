// BoostPad — flèches turbo au sol (x1,55 pendant 70 frames)
class BoostPad extends Vehicle {
  constructor(pos, angle) {
    super(pos.x, pos.y, 0, 0);
    this.vel = createVector(0, 0);
    this.angle = angle;
    this.r = 15;
  }

  touches(p) { return p5.Vector.dist(p, this.pos) < this.r + 5; }

  show(view) {
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    const P = (fx, sy) => [this.pos.x + fx * c - sy * s, this.pos.y + fx * s + sy * c, 0.5];
    view.poly([P(-17, -13), P(17, -13), P(17, 13), P(-17, 13)], color(0, 60, 70, 160), color(32, 227, 255, 160), 1);
    for (let k = 0; k < 3; k++) {
      const a = 0.35 + 0.65 * ((Math.sin(frameCount * 0.2 - k * 1.2) + 1) / 2);
      const x = -10 + k * 8;
      view.poly([P(x - 3, -8), P(x + 4, 0), P(x - 3, 8), P(x, 0)], color(120, 255, 240, 255 * a), null);
    }
  }
}

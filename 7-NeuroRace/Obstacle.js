// Obstacle — bloc pare-feu posé sur la piste (Vehicle immobile, mais c'est un Vehicle
// comme le demande l'architecture : il pourrait bouger). Ses 4 côtés sont des murs.
class Obstacle extends Vehicle {
  constructor(pos, angle, index) {
    super(pos.x, pos.y, 0, 0);
    this.vel = createVector(0, 0);
    this.angle = angle;
    this.index = index;
    this.s = 10;           // demi-côté
    this.h = 20;
  }

  corners() {
    const c = Math.cos(this.angle), s = Math.sin(this.angle), k = this.s;
    return [[-k, -k], [k, -k], [k, k], [-k, k]].map(([x, y]) =>
      createVector(this.pos.x + x * c - y * s, this.pos.y + x * s + y * c));
  }

  sides() {
    const p = this.corners();
    return p.map((a, i) => new Boundary(a.x, a.y, p[(i + 1) % 4].x, p[(i + 1) % 4].y));
  }

  depth(view) { return view.depthOf(this.pos.x, this.pos.y, this.h / 2); }

  show(view) {
    const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.1 + this.index);
    view.box(this.corners(), 0, this.h, color(40, 8, 4, 230), color(255, 110, 40, 140 + 115 * pulse), 2);
    const top = this.corners().map(p => [p.x, p.y, this.h]);
    view.poly(top, color(255, 90, 30, 60 + 60 * pulse), null);
    if (Vehicle.debug) view.label('pare-feu', this.pos.x, this.pos.y, this.h + 10, color(255, 140, 80));
  }
}

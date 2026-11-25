// GlitchField — zone de bug au sol : divise la vitesse par 2
class GlitchField extends Vehicle {
  constructor(pos) {
    super(pos.x, pos.y, 0, 0);
    this.vel = createVector(0, 0);
    this.r = 19;
  }

  touches(p) { return p5.Vector.dist(p, this.pos) < this.r + 5; }

  show(view) {
    const pts = [];
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * TWO_PI, rr = 21 + (Math.random() < 0.15 ? Math.random() * 4 : 0);
      pts.push([this.pos.x + Math.cos(a) * rr, this.pos.y + Math.sin(a) * rr * 0.8, 0.4]);
    }
    view.poly(pts, color(150, 40, 255, 70 + Math.random() * 30), color(200, 90, 255, 180), 1);
    for (let k = 0; k < 3; k++) {     // lignes de « glitch »
      const y = this.pos.y + (Math.random() - 0.5) * 26, w = 8 + Math.random() * 16;
      view.line3([this.pos.x - w, y, 0.6], [this.pos.x + w, y, 0.6], color(230, 160, 255, 200), 1.5);
    }
  }
}

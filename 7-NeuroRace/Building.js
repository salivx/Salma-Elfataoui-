// Building — tour de la ville néon autour du circuit (décor, Vehicle immobile)
class Building extends Vehicle {
  constructor(x, y, w, d, h) {
    super(x, y, 0, 0);
    this.vel = createVector(0, 0);
    this.w = w; this.d = d; this.h = h;
    const palette = [[32, 227, 255], [255, 43, 214], [140, 90, 255], [60, 255, 170]];
    this.neon = palette[Math.floor(Math.random() * palette.length)];
    this.bands = Math.floor(h / 28);
    this.blink = Math.random() * 100;
  }

  corners() {
    const x = this.pos.x, y = this.pos.y, w = this.w / 2, d = this.d / 2;
    return [createVector(x - w, y - d), createVector(x + w, y - d), createVector(x + w, y + d), createVector(x - w, y + d)];
  }

  depth(view) { return view.depthOf(this.pos.x, this.pos.y, this.h * 0.5); }

  show(view) {
    const [r, g, b] = this.neon;
    if (view.depthOf(this.pos.x, this.pos.y, 0) < view.ghostDepth) {   // devant la piste : fantôme
      view.box(this.corners(), 0, this.h, null, color(r, g, b, 45), 1);
      return;
    }
    view.box(this.corners(), 0, this.h, color(9, 12, 34, 245), color(r, g, b, 120), 1, this.bands, color(r, g, b, 70));
    // antenne qui clignote sur les grandes tours
    if (this.h > 110) {
      const on = (frameCount + this.blink) % 90 < 45;
      view.line3([this.pos.x, this.pos.y, this.h], [this.pos.x, this.pos.y, this.h + 16], color(200, 220, 255, 160), 1);
      if (on) view.dot(this.pos.x, this.pos.y, this.h + 16, 3, color(255, 60, 90));
    }
  }
}

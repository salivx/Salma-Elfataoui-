// DataShard — cristal de données qui flotte et tourne : le joueur le ramasse (+1)
class DataShard extends Vehicle {
  constructor(pos) {
    super(pos.x, pos.y, 0, 0);
    this.vel = createVector(0, 0);
    this.r = 7;
    this.takenLap = -1;       // tour pendant lequel le joueur l'a pris
    this.seed = Math.random() * 10;
  }

  touches(p) { return p5.Vector.dist(p, this.pos) < this.r + 5; }

  depth(view) { return view.depthOf(this.pos.x, this.pos.y, 12); }

  show(view) {
    const t = frameCount * 0.06 + this.seed;
    const z = 12 + Math.sin(t * 1.3) * 3;
    const ring = [];
    for (let k = 0; k < 4; k++) {
      const a = t + (k * HALF_PI);
      ring.push([this.pos.x + Math.cos(a) * 5, this.pos.y + Math.sin(a) * 5, z]);
    }
    const top = [this.pos.x, this.pos.y, z + 7], bot = [this.pos.x, this.pos.y, z - 7];
    view.shadow(this.pos.x, this.pos.y, 5);
    for (let k = 0; k < 4; k++) {
      const a = ring[k], b = ring[(k + 1) % 4];
      const shade = k % 2 ? color(255, 210, 60, 235) : color(255, 240, 150, 235);
      view.poly([top, a, b], shade, null);
      view.poly([bot, a, b], color(200, 140, 20, 235), null);
    }
  }
}

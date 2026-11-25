// A wall segment (track border or crate side). Rays and runners collide with it.
class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
  }

  // shortest distance from point p to this segment
  distTo(p) {
    const abx = this.b.x - this.a.x, aby = this.b.y - this.a.y;
    const t = constrain(((p.x - this.a.x) * abx + (p.y - this.a.y) * aby) / (abx * abx + aby * aby), 0, 1);
    const dx = this.a.x + t * abx - p.x, dy = this.a.y + t * aby - p.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // point du segment le plus proche de p
  closestPoint(p) {
    const abx = this.b.x - this.a.x, aby = this.b.y - this.a.y;
    const t = constrain(((p.x - this.a.x) * abx + (p.y - this.a.y) * aby) / (abx * abx + aby * aby), 0, 1);
    return createVector(this.a.x + t * abx, this.a.y + t * aby);
  }
}

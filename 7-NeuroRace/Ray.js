// A sensor ray: casts from the runner and returns the distance to the nearest wall
class Ray {
  constructor(offsetDeg, sight = SIGHT) {
    this.sight = sight;
    this.offset = radians(offsetDeg);
    this.hit = null;     // last hit point (for drawing)
    this.d = sight;
  }

  cast(pos, heading, walls) {
    const ang = heading + this.offset;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    let best = this.sight;
    for (const w of walls) {
      // ray / segment intersection (Coding Train "2D raycasting")
      const x1 = w.a.x, y1 = w.a.y, x2 = w.b.x, y2 = w.b.y;
      const x3 = pos.x, y3 = pos.y, x4 = pos.x + dx, y4 = pos.y + dy;
      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (den === 0) continue;
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
      if (t >= 0 && t <= 1 && u > 0 && u < best) best = u;
    }
    this.d = best;
    this.hit = { x: pos.x + dx * best, y: pos.y + dy * best };
    return best;
  }
}

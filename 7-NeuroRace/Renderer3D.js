// =====================================================================
//  Renderer3D — moteur 3D « fait main » en p5.js 2D :
//  projection perspective (yaw, inclinaison, distance) + algorithme du
//  peintre (on dessine du plus loin au plus proche).
//  Chaque objet du jeu a show(view) et depth(view) et utilise les
//  primitives ci-dessous (poly, line3, dot, box, ring, label…).
// =====================================================================
class Renderer3D {
  constructor(cam) {
    this.cam = cam;
    this.near = 25;
  }

  // calcule les constantes de la frame
  begin() {
    const c = this.cam;
    this.ca = Math.cos(c.yaw); this.sa = Math.sin(c.yaw);
    this.ct = Math.cos(c.tilt); this.st = Math.sin(c.tilt);
    this.fit = Math.min(width / 1060, height / 700) * (c.mode === 'chase' ? 1.15 : 1);
    this.cx = width / 2;
    this.cy = height / 2 + (c.mode === 'chase' ? height * 0.12 : 0);
  }

  // profondeur en dessous de laquelle un bâtiment cache la piste -> on le dessine en « fantôme »
  computeGhostDepth(tr) {
    if (this.cam.mode === 'chase') { this.ghostDepth = this.cam.dist * 0.97; return; }
    let m = 1e9;
    for (let i = 0; i < tr.N; i += 2) m = Math.min(m, this.depthOf(tr.outer[i].x, tr.outer[i].y, 0), this.depthOf(tr.inner[i].x, tr.inner[i].y, 0));
    this.ghostDepth = m - 10;
  }

  depthOf(x, y, z) {
    const dx = x - this.cam.pos.x, dy = y - this.cam.pos.y;
    const y1 = dx * this.sa + dy * this.ca;
    return this.cam.dist - (y1 * this.st + z * this.ct);
  }

  // projette un point 3D (x, y du plan, z = hauteur) -> [sx, sy, échelle] ou null
  p(x, y, z) {
    const dx = x - this.cam.pos.x, dy = y - this.cam.pos.y;
    const x1 = dx * this.ca - dy * this.sa;
    const y1 = dx * this.sa + dy * this.ca;
    const depth = this.cam.dist - (y1 * this.st + z * this.ct);
    if (depth < this.near) return null;
    const f = (this.cam.dist / depth) * this.fit;
    return [this.cx + x1 * f, this.cy + (y1 * this.ct - z * this.st) * f, f];
  }

  // inverse de la projection : point de l'écran -> point au sol (z = 0)
  unproject(sx, sy) {
    if (this.fit === undefined) return null;
    const c = this.cam, u = (sx - this.cx) / this.fit, v = (sy - this.cy) / this.fit;
    const den = this.ct * c.dist + v * this.st;
    if (den <= 1e-6) return null;                     // au-dessus de l'horizon
    const y1 = (v * c.dist) / den;
    const depth = c.dist - y1 * this.st;
    if (depth < this.near) return null;
    const x1 = u * depth / c.dist;
    return createVector(c.pos.x + x1 * this.ca + y1 * this.sa, c.pos.y - x1 * this.sa + y1 * this.ca);
  }

  poly(pts, fillCol, strokeCol, sw = 1) {
    const q = [];
    for (const [x, y, z] of pts) { const s = this.p(x, y, z); if (!s) return; q.push(s); }
    push();
    if (fillCol) fill(fillCol); else noFill();
    if (strokeCol) { stroke(strokeCol); strokeWeight(sw); } else noStroke();
    beginShape(); for (const s of q) vertex(s[0], s[1]); endShape(CLOSE);
    pop();
  }

  line3(a, b, col, w = 1) {
    const s = this.p(a[0], a[1], a[2]), e = this.p(b[0], b[1], b[2]);
    if (!s || !e) return;
    push(); stroke(col); strokeWeight(w * Math.min(2, s[2])); line(s[0], s[1], e[0], e[1]); pop();
  }

  dot(x, y, z, r, col) {
    const s = this.p(x, y, z); if (!s) return;
    push(); noStroke(); fill(col); circle(s[0], s[1], r * 2 * s[2]); pop();
  }

  ring(x, y, R, col, w = 2, z = 0.6) {
    const pts = [];
    for (let k = 0; k < 20; k++) { const a = (k / 20) * TWO_PI; pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R, z]); }
    this.poly(pts, null, col, w);
  }

  shadow(x, y, R) {
    const pts = [];
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TWO_PI; pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R, 0.3]); }
    this.poly(pts, color(0, 0, 0, 110), null);
  }

  label(txt, x, y, z, col, size = 11) {
    const s = this.p(x, y, z); if (!s) return;
    push(); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(size); noStroke();
    fill(0, 0, 0, 160); text(txt, s[0] + 1, s[1] + 1);
    fill(col); text(txt, s[0], s[1]); pop();
  }

  // pavé : 4 coins au sol, du z0 au z1. Faces triées du plus loin au plus proche.
  box(corners, z0, z1, fillCol, edgeCol, sw = 1, bands = 0, bandCol = null) {
    const faces = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4];
      faces.push({ a, b, d: this.depthOf((a.x + b.x) / 2, (a.y + b.y) / 2, (z0 + z1) / 2) });
    }
    faces.sort((u, v) => v.d - u.d);
    for (const { a, b } of faces) {
      this.poly([[a.x, a.y, z0], [b.x, b.y, z0], [b.x, b.y, z1], [a.x, a.y, z1]], fillCol, edgeCol, sw);
      for (let k = 1; k <= bands; k++) {
        const z = z0 + ((z1 - z0) * k) / (bands + 1);
        this.line3([a.x, a.y, z], [b.x, b.y, z], bandCol, 1);
      }
    }
    this.poly(corners.map(c => [c.x, c.y, z1]), fillCol, edgeCol, sw + 0.5);
  }

  // ---------------- la scène complète ----------------
  draw(game) {
    this.begin();
    const tr = game.track;
    this.computeGhostDepth(tr);
    // ciel + halo
    background(4, 5, 14);
    push(); noStroke();
    for (let k = 0; k < 6; k++) { fill(60, 20, 120, 10); ellipse(width / 2, height * 0.1, width * (1.6 - k * 0.2), height * (0.7 - k * 0.08)); }
    pop();
    this.grid();
    // piste
    for (let i = 0; i < tr.N; i++) {
      const j = (i + 1) % tr.N, a = tr.inner[i], b = tr.outer[i], c = tr.outer[j], d = tr.inner[j];
      this.poly([[a.x, a.y, 0], [b.x, b.y, 0], [c.x, c.y, 0], [d.x, d.y, 0]], color(12, 18, 46), color(12, 18, 46), 1);
      if (i % 2 === 0) this.line3([tr.center[i].x, tr.center[i].y, 0.3], [tr.center[j].x, tr.center[j].y, 0.3], color(80, 120, 255, 90), 1.5);
    }
    this.startLine(tr);
    for (const b of tr.boosts) b.show(this);
    for (const g of tr.glitches) g.show(this);
    if (game.debug.checkpoints) {
      tr.cps.forEach((cp, i) => this.line3([cp.a.x, cp.a.y, 0.5], [cp.b.x, cp.b.y, 0.5], i === 0 ? color(255, 255, 0, 160) : color(60, 120, 255, 90), 1));
    }
    // objets en relief triés par profondeur
    const items = [];
    if (!this.wallItems || this.wallTrack !== tr) {
      this.wallTrack = tr;
      this.wallItems = tr.walls.slice(0, tr.N * 2).map((w, i) => new WallSegment(w, i % 2 === 0));
    }
    for (const w of this.wallItems) items.push(w);
    if (game.debug.city) for (const b of tr.buildings) items.push(b);
    for (const o of tr.obstacles) items.push(o);
    if (game.shardsVisible()) for (const s of tr.shards) if (s.takenLap !== game.playerLap()) items.push(s);
    for (const r of game.visibleRunners()) items.push(r);
    for (const p of game.particles) items.push(p);
    for (const p of game.popups) items.push(p);
    const keyed = items.map(o => ({ o, d: o.depth(this) }));
    keyed.sort((u, v) => v.d - u.d);
    for (const { o } of keyed) {
      if (o instanceof Runner) game.drawRunner(o, this); else o.show(this);
    }
    // debug par-dessus
    for (const r of game.visibleRunners()) if (game.raysFor(r)) r.showRays(this);
    if (game.debug.vectors) for (const r of game.visibleRunners()) r.showVelocity(this);
  }

  grid() {
    const step = 48, x0 = -480, x1 = 1440, y0 = -360, y1 = 960;
    push();
    for (let x = x0; x <= x1; x += step) this.gridLine(x, y0, x, y1);
    for (let y = y0; y <= y1; y += step) this.gridLine(x0, y, x1, y);
    pop();
  }

  gridLine(ax, ay, bx, by) {
    const n = 8;
    let prev = null;
    stroke(30, 60, 140, 70); strokeWeight(1);
    for (let k = 0; k <= n; k++) {
      const s = this.p(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, 0);
      if (s && prev) line(prev[0], prev[1], s[0], s[1]);
      prev = s;
    }
  }

  startLine(tr) {
    const a = tr.inner[0], b = tr.outer[0], t = tr.tan[0];
    for (let k = 0; k < 10; k++) for (let r = 0; r < 2; r++) {
      const p = p5.Vector.lerp(a, b, k / 10), q = p5.Vector.lerp(a, b, (k + 1) / 10);
      const o = r * 6;
      this.poly([[p.x + t.x * o, p.y + t.y * o, 0.4], [q.x + t.x * o, q.y + t.y * o, 0.4],
        [q.x + t.x * (o + 6), q.y + t.y * (o + 6), 0.4], [p.x + t.x * (o + 6), p.y + t.y * (o + 6), 0.4]],
        (k + r) % 2 ? color(240) : color(20), null);
    }
  }
}

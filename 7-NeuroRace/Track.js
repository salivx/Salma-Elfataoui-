// =====================================================================
//  Track — le circuit (côté simulation) : ligne centrale, murs,
//  checkpoints (comme 9-VoitureSuitCircuit), blocs pare-feu, bonus,
//  et le décor (tours de la ville).
// =====================================================================
class Track {
  constructor() {
    const ctrl = [[150,300],[165,160],[290,85],[450,105],[525,195],[625,125],[785,90],[885,185],
      [872,330],[770,385],[655,355],[585,440],[645,520],[485,552],[300,535],[190,465]];
    this.center = Track.resample(Track.catmull(ctrl, 24), 84);
    this.N = this.center.length;
    this.tan = []; this.inner = []; this.outer = [];
    for (let i = 0; i < this.N; i++) {
      const p = this.center[(i - 1 + this.N) % this.N], q = this.center[(i + 1) % this.N];
      const t = createVector(q.x - p.x, q.y - p.y).normalize();
      const n = createVector(-t.y, t.x);
      this.tan.push(t);
      this.inner.push(p5.Vector.add(this.center[i], p5.Vector.mult(n, -TRACK_W / 2)));
      this.outer.push(p5.Vector.add(this.center[i], p5.Vector.mult(n, TRACK_W / 2)));
    }
    // murs + checkpoints (un checkpoint = segment intérieur -> extérieur)
    this.walls = []; this.cps = [];
    for (let i = 0; i < this.N; i++) {
      const j = (i + 1) % this.N;
      this.walls.push(new Boundary(this.inner[i].x, this.inner[i].y, this.inner[j].x, this.inner[j].y));
      this.walls.push(new Boundary(this.outer[i].x, this.outer[i].y, this.outer[j].x, this.outer[j].y));
      this.cps.push(new Boundary(this.inner[i].x, this.inner[i].y, this.outer[i].x, this.outer[i].y));
    }
    // blocs pare-feu : obstacles solides, les rayons des IA les voient
    this.obstacles = [[13, 16], [31, -16], [47, 15], [62, -15], [75, 14]].map(([i, off]) => {
      const o = new Obstacle(this.at(i, off), this.tan[i].heading(), i);
      this.walls.push(...o.sides());
      return o;
    });
    this.boosts = [7, 40, 68].map(i => new BoostPad(this.at(i, 0), this.tan[i].heading()));
    this.glitches = [[22, -6], [55, 6]].map(([i, o]) => new GlitchField(this.at(i, o)));
    this.shards = [];
    for (let i = 3; i < this.N - 4; i += 4) {
      if (this.obstacles.some(o => Math.abs(o.index - i) < 3)) continue;
      this.shards.push(new DataShard(this.at(i, (i % 8 === 3 ? -1 : 1) * 16)));
    }
    this.buildings = this.makeCity();
  }

  // point de la piste : index sur la ligne centrale + décalage latéral
  at(i, off) {
    const t = this.tan[i];
    return createVector(this.center[i].x - t.y * off, this.center[i].y + t.x * off);
  }

  makeCity() {
    randomSeed(11);
    const list = [];
    for (let gx = -160; gx < PLAN_W + 160; gx += 58) {
      for (let gy = -120; gy < PLAN_H + 120; gy += 58) {
        const x = gx + random(-14, 14), y = gy + random(-14, 14);
        const w = random(26, 44), d = random(26, 44);
        if (this.distToCenter(x, y) < TRACK_W / 2 + Math.max(w, d) * 0.75 + 12) continue;
        if (random() < 0.18) continue;
        // dans la boucle du circuit : bâtiments bas pour ne jamais cacher les coureurs
        const inField = this.insideLoop(x, y);
        const near = this.distToCenter(x, y) < TRACK_W / 2 + 70;
        const h = inField ? random(8, 24) : near ? random(20, 60) : random(40, 150);
        list.push(new Building(x, y, w, d, h));
      }
    }
    randomSeed();
    return list;
  }

  // le point (x, y) est-il à l'intérieur de la boucle ? (lancer de rayon)
  insideLoop(x, y) {
    let inside = false;
    for (let i = 0, j = this.N - 1; i < this.N; j = i++) {
      const a = this.center[i], b = this.center[j];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }

  static catmull(pts, steps) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push(createVector(f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])));
      }
    }
    return out;
  }

  static resample(dense, n) {
    const L = [0];
    for (let i = 1; i <= dense.length; i++) L.push(L[i - 1] + p5.Vector.dist(dense[i - 1], dense[i % dense.length]));
    const total = L[L.length - 1], out = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      const d = (total * i) / n;
      while (L[k + 1] < d) k++;
      const t = (d - L[k]) / (L[k + 1] - L[k]);
      out.push(p5.Vector.lerp(dense[k], dense[(k + 1) % dense.length], t));
    }
    return out;
  }

  distToCenter(x, y) {
    let best = 1e9;
    for (let i = 0; i < this.N; i++) {
      const a = this.center[i], b = this.center[(i + 1) % this.N];
      const abx = b.x - a.x, aby = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (y - a.y) * aby) / (abx * abx + aby * aby)));
      best = Math.min(best, Math.hypot(x - a.x - t * abx, y - a.y - t * aby));
    }
    return best;
  }
}

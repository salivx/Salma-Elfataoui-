// =====================================================================
//  Runner — coureur androïde piloté par un réseau de neurones.
//  Même principe que la Vehicle de 9-VoitureSuitCircuit :
//   - des rayons-capteurs mesurent la distance aux murs,
//   - le réseau reçoit ces distances (+ sa vitesse) et sort
//     un angle de braquage et une vitesse,
//   - on en déduit une force de pilotage (desired - vel, Reynolds),
//   - la fitness = nombre de checkpoints franchis.
// =====================================================================
class Runner extends Vehicle {
  constructor(track, slot, brain, opts = {}) {
    const start = Runner.gridPos(track, slot);
    super(start.x, start.y, opts.maxSpeed || MAX_SPEED, MAX_FORCE);
    this.vel = p5.Vector.fromAngle(track.tan[0].heading()).setMag(0.5);
    this.track = track;
    this.sight = opts.sight || SIGHT;
    this.rayAngles = opts.rays || RAY_ANGLES;
    this.stallLimit = opts.stall || STALL_FRAMES;
    this.brain = brain || new NeuralNetwork(this.rayAngles.length + 1, opts.hidden || HIDDEN, OUTPUTS, opts.act || 'tanh');
    this.name = opts.name || '';
    this.col = opts.col || [32, 227, 255];
    this.r = 7;
    this.pathMaxLength = 0;
    this.rays = this.rayAngles.map(a => new Ray(a, this.sight));
    this.alive = true;
    this.passed = 0;          // checkpoints franchis = fitness
    this.nextCp = 1; this.lastCp = 0; this.sinceCp = 0;
    this.stun = 0; this.boost = 0; this.shards = 0; this.ghost = 0;
    this.finished = false; this.finishTime = 0;
    this.phase = Math.random() * TWO_PI;
    this.champion = false;
    this.mult = 1;
    this.out = [0, 0];
  }

  // grille de départ : 2 colonnes derrière la ligne
  static gridPos(track, slot) {
    const t = track.tan[0], c = track.center[0];
    const back = 14 + Math.floor(slot / 2) * 22, side = slot % 2 ? 15 : -15;
    return createVector(c.x - t.x * back - t.y * side, c.y - t.y * back + t.x * side);
  }

  get lap() { return Math.floor(this.passed / this.track.N); }
  get heading() { return this.vel.heading(); }

  get progress() {
    if (this.finished) return 1e9 - this.finishTime;
    return this.passed * 1000 - p5.Vector.dist(this.pos, this.track.center[this.nextCp]);
  }

  // bonus au sol : turbo ou zone de bug
  speedMult(ev) {
    let m = 1;
    for (const b of this.track.boosts) {
      if (b.touches(this.pos)) { if (this.boost === 0 && ev.boost) ev.boost(this); this.boost = 70; }
    }
    for (const g of this.track.glitches) if (g.touches(this.pos)) m = 0.5;
    if (this.boost > 0) { this.boost--; m *= 1.55; }
    return m;
  }

  // steering de Reynolds : vitesse désirée dans la direction (cap + angle)
  steerToward(angleOffset, speedFrac, speedMult = 1) {
    const desired = p5.Vector.fromAngle(this.heading + angleOffset).setMag(this.maxSpeed * speedMult * speedFrac);
    const steer = p5.Vector.sub(desired, this.vel).limit(this.maxForce * (speedMult > 1 ? 1.4 : 1));
    this.applyForce(steer);
  }

  // le cerveau décide
  think() {
    const inp = this.rays.map(r => 1 - r.cast(this.pos, this.heading, this.track.walls) / this.sight);
    inp.push(this.vel.mag() / MAX_SPEED);
    const o = this.brain.predict(inp);
    const angle = Math.tanh(o[0]) * 0.9;
    const speed = 0.35 + 0.65 * (Math.tanh(o[1]) + 1) / 2;
    this.out = [angle, speed];
    this.steerToward(angle, speed, this.mult);
  }

  decide() { this.think(); }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed * this.mult);
    if (this.vel.mag() < 0.3) this.vel.setMag(0.3);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  // un pas de simulation. lab = règles d'entraînement (mort au contact d'un mur)
  step(lab, ev = {}) {
    if (!this.alive || this.finished) return;
    if (this.stun > 0) { this.stun--; if (this.stun === 0) this.respawn(); return; }
    if (this.ghost > 0) this.ghost--;
    this.mult = this.speedMult(ev);
    this.decide();
    this.update();
    this.phase += this.vel.mag() * 0.32;
    this.sinceCp++;
    if (this.track.cps[this.nextCp].distTo(this.pos) < 12) {
      this.passed++; this.lastCp = this.nextCp;
      this.nextCp = (this.nextCp + 1) % this.track.N;
      this.sinceCp = 0;
      if (this.nextCp === 1 && ev.lap) ev.lap(this);
    }
    const walls = this.track.walls, trackWalls = this.track.N * 2;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (w.distTo(this.pos) >= this.r - 1) continue;
      if (lab) { this.alive = false; break; }
      if (this.human && i < trackWalls) { this.slide(w); continue; }   // le joueur glisse le long des murs
      if (this.human && this.ghost > 0) continue;                      // invincible juste après un crash
      this.stun = this.human ? 22 : 40;
      if (ev.crash) ev.crash(this);
      break;
    }
    if (lab && this.sinceCp > this.stallLimit) this.alive = false;
  }

  // repousse le coureur hors du mur et annule la vitesse qui rentre dedans
  slide(w) {
    const c = w.closestPoint(this.pos);
    const n = p5.Vector.sub(this.pos, c);
    if (n.magSq() < 1e-6) n.set(-this.vel.y, this.vel.x);
    n.normalize();
    this.pos = p5.Vector.add(c, p5.Vector.mult(n, this.r));
    const vn = this.vel.dot(n);
    if (vn < 0) this.vel.sub(p5.Vector.mult(n, vn * 1.2));
    this.vel.mult(0.92);
  }

  respawn() {
    const i = this.lastCp;
    this.pos = this.track.center[i].copy();
    this.vel = this.track.tan[i].copy().setMag(0.6);
    this.sinceCp = 0;
    this.ghost = 60;
  }

  depth(view) { return view.depthOf(this.pos.x, this.pos.y, 12); }

  // ---------- rendu 3D : androïde filaire néon ----------
  show(view, alpha = 255) {
    const [r, g, b] = this.col;
    const h = this.heading + (this.stun > 0 ? this.stun * 0.45 : 0);
    const fx = Math.cos(h), fy = Math.sin(h), sx = -fy, sy = fx;
    const s = Math.sin(this.phase), x = this.pos.x, y = this.pos.y;
    const P = (f, side, z) => [x + fx * f + sx * side, y + fy * f + sy * side, z];
    view.shadow(x, y, 7);
    if (this.boost > 0) view.ring(x, y, 12, color(120, 255, 240, 120), 3);
    const body = color(r, g, b, alpha), glow = color(r, g, b, alpha * 0.25);
    const hip = P(0, 0, 10), neck = P(1, 0, 19);
    const limbs = [
      [hip, P(s * 6, -2.5, 0.5)], [hip, P(-s * 6, 2.5, 0.5)],              // jambes
      [P(1, -3, 17), P(-s * 5 + 1, -4, 11)], [P(1, 3, 17), P(s * 5 + 1, 4, 11)], // bras
      [hip, neck], [P(1, -3.5, 17.5), P(1, 3.5, 17.5)]                     // torse, épaules
    ];
    for (const [a, c] of limbs) view.line3(a, c, glow, 6);
    for (const [a, c] of limbs) view.line3(a, c, body, 2.2);
    view.dot(x + fx * 1.5, y + fy * 1.5, 23, 6.5, body);                    // tête
    view.dot(x + fx * 3.6, y + fy * 3.6, 23.5, 2.6, color(255, 255, 255, alpha)); // visière
    if (this.stun > 0) {
      for (let k = 0; k < 3; k++) {
        const a = frameCount * 0.25 + k * TWO_PI / 3;
        view.dot(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 30, 2.5, color(255, 230, 80));
      }
    }
    if (this.champion) view.ring(x, y, 11, color(255, 210, 60, 220), 2);
    if (this.name) view.label(this.name, x, y, 34, color(r, g, b));
  }

  // debug : rayons-capteurs
  showRays(view) {
    for (const ray of this.rays) {
      if (!ray.hit) continue;
      const near = ray.d < 40;
      view.line3([this.pos.x, this.pos.y, 6], [ray.hit.x, ray.hit.y, 6], color(255, 255, 255, 70), 1);
      view.dot(ray.hit.x, ray.hit.y, 6, 3, near ? color(255, 60, 60) : color(60, 255, 170));
    }
  }

  showVelocity(view) {
    const v = p5.Vector.mult(this.vel, 10);
    view.line3([this.pos.x, this.pos.y, 2], [this.pos.x + v.x, this.pos.y + v.y, 2], color(255, 40, 40), 2);
  }
}

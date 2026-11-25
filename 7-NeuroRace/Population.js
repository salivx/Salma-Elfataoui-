// =====================================================================
//  Population — algorithme génétique du Labo IA (comme ga.js du cours) :
//  fitness = checkpoints ^ exposant, sélection par roulette, croisement,
//  mutation, élitisme. Tous les paramètres viennent de NEURO (menu
//  « Réseau neuronal ») et sont figés dans this.cfg au lancement.
// =====================================================================
class Population {
  constructor(track, seed, onGeneration) {
    this.track = track;
    this.cfg = Object.assign({}, NEURO);
    this.cfg.angles = rayAnglesFor(this.cfg.rays, this.cfg.fov);
    // un cerveau chargé qui n'a pas la bonne forme est ignoré
    if (seed && (seed.inN !== this.cfg.angles.length + 1 || seed.hN !== this.cfg.hidden)) { this.rejected = true; seed = null; }
    this.size = this.cfg.population;
    this.generation = 1;
    this.bestBrain = seed ? seed.copy() : null;
    this.bestFit = 0;
    this.history = [];
    this.frames = 0;
    this.onGeneration = onGeneration;
    this.runners = this.make(i => seed ? (i === 0 ? seed.copy() : seed.copy().mutate(0.2, this.cfg.mutationStrength)) : null);
    if (seed) this.runners[0].champion = true;
  }

  // options d'un coureur du Labo (servent aussi pour « Courir contre mon IA »)
  runnerOpts() {
    const c = this.cfg;
    return { rays: c.angles, sight: c.sight, hidden: c.hidden, act: c.activation,
      stall: Math.round(c.stallSeconds * 60), maxSpeed: c.maxSpeed };
  }

  make(brainFor) {
    const list = [];
    for (let i = 0; i < this.size; i++) {
      const c = color(`hsl(${(i * 47) % 360}, 90%, 62%)`);
      list.push(new Runner(this.track, i % 2, brainFor(i), Object.assign(this.runnerOpts(), { col: [red(c), green(c), blue(c)] })));
    }
    return list;
  }

  alive() { return this.runners.filter(r => r.alive); }

  leader() {
    let best = null;
    for (const r of this.runners) if (r.alive && (!best || r.progress > best.progress)) best = r;
    return best || this.runners[0];
  }

  fitness(r) { return Math.pow(r.passed, this.cfg.fitnessExp); }

  step() {
    this.frames++;
    for (const r of this.runners) r.step(true);
    if (this.frames > this.cfg.genSeconds * 60 || !this.runners.some(r => r.alive)) this.nextGeneration();
  }

  // roulette : plus la fitness est grande, plus on a de chances d'être parent
  pick(total) {
    let x = Math.random() * total;
    for (const r of this.runners) { x -= this.fitness(r); if (x <= 0) return r; }
    return this.runners[0];
  }

  nextGeneration() {
    const c = this.cfg;
    const sorted = [...this.runners].sort((a, b) => b.progress - a.progress);
    const top = sorted[0];
    this.history.push(top.passed);
    if (this.fitness(top) >= this.bestFit) { this.bestFit = this.fitness(top); this.bestBrain = top.brain.copy(); }
    const elites = [this.bestBrain, ...sorted.slice(0, c.elitism - 1).map(r => r.brain)];
    const total = this.runners.reduce((s, r) => s + this.fitness(r), 0) || 1;
    this.runners = this.make(i => {
      if (i < Math.min(c.elitism, elites.length)) return elites[i].copy();     // élitisme
      const a = this.pick(total).brain;
      const child = c.crossover ? a.crossover(this.pick(total).brain) : a.copy();
      return child.mutate(c.mutationRate, c.mutationStrength);
    });
    this.runners[0].champion = true;
    this.frames = 0;
    this.generation++;
    if (this.onGeneration) this.onGeneration();
  }
}

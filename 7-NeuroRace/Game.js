// =====================================================================
//  Game — états du jeu et boucle : menu (démo), compte à rebours,
//  course, pause, résultats, Labo IA (entraînement génétique).
// =====================================================================
const RIVALS = [
  { name: 'NOVA',   col: [255, 43, 214] },
  { name: 'BYTE',   col: [60, 255, 170] },
  { name: 'PIXEL',  col: [255, 210, 60] },
  { name: 'GLITCH', col: [150, 120, 255] },
  { name: 'ECHO',   col: [255, 130, 60] }
];
const DIFFICULTY = {
  facile:    { brains: ['medium', 'easy', 'easy', 'medium', 'easy'], speed: 0.8 },
  normal:    { brains: ['hard', 'medium', 'medium', 'easy', 'easy'], speed: 0.9 },
  difficile: { brains: ['hard', 'hard', 'medium', 'hard', 'medium'], speed: 1.0 }
};

class Game {
  constructor() {
    this.track = new Track();
    this.cam = new CameraRig();
    this.view = new Renderer3D(this.cam);
    this.input = { left: false, right: false, up: false, down: false, brake: false, mode: 'mouse', pointer: null };
    this.settings = { name: 'JOUEUR', col: [255, 255, 255], difficulty: 'normal', laps: 3 };
    this.showBrain = true;
    this.debug = { rays: false, checkpoints: false, vectors: false, nn: true, city: true, rivals: 5, rivalSpeed: 1 };
    this.state = 'menu';
    this.racers = []; this.player = null;
    this.particles = []; this.popups = [];
    this.lab = null; this.cycles = 1;
    this.count = 0; this.raceFrames = 0; this.shake = 0;
    this.camMode = 'overview';
    this.events = {
      crash: r => this.onCrash(r),
      boost: r => this.onBoost(r),
      lap: r => { if (r === this.player && r.lap < this.settings.laps) Sfx.lap(); }
    };
    this.startDemo();
  }

  brain(skill) {
    if (skill === 'lab') return this.lab && this.lab.bestBrain ? this.lab.bestBrain.copy() : null;
    const d = BRAINS[skill];
    return d ? NeuralNetwork.fromJSON(d) : null;
  }

  makeRivals(withLab) {
    const diff = DIFFICULTY[this.settings.difficulty];
    const slots = [0, 1, 3, 4, 5];
    const n = this.debug.rivals;
    const list = [];
    for (let k = 0; k < n; k++) {
      const labSlot = withLab && k === 0;
      const opts = Object.assign(labSlot ? this.lab.runnerOpts() : {}, {
        name: labSlot ? 'MON IA' : RIVALS[k].name,
        col: labSlot ? [255, 255, 120] : RIVALS[k].col,
        maxSpeed: (labSlot ? this.lab.cfg.maxSpeed : MAX_SPEED * diff.speed) * this.debug.rivalSpeed * (1 - k * 0.012)
      });
      const r = new Runner(this.track, slots[k], this.brain(labSlot ? 'lab' : diff.brains[k]), opts);
      list.push(r);
    }
    return list;
  }

  // ---------- états ----------
  startDemo() {
    this.state = 'menu';
    this.racers = this.makeRivals(false);
    this.player = null;
    this.cam.setMode('orbit');
  }

  startRace(withLab = false) {
    Sfx.init();
    this.racers = this.makeRivals(withLab);
    this.player = new PlayerRunner(this.track, 2, this.input, {
      name: this.settings.name, col: this.settings.col, maxSpeed: 3.75
    });
    this.racers.push(this.player);
    for (const s of this.track.shards) s.takenLap = -1;
    this.particles = []; this.popups = [];
    this.raceFrames = 0; this.count = 180;
    this.state = 'countdown';
    this.cam.setMode(this.camMode);
  }

  startLab() {
    if (!this.lab) this.lab = new Population(this.track, null, () => labScreen.refresh());
    this.state = 'lab';
    this.player = null;
    this.cam.setMode('overview');
  }

  togglePause() {
    if (this.state === 'race' || this.state === 'countdown') { this.paused = this.state; this.state = 'pause'; Sfx.beep(); }
    else if (this.state === 'pause') this.state = this.paused;
  }

  cycleCamera() {
    const order = ['overview', 'top', 'chase'];
    if (!this.player) { this.cam.setMode(this.cam.mode === 'top' ? 'overview' : 'top'); return; }
    this.camMode = order[(order.indexOf(this.cam.mode) + 1) % order.length];
    this.cam.setMode(this.camMode);
  }

  // ---------- simulation ----------
  update() {
    if (this.state === 'menu') for (const r of this.racers) r.step(false, {});
    if (this.state === 'countdown') {
      this.count--;
      if (this.count % 60 === 0 && this.count > 0) Sfx.beep();
      if (this.count === 0) { Sfx.go(); this.state = 'race'; }
    }
    if (this.state === 'race') this.raceStep();
    if (this.state === 'results') for (const r of this.racers) if (!r.human) r.step(false, {});
    if (this.state === 'lab') for (let i = 0; i < this.cycles; i++) this.lab.step();

    for (const p of this.particles) p.step();
    for (const p of this.popups) p.step();
    this.particles = this.particles.filter(p => p.life > 0);
    this.popups = this.popups.filter(p => p.life > 0);
    const target = this.state === 'lab' ? null : this.player;
    this.cam.follow(target);
  }

  raceStep() {
    this.raceFrames++;
    for (const r of this.racers) {
      r.step(false, this.events);
      if (!r.finished && r.passed >= this.settings.laps * this.track.N) {
        r.finished = true; r.finishTime = this.raceFrames;
        if (r === this.player) this.finish();
      }
    }
    const p = this.player;
    if (p && !p.finished) {
      for (const s of this.track.shards) {
        if (s.takenLap !== p.lap && s.touches(p.pos)) {
          s.takenLap = p.lap; p.shards++; Sfx.coin();
          this.burst(s.pos.x, s.pos.y, '#ffd23c', 10);
          this.popups.push(new ScorePopup(s.pos.x, s.pos.y, '+1 DATA', '#ffd23c'));
        }
      }
    }
  }

  finish() {
    const order = this.standings();
    const place = order.indexOf(this.player) + 1;
    place === 1 ? Sfx.win() : Sfx.lap();
    const time = this.raceFrames / 60;
    const key = 'neuroRaceBest_' + this.settings.laps;
    let best = null, isRecord = false;
    try {
      best = parseFloat(localStorage.getItem(key)) || null;
      if (!best || time < best) { localStorage.setItem(key, time.toFixed(2)); isRecord = true; best = time; }
    } catch (e) {}
    this.state = 'results';
    this.cam.setMode('orbit');
    resultsScreen.show({ order, place, time, best, isRecord, shards: this.player.shards, game: this });
  }

  standings() { return [...this.racers].sort((a, b) => b.progress - a.progress); }

  // ---------- événements ----------
  onCrash(r) {
    this.burst(r.pos.x, r.pos.y, r.human ? '#ffffff' : color(...r.col), 16);
    if (r.human) { Sfx.crash(); this.popups.push(new ScorePopup(r.pos.x, r.pos.y, 'CRASH !', '#ff5050')); }
  }

  onBoost(r) {
    if (r.human) { Sfx.boost(); this.popups.push(new ScorePopup(r.pos.x, r.pos.y, 'TURBO !', '#78fff0')); }
  }

  burst(x, y, col, n) { for (let i = 0; i < n; i++) this.particles.push(new Particle(x, y, col)); }

  // ---------- aides au rendu ----------
  visibleRunners() {
    if (this.state === 'lab') return this.lab.runners.filter(r => r.alive);
    return this.racers;
  }

  drawRunner(r, view) {
    if (this.state === 'lab') r.show(view, r === this.lab.leader() || r.champion ? 255 : 110);
    else r.show(view);
  }

  raysFor(r) {
    if (this.state === 'lab') return r === this.lab.leader();
    return this.debug.rays || r === this.watched();
  }

  // le rival dont on montre le cerveau en course : la meilleure IA
  watched() {
    if (!this.showBrain || this.state === 'lab') return null;
    return this.standings().find(r => !r.human) || null;
  }

  shardsVisible() { return this.state !== 'lab'; }
  playerLap() { return this.player ? this.player.lap : -99; }

  draw() {
    this.view.draw(this);
    hud.draw(this);
  }
}

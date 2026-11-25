// =====================================================================
//  NeuroSettings — menu « Réseau neuronal » (DOM) : architecture du
//  réseau, capteurs, algorithme génétique, préréglages, aperçu en direct
//  (éventail des rayons + schéma du réseau). Les réglages s'appliquent
//  au Labo IA et à « Mon IA ».
// =====================================================================
class NeuroSettings {
  constructor(game) {
    this.game = game;
    this.el = select('#neuro');
    this.fields = [
      { group: 'Réseau de neurones' },
      { k: 'hidden', label: 'Neurones cachés', min: 2, max: 32, step: 1, tip: 'Plus de neurones = cerveau plus riche, mais plus long à entraîner.' },
      { k: 'activation', label: 'Activation', choices: [['tanh', 'tanh'], ['relu', 'ReLU'], ['sigmoid', 'sigmoïde']] },
      { group: 'Capteurs' },
      { k: 'rays', label: 'Nombre de rayons', min: 1, max: 15, step: 1 },
      { k: 'fov', label: 'Champ de vision', min: 30, max: 300, step: 10, unit: '°' },
      { k: 'sight', label: 'Portée des rayons', min: 40, max: 320, step: 10, unit: ' px' },
      { group: 'Algorithme génétique' },
      { k: 'population', label: 'Population', min: 10, max: 250, step: 10 },
      { k: 'mutationRate', label: 'Taux de mutation', min: 0, max: 0.5, step: 0.01, fix: 2 },
      { k: 'mutationStrength', label: 'Force de mutation', min: 0.05, max: 1.5, step: 0.05, fix: 2 },
      { k: 'crossover', label: 'Croisement de 2 parents', bool: true },
      { k: 'elitism', label: 'Élitisme (gardés intacts)', min: 0, max: 10, step: 1 },
      { k: 'fitnessExp', label: 'Fitness = checkpoints ^', choices: [['1', '1'], ['2', '2'], ['3', '3']], num: true },
      { group: 'Simulation' },
      { k: 'genSeconds', label: 'Durée d\'une génération', min: 10, max: 90, step: 5, unit: ' s' },
      { k: 'stallSeconds', label: 'Patience sans checkpoint', min: 0.5, max: 5, step: 0.5, unit: ' s', fix: 1 },
      { k: 'maxSpeed', label: 'Vitesse max', min: 2, max: 5, step: 0.1, fix: 1 }
    ];
    this.presets = {
      'Équilibré': {},
      'Rapide': { population: 80, hidden: 8, mutationRate: 0.15, genSeconds: 20 },
      'Cerveau XXL': { population: 150, hidden: 24, rays: 11, fov: 200, sight: 200 },
      'Myope': { rays: 3, fov: 90, sight: 70 },
      'Chaos': { mutationRate: 0.4, mutationStrength: 1.2, crossover: false, elitism: 0 }
    };
    this.build();
    select('#neuroGo').mousePressed(() => this.apply());
    select('#neuroReset').mousePressed(() => { NEURO = Object.assign({}, NEURO_DEFAULTS); this.sync(); });
    select('#neuroBack').mousePressed(() => this.close());
  }

  build() {
    const form = select('#neuroForm').elt;
    form.innerHTML = '';
    const pre = document.createElement('div');
    pre.className = 'presets';
    for (const name of Object.keys(this.presets)) {
      const b = document.createElement('button');
      b.textContent = name;
      b.addEventListener('click', () => { NEURO = Object.assign({}, NEURO_DEFAULTS, this.presets[name]); this.sync(); });
      pre.appendChild(b);
    }
    form.appendChild(pre);
    for (const f of this.fields) {
      if (f.group) { const h = document.createElement('h3'); h.textContent = f.group; form.appendChild(h); continue; }
      const row = document.createElement('div');
      row.className = 'nrow';
      const lab = document.createElement('span'); lab.textContent = f.label; row.appendChild(lab);
      if (f.choices) {
        const c = document.createElement('div'); c.className = 'choice';
        for (const [v, t] of f.choices) {
          const b = document.createElement('button'); b.textContent = t; b.dataset.v = v;
          b.addEventListener('click', () => { NEURO[f.k] = f.num ? +v : v; this.sync(); });
          c.appendChild(b);
        }
        row.appendChild(c); f.el = c;
      } else if (f.bool) {
        const b = document.createElement('button'); b.className = 'toggle';
        b.addEventListener('click', () => { NEURO[f.k] = !NEURO[f.k]; this.sync(); });
        row.appendChild(b); f.el = b;
      } else {
        const wrap = document.createElement('div'); wrap.className = 'rng';
        const r = document.createElement('input');
        Object.assign(r, { type: 'range', min: f.min, max: f.max, step: f.step });
        r.setAttribute('aria-label', f.label);
        const out = document.createElement('b');
        r.addEventListener('input', () => { NEURO[f.k] = +r.value; this.sync(); });
        wrap.append(r, out); row.appendChild(wrap); f.el = r; f.out = out;
      }
      if (f.tip) row.title = f.tip;
      form.appendChild(row);
    }
  }

  // met le formulaire, le résumé et l'aperçu à jour
  sync() {
    for (const f of this.fields) {
      if (!f.k) continue;
      const v = NEURO[f.k];
      if (f.choices) f.el.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(v) === b.dataset.v));
      else if (f.bool) { f.el.textContent = v ? 'OUI' : 'NON'; f.el.classList.toggle('on', v); }
      else { f.el.value = v; f.out.textContent = (f.fix ? (+v).toFixed(f.fix) : v) + (f.unit || ''); }
    }
    const I = NEURO.rays + 1, Hn = NEURO.hidden, weights = I * Hn + Hn + Hn * 2 + 2;
    select('#neuroSummary').html(`<b>${I} → ${Hn} → 2</b> · ${weights} poids à évoluer · ${NEURO.population} coureurs · activation ${NEURO.activation}`);
    this.preview();
  }

  // aperçu : éventail des rayons à gauche, schéma du réseau à droite
  preview() {
    const cv = select('#neuroCanvas').elt, ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const angles = rayAnglesFor(NEURO.rays, NEURO.fov);
    const cx = 110, cy = H / 2 + 10, R = 30 + (NEURO.sight / 320) * 70;
    ctx.lineWidth = 1;
    for (const a of angles) {
      const t = (a - 90) * Math.PI / 180;
      ctx.strokeStyle = 'rgba(60,255,170,.7)';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(t) * R, cy + Math.sin(t) * R); ctx.stroke();
      ctx.fillStyle = '#3cffaa'; ctx.beginPath(); ctx.arc(cx + Math.cos(t) * R, cy + Math.sin(t) * R, 3, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#20e3ff'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#9fb0e0'; ctx.font = '600 12px Rajdhani, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(NEURO.rays + ' rayons · ' + NEURO.fov + '° · ' + NEURO.sight + ' px', cx, H - 8);
    // réseau
    const layers = [NEURO.rays + 1, NEURO.hidden, 2], xs = [260, 360, 450];
    const pos = layers.map((n, l) => Array.from({ length: n }, (_, i) => [xs[l], 16 + (i + 0.5) * ((H - 40) / n)]));
    ctx.strokeStyle = 'rgba(32,227,255,.18)';
    for (let l = 0; l < 2; l++) for (const a of pos[l]) for (const b of pos[l + 1]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    const cols = ['#3cffaa', '#20e3ff', '#ffd23c'];
    pos.forEach((L, l) => L.forEach(([x, y]) => { ctx.fillStyle = cols[l]; ctx.beginPath(); ctx.arc(x, y, Math.min(5, 90 / L.length + 1.5), 0, 7); ctx.fill(); }));
    ctx.fillStyle = '#9fb0e0';
    ['entrées', 'cachés', 'sorties'].forEach((t, l) => ctx.fillText(t, xs[l], H - 8));
  }

  open(from) { this.from = from; this.sync(); this.el.removeClass('hidden'); }
  close() { this.el.addClass('hidden'); if (this.from === 'menu') menu.show(); }

  apply() {
    try { localStorage.setItem('neuroRaceSettings', JSON.stringify(NEURO)); } catch (e) {}
    this.el.addClass('hidden');
    menu.hide();
    this.game.lab = new Population(this.game.track, null, () => labScreen.refresh());
    this.game.startLab();
    labScreen.show();
    controlPanel.syncMutation();
    labScreen.say('Nouveau Labo : ' + (NEURO.rays + 1) + ' → ' + NEURO.hidden + ' → 2, ' + NEURO.population + ' coureurs.');
  }
}

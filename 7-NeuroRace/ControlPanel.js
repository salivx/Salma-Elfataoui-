// ControlPanel — panneau de debug (touche D) : affichages et réglages en direct
class ControlPanel {
  constructor(game) {
    this.game = game;
    this.el = select('#debugPanel');
    const d = game.debug;
    this.check('#dbRays', v => (d.rays = v));
    this.check('#dbCps', v => (d.checkpoints = v));
    this.check('#dbVec', v => (d.vectors = v));
    this.check('#dbNN', v => (d.nn = v));
    this.check('#dbCity', v => (d.city = v));
    this.slider('#dbMut', '#dbMutVal', v => { NEURO.mutationRate = v; if (game.lab) game.lab.cfg.mutationRate = v; return v.toFixed(2); });
    this.slider('#dbRivals', '#dbRivalsVal', v => { d.rivals = v; return v + ' (prochaine course)'; });
    this.slider('#dbSpeed', '#dbSpeedVal', v => { d.rivalSpeed = v; return '×' + v.toFixed(2); });
    select('#dbClose').mousePressed(() => this.toggle());
  }

  check(id, set) { const c = select(id); c.elt.addEventListener('change', () => set(c.elt.checked)); }

  slider(id, out, set) {
    const s = select(id);
    const apply = () => select(out).html(set(+s.value()));
    s.input(apply); apply();
  }

  syncMutation() { select('#dbMut').value(NEURO.mutationRate); select('#dbMutVal').html(NEURO.mutationRate.toFixed(2)); }

  toggle() {
    Vehicle.debug = !Vehicle.debug;
    Vehicle.debug ? this.el.removeClass('hidden') : this.el.addClass('hidden');
    if (Vehicle.debug && !this.game.debug.rays) { this.game.debug.rays = true; select('#dbRays').elt.checked = true; }
  }
}

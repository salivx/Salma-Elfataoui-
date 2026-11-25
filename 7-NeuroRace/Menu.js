// Menu — écran d'accueil (DOM) : pseudo, couleur, difficulté, tours, Jouer / Labo IA / Comment jouer
class Menu {
  constructor(game) {
    this.game = game;
    this.el = select('#menu');
    this.colors = [[255, 255, 255], [32, 227, 255], [255, 43, 214], [60, 255, 170], [255, 210, 60]];
    const sw = select('#swatches');
    this.colors.forEach((c, i) => {
      const b = createButton('');
      b.parent(sw); b.class('swatch' + (i === 0 ? ' on' : ''));
      b.style('background', `rgb(${c})`); b.attribute('aria-label', 'Couleur ' + (i + 1));
      b.mousePressed(() => { selectAll('.swatch').forEach(s => s.removeClass('on')); b.addClass('on'); game.settings.col = c; });
    });
    this.bindChoice('#diff', v => (game.settings.difficulty = v));
    this.bindChoice('#laps', v => (game.settings.laps = +v));
    this.bindChoice('#ctrl', v => setControl(v));
    select('#name').input(() => { game.settings.name = (select('#name').value().trim() || 'JOUEUR').toUpperCase().slice(0, 10); });
    select('#playBtn').mousePressed(() => this.play());
    select('#labBtn').mousePressed(() => { this.hide(); game.startLab(); labScreen.show(); });
    select('#neuroBtn').mousePressed(() => { this.hide(); neuroSettings.open('menu'); });
    select('#howBtn').mousePressed(() => select('#how').toggleClass('open'));
    this.refreshRecord();
  }

  bindChoice(id, set) {
    const group = select(id);
    group.elt.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        group.elt.querySelectorAll('button').forEach(b => b.classList.remove('on'));
        btn.classList.add('on'); set(btn.dataset.v);
      });
    });
  }

  play(withLab = false) { this.hide(); labScreen.hide(); this.game.startRace(withLab); }
  show() { this.refreshRecord(); this.el.removeClass('hidden'); }
  hide() { this.el.addClass('hidden'); }
  visible() { return !this.el.hasClass('hidden'); }

  refreshRecord() {
    let txt = '';
    try {
      for (const l of [1, 3, 5]) {
        const b = localStorage.getItem('neuroRaceBest_' + l);
        if (b) txt += (txt ? ' · ' : 'Records : ') + l + ' tour' + (l > 1 ? 's' : '') + ' ' + b + ' s';
      }
    } catch (e) {}
    select('#record').html(txt || 'Pas encore de record. À toi de jouer.');
  }
}

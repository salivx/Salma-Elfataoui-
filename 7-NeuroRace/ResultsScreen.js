// ResultsScreen — fin de course : place, temps, classement, record, Rejouer / Menu
class ResultsScreen {
  constructor() {
    this.el = select('#results');
    select('#againBtn').mousePressed(() => menu.play());
    select('#menuBtn2').mousePressed(() => goToMenu());
  }

  show({ order, place, time, best, isRecord, shards, game }) {
    select('#resTitle').html(place === 1 ? 'VICTOIRE !' : place + 'e place');
    select('#resSub').html(`${hud.time(time * 60)} · ${shards} data ramassées` + (isRecord ? ' · <b>NOUVEAU RECORD</b>' : best ? ` · record ${best.toFixed(2)} s` : ''));
    const rows = order.map((r, i) => {
      const t = r.finished ? hud.time(r.finishTime) : 'tour ' + Math.min(game.settings.laps, r.lap + 1);
      const name = String(r.name).replace(/[&<>"']/g, '');
      return `<tr class="${r.human ? 'me' : ''}"><td>${i + 1}</td><td><i style="background:rgb(${r.col})"></i>${name}</td><td>${t}</td></tr>`;
    });
    select('#resTable').html(rows.join(''));
    this.el.removeClass('hidden');
  }

  hide() { this.el.addClass('hidden'); }
  visible() { return !this.el.hasClass('hidden'); }
}

// GameOverScreen : fin de partie (interface DOM) — score, statistiques, rejouer.
class GameOverScreen {
  constructor(onReplay, onMenu) {
    this.root = createDiv();
    this.root.addClass('overlay gameover hidden');

    this.title = createElement('h2', 'Perdu !');
    this.title.parent(this.root);

    this.cause = createP('');
    this.cause.addClass('menu-subtitle');
    this.cause.parent(this.root);

    this.stats = createDiv('');
    this.stats.addClass('stats');
    this.stats.parent(this.root);

    let replay = createButton('Rejouer');
    replay.addClass('menu-play');
    replay.parent(this.root);
    replay.mousePressed(onReplay);

    let menu = createButton('Menu principal');
    menu.addClass('secondary');
    menu.parent(this.root);
    menu.mousePressed(onMenu);

    let hint = createP('Entrée pour rejouer');
    hint.addClass('menu-help');
    hint.parent(this.root);
  }

  /** info : { cause, score, length, kills, rank, seconds, best, newBest } */
  show(info) {
    this.title.html(info.newBest === true ? 'Nouveau record !' : 'Perdu !');
    this.cause.html(info.cause);
    this.stats.html(
      `<div><span>Score</span><b>${info.score}</b></div>`
      + `<div><span>Longueur</span><b>${info.length}</b></div>`
      + `<div><span>Éliminations</span><b>${info.kills}</b></div>`
      + `<div><span>Meilleur rang</span><b>#${info.rank}</b></div>`
      + `<div><span>Temps</span><b>${info.seconds} s</b></div>`
      + `<div><span>Record</span><b>${info.best}</b></div>`,
    );
    this.root.removeClass('hidden');
  }

  hide() {
    this.root.addClass('hidden');
  }

  isVisible() {
    return !this.root.hasClass('hidden');
  }
}

// PauseScreen — écran de pause (Échap / P) : Reprendre, Recommencer, Menu
class PauseScreen {
  constructor(game) {
    this.game = game;
    this.el = select('#pause');
    select('#resumeBtn').mousePressed(() => game.togglePause());
    select('#restartBtn').mousePressed(() => menu.play());
    select('#quitBtn').mousePressed(() => goToMenu());
  }

  sync() { this.game.state === 'pause' ? this.el.removeClass('hidden') : this.el.addClass('hidden'); }
}

// Menu : écran d'accueil (interface DOM, donc pas un Vehicle).
// Pseudo, couleur, difficulté, bouton Jouer, rappel des commandes.
// Derrière lui, le monde tourne en mode « démo » (les bots mangent le texte géant).
class Menu {
  constructor(onPlay) {
    this.onPlay = onPlay;
    this.hues = [0, 30, 55, 110, 170, 200, 260, 310];
    this.hue = random(this.hues);
    this.difficulty = 'normal';

    this.root = createDiv();
    this.root.addClass('overlay menu');

    let title = createDiv();
    title.addClass('menu-title');
    title.parent(this.root);
    // Chaque lettre est un <span> animé en CSS (vague).
    [...'snake.io'].forEach((letter, i) => {
      let span = createSpan(letter);
      span.style('animation-delay', `${i * 0.12}s`);
      span.parent(title);
    });

    let subtitle = createP('Steering behaviors de Craig Reynolds — p5.js');
    subtitle.addClass('menu-subtitle');
    subtitle.parent(this.root);

    this.nameInput = createInput(this.loadName());
    this.nameInput.attribute('placeholder', 'Ton pseudo');
    this.nameInput.attribute('maxlength', '14');
    this.nameInput.addClass('menu-input');
    this.nameInput.parent(this.root);

    // Choix de la couleur.
    let colors = createDiv();
    colors.addClass('menu-colors');
    colors.parent(this.root);
    this.swatches = this.hues.map((hue) => {
      let swatch = createButton('');
      swatch.addClass('swatch');
      swatch.style('background', `hsl(${hue}, 85%, 55%)`);
      swatch.parent(colors);
      swatch.mousePressed(() => this.selectHue(hue));
      return { hue, swatch };
    });
    this.selectHue(this.hue);

    // Choix de la difficulté.
    let levels = createDiv();
    levels.addClass('menu-levels');
    levels.parent(this.root);
    this.levelButtons = [['facile', 'Facile'], ['normal', 'Normal'], ['difficile', 'Difficile']]
      .map(([id, label]) => {
        let button = createButton(label);
        button.addClass('level');
        button.parent(levels);
        button.mousePressed(() => this.selectLevel(id));
        return { id, button };
      });
    this.selectLevel(this.difficulty);

    let play = createButton('Jouer');
    play.addClass('menu-play');
    play.parent(this.root);
    play.mousePressed(() => this.play());

    this.best = createP('');
    this.best.addClass('menu-best');
    this.best.parent(this.root);

    let help = createDiv(
      '<b>Souris</b> diriger · <b>Clic / Espace</b> accélérer · <b>P / Échap</b> pause · '
      + '<b>D</b> debug<br>Mange les points et le <b>texte géant</b> pour grandir. '
      + 'Ne touche pas le corps des autres serpents… ni le bord du monde !',
    );
    help.addClass('menu-help');
    help.parent(this.root);
  }

  selectHue(hue) {
    this.hue = hue;
    this.swatches.forEach((s) => {
      if (s.hue === hue) {
        s.swatch.addClass('selected');
      } else {
        s.swatch.removeClass('selected');
      }
    });
  }

  selectLevel(id) {
    this.difficulty = id;
    this.levelButtons.forEach((l) => {
      if (l.id === id) {
        l.button.addClass('selected');
      } else {
        l.button.removeClass('selected');
      }
    });
  }

  play() {
    let name = this.nameInput.value().trim() || 'Salma';
    this.saveName(name);
    this.onPlay(name, this.hue, this.difficulty);
  }

  show(bestScore) {
    this.best.html(bestScore > 0 ? `Meilleur score : <b>${bestScore}</b>` : '');
    this.root.removeClass('hidden');
  }

  hide() {
    this.root.addClass('hidden');
  }

  isVisible() {
    return !this.root.hasClass('hidden');
  }

  // localStorage peut être indisponible : toujours protégé par try/catch.
  loadName() {
    try {
      return localStorage.getItem('snakeio-name') || '';
    } catch (e) {
      return '';
    }
  }

  saveName(name) {
    try {
      localStorage.setItem('snakeio-name', name);
    } catch (e) {
      // Pas de stockage : tant pis.
    }
  }
}

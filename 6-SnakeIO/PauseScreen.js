// PauseScreen : écran de pause (interface DOM).
class PauseScreen {
  constructor(onResume, onMenu) {
    this.root = createDiv();
    this.root.addClass('overlay pause hidden');

    let title = createElement('h2', 'Pause');
    title.parent(this.root);

    let resume = createButton('Reprendre');
    resume.addClass('menu-play');
    resume.parent(this.root);
    resume.mousePressed(onResume);

    let menu = createButton('Menu principal');
    menu.addClass('secondary');
    menu.parent(this.root);
    menu.mousePressed(onMenu);

    let hint = createP('P ou Échap pour reprendre');
    hint.addClass('menu-help');
    hint.parent(this.root);
  }

  show() {
    this.root.removeClass('hidden');
  }

  hide() {
    this.root.addClass('hidden');
  }
}

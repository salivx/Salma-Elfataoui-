// Hud : informations dessinées en coordonnées écran par-dessus le monde
// (score, classement, mini-carte, infos de debug). Rien n'y bouge par steering :
// ce n'est qu'un afficheur, donc pas un Vehicle.
class Hud {
  constructor() {
    this.minimapSize = 160;
    this.fpsSmooth = 60;
  }

  show(game) {
    this.fpsSmooth = lerp(this.fpsSmooth, frameRate(), 0.05);
    push();
    textFont('system-ui, sans-serif');
    if (game.player !== null && game.state !== 'menu') {
      this.showScore(game);
    }
    this.showLeaderboard(game);
    if (game.settings.minimap === true) {
      this.showMinimap(game);
    }
    if (Vehicle.debug === true) {
      this.showDebug(game);
    }
    pop();
  }

  showScore(game) {
    let p = game.player;
    let x = 20;
    let y = height - 20;
    noStroke();
    fill(0, 140);
    rect(x - 10, y - 78, 230, 88, 10);
    fill(255);
    textAlign(LEFT, BOTTOM);
    textSize(26);
    textStyle(BOLD);
    text(`Score : ${p.score}`, x, y - 44);
    textStyle(NORMAL);
    textSize(14);
    fill(220);
    text(`Longueur ${p.segments.length + 1}  ·  Éliminations ${p.kills}`, x, y - 22);
    fill(p.boosting === true ? color(255, 220, 0) : color(160));
    text(p.boosting === true ? 'BOOST !' : 'Clic / Espace : boost', x, y - 2);
  }

  showLeaderboard(game) {
    let ranking = game.ranking();
    let w = 210;
    let x = width - w - 16;
    let y = 16;
    let rows = min(10, ranking.length);
    noStroke();
    fill(0, 130);
    rect(x, y, w, 36 + (rows * 20), 10);
    fill(255);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(15);
    text('Classement', x + 12, y + 9);
    textStyle(NORMAL);
    textSize(13);
    for (let i = 0; i < rows; i += 1) {
      let s = ranking[i];
      let rowY = y + 32 + (i * 20);
      let isPlayer = s === game.player;
      push();
      colorMode(HSB, 360, 100, 100);
      fill(s.hue, 70, 100);
      circle(x + 18, rowY + 7, 9);
      pop();
      fill(isPlayer ? color(255, 230, 80) : color(235));
      textStyle(isPlayer ? BOLD : NORMAL);
      text(`${i + 1}. ${s.name}`, x + 28, rowY);
      textAlign(RIGHT, TOP);
      text(s.score, x + w - 12, rowY);
      textAlign(LEFT, TOP);
    }
    // Rang du joueur s'il n'est pas dans le top 10.
    if (game.player !== null && game.player.alive === true) {
      let rank = ranking.indexOf(game.player) + 1;
      if (rank > rows) {
        fill(255, 230, 80);
        text(`Toi : #${rank}`, x + 12, y + 40 + (rows * 20));
      }
    }
  }

  showMinimap(game) {
    let s = this.minimapSize;
    let x = width - s - 16;
    let y = height - s - 16;
    let k = s / game.world.w;
    noStroke();
    fill(0, 140);
    rect(x, y, s, s, 8);
    stroke(255, 60);
    noFill();
    rect(x, y, s, s, 8);

    // Zone du texte géant.
    noStroke();
    fill(255, 255, 255, 25);
    let c = game.text.center;
    rectMode(CENTER);
    rect(x + (c.x * k), y + (c.y * k), 2400 * k, 520 * k);
    rectMode(CORNER);

    // Serpents : un point par serpent, taille selon le score.
    game.snakes.forEach((snake) => {
      if (snake.alive !== true) {
        return;
      }
      push();
      colorMode(HSB, 360, 100, 100);
      fill(snake.hue, 70, 100);
      circle(x + (snake.pos.x * k), y + (snake.pos.y * k), snake === game.player ? 7 : 3 + (snake.r * 0.1));
      pop();
    });

    // Rectangle de la vue courante.
    let v = game.camera.view();
    stroke(255, 120);
    noFill();
    rect(x + (v.x * k), y + (v.y * k), v.w * k, v.h * k);
  }

  showDebug(game) {
    let lines = [
      `FPS : ${this.fpsSmooth.toFixed(0)}`,
      `État : ${game.state}`,
      `Serpents vivants : ${game.snakes.filter((s) => s.alive).length}`,
      `Anneaux (total) : ${game.snakes.reduce((n, s) => n + s.segments.length, 0)}`,
      `Nourriture : ${game.foods.length}`,
      `Texte « ${game.text.word} » : ${game.text.visibleCount()}/${game.text.dots.length} points`,
      `Popups : ${game.popups.length}`,
      `Caméra : (${game.camera.pos.x.toFixed(0)}, ${game.camera.pos.y.toFixed(0)}) zoom ${game.camera.zoom.toFixed(2)}`,
      `God mode : ${game.settings.godMode ? 'oui' : 'non'}`,
      'G : +20 score · B : +1 bot · K : se tuer',
    ];
    let x = 16;
    let y = height - 130 - (lines.length * 16);
    noStroke();
    fill(0, 170);
    rect(x - 6, y - 8, 320, (lines.length * 16) + 14, 6);
    fill(0, 255, 120);
    textAlign(LEFT, TOP);
    textSize(12);
    lines.forEach((line, i) => text(line, x, y + (i * 16)));
  }
}

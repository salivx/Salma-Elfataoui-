// Snake.io — jeu façon slither.io construit sur les steering behaviors.
// Aucune classe dans ce fichier (voir ARCHITECTURE.md) : toute la logique est dans Game.
//
// Commandes : souris = diriger, clic maintenu / espace = boost, P / Échap = pause,
// D = debug (panneau de réglages + vecteurs). En debug : G = +20 score,
// B = +1 bot, K = se tuer.

let game;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  describe('Jeu snake.io : des serpents colorés glissent sur une grille hexagonale, '
    + 'mangent des points lumineux et un grand texte arc-en-ciel.');

  // Boost à la souris seulement si le clic a lieu sur le canevas (pas sur le menu).
  canvas.mousePressed(() => {
    game.mouseBoost = true;
  });

  game = new Game();
}

function draw() {
  game.run();
}

function mouseReleased() {
  game.mouseBoost = false;
}

function keyPressed() {
  // Pendant la saisie du pseudo, seules les touches Entrée comptent.
  let typing = document.activeElement !== null && document.activeElement.tagName === 'INPUT'
    && document.activeElement.type === 'text';

  if (keyCode === ENTER) {
    if (game.state === 'menu') {
      game.menu.play();
    } else if (game.state === 'gameover') {
      game.restart();
    }
    return false;
  }
  if (typing === true) {
    return true;
  }

  if (key === 'd' || key === 'D') {
    game.setDebug(!Vehicle.debug);
  } else if (key === 'p' || key === 'P' || keyCode === ESCAPE) {
    game.togglePause();
  }

  // Raccourcis de debug.
  if (Vehicle.debug === true && game.state === 'playing' && game.player !== null) {
    if (key === 'g' || key === 'G') {
      game.player.grow(20);
    } else if (key === 'k' || key === 'K') {
      game.kill(game.player, null, 'Auto-destruction (touche K).');
    }
  }
  if (Vehicle.debug === true && (key === 'b' || key === 'B')) {
    game.settings.botCount += 1;
    game.sliders.botCount.value(game.settings.botCount);
    game.sliders.botCount.elt.dispatchEvent(new Event('input'));
  }

  // Empêche la page de défiler avec la barre d'espace.
  return key !== ' ';
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

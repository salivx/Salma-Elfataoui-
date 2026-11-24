// Game : état de la partie et boucle de jeu.
// États : 'menu' (démo en fond), 'playing', 'paused', 'gameover'.
// Respecte l'ordre de ARCHITECTURE.md : 1. décider, 2. bouger, 3. interactions, 4. dessiner.
class Game {
  constructor() {
    this.world = { x: 0, y: 0, w: 4000, h: 4000 };
    this.center = createVector(this.world.w / 2, this.world.h / 2);

    this.difficulties = {
      facile: { botCount: 8, botSpeed: 2.6, botForce: 0.2, botPerception: 160, botAggression: 0.3 },
      normal: { botCount: 14, botSpeed: 3, botForce: 0.25, botPerception: 220, botAggression: 0.7 },
      difficile: { botCount: 20, botSpeed: 3.2, botForce: 0.3, botPerception: 300, botAggression: 1.2 },
    };
    this.settings = {
      ...this.difficulties.normal,
      foodCount: 900,
      playerSpeed: 3,
      autoZoom: true,
      godMode: false,
      minimap: true,
    };
    this.botNames = ['Kaa', 'Nagini', 'Sifflote', 'Zigzag', 'Python', 'Cobra', 'Mamba', 'Vipère',
      'Anaconda', 'Boa', 'Slinky', 'Spaghetti', 'Ruban', 'Noodle', 'Sssam', 'Reynolds',
      'Boid', 'Wanderer', 'Seeker', 'Evadeur', 'Mocassin', 'Taïpan'];

    this.snakes = [];
    this.foods = [];
    this.popups = [];
    this.player = null;
    this.pendingBots = [];
    this.state = 'menu';
    this.mouseBoost = false;
    this.last = { name: 'Salma', hue: 0, difficulty: 'normal' };

    this.camera = new Camera(this.center.x, this.center.y);
    this.camera.zoom = 0.6;
    this.text = new AnimatedText(this, createVector(this.center.x, this.center.y - 200),
      ['SNAKE.IO', 'MANGE-MOI', 'STEERING', 'REYNOLDS', 'M2 IA2', 'MIAM !']);
    this.hud = new Hud();

    this.menu = new Menu((name, hue, difficulty) => this.start(name, hue, difficulty));
    this.pauseScreen = new PauseScreen(() => this.resume(), () => this.toMenu());
    this.gameOverScreen = new GameOverScreen(() => this.restart(), () => this.toMenu());
    this.buildPanel();

    this.maintainWorld(true);
    this.menu.show(this.bestScore());
  }

  // ---------------------------------------------------------------------------
  // Boucle principale (appelée par draw()).
  // ---------------------------------------------------------------------------

  run() {
    background(70, 10, 15);
    let view = this.camera.view();

    push();
    this.camera.begin();
    this.drawWorld(view);

    if (this.state !== 'paused') {
      this.text.update();
      this.maintainWorld(false);
      this.decide();
      this.move();
      this.interact();
    }

    this.foods.forEach((f) => f.show(view));
    // Les plus petits d'abord : les gros passent par-dessus.
    [...this.snakes].sort((a, b) => a.score - b.score).forEach((s) => s.show(view));
    this.popups.forEach((p) => p.show());
    this.camera.show();
    pop();

    this.hud.show(this);
  }

  /** 1. Chaque Vehicle calcule et applique ses forces. */
  decide() {
    let target;
    let zoom;
    if (this.state === 'playing' && this.player !== null) {
      target = this.player.pos;
      zoom = this.settings.autoZoom === true ? map(this.player.r, 9, 27, 1, 0.55, true) : 1;
    } else if (this.state === 'gameover') {
      target = this.camera.pos;
      zoom = this.camera.targetZoom;
    } else {
      // Menu : la caméra tourne lentement autour du texte géant.
      let t = frameCount * 0.004;
      target = createVector(this.text.center.x + (500 * cos(t)), this.text.center.y + (250 * sin(t)));
      zoom = 0.6;
    }
    this.camera.applyBehaviors(target, zoom);

    this.foods.forEach((f) => f.applyBehaviors());
    this.snakes.forEach((s) => s.applyBehaviors(this));
    this.popups.forEach((p) => p.applyBehaviors());
  }

  /** 2. Tout le monde bouge. */
  move() {
    this.camera.update();
    this.foods.forEach((f) => f.update());
    this.snakes.forEach((s) => s.update());
    this.popups.forEach((p) => p.update());
    this.popups = this.popups.filter((p) => !p.isDead());

    if (this.state === 'playing' && this.player !== null) {
      let rank = this.ranking().indexOf(this.player) + 1;
      this.bestRank = min(this.bestRank, rank);
    }
  }

  /** 3. Manger, se cogner. */
  interact() {
    this.eat();
    this.collisions();
  }

  // ---------------------------------------------------------------------------
  // Nourriture.
  // ---------------------------------------------------------------------------

  eat() {
    let removed = new Set();
    this.foods.forEach((f) => {
      f.attractor = null;
      if (f.hidden === true) {
        return;
      }
      let bestD2 = Infinity;
      for (let s of this.snakes) {
        let dx = s.pos.x - f.pos.x;
        let dy = s.pos.y - f.pos.y;
        let d2 = (dx * dx) + (dy * dy);
        let eatR = s.r + f.r;
        if (d2 < eatR * eatR) {
          s.grow(f.value);
          if (s === this.player && f instanceof TextFood && this.popups.length < 40) {
            this.popups.push(new ScorePopup(f.pos.x, f.pos.y, `+${f.value}`, (frameCount * 3) % 360, 16));
          }
          if (f.onEaten() === true) {
            removed.add(f);
          }
          f.attractor = null;
          return;
        }
        let attractR = (s.r * 2) + 40;
        if (d2 < attractR * attractR && d2 < bestD2) {
          bestD2 = d2;
          f.attractor = s;
        }
      }
    });
    if (removed.size > 0) {
      this.foods = this.foods.filter((f) => !removed.has(f));
    }
  }

  /** Ajoute une boule de nourriture (gardée à l'intérieur du monde). */
  spawnFood(x, y, value = 1, hue = random(360)) {
    let fx = constrain(x, this.world.x + 20, this.world.x + this.world.w - 20);
    let fy = constrain(y, this.world.y + 20, this.world.y + this.world.h - 20);
    this.foods.push(new Food(fx, fy, value, hue));
  }

  /** Nourriture la plus rentable dans le champ de perception d'un bot. */
  bestFoodFor(bot) {
    let best = null;
    let bestScore = 0;
    let r2 = bot.perceptionRadius * bot.perceptionRadius;
    this.foods.forEach((f) => {
      if (f.hidden === true) {
        return;
      }
      let dx = f.pos.x - bot.pos.x;
      let dy = f.pos.y - bot.pos.y;
      let d2 = (dx * dx) + (dy * dy);
      if (d2 > r2) {
        return;
      }
      let score = f.value / (sqrt(d2) + 20);
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    });
    return best;
  }

  // ---------------------------------------------------------------------------
  // Collisions et morts.
  // ---------------------------------------------------------------------------

  collisions() {
    let deaths = new Map(); // victime -> { killer, cause }
    let w = this.world;

    this.snakes.forEach((s) => {
      if (s === this.player && this.settings.godMode === true) {
        return;
      }
      if (s.pos.x < w.x || s.pos.y < w.y || s.pos.x > w.x + w.w || s.pos.y > w.y + w.h) {
        deaths.set(s, { killer: null, cause: 'Tu as touché le bord du monde.' });
        return;
      }
      for (let o of this.snakes) {
        if (o === s) {
          continue;
        }
        let reach = (o.segments.length * o.spacing) + o.r + s.r + 50;
        if (p5.Vector.dist(s.pos, o.pos) > reach) {
          continue;
        }
        // Tête contre tête : le plus petit meurt (les deux si égalité).
        if (p5.Vector.dist(s.pos, o.pos) < (s.r + o.r) * 0.8 && s.score <= o.score) {
          deaths.set(s, { killer: o, cause: `Collision frontale avec ${o.name}.` });
          return;
        }
        let hitR = (s.r * 0.6) + (o.r * 0.85);
        for (let seg of o.segments) {
          if (p5.Vector.dist(s.pos, seg.pos) < hitR) {
            deaths.set(s, { killer: o, cause: `Tu t'es cogné(e) contre ${o.name}.` });
            return;
          }
        }
      }
    });

    deaths.forEach((info, victim) => this.kill(victim, info.killer, info.cause));
  }

  /** Le serpent meurt et se transforme en nourriture. */
  kill(snake, killer = null, cause = '') {
    snake.alive = false;
    this.snakes = this.snakes.filter((s) => s !== snake);

    let parts = snake.parts();
    let value = constrain(round((snake.score + 10) / max(1, parts.length / 2)), 1, 5);
    for (let i = 0; i < parts.length; i += 2) {
      let p = parts[i].pos;
      this.spawnFood(p.x + random(-snake.r, snake.r), p.y + random(-snake.r, snake.r), value, snake.hue);
    }

    if (killer !== null) {
      killer.kills += 1;
      if (killer === this.player) {
        this.popups.push(new ScorePopup(snake.pos.x, snake.pos.y, `Élimine ${snake.name} !`, 50, 26));
      }
    }
    if (snake === this.player) {
      this.endGame(cause);
    }
  }

  // ---------------------------------------------------------------------------
  // Peuplement du monde.
  // ---------------------------------------------------------------------------

  /** Garde le bon nombre de bots et de nourriture. */
  maintainWorld(instant) {
    // Nourriture « normale » (le texte est géré par AnimatedText).
    let normal = this.foods.filter((f) => !(f instanceof TextFood)).length;
    let toAdd = instant === true ? this.settings.foodCount - normal : min(5, this.settings.foodCount - normal);
    for (let i = 0; i < toAdd; i += 1) {
      this.spawnFood(random(this.world.w), random(this.world.h), random() < 0.85 ? 1 : 2);
    }

    // Bots : renaissance après un délai.
    let bots = this.snakes.filter((s) => s instanceof BotSnake);
    let missing = this.settings.botCount - bots.length - this.pendingBots.length;
    for (let i = 0; i < missing; i += 1) {
      this.pendingBots.push(instant === true ? 0 : 120);
    }
    if (missing < 0) {
      // Curseur baissé : on retire des bots en trop (en commençant par les attentes).
      let excess = -missing;
      let fromPending = min(excess, this.pendingBots.length);
      this.pendingBots.splice(0, fromPending);
      bots.slice(0, excess - fromPending).forEach((b) => this.kill(b));
    }
    this.pendingBots = this.pendingBots.map((t) => t - 1);
    while (this.pendingBots.length > 0 && this.pendingBots[0] <= 0) {
      this.pendingBots.shift();
      this.spawnBot();
    }
  }

  spawnBot() {
    let p = this.findSpawnPoint();
    let used = this.snakes.map((s) => s.name);
    let free = this.botNames.filter((n) => !used.includes(n));
    let name = free.length > 0 ? random(free) : `Bot${floor(random(100))}`;
    this.snakes.push(new BotSnake(p.x, p.y, name, random(360), this.settings));
  }

  /** Point au hasard, loin des serpents existants. */
  findSpawnPoint() {
    let best = null;
    let bestDist = -1;
    for (let tries = 0; tries < 30; tries += 1) {
      let p = createVector(random(400, this.world.w - 400), random(400, this.world.h - 400));
      let nearest = Infinity;
      this.snakes.forEach((s) => s.parts().forEach((part) => {
        nearest = min(nearest, p5.Vector.dist(p, part.pos));
      }));
      if (nearest > 500) {
        return p;
      }
      if (nearest > bestDist) {
        bestDist = nearest;
        best = p;
      }
    }
    return best;
  }

  applyBotSettings() {
    this.snakes.forEach((s) => {
      if (s instanceof BotSnake) {
        s.applySettings(this.settings);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // États de jeu.
  // ---------------------------------------------------------------------------

  start(name, hue, difficulty) {
    this.last = { name, hue, difficulty };
    Object.assign(this.settings, this.difficulties[difficulty]);
    this.syncPanel();
    this.applyBotSettings();
    this.menu.hide();
    this.gameOverScreen.hide();

    let p = this.findSpawnPoint();
    this.player = new PlayerSnake(p.x, p.y, name, hue);
    this.player.baseSpeed = this.settings.playerSpeed;
    this.player.boostSpeed = this.settings.playerSpeed * 2.2;
    this.snakes.push(this.player);

    // Téléport explicite de la caméra sur le joueur (début de partie).
    this.camera.pos = this.player.pos.copy();
    this.camera.vel.set(0, 0);
    this.startFrame = frameCount;
    this.bestRank = Infinity;
    this.state = 'playing';
  }

  restart() {
    this.start(this.last.name, this.last.hue, this.last.difficulty);
  }

  endGame(cause) {
    this.state = 'gameover';
    let p = this.player;
    let best = this.bestScore();
    let newBest = p.score > best;
    if (newBest === true) {
      this.saveBestScore(p.score);
    }
    this.gameOverScreen.show({
      cause,
      score: p.score,
      length: p.segments.length + 1,
      kills: p.kills,
      rank: this.bestRank === Infinity ? '-' : this.bestRank,
      seconds: floor((frameCount - this.startFrame) / 60),
      best: max(best, p.score),
      newBest,
    });
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.pauseScreen.show();
    } else if (this.state === 'paused') {
      this.resume();
    }
  }

  resume() {
    this.state = 'playing';
    this.pauseScreen.hide();
  }

  toMenu() {
    this.pauseScreen.hide();
    this.gameOverScreen.hide();
    if (this.player !== null && this.player.alive === true) {
      this.snakes = this.snakes.filter((s) => s !== this.player);
    }
    this.player = null;
    this.state = 'menu';
    this.menu.show(this.bestScore());
  }

  // ---------------------------------------------------------------------------
  // Entrées.
  // ---------------------------------------------------------------------------

  mouseWorld() {
    return this.camera.screenToWorld(mouseX, mouseY);
  }

  boostRequested() {
    return this.mouseBoost === true || keyIsDown(32);
  }

  /** Classement des serpents vivants. */
  ranking() {
    return [...this.snakes].sort((a, b) => b.score - a.score);
  }

  // ---------------------------------------------------------------------------
  // Debug : panneau de réglages (visible seulement en mode debug).
  // ---------------------------------------------------------------------------

  buildPanel() {
    let s = this.settings;
    this.panel = new ControlPanel('Debug — réglages (D)', true);
    this.panel.root.addClass('hidden');
    this.sliders = {};

    this.panel.addSection('Affichage');
    this.debugCheckbox = this.panel.addCheckbox('Mode debug (D)', false, (v) => this.setDebug(v));
    this.panel.addCheckbox('Zoom automatique', s.autoZoom, (v) => { s.autoZoom = v; });
    this.panel.addCheckbox('Mini-carte', s.minimap, (v) => { s.minimap = v; });
    this.panel.addCheckbox('God mode (invincible)', s.godMode, (v) => { s.godMode = v; });

    this.panel.addSection('Monde');
    this.sliders.botCount = this.panel.addSlider('Nombre de bots', 0, 40, s.botCount, 1, (v) => { s.botCount = v; });
    this.panel.addSlider('Nourriture', 0, 3000, s.foodCount, 50, (v) => { s.foodCount = v; });
    this.panel.addSlider('Durée d\'un mot (s)', 5, 60, this.text.wordDuration / 60, 1, (v) => {
      this.text.wordDuration = v * 60;
    });

    this.panel.addSection('Joueur');
    this.panel.addSlider('Vitesse', 1, 8, s.playerSpeed, 0.1, (v) => {
      s.playerSpeed = v;
      if (this.player !== null) {
        this.player.baseSpeed = v;
        this.player.boostSpeed = v * 2.2;
      }
    });

    this.panel.addSection('Bots');
    let bot = (key, label, min, max, step) => {
      this.sliders[key] = this.panel.addSlider(label, min, max, s[key], step, (v) => {
        s[key] = v;
        this.applyBotSettings();
      });
    };
    bot('botSpeed', 'Vitesse max', 1, 8, 0.1);
    bot('botForce', 'Force max (virage)', 0.05, 1, 0.01);
    bot('botPerception', 'Perception', 50, 500, 10);
    bot('botAggression', 'Agressivité', 0, 2, 0.05);
  }

  /** Recale les curseurs après un changement de difficulté. */
  syncPanel() {
    Object.entries(this.sliders).forEach(([key, slider]) => {
      slider.value(this.settings[key]);
      slider.elt.dispatchEvent(new Event('input'));
    });
  }

  /** Point unique de bascule du debug : touche D et case à cocher restent synchronisées. */
  setDebug(value) {
    Vehicle.debug = value;
    this.debugCheckbox.checked(value);
    if (value === true) {
      this.panel.root.removeClass('hidden');
    } else {
      this.panel.root.addClass('hidden');
    }
  }

  // ---------------------------------------------------------------------------
  // Rendu du décor.
  // ---------------------------------------------------------------------------

  drawWorld(view) {
    let w = this.world;
    push();
    // Hors du monde : zone rouge sombre.
    noStroke();
    fill(60, 8, 12);
    rect(view.x, view.y, view.w, view.h);
    fill(14, 18, 30);
    rect(w.x, w.y, w.w, w.h);

    // Grille hexagonale légère, seulement dans la partie visible.
    let size = 60;
    let hexW = size * sqrt(3);
    let rowH = size * 1.5;
    let x0 = max(w.x, view.x - hexW);
    let x1 = min(w.x + w.w, view.x + view.w + hexW);
    let y0 = max(w.y, view.y - rowH);
    let y1 = min(w.y + w.h, view.y + view.h + rowH);
    stroke(255, 255, 255, 12);
    strokeWeight(2);
    noFill();
    for (let row = floor(y0 / rowH); row * rowH < y1; row += 1) {
      let offset = row % 2 === 0 ? 0 : hexW / 2;
      for (let col = floor((x0 - offset) / hexW); (col * hexW) + offset < x1; col += 1) {
        drawHexagon((col * hexW) + offset, row * rowH, size * 0.92);
      }
    }

    // Bord du monde, qui pulse.
    stroke(255, 40, 60, 150 + (80 * sin(frameCount * 0.08)));
    strokeWeight(8);
    noFill();
    rect(w.x, w.y, w.w, w.h);
    pop();
  }

  // ---------------------------------------------------------------------------
  // Record (localStorage protégé par try/catch).
  // ---------------------------------------------------------------------------

  bestScore() {
    try {
      return Number(localStorage.getItem('snakeio-best')) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveBestScore(score) {
    try {
      localStorage.setItem('snakeio-best', String(score));
    } catch (e) {
      // Pas de stockage disponible.
    }
  }
}

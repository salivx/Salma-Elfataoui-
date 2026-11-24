// AnimatedText : gère le texte géant posé au milieu du monde.
// Ce n'est pas un élément dessiné : c'est un « chef d'orchestre » qui calcule les
// points des lettres et donne à chaque TextFood (un Vehicle) sa place `home`.
// Les points sont obtenus en dessinant le mot dans un p5.Graphics hors écran puis
// en lisant ses pixels (pas besoin de fichier de police).
class AnimatedText {
  constructor(game, center, words, wordDuration = 1500) {
    this.game = game;
    this.center = center.copy();
    this.words = words;
    this.wordDuration = wordDuration;
    this.index = 0;
    this.timer = 0;
    this.step = 12;       // écart entre points dans le p5.Graphics (px)
    this.scale = 1.6;     // agrandissement graphics -> monde
    this.dots = [];
    this.setWord(this.words[0], true);
  }

  get word() {
    return this.words[this.index];
  }

  /** Points (coordonnées monde) formant le mot. */
  computePoints(word) {
    let g = createGraphics(1500, 320);
    g.pixelDensity(1);
    g.background(0);
    g.fill(255);
    g.noStroke();
    g.textStyle(BOLD);
    g.textAlign(CENTER, CENTER);
    let size = 250;
    g.textSize(size);
    while (g.textWidth(word) > g.width - 40 && size > 40) {
      size -= 10;
      g.textSize(size);
    }
    g.text(word, g.width / 2, g.height / 2);
    g.loadPixels();

    let points = [];
    for (let y = 0; y < g.height; y += this.step) {
      for (let x = 0; x < g.width; x += this.step) {
        let i = 4 * ((y * g.width) + x);
        if (g.pixels[i] > 128) {
          points.push(createVector(
            this.center.x + ((x - (g.width / 2)) * this.scale),
            this.center.y + ((y - (g.height / 2)) * this.scale),
          ));
        }
      }
    }
    g.remove();
    return points;
  }

  /** Change de mot : les points existants reçoivent une nouvelle place. */
  setWord(word, instant = false) {
    let points = shuffle(this.computePoints(word));
    points.forEach((home, i) => {
      if (i < this.dots.length) {
        this.dots[i].home = home;
      } else {
        let start = instant === true
          ? p5.Vector.add(home, p5.Vector.random2D().mult(random(0, 900)))
          : p5.Vector.add(this.center, p5.Vector.random2D().mult(random(900, 1400)));
        let dot = new TextFood(start.x, start.y, home);
        this.dots.push(dot);
        this.game.foods.push(dot);
      }
    });
    // Points en trop : retirés du monde.
    let extra = this.dots.splice(points.length);
    if (extra.length > 0) {
      this.game.foods = this.game.foods.filter((f) => !extra.includes(f));
    }
  }

  /** Passe au mot suivant toutes les wordDuration frames. */
  update() {
    this.timer += 1;
    if (this.timer >= this.wordDuration) {
      this.timer = 0;
      this.index = (this.index + 1) % this.words.length;
      this.setWord(this.word);
    }
  }

  /** Nombre de points actuellement en place (pour le HUD de debug). */
  visibleCount() {
    return this.dots.filter((d) => d.hidden === false).length;
  }
}

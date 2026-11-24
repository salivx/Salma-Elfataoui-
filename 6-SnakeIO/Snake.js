// Snake : un serpent façon slither.io.
// La tête EST le véhicule (this.pos, this.vel) ; le corps est une liste de Segment
// (eux aussi des Vehicle) qui suivent la tête avec arrive().
// Les sous-classes (PlayerSnake, BotSnake) redéfinissent applyBehaviors() pour choisir
// les forces de la tête, puis appellent applyBodyBehaviors().
class Snake extends Vehicle {
  constructor(x, y, name, hue, startLength = 10) {
    super(x, y);
    this.name = name;
    this.hue = hue;

    this.baseSpeed = 3;
    this.boostSpeed = 6.5;
    this.baseForce = 0.25;
    this.maxSpeed = this.baseSpeed;
    this.maxForce = this.baseForce;
    this.vel.setMag(this.baseSpeed);

    this.minLength = startLength;
    this.score = 0;
    this.kills = 0;
    this.alive = true;
    this.boosting = false;
    this.boostTimer = 0;
    this.lookDir = this.vel.heading();
    this.label = '';
    this.debugTarget = null;

    this.r = 10;
    this.spacing = 5;
    this.segments = [];
    this.updateSize();

    // Le corps est posé derrière la tête, dans l'axe de la vitesse.
    let back = p5.Vector.mult(this.vel, -1).setMag(this.spacing);
    for (let i = 0; i < this.targetLength(); i += 1) {
      let p = p5.Vector.add(this.pos, p5.Vector.mult(back, i + 1));
      this.segments.push(new Segment(p.x, p.y, this));
    }
  }

  // ---------------------------------------------------------------------------
  // Taille et croissance.
  // ---------------------------------------------------------------------------

  /** Nombre d'anneaux voulu pour le score courant. */
  targetLength() {
    return this.minLength + floor(this.score / 2);
  }

  /** Rayon et écart entre anneaux grossissent avec le score. */
  updateSize() {
    this.r = 9 + min(18, sqrt(this.score) * 0.55);
    this.spacing = this.r * 0.55;
    this.lookAhead = 50 + (this.r * 3);
  }

  /** Mange (value > 0) ou maigrit (value < 0). Ajoute / retire des anneaux. */
  grow(value) {
    this.score = max(0, this.score + value);
    this.updateSize();
    let wanted = this.targetLength();
    while (this.segments.length < wanted) {
      let tail = this.segments.length > 0 ? this.segments[this.segments.length - 1] : this;
      this.segments.push(new Segment(tail.pos.x, tail.pos.y, this));
    }
    while (this.segments.length > wanted) {
      this.segments.pop();
    }
  }

  /** Active / coupe le boost. Le boost coûte de la longueur et sème de la nourriture. */
  setBoost(wanted, game) {
    this.boosting = wanted === true && this.segments.length > this.minLength;
    this.maxSpeed = this.boosting === true ? this.boostSpeed : this.baseSpeed;
    this.maxForce = this.boosting === true ? this.baseForce * 1.6 : this.baseForce;

    if (this.boosting === true) {
      this.boostTimer += 1;
      if (this.boostTimer % 6 === 0) {
        let tail = this.segments[this.segments.length - 1];
        this.grow(-1);
        game.spawnFood(tail.pos.x, tail.pos.y, 1, this.hue);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pilotage.
  // ---------------------------------------------------------------------------

  /** Chaque anneau décide de suivre celui qui le précède. */
  applyBodyBehaviors() {
    for (let i = 0; i < this.segments.length; i += 1) {
      let leader = i === 0 ? this : this.segments[i - 1];
      this.segments[i].applyBehaviors(leader);
    }
  }

  /** Tête + corps bougent (après que tout le monde a décidé). */
  update() {
    super.update();
    this.segments.forEach((s) => s.update());
  }

  /** Tous les morceaux sur lesquels on peut se cogner (tête comprise). */
  parts() {
    return [this, ...this.segments];
  }

  // ---------------------------------------------------------------------------
  // Rendu.
  // ---------------------------------------------------------------------------

  /** view = rectangle visible en coordonnées monde (culling). */
  show(view) {
    push();
    colorMode(HSB, 360, 100, 100, 100);
    noStroke();

    // Halo de boost sous le corps.
    if (this.boosting === true) {
      fill(this.hue, 80, 100, 18 + (8 * sin(frameCount * 0.5)));
      for (let i = this.segments.length - 1; i >= 0; i -= 2) {
        let s = this.segments[i];
        if (inView(s.pos, view, this.r * 2)) {
          circle(s.pos.x, s.pos.y, this.r * 3);
        }
      }
    }

    // Corps de la queue vers la tête, rayures toutes les 3 bagues.
    for (let i = this.segments.length - 1; i >= 0; i -= 1) {
      let s = this.segments[i];
      if (!inView(s.pos, view, this.r)) {
        continue;
      }
      let stripe = floor(i / 3) % 2 === 0;
      let taper = map(i, 0, this.segments.length, 1, 0.75);
      stroke(this.hue, 90, 35);
      strokeWeight(1.5);
      fill(this.hue, stripe ? 75 : 60, stripe ? 95 : 75);
      circle(s.pos.x, s.pos.y, this.r * 2 * taper);
    }

    this.showHead();
    pop();

    if (Vehicle.debug === true) {
      this.showDebug();
    }
  }

  showHead() {
    stroke(this.hue, 90, 35);
    strokeWeight(1.5);
    fill(this.hue, 70, 100);
    circle(this.pos.x, this.pos.y, this.r * 2.2);

    // Yeux qui regardent dans la direction lookDir.
    let heading = this.vel.heading();
    let look = p5.Vector.fromAngle(this.lookDir).mult(this.r * 0.18);
    noStroke();
    [-1, 1].forEach((side) => {
      let eye = p5.Vector.fromAngle(heading + (side * 0.7)).mult(this.r * 0.6);
      eye.add(this.pos);
      fill(0, 0, 100);
      circle(eye.x, eye.y, this.r * 0.75);
      fill(0, 0, 5);
      circle(eye.x + look.x, eye.y + look.y, this.r * 0.4);
    });

    // Nom au-dessus de la tête.
    fill(0, 0, 100, 85);
    textAlign(CENTER, BOTTOM);
    textSize(13);
    text(this.name, this.pos.x, this.pos.y - (this.r * 1.6));
  }

  showDebug() {
    push();
    noFill();
    strokeWeight(1);
    // Cercle de collision de la tête et des anneaux.
    stroke(255, 0, 0);
    circle(this.pos.x, this.pos.y, this.r * 2);
    stroke(255, 0, 0, 70);
    for (let i = 0; i < this.segments.length; i += 4) {
      circle(this.segments[i].pos.x, this.segments[i].pos.y, this.r * 2);
    }
    // Cible courante.
    if (this.debugTarget !== null) {
      stroke(0, 255, 255);
      line(this.pos.x, this.pos.y, this.debugTarget.x, this.debugTarget.y);
      circle(this.debugTarget.x, this.debugTarget.y, 14);
    }
    // État et score.
    noStroke();
    fill(255, 255, 0);
    textAlign(CENTER, TOP);
    textSize(11);
    text(`${this.label} | score ${this.score} | v ${this.vel.mag().toFixed(1)}`,
      this.pos.x, this.pos.y + (this.r * 1.6));
    pop();

    drawArrow(this.pos, p5.Vector.mult(this.vel, 10), 'red');
  }
}

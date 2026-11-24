// BotSnake : serpent contrôlé par l'ordinateur.
// Sélection d'action par priorités (Reynolds) :
//   1. contain()  — ne pas sortir du monde (mortel) ;
//   2. avoid()    — ne pas foncer dans le corps d'un autre serpent (mortel) ;
//   3. evade()    — fuir la tête d'un serpent plus gros tout proche ;
//   4. pursue()   — chasser un serpent plus petit (selon l'agressivité) ;
//   5. seek()     — aller manger la nourriture la plus intéressante ;
//   6. wander()   — sinon, errer.
class BotSnake extends Snake {
  constructor(x, y, name, hue, settings) {
    super(x, y, name, hue, 10);
    this.applySettings(settings);
    this.wanderRadius = 40;
    this.wanderDistance = 80;
    this.displaceRange = 0.25;
    // Un bot démarre avec une taille aléatoire pour animer le classement.
    this.grow(floor(random(0, 60)));
  }

  /** Réglages communs à tous les bots (modifiables depuis le panneau de debug). */
  applySettings(settings) {
    this.baseSpeed = settings.botSpeed;
    this.boostSpeed = settings.botSpeed * 2.1;
    this.baseForce = settings.botForce;
    this.perceptionRadius = settings.botPerception;
    this.aggression = settings.botAggression;
  }

  applyBehaviors(game) {
    let others = game.snakes.filter((s) => s !== this && s.alive === true);
    let wantBoost = false;
    this.debugTarget = null;
    this.lookDir = this.vel.heading();

    // --- 1. Rester dans le monde. ---
    let containForce = this.contain(game.world, 120);

    // --- 2. Obstacles = morceaux des autres serpents proches (ce sont des Vehicle). ---
    let obstacles = [];
    others.forEach((o) => {
      let reach = this.perceptionRadius + (o.segments.length * o.spacing);
      if (p5.Vector.dist(this.pos, o.pos) > reach) {
        return;
      }
      o.parts().forEach((part) => {
        if (p5.Vector.dist(this.pos, part.pos) < this.perceptionRadius) {
          obstacles.push(part);
        }
      });
    });
    let avoidForce = this.avoid(obstacles);

    // --- 3. et 4. Menace et proie parmi les têtes voisines. ---
    let threat = null;
    let prey = null;
    let threatDistance = this.perceptionRadius * 0.6;
    let preyDistance = this.perceptionRadius * this.aggression;
    others.forEach((o) => {
      let d = p5.Vector.dist(this.pos, o.pos);
      if (o.score > this.score + 5 && d < threatDistance) {
        threat = o;
        threatDistance = d;
      } else if (this.score > o.score + 10 && d < preyDistance) {
        prey = o;
        preyDistance = d;
      }
    });

    let steering;
    if (containForce.magSq() > 0) {
      this.label = 'bord';
      steering = containForce.mult(3);
    } else if (avoidForce.magSq() > 0) {
      this.label = 'évite';
      steering = avoidForce.mult(4);
    } else if (threat !== null) {
      this.label = 'fuit';
      steering = this.evade(threat).mult(2);
      wantBoost = threatDistance < this.perceptionRadius * 0.35;
    } else if (prey !== null) {
      this.label = 'chasse';
      // On vise devant la tête de la proie pour lui couper la route.
      let cut = p5.Vector.add(prey.pos, p5.Vector.mult(prey.vel, 25));
      this.debugTarget = cut;
      steering = this.seek(cut).mult(1.5);
      wantBoost = preyDistance < 220;
    } else {
      let food = game.bestFoodFor(this);
      if (food !== null) {
        this.label = 'mange';
        this.debugTarget = food.pos;
        steering = this.seek(food.pos);
      } else {
        this.label = 'erre';
        steering = this.wander();
      }
    }

    this.setBoost(wantBoost && this.segments.length > this.minLength + 6, game);
    this.applyForce(steering);
    this.applyBodyBehaviors();
  }

  show(view) {
    super.show(view);
    if (Vehicle.debug === true) {
      push();
      noFill();
      stroke(0, 255, 255, 60);
      circle(this.pos.x, this.pos.y, this.perceptionRadius * 2);
      pop();
    }
  }
}

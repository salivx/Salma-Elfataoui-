// Classe de base de tout élément animé (ou potentiellement mobile) du monde.
// Modèle de véhicule simple de Craig Reynolds (GDC 1999) :
// https://www.red3d.com/cwr/steer/gdc99/
//
// Règles (voir ARCHITECTURE.md) :
// - Les comportements RENVOIENT une force limitée à maxForce et ne modifient rien.
// - applyBehaviors() choisit et combine les forces (redéfinie par les sous-classes).
// - update() intègre (Euler), show() dessine.
class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.mass = 1;
    this.r = 16;
    this.color = 'white';

    // Paramètres de wander.
    this.wanderDistance = 100;
    this.wanderRadius = 50;
    this.wanderTheta = 0;
    this.displaceRange = 0.3;

    // Paramètres de perception.
    this.perceptionRadius = 60;
    this.lookAhead = 60;

    // Poids par défaut utilisés dans applyBehaviors().
    this.wanderWeight = 1;
    this.avoidWeight = 3;
    this.separationWeight = 1.5;
    this.alignWeight = 1;
    this.cohesionWeight = 1;
    this.boundariesWeight = 2;
  }

  // ---------------------------------------------------------------------------
  // Sélection d'action : à redéfinir dans les sous-classes.
  // ---------------------------------------------------------------------------

  /**
   * Calcule et applique les forces de l'agent pour cette frame.
   * Par défaut : errance + évitement d'obstacles + séparation + rester à l'écran.
   * @param {Vehicle[]} vehicles autres agents
   * @param {Vehicle[]} obstacles obstacles (eux aussi des Vehicle)
   */
  applyBehaviors(vehicles = [], obstacles = []) {
    let wanderForce = this.wander();
    let avoidForce = this.avoid(obstacles);
    let separationForce = this.separate(vehicles);
    let boundariesForce = this.boundaries();

    wanderForce.mult(this.wanderWeight);
    avoidForce.mult(this.avoidWeight);
    separationForce.mult(this.separationWeight);
    boundariesForce.mult(this.boundariesWeight);

    this.applyForce(wanderForce);
    this.applyForce(avoidForce);
    this.applyForce(separationForce);
    this.applyForce(boundariesForce);
  }

  // ---------------------------------------------------------------------------
  // Comportements individuels (renvoient une force).
  // ---------------------------------------------------------------------------

  /** Seek : steering = desired - vel, desired = (target - pos) à maxSpeed. */
  seek(target, arrival = false, slowRadius = 100) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
    let speed = this.maxSpeed;

    if (arrival === true && d < slowRadius) {
      speed = map(d, 0, slowRadius, 0, this.maxSpeed);
    }
    desired.setMag(speed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /** Flee : inverse de seek, actif seulement à moins de detectionRadius. */
  flee(target, detectionRadius = Infinity) {
    if (p5.Vector.dist(this.pos, target) > detectionRadius) {
      return createVector(0, 0);
    }
    return this.seek(target).mult(-1);
  }

  /** Arrival : seek avec freinage linéaire dans slowRadius. */
  arrive(target, slowRadius = 100) {
    return this.seek(target, true, slowRadius);
  }

  /** Position future d'un agent : pos + vel * T, avec T = distance / maxSpeed. */
  predictPosition(agent) {
    let distance = p5.Vector.dist(this.pos, agent.pos);
    let t = distance / max(this.maxSpeed, 0.0001);
    let prediction = p5.Vector.mult(agent.vel, t);
    prediction.add(agent.pos);

    if (Vehicle.debug === true) {
      push();
      noStroke();
      fill('green');
      circle(prediction.x, prediction.y, 10);
      pop();
    }
    return prediction;
  }

  /** Pursuit : seek vers la position future de l'agent. */
  pursue(agent) {
    return this.seek(this.predictPosition(agent));
  }

  /** Evasion : flee de la position future de l'agent. */
  evade(agent, detectionRadius = Infinity) {
    return this.flee(this.predictPosition(agent), detectionRadius);
  }

  /** Wander : point mobile sur un cercle placé devant l'agent. */
  wander() {
    let center = this.vel.copy();
    center.setMag(this.wanderDistance);
    center.add(this.pos);

    let theta = this.wanderTheta + this.vel.heading();
    let point = createVector(
      center.x + (this.wanderRadius * cos(theta)),
      center.y + (this.wanderRadius * sin(theta)),
    );
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    if (Vehicle.debug === true) {
      push();
      noFill();
      stroke(255, 100);
      circle(center.x, center.y, this.wanderRadius * 2);
      line(this.pos.x, this.pos.y, center.x, center.y);
      fill('green');
      noStroke();
      circle(point.x, point.y, 8);
      pop();
    }
    return this.seek(point);
  }

  /**
   * Obstacle avoidance : on regarde un couloir devant l'agent ; l'obstacle menaçant
   * le plus proche produit une force latérale qui écarte l'agent.
   */
  avoid(obstacles) {
    let speedRatio = this.vel.mag() / max(this.maxSpeed, 0.0001);
    let ahead = this.vel.copy();
    ahead.setMag(this.r + (this.lookAhead * speedRatio));
    ahead.add(this.pos);
    let aheadHalf = p5.Vector.lerp(this.pos, ahead, 0.5);

    let threat = null;
    let threatDistance = Infinity;
    obstacles.forEach((obstacle) => {
      if (obstacle === this) {
        return;
      }
      let limit = obstacle.r + this.r;
      let d = min(
        p5.Vector.dist(ahead, obstacle.pos),
        p5.Vector.dist(aheadHalf, obstacle.pos),
        p5.Vector.dist(this.pos, obstacle.pos),
      );
      let distanceToMe = p5.Vector.dist(this.pos, obstacle.pos);
      if (d < limit && distanceToMe < threatDistance) {
        threat = obstacle;
        threatDistance = distanceToMe;
      }
    });

    if (Vehicle.debug === true) {
      push();
      stroke(threat === null ? 'yellow' : 'red');
      line(this.pos.x, this.pos.y, ahead.x, ahead.y);
      pop();
    }
    if (threat === null) {
      return createVector(0, 0);
    }

    // Composante latérale : direction de l'obstacle vers le point devant l'agent.
    let desired = p5.Vector.sub(aheadHalf, threat.pos);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /** Containment : rester dans le canevas à distance margin des bords. */
  boundaries(margin = 50) {
    let desired = null;

    if (this.pos.x < margin) {
      desired = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > width - margin) {
      desired = createVector(-this.maxSpeed, this.vel.y);
    }
    if (this.pos.y < margin) {
      desired = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > height - margin) {
      desired = createVector(this.vel.x, -this.maxSpeed);
    }

    if (desired === null) {
      return createVector(0, 0);
    }
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /**
   * Containment (Reynolds) : on prédit la position future (pos + vel * prediction).
   * Si elle sort de la région {x, y, w, h} réduite de margin, on vise un point
   * ramené à l'intérieur. Sinon aucune force.
   */
  contain(region, margin = 100, prediction = 25) {
    let future = p5.Vector.mult(this.vel, prediction);
    future.add(this.pos);

    let inside = createVector(
      constrain(future.x, region.x + margin, region.x + region.w - margin),
      constrain(future.y, region.y + margin, region.y + region.h - margin),
    );
    if (inside.x === future.x && inside.y === future.y) {
      return createVector(0, 0);
    }

    if (Vehicle.debug === true) {
      push();
      stroke('orange');
      strokeWeight(2);
      line(this.pos.x, this.pos.y, future.x, future.y);
      noFill();
      circle(inside.x, inside.y, 12);
      pop();
    }
    return this.seek(inside);
  }

  // ---------------------------------------------------------------------------
  // Comportements de groupe (renvoient une force).
  // ---------------------------------------------------------------------------

  /** Voisins à moins de radius (l'agent lui-même est exclu). */
  neighbors(vehicles, radius = this.perceptionRadius) {
    return vehicles.filter((other) => other !== this
      && p5.Vector.dist(this.pos, other.pos) < radius);
  }

  /** Separation : s'éloigner des voisins, pondéré par 1/d. */
  separate(vehicles, radius = this.r * 3) {
    let sum = createVector(0, 0);
    let nearby = this.neighbors(vehicles, radius);
    nearby.forEach((other) => {
      let diff = p5.Vector.sub(this.pos, other.pos);
      let d = max(diff.mag(), 0.0001);
      diff.setMag(1 / d);
      sum.add(diff);
    });
    if (nearby.length === 0) {
      return sum;
    }
    sum.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(sum, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /** Alignment : vitesse désirée = moyenne des vitesses des voisins. */
  align(vehicles, radius = this.perceptionRadius) {
    let nearby = this.neighbors(vehicles, radius);
    if (nearby.length === 0) {
      return createVector(0, 0);
    }
    let average = createVector(0, 0);
    nearby.forEach((other) => average.add(other.vel));
    average.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(average, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /** Cohesion : seek vers le centre de gravité des voisins. */
  cohesion(vehicles, radius = this.perceptionRadius) {
    let nearby = this.neighbors(vehicles, radius);
    if (nearby.length === 0) {
      return createVector(0, 0);
    }
    let center = createVector(0, 0);
    nearby.forEach((other) => center.add(other.pos));
    center.div(nearby.length);
    return this.seek(center);
  }

  /** Flocking : separation + alignment + cohesion pondérés. */
  flock(vehicles) {
    let force = createVector(0, 0);
    force.add(this.separate(vehicles).mult(this.separationWeight));
    force.add(this.align(vehicles).mult(this.alignWeight));
    force.add(this.cohesion(vehicles).mult(this.cohesionWeight));
    return force;
  }

  // ---------------------------------------------------------------------------
  // Locomotion et rendu.
  // ---------------------------------------------------------------------------

  /** acc += force / mass */
  applyForce(force) {
    this.acc.add(p5.Vector.div(force, this.mass));
  }

  /** Intégration d'Euler de Reynolds. */
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  /** Dessin par défaut : un triangle orienté selon la vitesse. */
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    stroke(this.color);
    strokeWeight(2);
    noFill();
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();

    if (Vehicle.debug === true) {
      drawArrow(this.pos, p5.Vector.mult(this.vel, 10), 'red');
    }
  }

  /** Bouclage d'écran (seule modification directe de pos autorisée). */
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}

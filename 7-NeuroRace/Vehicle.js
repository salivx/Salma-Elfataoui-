/**
 * Projection orthogonale d'un point a sur le segment [pos, b].
 * Utilisé par le suivi de chemin simple (5-2) et complexe (5-3).
 */
function findProjection(pos, a, b) {
  const v1 = p5.Vector.sub(a, pos);
  const v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  const sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

/**
 * Classe Vehicle unifiée regroupant l'ensemble des Steering Behaviors
 * des exemples 1 à 7 (Seek/Flee, Pursue/Evade, Arrival, Wander,
 * PathFollowing simple/complexe, ObstacleAvoidance multi-rayons, Boids/Flocking).
 */
class Vehicle {
  static debug = false;

  constructor(x, y, msOrImage, mf) {
    this.pos = createVector(x, y);
    this.acc = createVector(0, 0);

    const hasImage = msOrImage !== undefined && typeof msOrImage !== "number";
    this.image = hasImage ? msOrImage : undefined;

    this.baseMaxSpeed = typeof msOrImage === "number" ? msOrImage : hasImage ? 6 : 4;
    this.maxSpeed = this.baseMaxSpeed;
    this.baseMaxForce = typeof mf === "number" ? mf : 0.2;
    this.maxForce = this.baseMaxForce;

    if (hasImage) {
      this.vel = p5.Vector.random2D();
      this.vel.setMag(this.maxSpeed * 0.6);
    } else if (typeof msOrImage === "number") {
      this.vel = createVector(this.maxSpeed, 0);
    } else {
      this.vel = createVector(0, 0);
    }

    this.r = hasImage ? 32 : 16;
    this.r_pourDessin = 16;
    this.color = "white";
    this.couleur = "black";
    this.dureeDeVie = 5;

    // 1-Seek : détection et patrouille
    this.detectionRadius = 150;
    this.isChasing = false;
    this.randomDir = p5.Vector.random2D();
    this.nextDirectionChangeTime = typeof millis === "function" ? millis() + 4000 : 4000;

    // 3-Arrival : zone de freinage
    this.rayonZoneDeFreinage = 100;

    // 4-Wander & 5-3 & 7 : paramètres Wander (Craig Reynolds, GDC 1999)
    this.distanceCercle = 150;
    this.wanderRadius = 50;
    this.wanderTheta = typeof random === "function" ? random(TWO_PI) : 0;
    this.displaceRange = 0.3;

    // 5-3-PathFollowingComplex : poids de comportements
    this.wanderWeight = 0;
    this.followPathWeight = 2;
    this.separateWeight = 1.2;

    // 6-ObstacleAvoidance : évitement multi-rayons et modes
    this.largeurZoneEvitementDevantVaisseau = 24;
    this.rayCount = 1;
    this.raySpreadDeg = 100;
    this.dangerZoneSideScale = 1.0;
    this.avoidanceMode = "separation"; // "separation" | "vehiclesAsObstacles"
    this.separationWeight = 0.5;

    // 7-Boids : perception, poids flocking et confinement
    this.perceptionRadius = 25;
    this.alignWeight = 1.5;
    this.cohesionWeight = 1;
    this.boundariesWeight = 10;
    this.avoidWeight = 15;
    this.boundariesX = 0;
    this.boundariesY = 0;
    this.boundariesWidth = typeof width !== "undefined" ? width : 800;
    this.boundariesHeight = typeof height !== "undefined" ? height : 600;
    this.boundariesDistance = 25;

    // Traînée
    this.path = [];
    this.pathLength = 15;
    this.pathMaxLength = 30;
    this.pathSpacingInFrames = 4;
    this.lastSteeringForce = createVector(0, 0);
  }

  // =========================================================================
  // Orchestration générique (compatible Ex 1, Ex 4, Ex 5-3, Ex 6)
  // =========================================================================
  applyBehaviors(...args) {
    // Ex 4-Wander : applyBehaviors()
    if (args.length === 0) {
      const wanderForce = this.wander();
      this.lastSteeringForce.set(wanderForce.x, wanderForce.y);
      this.applyForce(wanderForce);
      return;
    }

    // Ex 5-3-PathFollowingComplex : applyBehaviors(vehicles, path)
    if (Array.isArray(args[0]) && args[1] && Array.isArray(args[1].points)) {
      const vehicles = args[0];
      const path = args[1];
      const f = this.follow(path);
      const s = this.separate(vehicles);
      const w = this.wander();
      f.mult(this.followPathWeight);
      s.mult(this.separateWeight);
      w.mult(this.wanderWeight);
      this.applyForce(f);
      this.applyForce(s);
      this.applyForce(w);
      return;
    }

    // Ex 1-Seek : applyBehaviors(target, targets, scenario)
    if (typeof args[2] === "string" || (Array.isArray(args[1]) && args.length <= 3 && (!args[1][0] || !(args[1][0] instanceof Obstacle)))) {
      if (typeof args[2] === "string") {
        const target = args[0];
        const targets = args[1] || [];
        const scenario = args[2];
        let force;
        if (scenario === "scenario1") {
          this.isChasing = false;
          this.maxSpeed = this.baseMaxSpeed;
          this.maxForce = this.baseMaxForce;
          force = this.seek(target);
        } else {
          const detectedTarget = this.findClosestTarget(targets);
          if (detectedTarget) {
            this.isChasing = true;
            this.maxSpeed = this.baseMaxSpeed * 3;
            this.maxForce = this.baseMaxForce * 3;
            force = this.seek(detectedTarget.pos);
          } else {
            this.isChasing = false;
            this.maxSpeed = this.baseMaxSpeed;
            this.maxForce = this.baseMaxForce;
            force = this.randomPatrol();
          }
        }
        this.applyForce(force);
        return;
      }
    }

    // Ex 6-ObstacleAvoidance : applyBehaviors(target, obstacles, vehicules)
    const target = args[0];
    const obstacles = args[1] || [];
    const vehicules = args[2] || [];

    const seekForce = this.arrive(target);
    const boundariesForce = this.boundaries(0, 0, width, height, 25);

    let avoidables = obstacles;
    let separateForce = createVector(0, 0);

    if (this.avoidanceMode === "vehiclesAsObstacles") {
      avoidables = [...obstacles];
      for (let i = 0; i < vehicules.length; i++) {
        if (vehicules[i] !== this) {
          avoidables.push(vehicules[i]);
        }
      }
    } else {
      separateForce = this.separate(vehicules);
      separateForce.mult(this.separationWeight);
    }

    const avoidForce = this.avoid(avoidables);
    seekForce.mult(0.25);
    avoidForce.mult(3);
    boundariesForce.mult(3);

    this.applyForce(seekForce);
    this.applyForce(avoidForce);
    this.applyForce(separateForce);
    this.applyForce(boundariesForce);
  }

  // Ex 7-Boids : équivalent applyBehaviors pour le flocking
  flock(boids, obstacles = []) {
    const avoidForce = obstacles.length > 0 ? this.avoid(obstacles) : createVector(0, 0);
    const alignment = this.align(boids);
    const cohesion = this.cohesion(boids);
    const separation = this.separation(boids);
    const boundaries = this.boundaries(
      this.boundariesX,
      this.boundariesY,
      this.boundariesWidth,
      this.boundariesHeight,
      this.boundariesDistance
    );

    avoidForce.mult(this.avoidWeight);
    alignment.mult(this.alignWeight);
    cohesion.mult(this.cohesionWeight);
    separation.mult(this.separationWeight);
    boundaries.mult(this.boundariesWeight);

    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(separation);
    this.applyForce(boundaries);
    this.applyForce(avoidForce);
  }

  // =========================================================================
  // 1-Seek & 3-Arrival : Seek, Flee, Arrive, Patrouille
  // =========================================================================
  findClosestTarget(targets) {
    let closest = null;
    let closestDistSq = this.detectionRadius * this.detectionRadius;

    for (let i = 0; i < targets.length; i++) {
      const candidate = targets[i];
      const dx = candidate.pos.x - this.pos.x;
      const dy = candidate.pos.y - this.pos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= closestDistSq) {
        closestDistSq = distSq;
        closest = candidate;
      }
    }
    return closest;
  }

  randomPatrol() {
    const now = millis();
    if (now >= this.nextDirectionChangeTime) {
      this.randomDir = p5.Vector.random2D();
      this.nextDirectionChangeTime = now + 4000;
    }
    const desiredSpeed = p5.Vector.mult(this.randomDir, this.maxSpeed);
    const force = p5.Vector.sub(desiredSpeed, this.vel);
    force.limit(this.maxForce);
    return force;
  }

  seek(target, arrival = false, d = 0) {
    const targetPos = target && target.pos ? target.pos : target;
    let desiredSpeed = this.maxSpeed;

    if (arrival) {
      if (Vehicle.debug) {
        push();
        stroke(255);
        noFill();
        circle(targetPos.x, targetPos.y, this.rayonZoneDeFreinage * 2);
        pop();
      }
      const distance = p5.Vector.dist(this.pos, targetPos);
      if (distance < this.rayonZoneDeFreinage) {
        desiredSpeed = map(distance, d, this.rayonZoneDeFreinage, 0, this.maxSpeed);
      }
    }

    const force = p5.Vector.sub(targetPos, this.pos);
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  flee(target, distanceDeDetection = Infinity) {
    const targetPos = target && target.pos ? target.pos : target;
    if (distanceDeDetection < Infinity) {
      const d = p5.Vector.dist(this.pos, targetPos);
      if (d > distanceDeDetection) {
        return createVector(0, 0);
      }
    }
    return this.seek(targetPos).mult(-1);
  }

  fleeWithTargetRadius(target) {
    const d = this.pos.dist(target.pos);
    const rayonZoneAFuir = (target.r || 20) + 10;
    if (d < rayonZoneAFuir) {
      if (Vehicle.debug) {
        push();
        stroke("red");
        strokeWeight(2);
        noFill();
        circle(target.pos.x, target.pos.y, rayonZoneAFuir * 2);
        pop();
      }
      const fleeForce = this.flee(target.pos);
      fleeForce.mult(100);
      this.applyForce(fleeForce);
    }
  }

  arrive(target, d = 0) {
    return this.seek(target, true, d);
  }

  // =========================================================================
  // 2-PursueEvade : Pursue, Evade, Interception parfaite
  // =========================================================================
  pursue(vehicle) {
    const target = vehicle.pos.copy();
    const prediction = vehicle.vel.copy().mult(10);
    target.add(prediction);
    return this.seek(target);
  }

  evade(vehicle) {
    return this.pursue(vehicle).mult(-1);
  }

  computePerfectInterceptionPoint(vehicle) {
    const targetSpeed = vehicle.vel.mag();
    if (targetSpeed < 1e-4 || this.maxSpeed < 1e-4) {
      return vehicle.pos.copy();
    }
    const toMe = p5.Vector.sub(this.pos, vehicle.pos);
    const dist = toMe.mag();
    if (dist < 1e-4) {
      return vehicle.pos.copy();
    }
    const speedRatio = targetSpeed / this.maxSpeed;
    const targetAngle = vehicle.vel.angleBetween(toMe);
    const sinMyAngle = Math.sin(targetAngle) * speedRatio;

    let prediction;
    if (Math.abs(sinMyAngle) < 1) {
      const myAngle = Math.asin(sinMyAngle);
      const denom = Math.sin(PI - myAngle - targetAngle);
      if (Math.abs(denom) > 1e-4) {
        prediction = (dist * Math.sin(myAngle)) / denom;
      } else {
        prediction = (dist / (this.maxSpeed + targetSpeed)) * targetSpeed;
      }
    } else {
      prediction = Math.min(dist / this.maxSpeed, 20) * targetSpeed;
    }

    prediction = Math.max(0, Math.min(prediction, dist * 1.5));
    return vehicle.vel.copy().setMag(prediction).add(vehicle.pos);
  }

  pursuePerfect(vehicle) {
    const interceptionPoint = this.computePerfectInterceptionPoint(vehicle);
    if (Vehicle.debug) {
      push();
      fill(0, 255, 0);
      noStroke();
      circle(interceptionPoint.x, interceptionPoint.y, 8);
      pop();
    }
    return this.seek(interceptionPoint);
  }

  // =========================================================================
  // 4-Wander : Wander (Craig Reynolds, GDC 1999)
  // =========================================================================
  wander() {
    const forward = this.vel.magSq() > 1e-4
      ? this.vel.copy().normalize()
      : createVector(1, 0);
    const pointDevant = p5.Vector.mult(forward, this.distanceCercle).add(this.pos);

    const heading = this.vel.magSq() > 1e-4 ? this.vel.heading() : 0;
    const theta = this.wanderTheta + heading;
    const pointSurLeCercle = createVector(
      pointDevant.x + this.wanderRadius * Math.cos(theta),
      pointDevant.y + this.wanderRadius * Math.sin(theta)
    );

    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    const force = p5.Vector.sub(pointSurLeCercle, this.pos);
    force.limit(this.maxForce);

    if (Vehicle.debug && (this.wanderWeight === undefined || this.wanderWeight > 0 || this.image)) {
      this.drawWanderDebug(pointDevant, pointSurLeCercle, force);
    }

    return force;
  }

  drawWanderDebug(pointDevant, pointSurLeCercle, steeringForce) {
    push();
    stroke(255, 255, 255, 110);
    strokeWeight(1.5);
    drawingContext.setLineDash([5, 8]);
    line(this.pos.x, this.pos.y, pointDevant.x, pointDevant.y);
    drawingContext.setLineDash([]);

    noFill();
    stroke(255, 255, 255, 180);
    strokeWeight(1.5);
    circle(pointDevant.x, pointDevant.y, this.wanderRadius * 2);

    noStroke();
    fill(239, 68, 68);
    circle(pointDevant.x, pointDevant.y, 8);

    stroke(148, 163, 184, 180);
    strokeWeight(1);
    line(pointDevant.x, pointDevant.y, pointSurLeCercle.x, pointSurLeCercle.y);

    stroke(250, 204, 21, 180);
    strokeWeight(1.5);
    line(this.pos.x, this.pos.y, pointSurLeCercle.x, pointSurLeCercle.y);

    noStroke();
    fill(34, 197, 94);
    circle(pointSurLeCercle.x, pointSurLeCercle.y, 12);

    this.drawArrow(this.pos, p5.Vector.mult(this.vel, 10), color(56, 189, 248));
    this.drawArrow(this.pos, p5.Vector.mult(steeringForce, 180), color(251, 146, 60));
    pop();
  }

  // =========================================================================
  // 5-2 & 5-3 : Suivi de chemin simple et complexe
  // =========================================================================
  follow(path) {
    // Chemin simple (5-2-PathFollowing : path.start, path.end)
    if (path && path.start && path.end && !Array.isArray(path.points)) {
      const future = this.vel.copy().mult(20).add(this.pos);
      const target = findProjection(path.start, future, path.end);

      if (Vehicle.debug) {
        push();
        noStroke();
        fill(255, 0, 0);
        circle(future.x, future.y, 12);
        fill("green");
        circle(target.x, target.y, 12);
        pop();
      }

      const d = p5.Vector.dist(future, target);
      return d > path.radius ? this.seek(target) : createVector(0, 0);
    }

    // Chemin complexe (5-3-PathFollowingComplex : path.points[])
    if (!path || !Array.isArray(path.points) || path.points.length < 2) {
      return createVector(0, 0);
    }

    const predict = this.vel.copy();
    if (predict.magSq() > 1e-6) {
      predict.normalize().mult(25);
    }
    const predictpos = p5.Vector.add(this.pos, predict);

    let normal = null;
    let target = null;
    let worldRecord = Infinity;

    for (let i = 0; i < path.points.length; i++) {
      let a = path.points[i];
      let b = path.points[(i + 1) % path.points.length];
      let normalPoint = findProjection(predictpos, a, b);
      let dir = p5.Vector.sub(b, a);

      if (
        normalPoint.x < min(a.x, b.x) ||
        normalPoint.x > max(a.x, b.x) ||
        normalPoint.y < min(a.y, b.y) ||
        normalPoint.y > max(a.y, b.y)
      ) {
        normalPoint = b.copy();
        a = path.points[(i + 1) % path.points.length];
        b = path.points[(i + 2) % path.points.length];
        dir = p5.Vector.sub(b, a);
      }

      const d = p5.Vector.dist(predictpos, normalPoint);
      if (d < worldRecord) {
        worldRecord = d;
        normal = normalPoint;
        if (dir.magSq() > 1e-6) {
          dir.normalize().mult(25);
        }
        target = normal.copy().add(dir);
      }
    }

    const showDebug = typeof debug !== "undefined" ? debug : Vehicle.debug;
    if (showDebug && normal && target) {
      push();
      stroke(0);
      fill(0);
      line(this.pos.x, this.pos.y, predictpos.x, predictpos.y);
      ellipse(predictpos.x, predictpos.y, 4, 4);
      ellipse(normal.x, normal.y, 4, 4);
      line(predictpos.x, predictpos.y, target.x, target.y);
      if (worldRecord > path.radius) fill(255, 0, 0);
      noStroke();
      ellipse(target.x, target.y, 8, 8);
      pop();
    }

    if (target && worldRecord > path.radius) {
      return this.seek(target);
    }
    return createVector(0, 0);
  }

  // =========================================================================
  // 6-ObstacleAvoidance : Évitement multi-rayons et zone critique
  // =========================================================================
  getRayAngles() {
    const baseHeading = this.vel.magSq() > 1e-4 ? this.vel.heading() : 0;
    let count = Math.max(1, Math.floor(this.rayCount));
    if (count % 2 === 0) {
      count += 1;
    }
    if (count === 1) {
      return [baseHeading];
    }

    const deg = Math.min(360, Math.max(0, Number(this.raySpreadDeg) || 0));
    const angles = [];
    const half = Math.floor(count / 2);

    if (deg >= 360) {
      const step = TWO_PI / count;
      for (let k = -half; k <= half; k++) {
        angles.push(baseHeading + k * step);
      }
      return angles;
    }

    const spreadRad = (deg * Math.PI) / 180;
    const halfSpread = spreadRad * 0.5;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      angles.push(baseHeading - halfSpread + t * spreadRad);
    }
    return angles;
  }

  isPointInDangerZone(pt, rayLength, heading, rectHalfWidth) {
    const dx = pt.x - this.pos.x;
    const dy = pt.y - this.pos.y;
    const cosH = Math.cos(-heading);
    const sinH = Math.sin(-heading);
    const lx = dx * cosH - dy * sinH;
    const ly = dx * sinH + dy * cosH;

    const sideScale = Math.max(0.1, Number(this.dangerZoneSideScale) || 1);
    const hexR = Math.max(this.r, 48) * 1.2;
    const apothem = hexR * 0.8660254;
    const absX = Math.abs(lx);
    const absY = Math.abs(ly);
    const normY = absY / sideScale;
    if (normY <= apothem && 0.8660254 * absX + 0.5 * normY <= apothem) {
      return true;
    }

    return lx >= 0 && lx <= rayLength && absY <= rectHalfWidth;
  }

  drawDangerZoneDebug(rayLength, heading, rectHalfWidth) {
    const sideScale = Math.max(0.1, Number(this.dangerZoneSideScale) || 1);
    const hexR = Math.max(this.r, 48) * 1.2;
    push();
    translate(this.pos.x, this.pos.y);
    rotate(heading);
    noFill();

    stroke(0, 255, 200, 190);
    strokeWeight(1.5);
    beginShape();
    for (let k = 0; k < 6; k++) {
      const a = (k * TWO_PI) / 6;
      vertex(Math.cos(a) * hexR, Math.sin(a) * hexR * sideScale);
    }
    endShape(CLOSE);

    stroke(0, 200, 255, 150);
    strokeWeight(1.2);
    rect(0, -rectHalfWidth, rayLength, rectHalfWidth * 2);
    pop();
  }

  avoid(avoidables) {
    const heading = this.vel.magSq() > 1e-4 ? this.vel.heading() : 0;
    const ahead = this.vel.copy().mult(30);
    const ahead2 = this.vel.copy().mult(15);
    const rayLength = ahead.mag();
    let count = Math.max(1, Math.floor(this.rayCount));
    if (count % 2 === 0) {
      count += 1;
    }
    const sideScale = Math.max(0.1, Number(this.dangerZoneSideScale) || 1);
    const rectHalfWidth = Math.max(this.r, 48) * 0.8 * sideScale;

    const pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead);
    const pointAuBoutDeAhead2 = p5.Vector.add(this.pos, ahead2);

    const rays = [];
    if (count === 1) {
      rays.push({
        pMid: pointAuBoutDeAhead2,
        pFar: pointAuBoutDeAhead,
        isCenter: true,
      });
    } else {
      const angles = this.getRayAngles();
      for (let i = 0; i < angles.length; i++) {
        const a = angles[i];
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        rays.push({
          pMid: createVector(
            this.pos.x + cosA * rayLength * 0.5,
            this.pos.y + sinA * rayLength * 0.5
          ),
          pFar: createVector(
            this.pos.x + cosA * rayLength,
            this.pos.y + sinA * rayLength
          ),
          isCenter: Math.abs(a - heading) < 1e-4,
        });
      }
    }

    if (Vehicle.debug) {
      if (count === 1) {
        this.drawVector(this.pos, ahead, "yellow");
        this.drawVector(this.pos, ahead2, "purple");
        push();
        stroke(255, 50);
        strokeWeight(this.largeurZoneEvitementDevantVaisseau * 2);
        line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
        noStroke();
        fill("red");
        circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
        fill("lightblue");
        circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);
        pop();
      } else {
        this.drawDangerZoneDebug(rayLength, heading, rectHalfWidth);
        for (let i = 0; i < rays.length; i++) {
          const ray = rays[i];
          push();
          stroke(250, 204, 21, 160);
          strokeWeight(1.5);
          line(this.pos.x, this.pos.y, ray.pFar.x, ray.pFar.y);
          noStroke();
          fill("lightblue");
          circle(ray.pMid.x, ray.pMid.y, 8);
          fill("red");
          circle(ray.pFar.x, ray.pFar.y, 8);
          pop();
        }
        this.drawVector(this.pos, ahead, "yellow");
      }
    }

    if (!avoidables || avoidables.length === 0) {
      return createVector(0, 0);
    }

    const combinedAvoid = createVector(0, 0);
    let threatCount = 0;

    for (let oIdx = 0; oIdx < avoidables.length; oIdx++) {
      const obs = avoidables[oIdx];
      const obsR = obs instanceof Vehicle ? Math.max(obs.r * 0.5, 24) : obs.r;
      const threshold = obsR + this.largeurZoneEvitementDevantVaisseau;

      let bestDist = Infinity;
      let closestSample = null;

      const dSelf = p5.Vector.dist(this.pos, obs.pos);
      if (dSelf < bestDist) {
        bestDist = dSelf;
        closestSample = this.pos;
      }

      for (let rIdx = 0; rIdx < rays.length; rIdx++) {
        const ray = rays[rIdx];
        if (
          ray.isCenter ||
          this.isPointInDangerZone(ray.pMid, rayLength, heading, rectHalfWidth)
        ) {
          const dMid = p5.Vector.dist(ray.pMid, obs.pos);
          if (dMid < bestDist) {
            bestDist = dMid;
            closestSample = ray.pMid;
          }
        }
        if (
          ray.isCenter ||
          this.isPointInDangerZone(ray.pFar, rayLength, heading, rectHalfWidth)
        ) {
          const dFar = p5.Vector.dist(ray.pFar, obs.pos);
          if (dFar < bestDist) {
            bestDist = dFar;
            closestSample = ray.pFar;
          }
        }
      }

      if (bestDist >= threshold || !closestSample) {
        continue;
      }

      const distVec = p5.Vector.sub(closestSample, obs.pos);
      if (Vehicle.debug) {
        this.drawVector(obs.pos, distVec, "yellow");
      }

      const pushVec = distVec.copy();
      if (pushVec.magSq() < 1e-4) {
        pushVec.set(1, 0).rotate(random(TWO_PI));
      }
      const clearance = Math.max(1, bestDist - obsR * 0.5);
      const weight = threshold / clearance;
      pushVec.normalize().mult(weight);
      combinedAvoid.add(pushVec);
      threatCount += 1;
    }

    if (threatCount === 0 || combinedAvoid.magSq() < 1e-6) {
      return createVector(0, 0);
    }

    combinedAvoid.setMag(this.maxSpeed);
    combinedAvoid.sub(this.vel);
    combinedAvoid.limit(this.maxForce);
    return combinedAvoid;
  }

  // =========================================================================
  // 7-Boids & Groupes : Boundaries, Align, Cohesion, Separation
  // =========================================================================
  boundaries(bx, by, bw, bh, d) {
    let vitesseDesiree = null;
    const xBordGauche = bx + d;
    const xBordDroite = bx + bw - d;
    const yBordHaut = by + d;
    const yBordBas = by + bh - d;

    if (this.pos.x < xBordGauche) {
      vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > xBordDroite) {
      vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < yBordHaut) {
      vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > yBordBas) {
      vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
    }

    if (vitesseDesiree !== null) {
      vitesseDesiree.setMag(this.maxSpeed);
      const force = p5.Vector.sub(vitesseDesiree, this.vel);
      force.limit(this.maxForce);
      return force;
    }

    if (Vehicle.debug) {
      push();
      noFill();
      stroke("white");
      rect(bx, by, bw, bh);
      stroke("red");
      rect(bx + d, by + d, bw - 2 * d, bh - 2 * d);
      pop();
    }

    return createVector(0, 0);
  }

  align(boids) {
    const perceptionSq = this.perceptionRadius * this.perceptionRadius;
    const steering = createVector(0, 0);
    let total = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other === this) continue;
      const dx = this.pos.x - other.pos.x;
      const dy = this.pos.y - other.pos.y;
      if (dx * dx + dy * dy < perceptionSq) {
        steering.add(other.vel);
        total++;
      }
    }

    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    const perceptionR = 2 * this.perceptionRadius;
    const perceptionSq = perceptionR * perceptionR;
    const steering = createVector(0, 0);
    let total = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other === this) continue;
      const dx = this.pos.x - other.pos.x;
      const dy = this.pos.y - other.pos.y;
      if (dx * dx + dy * dy < perceptionSq) {
        steering.add(other.pos);
        total++;
      }
    }

    if (total > 0) {
      steering.div(total);
      steering.sub(this.pos);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  separation(boids) {
    return this.separate(boids, this.perceptionRadius);
  }

  separate(vehicles, desiredSeparationOverride = null) {
    const desiredseparation =
      desiredSeparationOverride ??
      this.separationDistance ??
      Math.max(this.r * 2, 40);
    const desiredSq = desiredseparation * desiredseparation;
    const steer = createVector(0, 0, 0);
    let count = 0;

    for (let i = 0; i < vehicles.length; i++) {
      const other = vehicles[i];
      if (other === this) continue;
      const dx = this.pos.x - other.pos.x;
      const dy = this.pos.y - other.pos.y;
      const dSq = dx * dx + dy * dy;

      if (dSq > 0 && dSq < desiredSq) {
        const d = Math.sqrt(dSq);
        const diff = createVector(dx / d, dy / d);
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
    }

    if (steer.magSq() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistanceSq = Infinity;
    let obstacleLePlusProche = undefined;

    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const dx = this.pos.x - o.pos.x;
      const dy = this.pos.y - o.pos.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < plusPetiteDistanceSq) {
        plusPetiteDistanceSq = dSq;
        obstacleLePlusProche = o;
      }
    }
    return obstacleLePlusProche;
  }

  getVehiculeLePlusProche(vehicules) {
    let plusPetiteDistanceSq = Infinity;
    let vehiculeLePlusProche = undefined;

    for (let i = 0; i < vehicules.length; i++) {
      const v = vehicules[i];
      if (v === this) continue;
      const dx = this.pos.x - v.pos.x;
      const dy = this.pos.y - v.pos.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < plusPetiteDistanceSq) {
        plusPetiteDistanceSq = dSq;
        vehiculeLePlusProche = v;
      }
    }
    return vehiculeLePlusProche;
  }

  // =========================================================================
  // Pipeline physique & rendu
  // =========================================================================
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
    this.ajoutePosAuPath();
    this.dureeDeVie -= 0.01;
  }

  run() {
    this.update();
    this.edges();
    this.render();
  }

  ajoutePosAuPath() {
    if (this.pathMaxLength <= 0) {
      this.path.length = 0;
      return;
    }
    this.path.push(this.pos.copy());
    while (this.path.length > this.pathMaxLength) {
      this.path.shift();
    }
  }

  render() {
    push();
    const fillCol = this.couleur || this.color || "white";
    fill(fillCol);
    stroke(0);
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() + PI / 2);
    const r = this.r;
    beginShape();
    vertex(0, -r * 2);
    vertex(-r, r * 2);
    vertex(r, r * 2);
    endShape(CLOSE);
    pop();
  }

  show() {
    if (this.image !== undefined) {
      this.drawTrail();
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading() + (this.imageRotationOffset ?? 0));
      imageMode(CENTER);
      const size = this.r * (this.imageSizeMultiplier ?? 1);
      image(this.image, 0, 0, size, size);
      pop();
      return;
    }

    this.drawPath();
    this.drawVehicle();

    if (Vehicle.debug) {
      this.drawDetectionCircle();
    }
  }

  drawVehicle() {
    push();
    stroke(255);
    strokeWeight(2);
    fill(this.color || "white");
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    const size = this.r_pourDessin || this.r;
    triangle(-size, -size / 2, -size, size / 2, size, 0);
    pop();
  }

  drawDetectionCircle() {
    if (!this.detectionRadius) return;
    push();
    noFill();
    stroke(this.isChasing ? color(0, 255, 140, 190) : color(0, 220, 255, 140));
    strokeWeight(1.5);
    circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    pop();
  }

  drawPath() {
    if (this.path.length === 0) return;
    push();
    noStroke();
    fill(this.color || 255);
    for (let i = 0; i < this.path.length; i += 5) {
      circle(this.path[i].x, this.path[i].y, 1.5);
    }
    pop();
  }

  drawTrail() {
    if (this.path.length <= 1) return;
    push();
    const startColor = color(56, 189, 248);
    const endColor = color(239, 68, 68);
    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      const t = i / (this.path.length - 1);
      const col = lerpColor(endColor, startColor, t);
      col.setAlpha(40 + t * 180);
      noStroke();
      fill(col);
      circle(p.x, p.y, 2.5 + t * 3.5);
    }
    pop();
  }

  drawVector(pos, v, col = "red") {
    push();
    strokeWeight(2.5);
    stroke(col);
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    const arrowSize = 5;
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    fill(col);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  drawArrow(base, vec, col) {
    if (vec.magSq() < 1e-3) {
      return;
    }
    push();
    stroke(col);
    strokeWeight(2.5);
    fill(col);
    translate(base.x, base.y);
    line(0, 0, vec.x, vec.y);
    rotate(vec.heading());
    const arrowSize = 6;
    translate(vec.mag() - arrowSize, 0);
    triangle(0, arrowSize * 0.5, 0, -arrowSize * 0.5, arrowSize, 0);
    pop();
  }

  edges() {
    let wrapped = false;
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
      wrapped = true;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
      wrapped = true;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
      wrapped = true;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
      wrapped = true;
    }
    if (wrapped) {
      this.path.length = 0;
    }
  }
}

// Alias pour l'exemple 7-Boids : Boid est un Vehicle avec un autre nom
const Boid = Vehicle;

// Utilitaire de flèche conservé pour compatibilité avec 2-PursueEvade
function drawArrow(base, vec, myColor) {
  push();
  stroke(myColor);
  strokeWeight(3);
  fill(myColor);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  const arrowSize = 7;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}

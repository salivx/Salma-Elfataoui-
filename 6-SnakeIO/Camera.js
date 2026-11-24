// Camera : le point de vue est lui aussi un Vehicle. Il suit sa cible avec
// arrive() (suivi doux, sans à-coups) et dézoome quand le serpent grandit.
class Camera extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel.set(0, 0);
    this.maxSpeed = 30;
    this.maxForce = 2.5;
    this.zoom = 1;
    this.targetZoom = 1;
    this.target = null;
  }

  /** target : p5.Vector à suivre ; zoom : niveau de zoom souhaité. */
  applyBehaviors(target, zoom = 1) {
    this.target = target.copy();
    this.targetZoom = zoom;
    this.applyForce(this.arrive(target, 250));
  }

  update() {
    super.update();
    this.zoom = lerp(this.zoom, this.targetZoom, 0.04);
  }

  /** Applique la transformation monde -> écran (à appeler entre push()/pop()). */
  begin() {
    translate(width / 2, height / 2);
    scale(this.zoom);
    translate(-this.pos.x, -this.pos.y);
  }

  /** Coordonnées écran -> monde. */
  screenToWorld(x, y) {
    return createVector(
      ((x - (width / 2)) / this.zoom) + this.pos.x,
      ((y - (height / 2)) / this.zoom) + this.pos.y,
    );
  }

  /** Rectangle visible en coordonnées monde (pour ne dessiner que l'utile). */
  view() {
    let w = width / this.zoom;
    let h = height / this.zoom;
    return { x: this.pos.x - (w / 2), y: this.pos.y - (h / 2), w, h };
  }

  /** En debug : réticule au centre et cible de la caméra. */
  show() {
    if (Vehicle.debug !== true) {
      return;
    }
    push();
    stroke(255, 128, 0);
    strokeWeight(1 / this.zoom);
    line(this.pos.x - 15, this.pos.y, this.pos.x + 15, this.pos.y);
    line(this.pos.x, this.pos.y - 15, this.pos.x, this.pos.y + 15);
    if (this.target !== null) {
      noFill();
      circle(this.target.x, this.target.y, 30);
    }
    pop();
  }
}

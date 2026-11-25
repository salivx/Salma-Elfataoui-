// =====================================================================
//  CameraRig — la caméra 3D est un Vehicle : son point de visée « arrive »
//  vers la cible (centre du circuit, ou le joueur en vue poursuite).
//  Modes : 'orbit' (menu), 'overview' (vue 3D de tout le circuit),
//          'top' (vue du dessus), 'chase' (derrière le joueur).
// =====================================================================
class CameraRig extends Vehicle {
  constructor() {
    super(512, 318, 40, 6);
    this.vel = createVector(0, 0);
    this.pathMaxLength = 0;
    this.mode = 'orbit';
    this.yaw = 0; this.tilt = 0.9; this.dist = 900; this.zoom = 1;
    this.userYaw = 0; this.userTilt = 0;
  }

  setMode(m) { this.mode = m; this.userYaw = 0; this.userTilt = 0; this.zoom = 1; }

  follow(target) {
    let tx = 512, ty = 318, yaw = this.userYaw, tilt = 0.82 + this.userTilt, dist = 900;
    if (this.mode === 'orbit') { this.userYaw += 0.0022; yaw = this.userYaw; tilt = 0.95; }
    if (this.mode === 'top') { tilt = 0.02 + Math.max(0, this.userTilt); }
    if (this.mode === 'chase' && target) {
      const h = target.vel.heading();
      tx = target.pos.x + Math.cos(h) * 50; ty = target.pos.y + Math.sin(h) * 50;
      yaw = -HALF_PI - h + this.userYaw; tilt = 1.12; dist = 300;
    }
    tilt = constrain(tilt, 0, 1.3);
    // le point de visée arrive vers la cible (comportement arrive de Reynolds)
    const dbg = Vehicle.debug; Vehicle.debug = false;    // pas de cercle de debug en coordonnées plan
    this.rayonZoneDeFreinage = 160;
    this.applyForce(this.arrive(createVector(tx, ty), 0));
    Vehicle.debug = dbg;
    this.vel.add(this.acc); this.vel.limit(this.maxSpeed); this.pos.add(this.vel); this.acc.set(0, 0);
    // angles et distance : interpolation douce (avec gestion du tour complet pour le yaw)
    let dy = yaw - this.yaw;
    while (dy > PI) dy -= TWO_PI;
    while (dy < -PI) dy += TWO_PI;
    this.yaw += dy * (this.mode === 'chase' ? 0.12 : 0.08);
    this.tilt += (tilt - this.tilt) * 0.08;
    this.dist += (dist / this.zoom - this.dist) * 0.08;
  }
}

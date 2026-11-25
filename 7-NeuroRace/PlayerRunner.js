// =====================================================================
//  PlayerRunner — le coureur du joueur : les commandes remplacent le
//  réseau de neurones. Deux modes de contrôle :
//   - 'mouse' : le coureur va vers le pointeur au sol (seek / arrive de
//     Reynolds). Le plus simple : on montre où aller.
//   - 'keys'  : les flèches donnent une direction À L'ÉCRAN
//     (↑ = vers le haut de l'écran, ← = vers la gauche…), quelle que
//     soit la caméra. Espace = freiner.
// =====================================================================
class PlayerRunner extends Runner {
  constructor(track, slot, input, opts) {
    super(track, slot, null, opts);
    this.input = input;
    this.human = true;
    this.maxForce = 0.55;               // plus nerveux que les IA
    this.rayonZoneDeFreinage = 45;      // arrive() : ralentit près du pointeur
    this.target = null;                 // point visé (affiché au sol)
  }

  decide() {
    const i = this.input, view = game.view;
    this.target = null;
    if (i.mode === 'mouse' && i.pointer) {
      const t = view.unproject(i.pointer.x, i.pointer.y);
      if (t) {
        this.target = t;
        const f = this.arriveScaled(t);
        this.applyForce(f);
      }
    } else {
      // direction écran -> direction au sol
      const sx = (i.right ? 1 : 0) - (i.left ? 1 : 0), sy = (i.down ? 1 : 0) - (i.up ? 1 : 0);
      if (sx || sy) {
        const o = view.unproject(width / 2, height / 2), p = view.unproject(width / 2 + sx * 60, height / 2 + sy * 60);
        if (o && p) {
          const desired = p5.Vector.sub(p, o).setMag(this.maxSpeed * this.mult * (i.brake ? 0.3 : 1));
          this.applyForce(p5.Vector.sub(desired, this.vel).limit(this.maxForce));
        }
      } else {
        this.steerToward(0, i.brake ? 0.3 : 1, this.mult);   // tout droit
      }
    }
    if (Vehicle.debug) for (const r of this.rays) r.cast(this.pos, this.heading, this.track.walls);
  }

  // arrive() du cours, avec la vitesse max multipliée par le turbo / la zone de bug
  arriveScaled(t) {
    const ms = this.maxSpeed;
    this.maxSpeed = ms * this.mult;
    const dbg = Vehicle.debug; Vehicle.debug = false;
    const f = this.arrive(t, 0);
    Vehicle.debug = dbg;
    this.maxSpeed = ms;
    return f;
  }

  show(view) {
    const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.15);
    view.ring(this.pos.x, this.pos.y, 13, color(255, 255, 255, 120 + 120 * pulse), 2);
    if (this.target) {              // cible du pointeur au sol
      view.ring(this.target.x, this.target.y, 6 + pulse * 3, color(255, 255, 255, 160), 1.5);
      view.line3([this.pos.x, this.pos.y, 1], [this.target.x, this.target.y, 1], color(255, 255, 255, 50), 1);
    }
    if (this.ghost > 0 && Math.floor(this.ghost / 5) % 2) return;   // clignote quand invincible
    super.show(view);
  }
}

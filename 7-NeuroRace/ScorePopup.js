// ScorePopup — petit texte animé (« +1 DATA », « TURBO ! ») qui monte avec arrive()
class ScorePopup extends Vehicle {
  constructor(x, y, text, col) {
    super(x, y, 2, 0.2);
    this.vel = createVector(0, 0);
    this.text = text; this.col = col;
    this.z = 30; this.life = 50;
    this.pathMaxLength = 0;
  }

  step() { this.z += (60 - this.z) * 0.06; this.life--; }

  depth(view) { return view.depthOf(this.pos.x, this.pos.y, this.z); }

  show(view) {
    const c = color(this.col); c.setAlpha(Math.min(255, this.life * 8));
    view.label(this.text, this.pos.x, this.pos.y, this.z, c, 14);
  }
}

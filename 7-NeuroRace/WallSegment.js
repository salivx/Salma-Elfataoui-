// WallSegment — rendu 3D d'un segment de mur (Boundary) : paroi translucide + arête néon.
// Magenta pour le bord intérieur, cyan pour le bord extérieur.
class WallSegment {
  constructor(boundary, inner) {
    this.b = boundary;
    this.inner = inner;
    this.mx = (boundary.a.x + boundary.b.x) / 2;
    this.my = (boundary.a.y + boundary.b.y) / 2;
  }

  depth(view) { return view.depthOf(this.mx, this.my, WALL_H / 2); }

  show(view) {
    const a = this.b.a, b = this.b.b;
    const rgb = this.inner ? [255, 43, 214] : [32, 227, 255];
    view.poly([[a.x, a.y, 0], [b.x, b.y, 0], [b.x, b.y, WALL_H], [a.x, a.y, WALL_H]], color(...rgb, 45), null);
    view.line3([a.x, a.y, WALL_H], [b.x, b.y, WALL_H], color(...rgb, 70), 5);
    view.line3([a.x, a.y, WALL_H], [b.x, b.y, WALL_H], color(...rgb, 255), 1.6);
  }
}

// Fonctions utilitaires partagées (aucune classe dans ce fichier).

// Dessine une flèche représentant le vecteur vec, à partir du point base.
function drawArrow(base, vec, arrowColor) {
  push();
  stroke(arrowColor);
  strokeWeight(2);
  fill(arrowColor);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  let arrowSize = 6;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}

// Vrai si le point p est dans le rectangle view {x, y, w, h} élargi de margin.
// Sert à ne dessiner que ce qui est visible à l'écran.
function inView(p, view, margin = 0) {
  return p.x > view.x - margin && p.x < view.x + view.w + margin
    && p.y > view.y - margin && p.y < view.y + view.h + margin;
}

// Dessine un hexagone (pointe en haut) centré en (x, y).
function drawHexagon(x, y, size) {
  beginShape();
  for (let i = 0; i < 6; i += 1) {
    let a = (PI / 3) * i + (PI / 6);
    vertex(x + (size * cos(a)), y + (size * sin(a)));
  }
  endShape(CLOSE);
}

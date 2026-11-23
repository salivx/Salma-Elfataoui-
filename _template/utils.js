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

// Squelette d'application : des véhicules errent en évitant des obstacles.
// Touche d : mode debug. Clic : ajoute un obstacle.
// Aucune classe dans ce fichier (voir ARCHITECTURE.md).

const NB_VEHICLES = 20;
const NB_OBSTACLES = 5;

let vehicles = [];
let obstacles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  describe('Des triangles blancs errent sur fond noir en contournant des disques gris.');

  for (let i = 0; i < NB_VEHICLES; i += 1) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }
  for (let i = 0; i < NB_OBSTACLES; i += 1) {
    obstacles.push(new Obstacle(random(width), random(height), random(20, 60)));
  }
}

function draw() {
  background(0);

  // 1. Décider (sélection d'action + pilotage).
  obstacles.forEach((o) => o.applyBehaviors());
  vehicles.forEach((v) => v.applyBehaviors(vehicles, obstacles));

  // 2. Bouger (locomotion).
  obstacles.forEach((o) => o.update());
  vehicles.forEach((v) => v.update());

  // 3. Dessiner.
  obstacles.forEach((o) => o.show());
  vehicles.forEach((v) => v.show());
}

function mousePressed() {
  obstacles.push(new Obstacle(mouseX, mouseY, random(20, 60)));
}

function keyPressed() {
  if (key === 'd') {
    Vehicle.debug = !Vehicle.debug;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

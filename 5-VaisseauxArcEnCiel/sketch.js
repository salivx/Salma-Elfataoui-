// Vaisseaux réglables par curseurs.
// Touche D ou case « Mode debug » : affiche les vecteurs vitesse en rouge.
// Aucune classe dans ce fichier (voir ARCHITECTURE.md).

// Réglages courants des vaisseaux (pilotés par les curseurs).
let shipSettings = {
  count: 20,
  maxSpeed: 4,
  maxForce: 0.2,
};

let ships = [];
let gradient;
let panel;
let debugCheckbox;

function setup() {
  createCanvas(windowWidth, windowHeight);
  describe('Des vaisseaux errent sur fond noir, éclairés par un halo arc-en-ciel qui suit la souris ; un panneau de réglages en haut de l\'écran.');

  gradient = new RainbowGradient(width / 2, height / 2);
  setShipCount(shipSettings.count);
  createControlPanel();
}

function createControlPanel() {
  panel = new ControlPanel('Réglages');

  panel.addSection('Vaisseaux');
  panel.addSlider('Nombre de vaisseaux', 1, 200, shipSettings.count, 1, (value) => {
    setShipCount(value);
  });
  panel.addSlider('Vitesse max', 0, 20, shipSettings.maxSpeed, 0.01, (value) => {
    shipSettings.maxSpeed = value;
    ships.forEach((ship) => {
      ship.maxSpeed = value;
    });
  });
  panel.addSlider('Accélération max', 0, 10, shipSettings.maxForce, 0.01, (value) => {
    shipSettings.maxForce = value;
    ships.forEach((ship) => {
      ship.maxForce = value;
    });
  });
  debugCheckbox = panel.addCheckbox('Mode debug (touche D)', Vehicle.debug, (checked) => {
    setDebug(checked);
  });

  panel.addSection('Dégradé arc-en-ciel');
  addGradientSlider('Rayon', 20, 1500, 'radius', 1);
  addGradientSlider('Cycles de couleurs', 0.5, 8, 'cycles', 0.1);
  addGradientSlider('Rotation des couleurs', -10, 10, 'hueSpeed', 0.1);
  addGradientSlider('Saturation (%)', 0, 100, 'saturation', 1);
  addGradientSlider('Luminosité (%)', 0, 100, 'lightness', 1);
  addGradientSlider('Opacité', 0, 1, 'alpha', 0.01);
  addGradientSlider('Pulsation (amplitude)', 0, 0.5, 'pulseAmount', 0.01);
  addGradientSlider('Pulsation (vitesse)', 0, 0.2, 'pulseSpeed', 0.001);
  addGradientSlider('Suivi : vitesse max', 0, 50, 'maxSpeed', 0.1);
  addGradientSlider('Suivi : force max', 0, 5, 'maxForce', 0.01);
  addGradientSlider('Suivi : rayon de freinage', 0, 500, 'slowRadius', 1);
}

// Curseur lié directement à une propriété du dégradé.
function addGradientSlider(label, minValue, maxValue, property, step) {
  panel.addSlider(label, minValue, maxValue, gradient[property], step, (value) => {
    gradient[property] = value;
  });
}

// Ajoute ou retire des vaisseaux pour en avoir exactement count.
function setShipCount(count) {
  shipSettings.count = count;
  while (ships.length < count) {
    ships.push(new Ship(random(width), random(height), shipSettings.maxSpeed, shipSettings.maxForce));
  }
  if (ships.length > count) {
    ships.splice(count);
  }
}

// Point unique de changement du mode debug : garde la touche D et la case synchronisées.
function setDebug(enabled) {
  Vehicle.debug = enabled;
  if (debugCheckbox !== undefined && debugCheckbox.checked() !== enabled) {
    debugCheckbox.checked(enabled);
  }
}

function draw() {
  background(0);

  // 1. Décider.
  gradient.applyBehaviors(createVector(mouseX, mouseY));
  ships.forEach((ship) => ship.applyBehaviors(ships));

  // 2. Bouger.
  gradient.update();
  ships.forEach((ship) => ship.update());

  // 3. Dessiner (le dégradé en arrière-plan).
  gradient.show();
  ships.forEach((ship) => ship.show());
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    setDebug(!Vehicle.debug);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

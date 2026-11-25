// =====================================================================
//  NEURO RACE — sketch.js
//  Jeu de course en 3D néon contre des coureurs pilotés par des réseaux
//  de neurones (neuro-évolution, cf. 9-VoitureSuitCircuit du cours).
// =====================================================================
p5.disableFriendlyErrors = true;

let game, hud, menu, pauseScreen, resultsScreen, labScreen, controlPanel, neuroSettings;

function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  c.parent('stage');
  textFont('Rajdhani');
  game = new Game();
  hud = new Hud();
  menu = new Menu(game);
  pauseScreen = new PauseScreen(game);
  resultsScreen = new ResultsScreen();
  labScreen = new LabScreen(game);
  controlPanel = new ControlPanel(game);
  neuroSettings = new NeuroSettings(game);
  bindTouch();
}

function draw() {
  // le pointeur (souris ou doigt) sert de cible au joueur en mode souris
  const overUI = document.elementFromPoint(mouseX, mouseY);
  game.input.pointer = overUI && overUI.tagName === 'CANVAS' ? { x: mouseX, y: mouseY } : game.input.pointer;
  game.update();
  game.draw();
  pauseScreen.sync();
  select('#touch').style('display', (game.state === 'race' || game.state === 'countdown') && game.input.mode === 'keys' ? '' : 'none');
}

function setControl(mode) {
  game.input.mode = mode;
  document.querySelectorAll('#ctrl button').forEach(b => b.classList.toggle('on', b.dataset.v === mode));
}

function goToMenu() {
  resultsScreen.hide(); labScreen.hide();
  game.startDemo();
  menu.show();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// ---------- clavier ----------
function typing() { const a = document.activeElement; return a && a.tagName === 'INPUT' && a.type === 'text'; }

function keyPressed() {
  if (typing()) { if (keyCode === ENTER && menu.visible()) menu.play(); return; }
  setKey(true);
  if (key === 'd' || key === 'D') controlPanel.toggle();
  if (key === 'v' || key === 'V') game.cycleCamera();
  if (keyCode === ESCAPE || key === 'p' || key === 'P') game.togglePause();
  if (key === 'n' || key === 'N') game.showBrain = !game.showBrain;
  if (keyCode === ENTER || key === ' ') {
    if (menu.visible() && keyCode === ENTER) menu.play();
    else if (game.state === 'results') menu.play();
  }
  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW, 32].includes(keyCode)) return false;
}

function keyReleased() { if (!typing()) setKey(false); }

function setKey(v) {
  const i = game.input;
  // flèches = direction à l'écran, Espace = freiner (D est réservé au mode debug)
  if (keyCode === LEFT_ARROW) i.left = v;
  if (keyCode === RIGHT_ARROW) i.right = v;
  if (keyCode === UP_ARROW) i.up = v;
  if (keyCode === DOWN_ARROW) i.down = v;
  if (key === ' ') i.brake = v;
  // une flèche pressée en mode souris bascule automatiquement en mode flèches
  if (v && [LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode) && i.mode === 'mouse' && game.state === 'race') setControl('keys');
}

// ---------- souris : tourner / zoomer la caméra ----------
function mouseDragged(e) {
  if (!e || !e.target || e.target.tagName !== 'CANVAS' || menu.visible()) return;
  if (game.input.mode === 'mouse' && (game.state === 'race' || game.state === 'countdown')) return;   // la souris dirige
  game.cam.userYaw += movedX * 0.008;
  game.cam.userTilt = constrain(game.cam.userTilt + movedY * 0.004, -0.8, 0.45);
}

function mouseWheel(e) {
  if (menu.visible() || !e.target || e.target.tagName !== 'CANVAS') return;
  game.cam.zoom = constrain(game.cam.zoom * (e.delta > 0 ? 0.92 : 1.08), 0.6, 2.4);
  return false;
}

// ---------- boutons tactiles ----------
function bindTouch() {
  for (const [id, k] of [['#tLeft', 'left'], ['#tRight', 'right'], ['#tBrake', 'brake'], ['#tUp', 'up'], ['#tDown', 'down']]) {
    const b = select(id).elt;
    const on = e => { e.preventDefault(); game.input[k] = true; };
    const off = e => { e.preventDefault(); game.input[k] = false; };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('pointercancel', off);
  }
}

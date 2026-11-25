// =====================================================================
//  config.js — constantes partagées (pas de classe)
//  Le circuit est défini sur un plan de 960 × 600 « pixels-plan ».
//  ATTENTION : TRACK_W, SIGHT, RAY_ANGLES, MAX_SPEED, MAX_FORCE doivent
//  rester identiques à ceux de l'entraînement, sinon les cerveaux
//  pré-entraînés (brains.js) ne savent plus conduire.
// =====================================================================
const PLAN_W = 960, PLAN_H = 600;
const TRACK_W = 66;                        // largeur de la piste
const SIGHT = 160;                         // longueur des rayons-capteurs
const RAY_ANGLES = [-90, -50, -25, 0, 25, 50, 90];
const INPUTS = RAY_ANGLES.length + 1;      // 7 rayons + vitesse
const HIDDEN = 12, OUTPUTS = 2;            // sorties : angle de braquage, vitesse
const LAB_SIZE = 120;                      // coureurs par génération (Labo IA)
const GEN_FRAMES = 1800;                   // durée max d'une génération
const STALL_FRAMES = 90;                   // mort si aucun checkpoint pendant ce temps
let MUTATION_RATE = 0.1;
const MAX_SPEED = 3.6, MAX_FORCE = 0.28;
const WALL_H = 12;                         // hauteur des murs (3D)

// Réglages du Labo IA (modifiables dans le menu « Réseau neuronal »).
// Les rivaux de la course gardent la configuration d'origine (cerveaux pré-entraînés).
const NEURO_DEFAULTS = {
  population: 120,      // coureurs par génération
  hidden: 12,           // neurones cachés
  activation: 'tanh',   // tanh | relu | sigmoid
  rays: 7,              // nombre de rayons-capteurs
  fov: 180,             // angle de vision total (degrés)
  sight: 160,           // portée des rayons
  mutationRate: 0.1,    // probabilité de muter chaque poids
  mutationStrength: 0.5,// amplitude de la mutation (écart-type)
  crossover: true,      // croisement de 2 parents
  elitism: 1,           // meilleurs gardés intacts
  fitnessExp: 2,        // fitness = checkpoints ^ exposant
  genSeconds: 30,       // durée max d'une génération
  stallSeconds: 1.5,    // mort si aucun checkpoint pendant ce temps
  maxSpeed: 3.6         // vitesse max des coureurs du Labo
};
let NEURO = Object.assign({}, NEURO_DEFAULTS);
try { Object.assign(NEURO, JSON.parse(localStorage.getItem('neuroRaceSettings') || '{}')); } catch (e) {}

// angles des rayons répartis sur le champ de vision
function rayAnglesFor(n, fov) {
  if (n === 7 && fov === 180) return RAY_ANGLES.slice();
  if (n === 1) return [0];
  return Array.from({ length: n }, (_, i) => Math.round(-fov / 2 + (fov * i) / (n - 1)));
}

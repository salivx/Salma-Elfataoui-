// LabScreen — barre d'outils du Labo IA : vitesse d'entraînement, courir contre son IA,
// sauvegarder / charger le champion, recommencer, retour menu.
class LabScreen {
  constructor(game) {
    this.game = game;
    this.el = select('#labBar');
    this.speed = select('#labSpeed');
    this.speed.input(() => { game.cycles = +this.speed.value(); select('#labSpeedVal').html(game.cycles + '×'); });
    select('#raceMine').mousePressed(() => {
      if (!game.lab.bestBrain) return this.say('Attends au moins une génération.');
      menu.play(true);
    });
    select('#saveBrain').mousePressed(() => {
      if (!game.lab.bestBrain) return this.say('Pas encore de champion.');
      try { localStorage.setItem('neuroRaceBrain', JSON.stringify(game.lab.bestBrain.toJSON())); this.say('Champion sauvegardé.'); }
      catch (e) { this.say('Sauvegarde bloquée par le navigateur.'); }
    });
    select('#loadBrain').mousePressed(() => {
      let raw = null; try { raw = localStorage.getItem('neuroRaceBrain'); } catch (e) {}
      if (!raw) return this.say('Aucun cerveau sauvegardé.');
      const pop = new Population(game.track, NeuralNetwork.fromJSON(JSON.parse(raw)), () => this.refresh());
      if (pop.rejected) return this.say('Ce cerveau n\'a pas la forme des réglages actuels (rayons / neurones).');
      game.lab = pop;
      this.say('Champion chargé : ses enfants mutés s\'entraînent.');
    });
    select('#resetLab').mousePressed(() => {
      game.lab = new Population(game.track, null, () => this.refresh());
      this.say('Nouveaux cerveaux aléatoires.');
    });
    select('#labMenu').mousePressed(() => goToMenu());
    select('#labNeuro').mousePressed(() => neuroSettings.open('lab'));
  }

  say(msg) { select('#labMsg').html(msg); clearTimeout(this.t); this.t = setTimeout(() => select('#labMsg').html(''), 3000); }
  refresh() {}
  show() { this.el.removeClass('hidden'); }
  hide() { this.el.addClass('hidden'); }
}

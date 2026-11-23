// Panneau de réglages en haut de l'écran, semi-transparent, repliable (accordéon).
// C'est de l'interface DOM (pas un élément dessiné sur le canevas) : ce n'est donc
// pas un Vehicle (voir ARCHITECTURE.md, « Interface utilisateur »).
//
// Utilise les éléments HTML natifs <details>/<summary> : le panneau entier et
// chacune de ses sections se replient d'un clic sur leur titre.
class ControlPanel {
  constructor(title = 'Réglages', open = true) {
    this.root = createElement('details');
    this.root.addClass('control-panel');
    if (open === true) {
      this.root.attribute('open', '');
    }

    let summary = createElement('summary', title);
    summary.parent(this.root);

    this.body = createDiv();
    this.body.addClass('control-panel-body');
    this.body.parent(this.root);

    this.currentSection = this.body;
  }

  /** Ajoute une section repliable ; les contrôles suivants y sont placés. */
  addSection(title, open = true) {
    let section = createElement('details');
    section.addClass('control-section');
    if (open === true) {
      section.attribute('open', '');
    }
    section.parent(this.body);

    let summary = createElement('summary', title);
    summary.parent(section);

    let content = createDiv();
    content.addClass('control-section-body');
    content.parent(section);

    this.currentSection = content;
    return content;
  }

  /**
   * Ajoute un curseur avec son libellé et sa valeur affichée.
   * onChange(valeur) est appelé à chaque mouvement du curseur.
   */
  addSlider(label, min, max, value, step, onChange) {
    let row = createDiv();
    row.addClass('control-row');
    row.parent(this.currentSection);

    let name = createSpan(label);
    name.addClass('control-label');
    name.parent(row);

    let slider = createSlider(min, max, value, step);
    slider.parent(row);

    let display = createSpan(this.format(value, step));
    display.addClass('control-value');
    display.parent(row);

    slider.input(() => {
      let current = Number(slider.value());
      display.html(this.format(current, step));
      onChange(current);
    });
    return slider;
  }

  /** Ajoute une case à cocher ; onChange(booléen) à chaque changement. */
  addCheckbox(label, checked, onChange) {
    let checkbox = createCheckbox(label, checked);
    checkbox.addClass('control-row');
    checkbox.addClass('control-checkbox');
    checkbox.parent(this.currentSection);
    checkbox.changed(() => onChange(checkbox.checked()));
    return checkbox;
  }

  /** Affiche value avec autant de décimales que step. */
  format(value, step) {
    let text = String(step);
    let dot = text.indexOf('.');
    let decimals = dot === -1 ? 0 : text.length - dot - 1;
    return value.toFixed(decimals);
  }
}

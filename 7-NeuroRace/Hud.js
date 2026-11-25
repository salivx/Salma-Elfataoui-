// =====================================================================
//  Hud — tout ce qui est dessiné « à plat » par-dessus la 3D :
//  tour, position, chrono, classement, vitesse, compte à rebours,
//  infos du Labo IA, réseau de neurones, courbe d'évolution, debug.
// =====================================================================
class Hud {
  panel(x, y, w, h) {
    push();
    fill(6, 10, 30, 205); stroke(32, 227, 255, 120); strokeWeight(1);
    rect(x, y, w, h, 6);
    stroke(32, 227, 255); strokeWeight(2); line(x + 8, y, x + 40, y);
    pop();
  }

  draw(g) {
    textFont('Rajdhani');
    if (g.state === 'countdown' || g.state === 'race' || g.state === 'pause') this.race(g);
    const w = g.watched();
    if (w && g.state !== 'menu' && width > 900) this.brain(w.brain, 16, height - 236, w.rayAngles, 'CERVEAU DE ' + w.name + ' (EN DIRECT)');
    if (g.state === 'countdown') this.countdown(g);
    if (g.state === 'race' && g.raceFrames < 70) this.big('GO !', color(60, 255, 170));
    if (g.state === 'lab') this.lab(g);
    if (Vehicle.debug) this.debugInfo(g);
  }

  race(g) {
    const p = g.player; if (!p) return;
    const order = g.standings(), pos = order.indexOf(p) + 1, n = order.length;
    this.panel(16, 16, 210, 118);
    push(); noStroke(); textAlign(LEFT, TOP);
    fill(32, 227, 255); textStyle(BOLD); textSize(14);
    text('TOUR  ' + Math.min(g.settings.laps, p.lap + 1) + ' / ' + g.settings.laps, 30, 26);
    fill(255); textFont('Orbitron'); textSize(36);
    const place = pos + (pos === 1 ? 'er' : 'e');
    text(place, 30, 46);
    const pw = textWidth(place);
    textSize(14); fill(150, 170, 220); text('/ ' + n, 30 + pw + 8, 66);
    textFont('Rajdhani'); fill(220, 235, 255); textSize(16); textStyle(NORMAL);
    text(this.time(g.raceFrames) + '   ·   ' + p.shards + ' data', 30, 104);
    pop();

    // classement en direct
    const w = 190, x = width - w - 16;
    this.panel(x, 16, w, 30 + n * 22);
    push(); noStroke(); textSize(13); textAlign(LEFT, TOP);
    fill(32, 227, 255); textStyle(BOLD); text('CLASSEMENT', x + 14, 24);
    order.forEach((r, i) => {
      const y = 46 + i * 22;
      fill(...r.col); circle(x + 20, y + 8, 9);
      fill(r.human ? 255 : 200); textStyle(r.human ? BOLD : NORMAL);
      text((i + 1) + '. ' + r.name, x + 32, y);
      textAlign(RIGHT, TOP); fill(140, 160, 210);
      text(r.finished ? this.time(r.finishTime) : 'T' + Math.min(g.settings.laps, r.lap + 1), x + w - 12, y);
      textAlign(LEFT, TOP);
    });
    pop();

    // vitesse + turbo
    const sp = p.vel.mag() / (p.maxSpeed * 1.55), bw = Math.min(320, width * 0.4), bx = width / 2 - bw / 2, by = height - 40;
    push(); noStroke();
    fill(6, 10, 30, 200); rect(bx - 10, by - 22, bw + 20, 44, 6);
    fill(30, 40, 80); rect(bx, by, bw, 8, 4);
    fill(p.boost > 0 ? color(120, 255, 240) : color(32, 227, 255)); rect(bx, by, bw * constrain(sp, 0, 1), 8, 4);
    fill(200, 215, 255); textSize(12); textAlign(LEFT, BOTTOM); textStyle(BOLD);
    text(p.boost > 0 ? 'TURBO' : 'VITESSE', bx, by - 4);
    textAlign(RIGHT, BOTTOM); textStyle(NORMAL);
    text('V caméra (' + { overview: '3D', top: 'dessus', chase: 'poursuite' }[g.cam.mode] + ') · N cerveau · Échap pause', bx + bw, by - 4);
    pop();
  }

  countdown(g) {
    const n = Math.ceil(g.count / 60);
    this.big(n, color(32, 227, 255), 1 + (g.count % 60) / 60);
  }

  big(txt, col, s = 1) {
    push(); textAlign(CENTER, CENTER); textFont('Orbitron'); textStyle(BOLD); noStroke();
    textSize(110 * s);
    fill(red(col), green(col), blue(col), 60); text(txt, width / 2 + 4, height / 2 + 4);
    fill(col); text(txt, width / 2, height / 2);
    pop();
  }

  time(frames) {
    const t = frames / 60, m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
  }

  lab(g) {
    const L = g.lab, lead = L.leader();
    this.panel(16, 16, 240, 112);
    push(); noStroke(); textAlign(LEFT, TOP);
    fill(32, 227, 255); textStyle(BOLD); textSize(14); text('LABO IA · GÉNÉRATION ' + L.generation, 30, 26);
    fill(220, 235, 255); textStyle(NORMAL); textSize(15);
    text('En vie : ' + L.alive().length + ' / ' + L.size, 30, 50);
    const best = Math.max(0, ...L.history);
    text('Record : ' + best + ' checkpoints (' + (best / g.track.N).toFixed(1) + ' tours)', 30, 72);
    text('Vitesse : ' + g.cycles + '×   ·   temps ' + Math.floor(L.frames / 60) + ' s', 30, 94);
    pop();
    if (g.debug.nn) this.brain(lead.brain, width - 286, 16, lead.rayAngles);
    this.chart(L.history, g.track.N, 16, 140, Math.min(300, width - 32), 90);
  }

  // visualisation du réseau de neurones du meilleur coureur vivant
  brain(nn, x0, y0, angles, title) {
    const I = nn.inN, Hn = nn.hN, w = 270, h = Math.max(190, 34 + Math.max(I, Hn) * 11);
    if (y0 + h > height - 8) y0 = height - h - 8;
    this.panel(x0, y0, w, h);
    const col = (n, i, x) => ({ x, y: y0 + 22 + (i + 0.5) * ((h - 30) / n) });
    const ins = Array.from({ length: I }, (_, i) => col(I, i, x0 + 70));
    const hid = Array.from({ length: Hn }, (_, i) => col(Hn, i, x0 + 150));
    const outs = [col(2, 0, x0 + 212), col(2, 1, x0 + 212)];
    push(); strokeWeight(1);
    for (let j = 0; j < Hn; j++) {
      for (let i = 0; i < I; i++) {
        const v = nn.w1[j * I + i]; if (Math.abs(v) < 0.4) continue;
        stroke(v > 0 ? color(32, 227, 255, 70) : color(255, 43, 214, 70)); line(ins[i].x, ins[i].y, hid[j].x, hid[j].y);
      }
      for (let k = 0; k < 2; k++) {
        const v = nn.w2[k * Hn + j]; if (Math.abs(v) < 0.4) continue;
        stroke(v > 0 ? color(32, 227, 255, 110) : color(255, 43, 214, 110)); line(hid[j].x, hid[j].y, outs[k].x, outs[k].y);
      }
    }
    noStroke(); textSize(I > 12 ? 9 : 11);
    fill(32, 227, 255); textStyle(BOLD); textAlign(LEFT, TOP);
    text((title || 'RÉSEAU DU LEADER') + '  ' + I + '→' + Hn + '→2', x0 + 14, y0 + 6);
    textStyle(NORMAL); textAlign(RIGHT, CENTER);
    const labels = angles.map(a => 'rayon ' + a + '°').concat('vitesse');
    ins.forEach((p, i) => { fill(60, 255, 170, 60 + (nn.lastIn[i] || 0) * 195); circle(p.x, p.y, 7); fill(190, 205, 240); text(labels[i] || '', p.x - 8, p.y); });
    hid.forEach((p, j) => { const v = Math.max(-1, Math.min(1, nn.lastHidden[j])); fill(v > 0 ? color(32, 227, 255, 80 + v * 175) : color(255, 43, 214, 80 - v * 175)); circle(p.x, p.y, 7); });
    textAlign(LEFT, CENTER); fill(255, 210, 60); outs.forEach(p => circle(p.x, p.y, 10));
    fill(190, 205, 240); textSize(11); text('direction', outs[0].x + 8, outs[0].y); text('vitesse', outs[1].x + 8, outs[1].y);
    pop();
  }

  chart(hist, N, x, y, w, h) {
    this.panel(x, y, w, h);
    push(); noStroke(); fill(32, 227, 255); textSize(12); textStyle(BOLD); textAlign(LEFT, TOP);
    text('MEILLEURS CHECKPOINTS PAR GÉNÉRATION', x + 12, y + 8);
    const data = hist.slice(-50), max = Math.max(N * 1.2, ...data, 1), bw = (w - 24) / 50;
    const lapY = y + h - 10 - (N / max) * (h - 36);
    stroke(255, 255, 255, 60); strokeWeight(1); drawingContext.setLineDash([4, 4]); line(x + 12, lapY, x + w - 12, lapY); drawingContext.setLineDash([]);
    noStroke(); fill(200, 210, 240); textStyle(NORMAL); textAlign(RIGHT, BOTTOM); text('1 tour', x + w - 12, lapY - 2);
    data.forEach((v, i) => {
      const bh = Math.max(2, (v / max) * (h - 36));
      fill(v >= N ? color(255, 210, 60) : color(32, 227, 255));
      rect(x + 12 + i * bw, y + h - 10 - bh, bw - 2, bh, 2);
    });
    pop();
  }

  debugInfo(g) {
    push(); noStroke(); fill(255, 60, 60); textSize(13); textAlign(LEFT, BOTTOM); textStyle(BOLD);
    const n = g.visibleRunners().length;
    text('DEBUG · ' + Math.round(frameRate()) + ' FPS · ' + n + ' coureurs · ' + g.particles.length + ' particules · ' +
      g.track.walls.length + ' murs', 16, g.state === 'lab' ? 250 : height - 70);
    pop();
  }
}

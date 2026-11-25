// Sfx — petits effets sonores avec la Web Audio API (pas de fichier, marche en file://)
const Sfx = {
  ctx: null,
  on: true,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type = 'square', vol = 0.06, slide = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur);
  },
  beep() { this.tone(440, 0.18); },
  go() { this.tone(880, 0.4, 'square', 0.07); },
  coin() { this.tone(988, 0.07); setTimeout(() => this.tone(1319, 0.12), 60); },
  boost() { this.tone(300, 0.3, 'sawtooth', 0.05, 500); },
  crash() { this.tone(160, 0.35, 'sawtooth', 0.08, -110); },
  lap() { this.tone(660, 0.1); setTimeout(() => this.tone(880, 0.15), 100); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.2), i * 120)); }
};

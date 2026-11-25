// Petit réseau de neurones : entrées -> couche cachée (tanh, ReLU ou sigmoïde) -> sorties.
// Pas de rétropropagation : il apprend par neuro-évolution (mutation + croisement).
// No backprop: it learns by neuroevolution (mutation + crossover).
class NeuralNetwork {
  constructor(inN, hN, outN, act = 'tanh') {
    this.act = act;
    this.inN = inN; this.hN = hN; this.outN = outN;
    this.w1 = NeuralNetwork.rand(inN * hN);
    this.b1 = NeuralNetwork.rand(hN);
    this.w2 = NeuralNetwork.rand(hN * outN);
    this.b2 = NeuralNetwork.rand(outN);
    this.lastIn = new Array(inN).fill(0);
    this.lastHidden = new Array(hN).fill(0);
    this.lastOut = new Array(outN).fill(0);
  }

  static gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  static rand(n) {
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
    return a;
  }

  predict(x) {
    const { inN, hN, outN } = this;
    const h = this.lastHidden, o = this.lastOut;
    for (let j = 0; j < hN; j++) {
      let s = this.b1[j];
      for (let i = 0; i < inN; i++) s += x[i] * this.w1[j * inN + i];
      h[j] = this.act === 'relu' ? Math.max(0, s) : this.act === 'sigmoid' ? 1 / (1 + Math.exp(-s)) : Math.tanh(s);
    }
    for (let k = 0; k < outN; k++) {
      let s = this.b2[k];
      for (let j = 0; j < hN; j++) s += h[j] * this.w2[k * hN + j];
      o[k] = s;
    }
    this.lastIn = x.slice();
    return o;
  }

  copy() {
    const n = new NeuralNetwork(this.inN, this.hN, this.outN, this.act);
    n.w1 = this.w1.slice(); n.b1 = this.b1.slice();
    n.w2 = this.w2.slice(); n.b2 = this.b2.slice();
    return n;
  }

  mutate(rate, strength = 0.5) {
    for (const arr of [this.w1, this.b1, this.w2, this.b2]) {
      for (let i = 0; i < arr.length; i++) {
        if (Math.random() < rate) arr[i] += NeuralNetwork.gauss() * strength;
      }
    }
    return this;
  }

  // uniform crossover: each weight comes from one parent or the other
  crossover(other) {
    const c = this.copy();
    for (const key of ['w1', 'b1', 'w2', 'b2']) {
      for (let i = 0; i < c[key].length; i++) {
        if (Math.random() < 0.5) c[key][i] = other[key][i];
      }
    }
    return c;
  }

  toJSON() {
    return {
      shape: [this.inN, this.hN, this.outN], act: this.act,
      w1: Array.from(this.w1), b1: Array.from(this.b1),
      w2: Array.from(this.w2), b2: Array.from(this.b2)
    };
  }

  static fromJSON(d) {
    const n = new NeuralNetwork(d.shape[0], d.shape[1], d.shape[2], d.act || 'tanh');
    n.w1 = Float32Array.from(d.w1); n.b1 = Float32Array.from(d.b1);
    n.w2 = Float32Array.from(d.w2); n.b2 = Float32Array.from(d.b2);
    return n;
  }
}

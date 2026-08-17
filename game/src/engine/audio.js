// Fully synthesized audio engine (Web Audio API). No external asset files.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicNodes = [];
    this.musicTimer = null;
    this.enabled = true;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.master);
  }

  resume() {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _osc(type, freq, t0, dur, gainVal = 0.2, dest = this.sfxGain, glideTo = null) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(dest);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
    return osc;
  }

  jump() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('square', 300, t, 0.16, 0.18, this.sfxGain, 620);
  }
  doubleJump() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('square', 420, t, 0.14, 0.16, this.sfxGain, 760);
  }
  shard() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('square', 880, t, 0.09, 0.14);
    this._osc('square', 1318, t + 0.06, 0.12, 0.14);
  }
  stomp() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('triangle', 180, t, 0.12, 0.22, this.sfxGain, 60);
  }
  bump() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('square', 220, t, 0.07, 0.2, this.sfxGain, 120);
  }
  powerup() {
    this.ensure(); const t = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => this._osc('square', f, t + i * 0.09, 0.14, 0.16));
  }
  damage() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('sawtooth', 220, t, 0.28, 0.2, this.sfxGain, 60);
  }
  breakBlock() {
    this.ensure(); const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) this._osc('square', 140 + Math.random() * 200, t + i * 0.015, 0.05, 0.12);
  }
  throwWisp() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('sine', 700, t, 0.18, 0.12, this.sfxGain, 1400);
  }
  wispReturn() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('sine', 500, t, 0.12, 0.1, this.sfxGain, 900);
  }
  levelClear() {
    this.ensure(); const t = this.ctx.currentTime;
    [523, 587, 659, 784, 880, 1046, 1318].forEach((f, i) => this._osc('square', f, t + i * 0.11, 0.2, 0.18));
  }
  gameOver() {
    this.ensure(); const t = this.ctx.currentTime;
    [392, 349, 311, 261].forEach((f, i) => this._osc('sawtooth', f, t + i * 0.22, 0.3, 0.16));
  }
  select() {
    this.ensure(); const t = this.ctx.currentTime;
    this._osc('square', 660, t, 0.05, 0.1);
  }

  // --- Music: simple procedurally sequenced loop per biome ---
  startMusic(biome) {
    this.ensure();
    this.stopMusic();
    const patterns = {
      meadow: { notes: [392, 440, 523, 440, 392, 349, 392, 523], tempo: 0.22, wave: 'triangle', bass: [98, 98, 130.8, 98] },
      cavern: { notes: [220, 246, 220, 196, 174, 196, 220, 261], tempo: 0.30, wave: 'sine', bass: [73, 73, 65, 73] },
      sky: { notes: [587, 659, 784, 659, 880, 784, 659, 587], tempo: 0.19, wave: 'triangle', bass: [147, 147, 196, 147] },
    };
    const pat = patterns[biome] || patterns.meadow;
    let step = 0;
    const playStep = () => {
      const t = this.ctx.currentTime;
      const note = pat.notes[step % pat.notes.length];
      this._osc(pat.wave, note, t, pat.tempo * 0.9, 0.05, this.musicGain);
      if (step % 2 === 0) {
        const bass = pat.bass[Math.floor(step / 2) % pat.bass.length];
        this._osc('triangle', bass, t, pat.tempo * 1.8, 0.06, this.musicGain);
      }
      step++;
    };
    playStep();
    this.musicTimer = setInterval(playStep, pat.tempo * 1000);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}

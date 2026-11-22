// audio.js — the whole soundtrack is synthesized live with WebAudio: short
// oscillator blips, no audio files, no network. The context only starts after
// the player's first key or click, as browsers require.

export function createAudio() {
  return {
    ctx: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        try {
          const Ctor = window.AudioContext || window.webkitAudioContext;
          this.ctx = new Ctor();
        } catch (err) {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type, vol, when = 0) {
      if (this.muted) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },
    playCoin() { this.tone(920, 0.09, 'sine', 0.12); },
    playGem() {
      this.tone(1180, 0.1, 'sine', 0.12);
      this.tone(1560, 0.14, 'sine', 0.1, 0.08);
    },
    playSapphire() {
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.12, i * 0.09));
    },
    playSmoke() { this.tone(220, 0.25, 'sine', 0.1); this.tone(160, 0.3, 'sine', 0.08, 0.05); },
    playLoop() { this.tone(1400, 0.07, 'square', 0.05); this.tone(1400, 0.07, 'square', 0.05, 0.12); },
    playSpotted() {
      this.tone(196, 0.22, 'sawtooth', 0.14);
      this.tone(196, 0.22, 'sawtooth', 0.14, 0.26);
    },
    playCaught() {
      [330, 262, 196, 131].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.12, i * 0.16));
    },
    playWin() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.12, i * 0.11));
    },
  };
}

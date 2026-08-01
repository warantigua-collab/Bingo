/**
 * audio.js — Efectos de sonido sintetizados con Web Audio API.
 * No depende de archivos externos (mp3/wav), por lo que no hay nada que
 * descargar ni que se pueda romper por rutas de archivo incorrectas.
 */
(function (root) {
  "use strict";

  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, duration = 0.15, type = "sine", gain = 0.2, delay = 0, glide = null }) {
    if (!enabled) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = type;
    const t0 = c.currentTime + delay;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.linearRampToValueAtTime(glide, t0 + duration);
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(amp).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  const Sounds = {
    setEnabled(v) {
      enabled = v;
    },
    isEnabled() {
      return enabled;
    },
    click() {
      tone({ freq: 520, duration: 0.06, type: "square", gain: 0.12 });
    },
    ballCall() {
      tone({ freq: 300, duration: 0.18, type: "triangle", gain: 0.22, glide: 520 });
      tone({ freq: 700, duration: 0.1, type: "sine", gain: 0.1, delay: 0.05 });
    },
    pause() {
      tone({ freq: 440, duration: 0.15, type: "sine", gain: 0.15, glide: 220 });
    },
    resume() {
      tone({ freq: 300, duration: 0.15, type: "sine", gain: 0.15, glide: 500 });
    },
    reset() {
      tone({ freq: 600, duration: 0.08, type: "sine", gain: 0.15 });
      tone({ freq: 400, duration: 0.08, type: "sine", gain: 0.15, delay: 0.08 });
      tone({ freq: 250, duration: 0.12, type: "sine", gain: 0.15, delay: 0.16 });
    },
    bingo() {
      // pequeño arpegio festivo
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => tone({ freq: f, duration: 0.35, type: "triangle", gain: 0.22, delay: i * 0.12 }));
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Sounds;
  } else {
    root.Sounds = Sounds;
  }
})(typeof window !== "undefined" ? window : globalThis);

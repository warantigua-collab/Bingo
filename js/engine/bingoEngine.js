/**
 * bingoEngine.js
 * Motor del Bingo — 75 bolas, sin repeticiones, con historial navegable.
 * Funciona en navegador (window.BingoEngine) y en Node (module.exports) para pruebas.
 */
(function (root) {
  "use strict";

  const LETTERS = ["B", "I", "N", "G", "O"];
  const RANGES = {
    B: [1, 15],
    I: [16, 30],
    N: [31, 45],
    G: [46, 60],
    O: [61, 75],
  };

  function letterFor(n) {
    if (n <= 15) return "B";
    if (n <= 30) return "I";
    if (n <= 45) return "N";
    if (n <= 60) return "G";
    return "O";
  }

  // Fisher-Yates shuffle
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function createEngine(options) {
    options = options || {};
    const rng = options.rng; // for deterministic testing

    let bag = []; // orden aleatorio de 1..75
    let pointer = -1; // índice de la última bola llamada dentro de bag
    let finished = false;

    function reset() {
      const all = [];
      for (let i = 1; i <= 75; i++) all.push(i);
      bag = shuffle(all, rng);
      pointer = -1;
      finished = false;
    }

    reset(); // estado inicial listo al crear

    function current() {
      if (pointer < 0) return null;
      const n = bag[pointer];
      return { number: n, letter: letterFor(n) };
    }

    function history() {
      return bag.slice(0, pointer + 1).map((n) => ({ number: n, letter: letterFor(n) }));
    }

    function remainingCount() {
      return bag.length - (pointer + 1);
    }

    function next() {
      if (finished) return current();
      if (pointer >= bag.length - 1) {
        finished = true;
        return current();
      }
      pointer += 1;
      if (pointer === bag.length - 1) finished = true;
      return current();
    }

    function previous() {
      if (pointer < 0) return null;
      pointer -= 1;
      finished = false;
      return current();
    }

    function isFinished() {
      return finished;
    }

    function calledSet() {
      return new Set(bag.slice(0, pointer + 1));
    }

    return {
      reset,
      next,
      previous,
      current,
      history,
      remainingCount,
      isFinished,
      calledSet,
      LETTERS,
      RANGES,
      letterFor,
    };
  }

  const BingoEngine = { createEngine, letterFor, LETTERS, RANGES, shuffle };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BingoEngine;
  } else {
    root.BingoEngine = BingoEngine;
  }
})(typeof window !== "undefined" ? window : globalThis);

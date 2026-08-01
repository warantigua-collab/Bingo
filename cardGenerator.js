/**
 * cardGenerator.js
 * Generador de cartones de Bingo 5x5 (B-I-N-G-O) con centro libre.
 * Funciona en navegador (window.CardGenerator) y en Node para pruebas.
 */
(function (root) {
  "use strict";

  const COLS = [
    { letter: "B", min: 1, max: 15 },
    { letter: "I", min: 16, max: 30 },
    { letter: "N", min: 31, max: 45 },
    { letter: "G", min: 46, max: 60 },
    { letter: "O", min: 61, max: 75 },
  ];

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function rangeArray(min, max) {
    const out = [];
    for (let i = min; i <= max; i++) out.push(i);
    return out;
  }

  // Genera un solo cartón: objeto { B:[5], I:[5], N:[5 con null en el centro], G:[5], O:[5] }
  function generateCard(options) {
    options = options || {};
    const rng = options.rng;
    const card = {};
    COLS.forEach((col) => {
      const pool = shuffle(rangeArray(col.min, col.max), rng);
      card[col.letter] = pool.slice(0, 5);
    });
    // Centro libre
    card.N[2] = null;
    return card;
  }

  // Convierte el cartón (por columnas) a filas para renderizar una tabla 5x5
  function toRows(card) {
    const rows = [];
    for (let r = 0; r < 5; r++) {
      rows.push(COLS.map((col) => card[col.letter][r]));
    }
    return rows;
  }

  // Genera un identificador corto y legible para el cartón (para control del anfitrión)
  function cardSerial(card, index) {
    const flat = COLS.map((c) => card[c.letter].map((n) => (n === null ? "FR" : n)).join("-")).join("_");
    let hash = 0;
    for (let i = 0; i < flat.length; i++) {
      hash = (hash * 31 + flat.charCodeAt(i)) >>> 0;
    }
    const code = hash.toString(36).toUpperCase().slice(0, 5);
    return `C${String(index + 1).padStart(3, "0")}-${code}`;
  }

  // Genera un lote de N cartones únicos (comparando su representación de filas)
  function generateBatch(count, options) {
    options = options || {};
    const rng = options.rng;
    const seen = new Set();
    const cards = [];
    let attempts = 0;
    const maxAttempts = count * 50 + 100;
    while (cards.length < count && attempts < maxAttempts) {
      attempts++;
      const card = generateCard({ rng });
      const key = COLS.map((c) => card[c.letter].join(",")).join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push(card);
    }
    return cards.map((card, i) => ({
      card,
      rows: toRows(card),
      serial: cardSerial(card, i),
    }));
  }

  // Verifica si un cartón tiene Bingo dado un conjunto de números llamados.
  // patterns: 'linea' (fila, columna o diagonal) o 'lleno' (cartón completo)
  function checkWin(card, calledSet, pattern) {
    pattern = pattern || "linea";
    const rows = toRows(card);
    const isMarked = (n) => n === null || calledSet.has(n);

    const rowsMarked = rows.map((row) => row.every(isMarked));
    const colsMarked = COLS.map((_, ci) => rows.every((row) => isMarked(row[ci])));
    const diag1 = rows.every((row, ri) => isMarked(row[ri]));
    const diag2 = rows.every((row, ri) => isMarked(row[4 - ri]));

    if (pattern === "lleno") {
      return rows.every((row) => row.every(isMarked));
    }

    return (
      rowsMarked.some(Boolean) || colsMarked.some(Boolean) || diag1 || diag2
    );
  }

  const CardGenerator = {
    COLS,
    generateCard,
    generateBatch,
    toRows,
    cardSerial,
    checkWin,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CardGenerator;
  } else {
    root.CardGenerator = CardGenerator;
  }
})(typeof window !== "undefined" ? window : globalThis);

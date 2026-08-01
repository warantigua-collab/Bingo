const assert = require("assert");
const BingoEngine = require("../js/engine/bingoEngine.js");
const CardGenerator = require("../js/print/cardGenerator.js");

let passed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("OK   -", name);
    passed++;
  } catch (e) {
    console.error("FAIL -", name, "\n     ", e.message);
    process.exitCode = 1;
  }
}

// ---------- BingoEngine ----------

check("el motor produce 75 números únicos entre 1 y 75", () => {
  const engine = BingoEngine.createEngine();
  const seen = new Set();
  let call;
  let count = 0;
  while (!engine.isFinished()) {
    call = engine.next();
    if (call) {
      assert.ok(call.number >= 1 && call.number <= 75, "número fuera de rango");
      assert.ok(!seen.has(call.number), "número repetido: " + call.number);
      seen.add(call.number);
      count++;
    }
    if (count > 200) throw new Error("bucle infinito detectado");
  }
  assert.strictEqual(seen.size, 75, "no se llamaron las 75 bolas");
});

check("las letras B-I-N-G-O corresponden a los rangos correctos", () => {
  assert.strictEqual(BingoEngine.letterFor(1), "B");
  assert.strictEqual(BingoEngine.letterFor(15), "B");
  assert.strictEqual(BingoEngine.letterFor(16), "I");
  assert.strictEqual(BingoEngine.letterFor(30), "I");
  assert.strictEqual(BingoEngine.letterFor(31), "N");
  assert.strictEqual(BingoEngine.letterFor(45), "N");
  assert.strictEqual(BingoEngine.letterFor(46), "G");
  assert.strictEqual(BingoEngine.letterFor(60), "G");
  assert.strictEqual(BingoEngine.letterFor(61), "O");
  assert.strictEqual(BingoEngine.letterFor(75), "O");
});

check("anterior/siguiente navegan el historial sin duplicar ni perder bolas", () => {
  const engine = BingoEngine.createEngine();
  engine.next();
  engine.next();
  const secondCall = engine.current();
  engine.previous();
  assert.strictEqual(engine.history().length, 1, "el historial debería tener 1 tras retroceder");
  const again = engine.next();
  assert.strictEqual(again.number, secondCall.number, "siguiente tras anterior debe repetir la misma bola");
});

check("reiniciar limpia el historial y permite un nuevo juego completo", () => {
  const engine = BingoEngine.createEngine();
  engine.next();
  engine.next();
  engine.reset();
  assert.strictEqual(engine.history().length, 0, "el historial debe estar vacío tras reiniciar");
  assert.strictEqual(engine.remainingCount(), 75);
});

check("next() no avanza más allá de la bola 75 (sin errores, sin repetidos)", () => {
  const engine = BingoEngine.createEngine();
  for (let i = 0; i < 75; i++) engine.next();
  const beforeExtra = engine.history().length;
  engine.next();
  engine.next();
  assert.strictEqual(engine.history().length, beforeExtra, "no debe seguir creciendo el historial");
  assert.ok(engine.isFinished());
});

// ---------- CardGenerator ----------

check("un cartón tiene 5 columnas de 5 números en su rango correcto, con centro libre", () => {
  const card = CardGenerator.generateCard();
  CardGenerator.COLS.forEach((col) => {
    const values = card[col.letter];
    assert.strictEqual(values.length, 5);
    values.forEach((v, idx) => {
      if (col.letter === "N" && idx === 2) {
        assert.strictEqual(v, null, "el centro de la columna N debe ser libre (null)");
        return;
      }
      assert.ok(v >= col.min && v <= col.max, `valor ${v} fuera de rango para ${col.letter}`);
    });
    const nonNull = values.filter((v) => v !== null);
    assert.strictEqual(new Set(nonNull).size, nonNull.length, "números repetidos dentro de una columna");
  });
});

check("generateBatch produce cartones únicos", () => {
  const batch = CardGenerator.generateBatch(30);
  assert.strictEqual(batch.length, 30, "deben generarse los 30 cartones solicitados");
  const keys = batch.map((b) => JSON.stringify(b.rows));
  assert.strictEqual(new Set(keys).size, keys.length, "hay cartones duplicados en el lote");
  const serials = batch.map((b) => b.serial);
  assert.strictEqual(new Set(serials).size, serials.length, "hay números de serie duplicados");
});

check("checkWin detecta línea horizontal ganadora", () => {
  const card = CardGenerator.generateCard();
  const rows = CardGenerator.toRows(card);
  const winningRow = rows[0]; // fila 0
  const calledSet = new Set(winningRow.filter((n) => n !== null));
  assert.ok(CardGenerator.checkWin(card, calledSet, "linea"), "debería detectar bingo de línea");
});

check("checkWin no da falso positivo con números insuficientes", () => {
  const card = CardGenerator.generateCard();
  const calledSet = new Set([card.B[0]]);
  assert.strictEqual(CardGenerator.checkWin(card, calledSet, "linea"), false);
});

check("checkWin 'lleno' exige el cartón completo", () => {
  const card = CardGenerator.generateCard();
  const rows = CardGenerator.toRows(card);
  const allNums = rows.flat().filter((n) => n !== null);
  const almost = new Set(allNums.slice(0, allNums.length - 1));
  assert.strictEqual(CardGenerator.checkWin(card, almost, "lleno"), false);
  const full = new Set(allNums);
  assert.strictEqual(CardGenerator.checkWin(card, full, "lleno"), true);
});

console.log(`\n${passed} pruebas pasadas.`);

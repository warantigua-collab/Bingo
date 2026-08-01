const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

function loadPage(htmlFile, scripts) {
  const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");
  const dom = new JSDOM(html, {
    url: "http://localhost/" + htmlFile,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });

  // jsdom no implementa AudioContext ni window.print(); los simulamos.
  dom.window.AudioContext = function () {
    return {
      state: "running",
      currentTime: 0,
      resume() {},
      createOscillator() {
        return {
          type: "sine",
          frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} },
          connect() { return this; },
          start() {},
          stop() {},
        };
      },
      createGain() {
        return {
          gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() { return this; },
        };
      },
      destination: {},
    };
  };
  dom.window.print = () => {};
  dom.window.confirm = () => true;
  dom.window.scrollTo = () => {};

  scripts.forEach((rel) => {
    const code = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
    dom.window.eval(code);
  });

  return dom;
}

let passed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("OK   -", name);
    passed++;
  } catch (e) {
    console.error("FAIL -", name, "\n     ", e.stack || e.message);
    process.exitCode = 1;
  }
}

// ---------------- juego.html ----------------
check("juego.html: 'Siguiente' llama una bola y actualiza el DOM", () => {
  const dom = loadPage("juego.html", [
    "js/engine/bingoEngine.js",
    "js/audio/audio.js",
    "js/ui/confetti.js",
    "js/ui/juego.js",
  ]);
  const { document } = dom.window;
  const btnSiguiente = document.getElementById("btnSiguiente");
  btnSiguiente.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const numero = document.getElementById("bolaNumero").textContent;
  if (numero === "—") throw new Error("la bola no se actualizó tras 'Siguiente'");
  const historial = document.querySelectorAll("#historial .chip-numero");
  if (historial.length !== 1) throw new Error("el historial debería tener 1 chip");
});

check("juego.html: jugar la partida completa (75 clics) no lanza errores ni duplica", () => {
  const dom = loadPage("juego.html", [
    "js/engine/bingoEngine.js",
    "js/audio/audio.js",
    "js/ui/confetti.js",
    "js/ui/juego.js",
  ]);
  const { document } = dom.window;
  const btnSiguiente = document.getElementById("btnSiguiente");
  for (let i = 0; i < 80; i++) {
    btnSiguiente.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  }
  const chips = Array.from(document.querySelectorAll("#historial .chip-numero")).map((c) => c.textContent);
  if (chips.length !== 75) throw new Error("deberían llamarse exactamente 75 bolas, hubo " + chips.length);
  if (new Set(chips).size !== 75) throw new Error("hay bolas repetidas en el historial");
  if (!document.getElementById("btnSiguiente").disabled) throw new Error("Siguiente debería deshabilitarse al terminar");
});

check("juego.html: 'Anterior' retrocede sin perder sincronía con la tabla de referencia", () => {
  const dom = loadPage("juego.html", [
    "js/engine/bingoEngine.js",
    "js/audio/audio.js",
    "js/ui/confetti.js",
    "js/ui/juego.js",
  ]);
  const { document } = dom.window;
  const btnSiguiente = document.getElementById("btnSiguiente");
  const btnAnterior = document.getElementById("btnAnterior");
  btnSiguiente.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  btnSiguiente.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const segundoNumero = document.getElementById("bolaNumero").textContent;
  btnAnterior.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const llamadosActuales = document.querySelectorAll("#tablaReferencia .numero-ref.llamado").length;
  if (llamadosActuales !== 1) throw new Error("tras retroceder debería quedar solo 1 número marcado como llamado");
  btnSiguiente.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const numeroRepetido = document.getElementById("bolaNumero").textContent;
  if (numeroRepetido !== segundoNumero) throw new Error("siguiente tras anterior debería repetir la misma bola");
});

check("juego.html: 'Declarar Ganador' muestra la pantalla de celebración", () => {
  const dom = loadPage("juego.html", [
    "js/engine/bingoEngine.js",
    "js/audio/audio.js",
    "js/ui/confetti.js",
    "js/ui/juego.js",
  ]);
  const { document } = dom.window;
  document.getElementById("btnGanador").dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const pantalla = document.getElementById("pantallaGanador");
  if (pantalla.hidden) throw new Error("la pantalla de ganador debería mostrarse");
  const piezasConfeti = document.querySelectorAll(".confeti-pieza").length;
  if (piezasConfeti === 0) throw new Error("debería haberse generado confeti");
  document.getElementById("btnCerrarGanador").dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  if (!pantalla.hidden) throw new Error("la pantalla de ganador debería poder cerrarse");
});

check("juego.html: 'Reiniciar' limpia historial y reactiva 'Siguiente'", () => {
  const dom = loadPage("juego.html", [
    "js/engine/bingoEngine.js",
    "js/audio/audio.js",
    "js/ui/confetti.js",
    "js/ui/juego.js",
  ]);
  const { document } = dom.window;
  const btnSiguiente = document.getElementById("btnSiguiente");
  for (let i = 0; i < 76; i++) btnSiguiente.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  document.getElementById("btnReiniciar").dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const chips = document.querySelectorAll("#historial .chip-numero");
  if (chips.length !== 0) throw new Error("el historial debería vaciarse tras reiniciar");
  if (document.getElementById("btnSiguiente").disabled) throw new Error("Siguiente debería reactivarse tras reiniciar");
});

// ---------------- imprimir.html ----------------
check("imprimir.html: genera cartones automáticamente al cargar (4 por hoja, 12 cartones)", () => {
  const dom = loadPage("imprimir.html", ["js/print/cardGenerator.js", "js/print/print.js"]);
  const { document } = dom.window;
  const cartones = document.querySelectorAll(".carton");
  if (cartones.length !== 12) throw new Error("deberían generarse 12 cartones por defecto, hubo " + cartones.length);
  const hojas = document.querySelectorAll(".hoja-cartones");
  if (hojas.length !== 3) throw new Error("12 cartones a 4 por hoja deberían ser 3 hojas, hubo " + hojas.length);
});

check("imprimir.html: cambiar cantidad y distribución regenera correctamente", () => {
  const dom = loadPage("imprimir.html", ["js/print/cardGenerator.js", "js/print/print.js"]);
  const { document } = dom.window;
  document.getElementById("cantidad").value = "7";
  document.getElementById("porHoja").value = "2";
  document.getElementById("btnGenerar").dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const cartones = document.querySelectorAll(".carton");
  if (cartones.length !== 7) throw new Error("deberían generarse 7 cartones, hubo " + cartones.length);
  const hojas = document.querySelectorAll(".hoja-cartones");
  if (hojas.length !== 4) throw new Error("7 cartones a 2 por hoja deberían ser 4 hojas, hubo " + hojas.length);
});

check("imprimir.html: cada cartón impreso tiene 5x5 celdas con LIBRE en el centro", () => {
  const dom = loadPage("imprimir.html", ["js/print/cardGenerator.js", "js/print/print.js"]);
  const { document } = dom.window;
  const primerCarton = document.querySelector(".carton");
  const celdas = primerCarton.querySelectorAll("tbody td");
  if (celdas.length !== 25) throw new Error("cada cartón debe tener 25 celdas, hubo " + celdas.length);
  const libres = primerCarton.querySelectorAll("td.libre");
  if (libres.length !== 1) throw new Error("debe haber exactamente una celda LIBRE");
});

check("imprimir.html: cambiar formato A4 actualiza la regla @page", () => {
  const dom = loadPage("imprimir.html", ["js/print/cardGenerator.js", "js/print/print.js"]);
  const { document } = dom.window;
  document.getElementById("formato").value = "a4";
  document.getElementById("formato").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  const texto = document.getElementById("tamanoPagina").textContent;
  if (!texto.includes("a4")) throw new Error("la hoja de estilo @page debería indicar a4");
});

console.log(`\n${passed} pruebas de humo pasadas.`);

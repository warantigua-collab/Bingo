/**
 * juego.js — Controlador de la pantalla del anfitrión.
 * Une bingoEngine.js (lógica) con el DOM, audio.js y confetti.js.
 */
(function () {
  "use strict";

  const engine = BingoEngine.createEngine();

  const el = {
    bola: document.getElementById("bolaActual"),
    bolaLetra: document.getElementById("bolaLetra"),
    bolaNumero: document.getElementById("bolaNumero"),
    frase: document.getElementById("fraseLlamado"),
    contador: document.getElementById("contadorRestantes"),
    btnAnterior: document.getElementById("btnAnterior"),
    btnSiguiente: document.getElementById("btnSiguiente"),
    btnAutoplay: document.getElementById("btnAutoplay"),
    btnReiniciar: document.getElementById("btnReiniciar"),
    btnFinalizar: document.getElementById("btnFinalizar"),
    btnGanador: document.getElementById("btnGanador"),
    velocidad: document.getElementById("velocidad"),
    sonido: document.getElementById("sonido"),
    altoContraste: document.getElementById("altoContraste"),
    tablaReferencia: document.getElementById("tablaReferencia"),
    historial: document.getElementById("historial"),
    pantallaGanador: document.getElementById("pantallaGanador"),
    btnCerrarGanador: document.getElementById("btnCerrarGanador"),
    btnNuevaPartidaGanador: document.getElementById("btnNuevaPartidaGanador"),
  };

  let autoplayTimer = null;
  let finalizado = false;

  // ---- Construir la tabla de referencia (1..75) una sola vez ----
  function construirTablaReferencia() {
    el.tablaReferencia.innerHTML = "";
    BingoEngine.LETTERS.forEach((letra) => {
      const [min, max] = BingoEngine.RANGES[letra];
      const columna = document.createElement("div");
      columna.className = "columna-letra";

      const titulo = document.createElement("div");
      titulo.className = `columna-letra__titulo columna-letra__titulo--${letra}`;
      titulo.textContent = letra;
      columna.appendChild(titulo);

      for (let n = min; n <= max; n++) {
        const casilla = document.createElement("div");
        casilla.className = "numero-ref";
        casilla.dataset.numero = String(n);
        casilla.textContent = n;
        columna.appendChild(casilla);
      }
      el.tablaReferencia.appendChild(columna);
    });
  }

  function actualizarTablaReferencia() {
    const llamados = engine.calledSet();
    const actual = engine.current();
    const casillas = el.tablaReferencia.querySelectorAll(".numero-ref");
    casillas.forEach((c) => {
      const n = Number(c.dataset.numero);
      c.classList.toggle("llamado", llamados.has(n));
      c.classList.toggle("actual", !!actual && actual.number === n);
    });
  }

  function actualizarHistorial() {
    const hist = engine.history();
    if (hist.length === 0) {
      el.historial.innerHTML = '<span class="contador-restantes">Aún no se ha llamado ninguna bola.</span>';
      return;
    }
    el.historial.innerHTML = "";
    hist
      .slice()
      .reverse()
      .forEach((h) => {
        const chip = document.createElement("span");
        chip.className = "chip-numero";
        chip.textContent = `${h.letter}-${h.number}`;
        el.historial.appendChild(chip);
      });
  }

  function actualizarBola(animar) {
    const actual = engine.current();
    el.bola.classList.remove("rebote");
    if (!actual) {
      el.bola.className = "bola-actual bola-actual--vacia";
      el.bolaLetra.textContent = "\u00A0";
      el.bolaNumero.textContent = "—";
      el.frase.textContent = finalizado ? "Partida finalizada." : 'Presiona "Siguiente" para comenzar';
    } else {
      el.bola.className = `bola-actual bola-actual--${actual.letter}`;
      el.bolaLetra.textContent = actual.letter;
      el.bolaNumero.textContent = String(actual.number);
      el.frase.textContent = `${actual.letter} - ${actual.number}`;
      if (animar) {
        // fuerza el reinicio de la animación
        void el.bola.offsetWidth;
        el.bola.classList.add("rebote");
      }
    }
    el.contador.textContent = finalizado
      ? "Partida finalizada"
      : `${engine.remainingCount()} bola${engine.remainingCount() === 1 ? "" : "s"} por llamar`;
  }

  function actualizarControles() {
    const hist = engine.history();
    el.btnAnterior.disabled = hist.length === 0 || finalizado;
    el.btnSiguiente.disabled = engine.isFinished() || finalizado;
    el.btnAutoplay.disabled = engine.isFinished() || finalizado;
  }

  function refrescarTodo(animar) {
    actualizarBola(animar);
    actualizarTablaReferencia();
    actualizarHistorial();
    actualizarControles();
  }

  function detenerAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
      el.btnAutoplay.textContent = "▶ Reproducir";
    }
  }

  function reproducirSonido(nombre) {
    if (!el.sonido.checked) return;
    try {
      Sounds[nombre]();
    } catch (e) {
      /* silencioso: el audio nunca debe romper el juego */
    }
  }

  // ---- Acciones ----

  function irSiguiente() {
    if (finalizado || engine.isFinished()) return;
    engine.next();
    reproducirSonido("ballCall");
    refrescarTodo(true);
    if (engine.isFinished()) {
      detenerAutoplay();
    }
  }

  function irAnterior() {
    if (finalizado) return;
    detenerAutoplay();
    engine.previous();
    reproducirSonido("click");
    refrescarTodo(false);
  }

  function alternarAutoplay() {
    if (finalizado) return;
    if (autoplayTimer) {
      detenerAutoplay();
      reproducirSonido("pause");
      return;
    }
    reproducirSonido("resume");
    el.btnAutoplay.textContent = "⏸ Pausar";
    const intervalo = Number(el.velocidad.value);
    autoplayTimer = setInterval(() => {
      if (engine.isFinished() || finalizado) {
        detenerAutoplay();
        return;
      }
      irSiguiente();
    }, intervalo);
  }

  function reiniciar() {
    const hist = engine.history();
    if (hist.length > 0) {
      const confirmado = window.confirm("¿Reiniciar la partida? Se perderá el historial de llamados actual.");
      if (!confirmado) return;
    }
    detenerAutoplay();
    finalizado = false;
    engine.reset();
    reproducirSonido("reset");
    refrescarTodo(false);
  }

  function finalizar() {
    if (finalizado) return;
    detenerAutoplay();
    finalizado = true;
    refrescarTodo(false);
  }

  function declararGanador() {
    detenerAutoplay();
    reproducirSonido("bingo");
    Confeti.lanzarConfeti(90);
    el.pantallaGanador.hidden = false;
    el.btnCerrarGanador.focus();
  }

  function cerrarGanador() {
    el.pantallaGanador.hidden = true;
    el.btnGanador.focus();
  }

  function nuevaPartidaDesdeGanador() {
    el.pantallaGanador.hidden = true;
    finalizado = false;
    engine.reset();
    reproducirSonido("reset");
    refrescarTodo(false);
  }

  // ---- Eventos ----
  el.btnSiguiente.addEventListener("click", irSiguiente);
  el.btnAnterior.addEventListener("click", irAnterior);
  el.btnAutoplay.addEventListener("click", alternarAutoplay);
  el.btnReiniciar.addEventListener("click", reiniciar);
  el.btnFinalizar.addEventListener("click", finalizar);
  el.btnGanador.addEventListener("click", declararGanador);
  el.btnCerrarGanador.addEventListener("click", cerrarGanador);
  el.btnNuevaPartidaGanador.addEventListener("click", nuevaPartidaDesdeGanador);

  el.velocidad.addEventListener("change", () => {
    if (autoplayTimer) {
      detenerAutoplay();
      alternarAutoplay();
    }
  });

  el.altoContraste.addEventListener("change", () => {
    document.body.classList.toggle("alto-contraste", el.altoContraste.checked);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
    if (e.code === "Space" || e.key === "ArrowRight") {
      e.preventDefault();
      irSiguiente();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      irAnterior();
    }
  });

  window.addEventListener("beforeunload", (e) => {
    if (engine.history().length > 0 && !finalizado) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // ---- Inicio ----
  construirTablaReferencia();
  refrescarTodo(false);
})();

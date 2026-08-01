/**
 * confetti.js — Efecto de confeti con divs + CSS, sin canvas ni librerías.
 */
(function (root) {
  "use strict";

  const COLORES = ["#c0392b", "#14919b", "#1b3a6b", "#f2b705", "#1e8a6e", "#6b2d75"];

  function lanzarConfeti(cantidad) {
    cantidad = cantidad || 80;
    const frag = document.createDocumentFragment();
    const piezas = [];
    for (let i = 0; i < cantidad; i++) {
      const pieza = document.createElement("div");
      pieza.className = "confeti-pieza";
      const izquierda = Math.random() * 100;
      const duracion = 2.2 + Math.random() * 1.8;
      const retraso = Math.random() * 0.6;
      const color = COLORES[Math.floor(Math.random() * COLORES.length)];
      pieza.style.left = izquierda + "vw";
      pieza.style.background = color;
      pieza.style.animationDuration = duracion + "s";
      pieza.style.animationDelay = retraso + "s";
      pieza.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      frag.appendChild(pieza);
      piezas.push(pieza);
    }
    document.body.appendChild(frag);
    setTimeout(() => {
      piezas.forEach((p) => p.remove());
    }, 4500);
  }

  const Confeti = { lanzarConfeti };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Confeti;
  } else {
    root.Confeti = Confeti;
  }
})(typeof window !== "undefined" ? window : globalThis);

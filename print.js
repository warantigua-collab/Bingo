/**
 * print.js — Controlador de la página "Imprimir Cartones".
 * Usa cardGenerator.js para generar los cartones y arma las hojas de impresión.
 */
(function () {
  "use strict";

  const el = {
    cantidad: document.getElementById("cantidad"),
    formato: document.getElementById("formato"),
    porHoja: document.getElementById("porHoja"),
    btnGenerar: document.getElementById("btnGenerar"),
    btnImprimir: document.getElementById("btnImprimir"),
    resumen: document.getElementById("resumen"),
    vistaPrevia: document.getElementById("vistaPrevia"),
    tamanoPagina: document.getElementById("tamanoPagina"),
  };

  const LETRAS = ["B", "I", "N", "G", "O"];

  function actualizarTamanoPagina() {
    const size = el.formato.value === "a4" ? "a4" : "letter";
    el.tamanoPagina.textContent = `@page { size: ${size}; margin: 0.4in; }`;
  }

  function renderCarton(entry) {
    const { rows, serial } = entry;
    const carton = document.createElement("div");
    carton.className = "carton";

    const cabecera = document.createElement("div");
    cabecera.className = "carton__cabecera";
    cabecera.innerHTML = `<span class="carton__titulo">BINGO FAMILIAR</span><span class="carton__serial">${serial}</span>`;
    carton.appendChild(cabecera);

    const tabla = document.createElement("table");
    const thead = document.createElement("thead");
    const filaEncabezado = document.createElement("tr");
    LETRAS.forEach((l) => {
      const th = document.createElement("th");
      th.textContent = l;
      filaEncabezado.appendChild(th);
    });
    thead.appendChild(filaEncabezado);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((valor) => {
        const td = document.createElement("td");
        if (valor === null) {
          td.textContent = "LIBRE";
          td.className = "libre";
        } else {
          td.textContent = valor;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);
    carton.appendChild(tabla);

    return carton;
  }

  function generarYRenderizar() {
    const cantidad = Math.max(1, Math.min(200, Number(el.cantidad.value) || 1));
    const porHoja = Number(el.porHoja.value);
    el.cantidad.value = cantidad;

    const batch = CardGenerator.generateBatch(cantidad);

    el.vistaPrevia.innerHTML = "";
    let hojaActual = null;

    batch.forEach((entry, idx) => {
      if (idx % porHoja === 0) {
        hojaActual = document.createElement("div");
        hojaActual.className = "hoja-cartones";
        hojaActual.dataset.porHoja = String(porHoja);
        el.vistaPrevia.appendChild(hojaActual);
      }
      hojaActual.appendChild(renderCarton(entry));
    });

    const totalHojas = Math.ceil(batch.length / porHoja);
    el.resumen.textContent = `${batch.length} cartón${batch.length === 1 ? "" : "es"} generado${batch.length === 1 ? "" : "s"} en ${totalHojas} hoja${totalHojas === 1 ? "" : "s"}.`;
  }

  el.btnGenerar.addEventListener("click", generarYRenderizar);
  el.btnImprimir.addEventListener("click", () => {
    if (!el.vistaPrevia.children.length) {
      generarYRenderizar();
    }
    window.print();
  });
  el.formato.addEventListener("change", actualizarTamanoPagina);

  actualizarTamanoPagina();
  generarYRenderizar();
})();

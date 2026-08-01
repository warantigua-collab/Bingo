# Bingo Familiar en Español

Bingo tradicional de 75 bolas (B-I-N-G-O) para jugar en familia. Un anfitrión
llama los números desde un dispositivo; los jugadores usan cartones impresos
y marcadores físicos. Sin cuentas, sin base de datos, sin apuestas.

Basado en `Software_Design_Bible_Bingo_Familiar_v1.md`.

## Estructura del proyecto

```
bingo-familiar/
├── index.html              Inicio / menú principal
├── juego.html               Pantalla del anfitrión (llamador)
├── imprimir.html             Generador e impresión de cartones
├── ayuda.html                Reglas y preguntas frecuentes
├── css/
│   └── styles.css            Sistema de diseño completo (colores, tipografía,
│                              componentes, banda textil, impresión, responsive)
├── js/
│   ├── engine/
│   │   └── bingoEngine.js    Motor: sorteo sin repeticiones, historial, navegación
│   ├── print/
│   │   ├── cardGenerator.js  Generador de cartones 5x5 + verificación de bingo
│   │   └── print.js          Controlador de la página de impresión
│   ├── audio/
│   │   └── audio.js          Sonidos sintetizados con Web Audio API (sin archivos .mp3)
│   └── ui/
│       ├── juego.js          Controlador de la pantalla de juego
│       └── confetti.js       Efecto de confeti para la pantalla de ganador
├── test/
│   ├── logic.test.js         Pruebas del motor y del generador de cartones (Node)
│   └── smoke.test.js         Pruebas de humo sobre el DOM real con jsdom
├── package.json
└── .gitignore
```

Ningún archivo de audio o imagen externo es necesario: los sonidos se
sintetizan en el navegador y el motivo textil (la franja de colores tipo
tejido) se genera con CSS puro.

## Cómo funciona

- **`js/engine/bingoEngine.js`** — Lógica pura, sin DOM. Baraja el 1-75 una
  vez por partida y expone `next()`, `previous()`, `reset()`, `history()`,
  etc. Se puede probar directamente en Node.
- **`js/print/cardGenerator.js`** — Lógica pura para generar cartones 5x5 con
  centro libre, en lotes garantizados sin duplicados, y verificar patrones
  ganadores (línea o cartón lleno).
- Los controladores de UI (`juego.js`, `print.js`) conectan esa lógica con el
  DOM y son los únicos archivos que tocan `document`.

## Ejecutar localmente

No requiere build ni instalación para usarse: es HTML/CSS/JS estático.

```bash
# Opción 1: abrir index.html directamente en el navegador
# Opción 2: servirlo con un servidor local
npm run start
# abre http://localhost:8080
```

## Pruebas

```bash
npm install    # instala jsdom (solo dependencia de desarrollo, para pruebas)
npm test
```

Esto ejecuta:
1. `test/logic.test.js` — 10 pruebas del motor y del generador de cartones
   (sin repeticiones, rangos correctos, navegación anterior/siguiente,
   cartones únicos, detección de bingo).
2. `test/smoke.test.js` — 9 pruebas de humo que cargan `juego.html` e
   `imprimir.html` en jsdom y simulan una partida completa (75 clics en
   "Siguiente"), retrocesos, reinicios, declarar ganador, y generación de
   hojas de impresión.

## Publicar en GitHub Pages

1. Sube este repositorio a GitHub.
2. En **Settings → Pages**, selecciona la rama principal y la carpeta raíz (`/`).
3. El sitio quedará disponible en `https://<usuario>.github.io/<repositorio>/`.

No hay variables de entorno ni claves que configurar.

## Notas de diseño

- Paleta inspirada en textiles guatemaltecos (rojo tejido, turquesa, azul
  profundo, amarillo maíz, verde jade, morado) sobre fondo marfil.
- Tipografía: Fredoka (títulos) + Nunito Sans (texto), cargadas desde Google
  Fonts — con reserva a fuentes del sistema si no hay conexión.
- El elemento de firma visual es la **banda textil**: un patrón de zigzag
  generado enteramente con CSS (`repeating`/`linear-gradient`), usado como
  cabecera y como marco de la pantalla de ganador.
- Accesibilidad: navegación por teclado (flechas para Siguiente/Anterior en
  la pantalla de juego), tamaños de texto grandes, modo de alto contraste,
  y respeto a `prefers-reduced-motion`.

## Próximos pasos sugeridos

- v1.1: temas visuales alternativos.
- v1.2: más idiomas (inglés).
- v2.0: modo anfitrión remoto, estadísticas, variantes de Bingo.

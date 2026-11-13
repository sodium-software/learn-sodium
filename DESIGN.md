# Diseño: «Viñetas» (novela gráfica)

Lo eligieron el fundador y Mariana el 2026-11-12 para un público adolescente (nivel B1). Reemplaza al «Fanzine», que a Mariana no le gustó, y conserva la estructura de su portada. El sitio es una página de cómic: cada bloque es una viñeta con borde de tinta, los títulos van en cartelas amarillas y las frases reales de las historias en globos de diálogo.

## Reglas
- **Color:**
  - Papel `#f3f3ef`, hoja `#ffffff` y tinta `#121212`.
  - Colores de impresión: rojo `#ff4a36`, siempre con texto en tinta, y amarillo `#ffd23f`.
  - Azul `#1f5fd0` y verde `#157a42` marcan solo secciones (Storytale y Activities).
  - Para texto en rojo se usa `--color-red-deep`.
- **Tipografía:** Archivo Black (900 y 700) para los títulos, en mayúsculas. Atkinson Hyperlegible Next para el texto, con el cuerpo a 18 px. Las dos tienen licencia SIL OFL 1.1.
- **Piezas del mundo:**
  - `.panel`: viñeta con borde de 3 px.
  - `.strip`: cartela amarilla con contorno.
  - `.balloon`: globo de diálogo; es lo único redondo.
  - `.xerox`: foto con trama de puntos sobre un color de impresión.
  - `.hl` y `.hl-strong`: marcador.
- **Fotos:** son de archivo, con licencia abierta y crédito en el pie. Están en `public/media/zine/` y sus créditos en `credits.json`. Solo las fotos decorativas se inclinan, y como mucho 2°.
- **Accesibilidad:** controles de 48 px (`scripts/check-targets.mjs`) y contraste AA (`scripts/check-contrast.mjs`).
- **Movimiento:**
  - La foto de la canción se abre como una persiana (`.shutter`).
  - Las secciones entran al hacer scroll (`.reveal`).
  - Las viñetas se elevan al pasar el ratón.
  - En «Build the word», una letra equivocada tiembla.
  - Con `prefers-reduced-motion` no hay recorrido.

## Portada (`HomeView`)
1. **Página de cómic:** la viñeta roja lleva el título, y las cuatro viñetas de formato llevan foto y globos con frases reales de las piezas. Debajo, una cartela con el nivel B1.
2. **"Every word, in print":** video en bucle de una imprenta y tiras con fragmentos reales de los guiones.
3. **Escalera de uso:** watch, read, try, tell.
4. **"What is inside":** la lista de piezas.
5. **"Practise here":** el juego «Build the word», con vocabulario B1.
6. **"About this guide":** texto largo con marcador.
7. **Pie:** el nombre construido con bloques de color, más los créditos de las fotos.

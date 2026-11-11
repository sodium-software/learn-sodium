# Diseño: «La puerta de la nevera»

La dirección la eligió el fundador el 2026-11-11, entre tres propuestas. El sitio es la puerta de la nevera de casa: el suelo es de esmalte claro, cada pieza es un papel sujeto con un imán y el nombre está hecho de letras-imán de plástico.

## Reglas
- **Color:**
  - Esmalte `#eef1ee` como suelo.
  - Papel `#ffffff`.
  - Tinta `#1b1d24`.
  - Cuatro plásticos y su canto oscuro: rojo `#d42a2f`/`#9d1b1f`, azul `#1f5fd0`/`#143f8e`, verde `#157a42`/`#11633a` y amarillo `#f4b400`/`#b98700`.
  - La acción va en azul.
  - Cada sección tiene su color: Canciones rojo, Historias azul, Podcast amarillo, Cortometrajes tinta y Actividades verde.
- **Tipografía:** Baloo 2 (700 y 800) para títulos y letras-imán; Andika (400 y 700) para leer. Las dos tienen licencia SIL OFL 1.1 y se instalan con `@fontsource`. El texto corrido nunca baja de 17 px, y el cuerpo va a 19 px con interlineado de 1,6.
- **Retícula firme:** solo los papeles decorativos se inclinan, y como mucho 2° (`.tilt-l` y `.tilt-r`). Los controles y el texto de lectura van siempre rectos.
- **Superficies:** se separan por el tono, sin líneas ni sombras en reposo. Las líneas quedan solo en los campos de formulario, y las sombras solo en lo que flota (menús).
- **Controles:** botones de plástico redondo (`.btn`) de 48 px como mínimo. Los deslizadores tienen 48 px de alto y un tirador de 28 px. Lo comprueba `node scripts/check-targets.mjs`.
- **Contraste:** AA en todo el texto. Lo comprueba `node scripts/check-contrast.mjs`.
- **Ilustración:** SVG original de trazo grueso con rellenos planos, en `src/components/Drawings.tsx`. Si una pieza no trae portada, se muestra el dibujo de su sección (`Cover`).
- **Movimiento:**
  - Las letras-imán del nombre caen y se pegan al cargar la portada (`.animate-stick`).
  - Las partes de la portada y de las cabeceras entran subiendo (`.animate-rise`).
  - Los papeles se elevan un poco al pasar el ratón.
  - En «Arma la palabra», una letra equivocada tiembla.
  - Con `prefers-reduced-motion` todo queda en su sitio, sin recorrido.
- **Lo pendiente se ve como hueco:** las letras que faltan en «Arma la palabra» y el progreso de las actividades.

## Piezas
- `SiteHeader`: muestra las secciones del niño y agrupa en «Para adultos» la introducción, la biodata y los ajustes. En pantallas estrechas usa un menú. Incluye `MagnetWord` y `Brand` (cinco toques abren el juego oculto).
- `SectionHeader`: la cabecera de cada sección, en su color y con su dibujo.
- `WordGame`: «Arma la palabra». Solo usa la voz del navegador si es local, para que nada salga del dispositivo.
- `Cover`, `Drawings` y `sections.ts`.
- El panel (`/admin`) hereda los tokens y conserva su estructura de herramienta.

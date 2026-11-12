# Diseño: «Fanzine»

La dirección la eligió el fundador el 2026-11-11 para un público adolescente (nivel B1). Reemplaza a «La puerta de la nevera», que estaba pensada para niños de 6 a 9 años. La guía se presenta como un fanzine hecho por las autoras: papel fotocopiado, tóner, titulares recortados en tiras, cinta adhesiva y trama de fotocopia.

## Reglas
- **Color:**
  - Papel `#ebebe6` y hoja `#fafafa`.
  - Tóner `#141414`.
  - Los cuatro colores anteriores siguen como marcador, cinta y trama, porque Mariana pidió conservarlos: rojo `#d42a2f`, azul `#1f5fd0`, verde `#157a42` y amarillo `#f4b400`, cada uno con su tono oscuro.
  - La acción es una tira de tóner (botón negro).
  - Cada sección tiene su color: Song rojo, Storytale azul, Podcast amarillo, Short film tóner y Activities verde.
- **Tipografía:** Anton para los titulares, en mayúsculas y recortados en tiras (`.strip`). Space Grotesk para el texto, con el cuerpo a 18 px. Las dos tienen licencia SIL OFL 1.1 y se instalan con `@fontsource`.
- **Papel cortado:** sin radios, sin sombras en reposo y sin degradados. La trama (`.halftone`) es una textura de puntos, no un degradado.
- **Inclinación:** solo la cinta y el nombre se inclinan, y como mucho 2°. Los controles y el texto de lectura van siempre rectos.
- **Accesibilidad:** controles de 48 px (`scripts/check-targets.mjs`) y contraste AA (`scripts/check-contrast.mjs`).
- **Movimiento:**
  - Las tiras del titular se pegan al cargar (`.animate-stick`).
  - Las secciones, tarjetas y titulares entran al hacer scroll (`.reveal`, lo activa AppShell).
  - Las hojas se elevan al pasar el ratón.
  - En «Build the word», una letra equivocada tiembla.
  - Con `prefers-reduced-motion` no hay recorrido.
- **Tono:** inglés B1 para adolescentes. Nada infantil.

## Piezas
- `SiteHeader`: muestra `Wordmark` (la tira con el nombre) y las secciones. «About» agrupa Introduction, Bio y Settings.
- `SectionHeader`: la cabecera de cada sección, una hoja del color de la sección con el titular recortado y la trama.
- `Cover`: si una pieza no tiene portada, muestra la trama de su sección con su nombre.
- `WordGame` («Build the word»): vocabulario B1 abstracto, con una definición en inglés como pista.
- `sections.ts`: colores, nombres y trama de cada sección.
- El panel (`/admin`) hereda los tokens y conserva su estructura de herramienta.

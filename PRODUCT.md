# Product

<!-- impeccable:product-schema 1 -->

<!-- Fuente: brief de misión del fundador (2026-11-11). Sin ronda de entrevista aparte; se confirma en la compuerta de diseño. -->

## Platform

web

## Users

- **Adolescentes colombianos que aprenden inglés como lengua extranjera** en colegios públicos y privados. Nivel probable A2–B1: el grupo lo fija y debe mantenerlo en todas las piezas. Lo usan en clase o en casa, sobre todo desde el móvil. Ven videos, escuchan, leen y hacen actividades.
- **La profesora del curso y los compañeros**, que evalúan el sitio en la defensa oral (19, 23 y 26 de noviembre de 2026) según la guía `2026-2Project_Guide_Weeks12_17.pdf`.
- **Mariana y su grupo**, profesoras en formación (Licenciatura en Español y Lenguas Extranjeras), que cargan el contenido desde el panel.

## Product Purpose

La Cartilla es la guía didáctica web del proyecto de *digital storytelling* del grupo. Reúne cuatro historias en cuatro formatos (canción en MP3, podcast en video, cortometraje sin diálogo y storytale), cada una con su transcripción y cuatro actividades comunicativas, más la introducción (que cita a dos autores) y la biografía de las autoras. Éxito: un adolescente quiere ver las historias y hacer las actividades, y la profesora ve un sitio cuidado que cumple la guía.

## Positioning

Un proyecto pequeño y de autor, hecho por una estudiante de pedagogía, sin cuentas, sin analítica y sin publicidad. Su nombre viene de la cartilla escolar con la que los niños aprenden a leer.

## Operating Context

- Contenido en JSON publicado desde el panel, servido por Cloudflare Pages Functions con D1 y R2. Si la API falla, el sitio usa la caché local y luego un snapshot incluido en el build.
- Existe una copia estática que funciona sin servidor (`file://`).
- El progreso y el nombre del estudiante viven solo en localStorage.

## Capabilities and Constraints

- Rutas: `/`, `/introduccion`, `/biodata`, `/song`, `/storytelling`, `/podcast`, `/short-film`, `/activities` (cada una con su detalle `/:id`), `/settings`, `/admin/*` y `/juego` (juego oculto, se activa desde el panel).
- Las actividades pueden ser internas (quiz, emparejar, completar, escuchar, leer, vocabulario) o enlaces a herramientas externas. Los enlaces se abren en pestaña nueva, con aviso de salida.
- Prohibido: analítica, cookies de terceros, cuentas o formularios para estudiantes. Los contenidos insertados de Canva, Wordwall, Educaplay y Heyzine se muestran directamente (decisión del fundador); YouTube se carga solo al tocarlo.
- Interfaz en inglés. El diseño «La puerta de la nevera», pensado para niños de 6 a 9 años, se reemplaza por uno para adolescentes.

## Brand Commitments

- Nombre: «La Cartilla». Sin la marca Sodium en el sitio público.
- Ilustración original en SVG. Sin personajes con derechos de terceros ni fotos de stock con personas reconocibles.

## Evidence on Hand

- 33 piezas de ejemplo marcadas «Ejemplo», con fotos de Wikimedia o Openverse y sus créditos en `src/content/snapshot.json`. Mariana las reemplazará.
- Introducción y Biodata llevan texto de ejemplo. No se inventan datos de Mariana.

## Product Principles

1. Hablarle a un adolescente como a un adolescente: nada infantil y nada condescendiente.
2. El adulto tiene que poder confiar a primera vista: el sitio se ve cuidado, la privacidad se explica de forma sencilla y los créditos están en orden.
3. El contenido de Mariana manda: el diseño debe sostener cualquier pieza que ella suba, con o sin imagen.
4. La interfaz es ligera y funciona sin conexión a la API.

## Accessibility & Inclusion

- Texto grande con interlineado generoso para lectores nuevos.
- Contraste WCAG AA.
- Objetivos táctiles de al menos 48 px.
- Se respeta `prefers-reduced-motion`.
- Todo se puede usar con el teclado.

# Product

<!-- impeccable:product-schema 1 -->

<!-- Fuente: brief de misión del fundador (2026-11-11). Sin ronda de entrevista aparte; se confirma en la compuerta de diseño. -->

## Platform

web

## Users

- **Niños hispanohablantes de 6 a 9 años** que empiezan a aprender inglés. Leen poco o están aprendiendo a leer en español; usan el sitio en tableta o móvil, a menudo con un adulto al lado. Exploran: eligen una canción, un cuento o un juego.
- **El adulto** (madre, padre, docente) decide si el sitio es confiable y bien hecho, y lo aprueba.
- **Mariana**, estudiante de pedagogía y autora, carga y publica el contenido desde el panel (`/admin`).

## Product Purpose

La Cartilla reúne canciones, historias por capítulos, podcast, cortometrajes y actividades en inglés para niños, cada pieza con su ficha de créditos y licencia. Éxito: el niño quiere volver a explorar y el adulto ve un sitio cuidado y seguro.

## Positioning

Un proyecto pequeño y de autor, hecho por una estudiante de pedagogía, sin cuentas, sin analítica y sin publicidad. Su nombre viene de la cartilla escolar con la que los niños aprenden a leer.

## Operating Context

- Contenido en JSON publicado desde el panel, servido por Cloudflare Pages Functions con D1 y R2. Si la API falla, el sitio usa la caché local y luego un snapshot incluido en el build.
- Existe una copia estática que funciona sin servidor (`file://`).
- El progreso y el nombre del niño viven solo en localStorage.

## Capabilities and Constraints

- Rutas: `/`, `/introduccion`, `/biodata`, `/song`, `/storytelling`, `/podcast`, `/short-film`, `/activities` (cada una con su detalle `/:id`), `/settings`, `/admin/*` y `/juego` (juego oculto, se activa desde el panel).
- Las actividades pueden ser internas (quiz, emparejar, completar, escuchar, leer, vocabulario) o enlaces a herramientas externas. Los enlaces se abren en pestaña nueva, con aviso de salida.
- Prohibido: analítica, cookies de terceros, cuentas o formularios para niños.
- Interfaz en español; el contenido de aprendizaje está en inglés.
- Las dos identidades actuales (Cuaderno y Recreo) siguen pendientes de que Mariana elija entre ellas. El rediseño reemplaza ambas por la dirección que elija el fundador.

## Brand Commitments

- Nombre: «La Cartilla». Sin la marca Sodium en el sitio público.
- Ilustración original en SVG. Sin personajes con derechos de terceros ni fotos de stock con personas reconocibles.

## Evidence on Hand

- 33 piezas de ejemplo marcadas «Ejemplo», con fotos de Wikimedia o Openverse y sus créditos en `src/content/snapshot.json`. Mariana las reemplazará.
- Introducción y Biodata llevan texto de ejemplo. No se inventan datos de Mariana.

## Product Principles

1. Un niño de 6 años que apenas lee debe orientarse por la forma, el color y el dibujo, no solo por las palabras.
2. El adulto tiene que poder confiar a primera vista: el sitio se ve cuidado, la privacidad se explica de forma sencilla y los créditos están en orden.
3. El contenido de Mariana manda: el diseño debe sostener cualquier pieza que ella suba, con o sin imagen.
4. La interfaz es ligera y funciona sin conexión a la API.

## Accessibility & Inclusion

- Texto grande con interlineado generoso para lectores nuevos.
- Contraste WCAG AA.
- Objetivos táctiles de al menos 48 px.
- Se respeta `prefers-reduced-motion`.
- Todo se puede usar con el teclado.

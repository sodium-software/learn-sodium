# La Cartilla — learn.sodium.software

Plataforma educativa web para aprender inglés reuniendo material multimedia en
un mismo cuaderno: canciones, historias, podcast, cortometrajes y seis
herramientas pedagógicas que se corrigen solas.

Es una aplicación **estática**: no hay backend, ni cuentas, ni servicios
externos. Todo el material multimedia se genera localmente y se sirve desde el
mismo sitio; el progreso de cada persona vive en el `localStorage` de su
navegador.

- **Producción:** https://learn.sodium.software
- **Repositorio:** https://github.com/sodium-software/learn-sodium
- **Cloudflare Pages** (proyecto `learn-sodium`)

---

## Ejecutar en local

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Compila TypeScript (`tsc -b`) y genera `dist/`. |
| `npm run preview` | Sirve `dist/` en local, como lo hará Cloudflare. |
| `npm run lint` | ESLint sobre todo el proyecto. |
| `npm run typecheck` | Comprobación de tipos sin emitir nada. |
| `npm run test:e2e` | 25 comprobaciones funcionales con navegador real. |
| `npm run test:media` | Verifica que todo el multimedia referenciado exista en `dist/`. |

### Regenerar el material multimedia (opcional)

Los audios, los vídeos y las marcas de tiempo ya están versionados. Para
volver a generarlos hace falta `ffmpeg` y `piper-tts`:

```bash
python3 scripts/generate-media.py
```

El script lee `content/*.json`, sintetiza la voz con Piper, arma las bases
instrumentales con ffmpeg y escribe `src/content/timings.json` con las marcas
de tiempo que sincronizan la letra y las transcripciones.

---

## Estructura del proyecto

```
learn-sodium/
├── content/                    Contenido editable, en JSON
│   ├── songs.json              4 canciones con letra, glosario y fragmentos
│   ├── stories.json            3 historias por capítulos con comprensión lectora
│   ├── podcasts.json           4 episodios con transcripción y comprensión
│   ├── films.json              3 cortiempres con sinopsis, escenas y preguntas
│   └── activities.json         13 definiciones de actividades
├── public/
│   ├── _redirects              Regla de Cloudflare Pages para el enrutado SPA
│   └── media/                  Audio, vídeo y portadas generados
├── scripts/
│   ├── generate-media.py       Generador de multimedia (Piper + ffmpeg)
│   ├── fetch-covers.sh         Descarga de portadas de dominio público
│   ├── e2e.mjs                 Comprobaciones funcionales con navegador
│   ├── shoot.mjs               Capturas en tres anchos + control de desbordes
│   └── check-media.mjs         Verificación de que el multimedia existe
├── src/
│   ├── activities/             Herramientas pedagógicas
│   │   ├── registry.ts         ⭐ Punto de extensión: el mapa tipo → componente
│   │   ├── shared.tsx          Piezas comunes (cabecera, resultado, feedback)
│   │   ├── clock.ts            Cronómetro de la actividad
│   │   └── tools/              Un archivo por herramienta
│   ├── components/             Layout, navegación, reproductor y UI base
│   ├── config/site.ts          ⭐ Nombre, bienvenida y branding
│   ├── content/index.ts        Índice y búsqueda de contenido
│   ├── lib/                    Persistencia, estado de progreso, utilidades
│   ├── views/                  Una vista por sección y sus páginas de detalle
│   ├── App.tsx                 Mapa de rutas
│   └── index.css               Sistema visual (tokens y componentes)
└── vite.config.ts
```

---

## Arquitectura

### Añadir una actividad nueva

El registro de herramientas es el único punto que hay que tocar. No se
modifica la vista de actividades, ni el enrutador, ni el resto de la
aplicación:

1. Escribe el componente en `src/activities/tools/MiActividad.tsx`. Recibe
   `definition` y `onComplete`, y llama a `onComplete` con el resultado.
2. Añádelo al mapa `tools` de `src/activities/registry.ts`, con un `kind` y una
   `typeLabel`.
3. Añade su contenido en `content/activities.json`.

La vista de actividades, el contador de progreso y el guardado se adaptan
solos.

### Estado y persistencia

`src/lib/progress.tsx` mantiene el estado en memoria y lo escribe en
`localStorage` bajo la clave `la-cartilla:state:v1`. Se guarda:

- preferencias (nombre, objetivo diario, barra plegada, traducciones);
- resultado de cada actividad (puntuación, aciertos, fecha, tiempo);
- fragmentos destacados y marcas de "completado" del material multimedia;
- vocabulario marcado como dominado;
- minutos por día, de donde sale la racha.

Un estado corrupto o de otra versión nunca rompe la aplicación: se descarta y
se empieza limpio.

### Sistema visual

Un cuaderno impreso a una sola tinta: papel hueso, tinta azul-petróleo y el
mismo azul como acento. Sin degradados, sin sombras en reposo, esquinas
rectas, un solo par de márgenes y una sola familia tipográfica para la
interfaz (Bricolage Grotesque) con una serif de lectura para los textos largos
(Newsreader). Los tokens viven en `src/index.css` y se pueden cambiar sin
tocar componentes.

---

## Contenido

Todo el material es **original y de demostración**, generado localmente:

- las canciones se narran con voz sintética sobre una base armónica creada
  con ffmpeg, con la letra marcada en el tiempo;
- los podcast son episodios hablados con dos voces y transcripción sincronizada;
- los cortiempres son vídeo con las escenas tipográficas y la narración
  original en inglés;
- las portadas son fotografías de dominio público o Creative Commons de
  Wikimedia Commons, Openverse, el Met y el AIC, con sus créditos en
  `public/media/covers/credits.json`.

Para sustituirlo por material real basta con reemplazar los archivos de
`public/media/` y las rutas declaradas en `content/*.json`: los componentes ya
están preparados para audio y vídeo reales.

---

## Despliegue

El proyecto se despliega en **Cloudflare Pages** con la rama `main`.

```bash
npm run build          # genera dist/
npx wrangler pages deploy dist --project-name learn-sodium --branch main
```

El subdominio `learn.sodium.software` está configurado como dominio
personalizado del proyecto. La documentación completa del despliegue, incluida
la configuración de DNS, está en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

---

## Licencia y créditos

Código: uso interno de Sodium Software.

Las portadas pertenecen a sus autores y se usan bajo sus licencias
(dominio público, CC0, CC BY o CC BY-SA). Los créditos completos están en
`public/media/covers/credits.json`.

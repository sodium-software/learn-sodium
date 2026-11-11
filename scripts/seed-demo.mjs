/**
 * Convierte el contenido demo de content/*.json al formato de la base de datos.
 *
 *   node scripts/seed-demo.mjs   → seed/demo.sql  (para `wrangler d1 execute --file`)
 *                                → src/content/snapshot.json  (respaldo empaquetado en la SPA)
 *
 * Todas las piezas se marcan como ejemplo (is_example = 1) y se publican.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { SCHEMAS, sanitize } from '../src/shared/schema.ts'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))
const timings = read('src/content/timings.json')
const credits = Object.fromEntries(read('public/media/covers/credits.json').map((c) => [c.slug, c.credit]))
const marks = (key) => (Array.isArray(timings[key]) ? timings[key] : [])
const round = (n) => Math.round(n * 100) / 100

const demo = (cover) => ({
  source: 'La Cartilla — pieza de demostración generada para el prototipo',
  license: 'propio',
  credits: `Texto y audio de demostración. Portada: ${credits[cover] ?? 'sin datos'}.`,
})
const question = (q) => ({
  prompt: q.prompt,
  options: q.options.map((o) => o.text),
  correct: q.options.findIndex((o) => o.id === q.correctOptionId) + 1,
  explanation: q.explanation,
})
const cover = (slug) => `/media/covers/${slug}.jpg`

const items = []
const add = (kind, id, data) => items.push({ kind, id, data, position: items.filter((i) => i.kind === kind).length })

for (const s of read('content/songs.json').songs) {
  const m = marks(`songs:${s.id}`)
  const lyrics = s.lyrics.map((l, i) => ({ start: round(m[i]?.start ?? 0), text: l.text, note: l.note, keywords: l.keywords }))
  add('song', s.id, {
    title: s.title, summary: s.summary, level: s.level, cover: cover(s.cover), artist: s.artist, mood: s.mood, audio: s.audio,
    lyrics, glossary: s.glossary,
    highlights: s.highlights.map((h, i) => {
      const start = h.start ?? lyrics[Math.min(i, lyrics.length - 1)]?.start ?? 0
      return { label: h.label, start: round(start), end: round(h.end ?? start + 3.5), note: h.note }
    }),
    ...demo(s.cover),
  })
}
for (const s of read('content/stories.json').stories) {
  add('story', s.id, {
    title: s.title, summary: s.summary, level: s.level, cover: cover(s.cover), author: s.author, readingTime: s.readingTime,
    intro: s.intro, chapters: s.chapters.map((c) => ({ title: c.title, paragraphs: c.paragraphs })),
    glossary: s.glossary, comprehension: s.comprehension.map(question), ...demo(s.cover),
  })
}
for (const e of read('content/podcasts.json').episodes) {
  const m = marks(`podcasts:${e.id}`)
  add('podcast', e.id, {
    title: e.title, summary: e.summary, level: e.level, cover: cover(e.cover), show: e.show, audio: `/media/audio/${e.id}.mp3`,
    segments: e.segments.map((g, i) => ({ start: round(m[i]?.start ?? g.start ?? 0), speaker: g.speaker, text: g.text, note: g.note })),
    keyTerms: e.keyTerms, comprehension: e.comprehension.map(question), ...demo(e.cover),
  })
}
const videos = new Set(['night-shift-observatory', 'paper-and-ink'])
for (const f of read('content/films.json').films) {
  const m = marks(`films:${f.id}`)
  add('film', f.id, {
    title: f.title, summary: f.synopsis, level: f.level, cover: cover(f.cover), director: f.director,
    video: videos.has(f.id) ? `/media/video/${f.id}.mp4` : undefined,
    scenes: f.scenes.map((sc, i) => ({ start: round(m[i]?.start ?? sc.start ?? 0), speaker: sc.speaker, line: sc.line, translation: sc.translation })),
    comprehension: f.comprehension.map(question), relatedActivityIds: f.relatedActivityIds, ...demo(f.cover),
  })
}
const skillOf = { vocabulary: 'vocabulary', quiz: 'reading', matching: 'vocabulary', 'fill-blanks': 'grammar', listening: 'listening', reading: 'reading' }
for (const a of read('content/activities.json').activities) {
  add('activity', a.id, {
    type: a.kind, title: a.title, tagline: a.tagline, summary: a.description, level: a.level, skill: skillOf[a.kind], minutes: a.minutes,
    cards: a.cards?.map(({ term, translation, definition, example }) => ({ term, translation, definition, example })),
    questions: (a.questions ?? a.passage?.questions)?.map(question),
    pairs: a.pairs?.map(({ left, right }) => ({ left, right })),
    blanks: a.blanks?.map(({ sentence, answer, options, hint }) => ({ sentence, answer, options, hint })),
    listening: a.listening?.map((l) => ({ audio: l.audio, ...question(l.question) })),
    passageTitle: a.passage?.title, passage: a.passage?.paragraphs,
    relatedIds: a.relatedIds,
    source: 'La Cartilla — actividad de demostración', license: 'propio',
  })
}
// Una actividad externa de ejemplo por herramienta: enlazan a la portada de cada plataforma.
for (const [tool, name, url, skill] of [
  ['wordwall', 'Wordwall', 'https://wordwall.net/', 'vocabulary'],
  ['educaplay', 'Educaplay', 'https://www.educaplay.com/', 'listening'],
  ['liveworksheets', 'Liveworksheets', 'https://www.liveworksheets.com/', 'writing'],
  ['canva', 'Canva', 'https://www.canva.com/', 'speaking'],
]) {
  add('activity', `ejemplo-${tool}`, {
    type: 'external', tool, url, skill, level: 'A1', age: '7 a 10 años', minutes: 10,
    title: `Ejemplo: actividad en ${name}`,
    summary: `Tarjeta de ejemplo. Aquí irá el enlace a una actividad creada en ${name}.`,
    instructions: 'Abre la actividad, hazla con calma y, al volver, márcala como hecha.',
    source: name, license: 'permiso', credits: `Actividad alojada en ${name}.`,
  })
}
add('page', 'introduccion', {
  title: 'Introducción',
  summary: 'Texto de ejemplo: aquí va la presentación del proyecto.',
  body: [
    'Este es un texto de ejemplo. Desde el panel se reemplaza por la introducción del trabajo: a quién va dirigido, qué se espera que aprendan los niños y cómo usar cada sección.',
    'Cada sección reúne material para escuchar, leer, ver y practicar inglés a su ritmo.',
  ],
})
add('page', 'biodata', {
  title: 'Biodata',
  summary: 'Texto de ejemplo: aquí va la presentación de la autora.',
  body: ['Este es un texto de ejemplo. Desde el panel se escribe la biodata: formación, intereses y el porqué de este proyecto.'],
})

// Validar con el mismo esquema que la API.
let failed = false
for (const item of items) {
  const { data, errors } = sanitize(SCHEMAS[item.kind], item.data)
  if (errors.length) {
    failed = true
    console.error(item.id, errors)
  }
  item.data = data
}
if (failed) process.exit(1)

const q = (text) => `'${text.replaceAll("'", "''")}'`
const stamp = new Date().toISOString()
const sql = items.map((i) => {
  const json = JSON.stringify(i.data)
  return `INSERT INTO items (id, kind, position, draft, published, is_example, updated_at, published_at) VALUES (${q(i.id)}, ${q(i.kind)}, ${i.position}, ${q(json)}, ${q(json)}, 1, ${q(stamp)}, ${q(stamp)}) ON CONFLICT(id) DO NOTHING;`
})
writeFileSync('seed/demo.sql', sql.join('\n') + '\n')
writeFileSync(
  'src/content/snapshot.json',
  JSON.stringify({ items: items.map((i) => ({ id: i.id, kind: i.kind, example: true, data: i.data })), settings: { easterEgg: true, dedication: '' }, version: stamp }),
)
console.log(`${items.length} piezas → seed/demo.sql y src/content/snapshot.json`)

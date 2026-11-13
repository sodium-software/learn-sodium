/**
 * Esquema del contenido editable, compartido por el panel (formularios) y la
 * API (validación y saneado). Un solo sitio describe cada campo: si se añade
 * aquí, aparece en el panel y el servidor lo acepta.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'url'
  | 'media'
  | 'tags' // lista de palabras separadas por comas
  | 'lines' // una entrada por línea
  | 'paragraphs' // párrafos separados por una línea en blanco
  | 'list'

export interface Field {
  name: string
  label: string
  type: FieldType
  help?: string
  required?: boolean
  max?: number
  min?: number
  options?: [string, string][]
  accept?: 'image' | 'audio' | 'video'
  fields?: Field[]
  /** Etiquetas que en el panel se eligen con casillas (las piezas publicadas o en borrador). */
  picker?: 'pieces'
  /** Enlace que se muestra insertado: se valida y se guarda ya en su forma para insertar. */
  embed?: 'any' | 'youtube'
  /** Solo aplica (y solo se valida) si otro campo tiene uno de estos valores. */
  showIf?: { field: string; in: string[] }
}

export type Kind = 'song' | 'story' | 'podcast' | 'film' | 'activity' | 'page'
export const KINDS: Kind[] = ['song', 'story', 'podcast', 'film', 'activity', 'page']

export const KIND_LABELS: Record<Kind, string> = {
  song: 'Songs',
  story: 'Stories',
  podcast: 'Podcast',
  film: 'Short films',
  activity: 'Activities',
  page: 'Pages',
}

export const LEVELS: [string, string][] = [
  ['A1', 'A1 · Beginner'],
  ['A2', 'A2 · Elementary'],
  ['B1', 'B1 · Intermediate'],
  ['B2', 'B2 · Upper intermediate'],
  ['C1', 'C1 · Advanced'],
]

export const LICENSES: [string, string][] = [
  ['propio', 'Own work'],
  ['dominio-publico', 'Public domain'],
  ['cc', 'Creative Commons'],
  ['permiso', 'Used with permission'],
]

export const LICENSE_LABEL = Object.fromEntries(LICENSES) as Record<string, string>

export const ACTIVITY_TYPES: [string, string][] = [
  ['external', 'External (link to another platform)'],
  ['vocabulary', 'Vocabulary cards'],
  ['quiz', 'Quiz'],
  ['matching', 'Match the pairs'],
  ['fill-blanks', 'Fill in the blanks'],
  ['listening', 'Listening'],
  ['reading', 'Reading'],
]

export const EXTERNAL_TOOLS: [string, string][] = [
  ['canva', 'Canva'],
  ['educaplay', 'Educaplay'],
  ['wordwall', 'Wordwall'],
  ['liveworksheets', 'Liveworksheets'],
  ['other', 'Other platform'],
]

export const SKILLS: [string, string][] = [
  ['listening', 'Listening'],
  ['reading', 'Reading'],
  ['speaking', 'Speaking'],
  ['writing', 'Writing'],
  ['vocabulary', 'Vocabulary'],
  ['grammar', 'Grammar'],
]

// ── Bloques reutilizables ───────────────────────────────────────────────────

const meta: Field[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, max: 120 },
  { name: 'summary', label: 'Summary', type: 'textarea', max: 600 },
  { name: 'level', label: 'Level', type: 'select', options: LEVELS, required: true },
  { name: 'age', label: 'Recommended age', type: 'text', max: 40, help: 'For example: 7 to 9 years' },
  { name: 'cover', label: 'Cover or thumbnail', type: 'media', accept: 'image' },
  {
    name: 'embed',
    label: 'Embed from Canva, Wordwall, Educaplay, Heyzine or YouTube',
    type: 'url',
    embed: 'any',
    help: 'Shown inside the page. Paste the link or the embed code (Share → Embed). Canva edit links are fine: the site only shows the design. YouTube only loads when the student taps play.',
  },
]

/** Imágenes con el texto (la letra o el guion hechos en Canva, por ejemplo). */
const textPictures = (label: string): Field => ({
  name: 'textPictures',
  label,
  type: 'list',
  max: 12,
  help: 'Pictures that show the text, for example a page made in Canva. They appear in order.',
  fields: [
    { name: 'image', label: 'Picture', type: 'media', accept: 'image', required: true },
    { name: 'alt', label: 'Text in the picture (for screen readers)', type: 'textarea', max: 3000 },
  ],
})

const rights: Field[] = [
  { name: 'source', label: 'Source', type: 'text', max: 200, required: true, help: 'Where the piece comes from (author, website, book).' },
  { name: 'license', label: 'License', type: 'select', options: LICENSES, required: true },
  { name: 'credits', label: 'Credits', type: 'textarea', max: 1000, help: 'Shown on the public page.' },
]

const glossary: Field = {
  name: 'glossary',
  label: 'Glossary',
  type: 'list',
  max: 60,
  fields: [
    { name: 'term', label: 'Word', type: 'text', required: true, max: 80 },
    { name: 'translation', label: 'Translation', type: 'text', max: 120 },
    { name: 'definition', label: 'Definition', type: 'text', max: 300 },
    { name: 'example', label: 'Example', type: 'text', max: 300 },
  ],
}

const questionFields: Field[] = [
  { name: 'prompt', label: 'Question', type: 'text', required: true, max: 300 },
  { name: 'options', label: 'Options (one per line)', type: 'lines', required: true, max: 200 },
  { name: 'correct', label: 'Number of the correct option', type: 'number', min: 1, max: 8, required: true },
  { name: 'explanation', label: 'Explanation', type: 'text', max: 400 },
]

const questions = (name: string, label: string, showIf?: Field['showIf']): Field => ({
  name,
  label,
  type: 'list',
  max: 30,
  fields: questionFields,
  showIf,
})

const onlyFor = (...types: string[]) => ({ field: 'type', in: types })

// ── Esquemas por tipo ───────────────────────────────────────────────────────

export const SCHEMAS: Record<Kind, Field[]> = {
  song: [
    ...meta,
    { name: 'artist', label: 'Performer', type: 'text', max: 120 },
    { name: 'mood', label: 'Mood or theme', type: 'text', max: 160 },
    { name: 'audio', label: 'Audio', type: 'media', accept: 'audio', required: true },
    {
      name: 'lyrics',
      label: 'Lyrics',
      type: 'list',
      max: 200,
      fields: [
        { name: 'start', label: 'Second', type: 'number', min: 0, max: 36000 },
        { name: 'text', label: 'Line in English', type: 'text', required: true, max: 300 },
        { name: 'note', label: 'Translation', type: 'text', max: 300 },
        { name: 'keywords', label: 'Key words', type: 'tags', max: 80 },
        { name: 'image', label: 'Picture next to the line', type: 'media', accept: 'image' },
      ],
    },
    textPictures('Lyrics pictures'),
    glossary,
    {
      name: 'highlights',
      label: 'Highlights',
      type: 'list',
      max: 20,
      fields: [
        { name: 'label', label: 'Name', type: 'text', required: true, max: 120 },
        { name: 'start', label: 'From (s)', type: 'number', min: 0, max: 36000 },
        { name: 'end', label: 'To (s)', type: 'number', min: 0, max: 36000 },
        { name: 'note', label: 'Note', type: 'text', max: 300 },
      ],
    },
    ...rights,
  ],
  story: [
    ...meta,
    { name: 'author', label: 'Author', type: 'text', max: 120 },
    { name: 'readingTime', label: 'Reading minutes', type: 'number', min: 1, max: 240 },
    { name: 'intro', label: 'Introduction', type: 'textarea', max: 1500 },
    {
      name: 'chapters',
      label: 'Chapters',
      type: 'list',
      max: 40,
      fields: [
        { name: 'title', label: 'Chapter title', type: 'text', required: true, max: 160 },
        { name: 'paragraphs', label: 'Text (leave a blank line between paragraphs)', type: 'paragraphs', required: true, max: 4000 },
      ],
    },
    textPictures('Story pictures'),
    glossary,
    questions('comprehension', 'Comprehension questions'),
    ...rights,
  ],
  podcast: [
    ...meta,
    { name: 'show', label: 'Show', type: 'text', max: 120 },
    {
      name: 'audio',
      label: 'Audio',
      type: 'media',
      accept: 'audio',
      help: 'Optional. If the episode is a video, put its YouTube or Canva link in the Embed field instead.',
    },
    {
      name: 'segments',
      label: 'Transcript',
      type: 'list',
      max: 300,
      fields: [
        { name: 'start', label: 'Second', type: 'number', min: 0, max: 36000 },
        { name: 'speaker', label: 'Speaker', type: 'text', max: 60 },
        { name: 'text', label: 'Text in English', type: 'text', required: true, max: 600 },
        { name: 'note', label: 'Translation', type: 'text', max: 600 },
      ],
    },
    textPictures('Script pictures'),
    { ...glossary, name: 'keyTerms', label: 'Key words' },
    questions('comprehension', 'Comprehension questions'),
    ...rights,
  ],
  film: [
    ...meta,
    { name: 'director', label: 'Director', type: 'text', max: 120 },
    { name: 'video', label: 'Video', type: 'media', accept: 'video' },
    {
      name: 'youtube',
      label: 'YouTube video',
      type: 'url',
      embed: 'youtube',
      help: 'Instead of uploading a file. It only loads when the student taps play.',
    },
    {
      name: 'scenes',
      label: 'Scenes',
      type: 'list',
      max: 200,
      fields: [
        { name: 'start', label: 'Second', type: 'number', min: 0, max: 36000 },
        { name: 'speaker', label: 'Speaker', type: 'text', max: 60 },
        { name: 'line', label: 'Line in English', type: 'text', required: true, max: 400 },
        { name: 'translation', label: 'Translation', type: 'text', max: 400 },
      ],
    },
    textPictures('Script pictures'),
    questions('comprehension', 'Comprehension questions'),
    { name: 'relatedActivityIds', label: 'Related activities (IDs)', type: 'tags', max: 80 },
    ...rights,
  ],
  activity: [
    { name: 'type', label: 'Activity type', type: 'select', options: ACTIVITY_TYPES, required: true },
    ...meta.map((field) =>
      field.name === 'summary' ? { ...field, label: 'Description' } : field.name === 'cover' ? { ...field, label: 'Thumbnail' } : field,
    ),
    { name: 'tagline', label: 'Short subtitle', type: 'text', max: 80 },
    { name: 'skill', label: 'Skill', type: 'select', options: SKILLS, required: true },
    { name: 'minutes', label: 'Estimated minutes', type: 'number', min: 1, max: 120 },
    { name: 'tool', label: 'Tool', type: 'select', options: EXTERNAL_TOOLS, required: true, showIf: onlyFor('external') },
    { name: 'url', label: 'Link to the activity', type: 'url', required: true, showIf: onlyFor('external') },
    { name: 'instructions', label: 'Instructions for the student', type: 'textarea', max: 1500 },
    {
      name: 'cards',
      label: 'Cards',
      type: 'list',
      max: 60,
      showIf: onlyFor('vocabulary'),
      fields: glossary.fields,
    },
    questions('questions', 'Questions', onlyFor('quiz', 'reading')),
    {
      name: 'pairs',
      label: 'Pairs',
      type: 'list',
      max: 30,
      showIf: onlyFor('matching'),
      fields: [
        { name: 'left', label: 'Left', type: 'text', required: true, max: 120 },
        { name: 'right', label: 'Right', type: 'text', required: true, max: 120 },
      ],
    },
    {
      name: 'blanks',
      label: 'Sentences with a blank',
      type: 'list',
      max: 40,
      showIf: onlyFor('fill-blanks'),
      fields: [
        { name: 'sentence', label: 'Sentence (use ___ for the blank)', type: 'text', required: true, max: 300 },
        { name: 'answer', label: 'Answer', type: 'text', required: true, max: 80 },
        { name: 'options', label: 'Word bank', type: 'tags', max: 80 },
        { name: 'hint', label: 'Hint', type: 'text', max: 200 },
      ],
    },
    {
      name: 'listening',
      label: 'Listening clips',
      type: 'list',
      max: 20,
      showIf: onlyFor('listening'),
      fields: [{ name: 'audio', label: 'Audio', type: 'media', accept: 'audio', required: true }, ...questionFields],
    },
    { name: 'passageTitle', label: 'Text title', type: 'text', max: 160, showIf: onlyFor('reading') },
    { name: 'passage', label: 'Text to read', type: 'paragraphs', max: 8000, showIf: onlyFor('reading') },
    {
      name: 'relatedIds',
      label: 'Story it belongs to',
      type: 'tags',
      max: 80,
      picker: 'pieces',
      help: 'Tick the song, podcast, short film or story this activity is for. It appears on that page.',
    },
    ...rights,
  ],
  page: [
    { name: 'title', label: 'Title', type: 'text', required: true, max: 120 },
    { name: 'summary', label: 'Lead', type: 'textarea', max: 600 },
    { name: 'body', label: 'Text (leave a blank line between paragraphs)', type: 'paragraphs', max: 12000 },
    { name: 'cover', label: 'Photo', type: 'media', accept: 'image' },
    { name: 'credits', label: 'Photo credits', type: 'textarea', max: 600 },
    {
      name: 'people',
      label: 'People',
      type: 'list',
      max: 10,
      help: 'For the Bio page: one entry per trainee teacher.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true, max: 120 },
        { name: 'photo', label: 'Photo', type: 'media', accept: 'image' },
        { name: 'story', label: 'Short life story', type: 'paragraphs', max: 4000 },
      ],
    },
    {
      name: 'references',
      label: 'References (one per line)',
      type: 'lines',
      max: 400,
      help: 'For example the two authors cited in the introduction, in APA style.',
    },
  ],
}

export const SETTINGS_SCHEMA: Field[] = [
  { name: 'easterEgg', label: 'Hidden game', type: 'select', options: [['on', 'On'], ['off', 'Off']], required: true },
  { name: 'dedication', label: 'Game dedication', type: 'textarea', max: 600 },
]

// ── Enlaces insertados ──────────────────────────────────────────────────────

export type EmbedPlatform = 'canva' | 'wordwall' | 'educaplay' | 'heyzine' | 'youtube'

const CANVA = /^https:\/\/(?:www\.)?canva\.com\/design\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/(view|watch|edit)\b/
const YOUTUBE = [
  /^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/,
  /^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})/,
  /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/,
]
const WORDWALL = /^https:\/\/wordwall\.net\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?embed\/[A-Za-z0-9]+/
const HEYZINE = /^https:\/\/(?:www\.)?heyzine\.com\/flip-book\/[A-Za-z0-9]+(?:\.html)?(?:[?#].*)?$/
const EDUCAPLAY = /^https:\/\/(?:[a-z]{2,3}\.|www\.)?educaplay\.com\//

/** Plataforma de un enlace ya convertido (para elegir cómo mostrarlo). */
export function embedPlatform(url: string): EmbedPlatform {
  if (url.includes('youtube-nocookie.com')) return 'youtube'
  if (url.includes('canva.com')) return 'canva'
  if (url.includes('wordwall.net')) return 'wordwall'
  if (url.includes('heyzine.com')) return 'heyzine'
  return 'educaplay'
}

/** Si la autora pega el código <iframe> completo, se queda con su src. */
export function embedSource(raw: unknown): string {
  const text = String(raw ?? '').trim()
  const src = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(text)
  return (src ? src[1] : text).replace(/&amp;/g, '&')
}

/**
 * Convierte el enlace (o el código para insertar) que pega la autora en la
 * dirección que se inserta. Solo acepta Canva, Wordwall, Educaplay, Heyzine y YouTube:
 * la misma lista blanca que frame-src en public/_headers.
 * shortcut: no sigue enlaces cortos (canva.link, wordwall share); si hiciera falta, habría que resolver la redirección.
 */
export function embedUrl(link: string, only?: EmbedPlatform): string | { error: string } {
  const c = CANVA.exec(link)
  if (c && (!only || only === 'canva')) {
    // El enlace de edición se guarda como /view: en la web nunca queda un enlace que permita editar.
    return `https://www.canva.com/design/${c[1]}/${c[2]}/view?embed`
  }
  if (!only || only === 'youtube') {
    for (const pattern of YOUTUBE) {
      const m = pattern.exec(link)
      if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`
    }
  }
  if (!only && WORDWALL.test(link)) return link
  if (!only && /^https:\/\/wordwall\.net\//.test(link)) {
    return { error: 'use the Wordwall embed code: on the activity choose Share → Embed and paste it here' }
  }
  if (!only && EDUCAPLAY.test(link)) return link
  if (!only && HEYZINE.test(link)) return link
  if (only === 'youtube') return { error: 'this is not a YouTube video link' }
  return { error: 'only Canva, Wordwall, Educaplay, Heyzine or YouTube links can be shown inside the page' }
}

// ── Saneado ─────────────────────────────────────────────────────────────────

export type Data = Record<string, unknown>

// eslint-disable-next-line no-control-regex -- quitar caracteres de control es justo el objetivo
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
const TAG = /<\/?[a-z!?][^>]*>/gi
const MEDIA_PATH = /^\/(files|media)\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/

/** Texto plano: sin etiquetas HTML ni caracteres de control. */
export function cleanText(value: unknown, max = 1000): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(CONTROL, '').replace(TAG, '').replace(/\r\n?/g, '\n').trim().slice(0, max)
}

export function isVisible(field: Field, data: Data): boolean {
  return !field.showIf || field.showIf.in.includes(String(data[field.showIf.field] ?? ''))
}

/**
 * Devuelve solo los campos del esquema, saneados. Los errores se devuelven
 * con la ruta del campo para mostrarlos en el formulario.
 */
export function sanitize(fields: Field[], input: unknown, path = ''): { data: Data; errors: string[] } {
  const source = (typeof input === 'object' && input !== null && !Array.isArray(input) ? input : {}) as Data
  const data: Data = {}
  const errors: string[] = []

  for (const field of fields) {
    if (!isVisible(field, source)) continue
    const raw = source[field.name]
    const at = `${path}${field.label}`
    const max = field.max ?? 1000
    let value: unknown

    switch (field.type) {
      case 'text':
      case 'textarea':
        value = cleanText(raw, max)
        break
      case 'number': {
        const n = raw === '' || raw === null || raw === undefined ? NaN : Number(raw)
        if (Number.isFinite(n)) {
          if ((field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max)) {
            errors.push(`${at}: out of range`)
          }
          value = n
        }
        break
      }
      case 'select':
        value = cleanText(raw, 60)
        if (value && !field.options?.some(([option]) => option === value)) {
          errors.push(`${at}: invalid option`)
          value = ''
        }
        break
      case 'url': {
        const text = cleanText(field.embed ? embedSource(raw) : raw, 2000)
        if (text) {
          try {
            const url = new URL(text)
            if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
            value = url.toString()
          } catch {
            errors.push(`${at}: the link must start with https://`)
            break
          }
          if (field.embed) {
            const embedded = embedUrl(String(value), field.embed === 'any' ? undefined : field.embed)
            if (typeof embedded === 'string') value = embedded
            else {
              errors.push(`${at}: ${embedded.error}`)
              value = undefined
            }
          }
        }
        break
      }
      case 'media': {
        const text = cleanText(raw, 300)
        if (text && (!MEDIA_PATH.test(text) || text.includes('..'))) errors.push(`${at}: invalid file`)
        else value = text
        break
      }
      case 'tags':
        value = (Array.isArray(raw) ? raw : String(raw ?? '').split(','))
          .map((item) => cleanText(item, max))
          .filter(Boolean)
          .slice(0, 50)
        break
      case 'lines':
        value = (Array.isArray(raw) ? raw : String(raw ?? '').split('\n'))
          .map((item) => cleanText(item, max))
          .filter(Boolean)
          .slice(0, 50)
        break
      case 'paragraphs':
        value = (Array.isArray(raw) ? raw : String(raw ?? '').split(/\n\s*\n/))
          .map((item) => cleanText(item, max))
          .filter(Boolean)
          .slice(0, 400)
        break
      case 'list': {
        const items = Array.isArray(raw) ? raw.slice(0, field.max ?? 100) : []
        value = items.map((item, index) => {
          const result = sanitize(field.fields ?? [], item, `${at} ${index + 1} › `)
          errors.push(...result.errors)
          return result.data
        })
        break
      }
    }

    const empty =
      value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
    if (field.required && empty) errors.push(`${at}: required`)
    if (!empty) data[field.name] = value
  }

  return { data, errors }
}

export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'pieza'
  )
}

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

// ── Formato público ─────────────────────────────────────────────────────────

export interface PublicItem {
  id: string
  kind: Kind
  example: boolean
  data: Data
}

export interface PublicContent {
  items: PublicItem[]
  settings: { easterEgg: boolean; dedication: string }
  /** Fecha de la última publicación. */
  version: string
}

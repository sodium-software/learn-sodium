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
  /** Solo aplica (y solo se valida) si otro campo tiene uno de estos valores. */
  showIf?: { field: string; in: string[] }
}

export type Kind = 'song' | 'story' | 'podcast' | 'film' | 'activity' | 'page'
export const KINDS: Kind[] = ['song', 'story', 'podcast', 'film', 'activity', 'page']

export const KIND_LABELS: Record<Kind, string> = {
  song: 'Canciones',
  story: 'Historias',
  podcast: 'Podcast',
  film: 'Cortometrajes',
  activity: 'Actividades',
  page: 'Páginas',
}

export const LEVELS: [string, string][] = [
  ['A1', 'A1 · Inicial'],
  ['A2', 'A2 · Básico'],
  ['B1', 'B1 · Intermedio'],
  ['B2', 'B2 · Intermedio alto'],
  ['C1', 'C1 · Avanzado'],
]

export const LICENSES: [string, string][] = [
  ['propio', 'Propio'],
  ['dominio-publico', 'Dominio público'],
  ['cc', 'Creative Commons'],
  ['permiso', 'Con permiso del autor'],
]

export const LICENSE_LABEL = Object.fromEntries(LICENSES) as Record<string, string>

export const ACTIVITY_TYPES: [string, string][] = [
  ['external', 'Externa (enlace a otra plataforma)'],
  ['vocabulary', 'Tarjetas de vocabulario'],
  ['quiz', 'Quiz'],
  ['matching', 'Relacionar parejas'],
  ['fill-blanks', 'Completar huecos'],
  ['listening', 'Escucha'],
  ['reading', 'Lectura'],
]

export const EXTERNAL_TOOLS: [string, string][] = [
  ['canva', 'Canva'],
  ['educaplay', 'Educaplay'],
  ['wordwall', 'Wordwall'],
  ['liveworksheets', 'Liveworksheets'],
  ['other', 'Otra plataforma'],
]

export const SKILLS: [string, string][] = [
  ['listening', 'Escuchar'],
  ['reading', 'Leer'],
  ['speaking', 'Hablar'],
  ['writing', 'Escribir'],
  ['vocabulary', 'Vocabulario'],
  ['grammar', 'Gramática'],
]

// ── Bloques reutilizables ───────────────────────────────────────────────────

const meta: Field[] = [
  { name: 'title', label: 'Título', type: 'text', required: true, max: 120 },
  { name: 'summary', label: 'Resumen', type: 'textarea', max: 600 },
  { name: 'level', label: 'Nivel', type: 'select', options: LEVELS, required: true },
  { name: 'age', label: 'Edad recomendada', type: 'text', max: 40, help: 'Por ejemplo: 7 a 9 años' },
  { name: 'cover', label: 'Portada o miniatura', type: 'media', accept: 'image' },
]

const rights: Field[] = [
  { name: 'source', label: 'Fuente', type: 'text', max: 200, required: true, help: 'De dónde sale la pieza (autor, sitio, libro).' },
  { name: 'license', label: 'Licencia', type: 'select', options: LICENSES, required: true },
  { name: 'credits', label: 'Créditos', type: 'textarea', max: 1000, help: 'Se muestran en la ficha pública.' },
]

const glossary: Field = {
  name: 'glossary',
  label: 'Glosario',
  type: 'list',
  max: 60,
  fields: [
    { name: 'term', label: 'Palabra', type: 'text', required: true, max: 80 },
    { name: 'translation', label: 'Traducción', type: 'text', max: 120 },
    { name: 'definition', label: 'Definición', type: 'text', max: 300 },
    { name: 'example', label: 'Ejemplo', type: 'text', max: 300 },
  ],
}

const questionFields: Field[] = [
  { name: 'prompt', label: 'Pregunta', type: 'text', required: true, max: 300 },
  { name: 'options', label: 'Opciones (una por línea)', type: 'lines', required: true, max: 200 },
  { name: 'correct', label: 'Número de la opción correcta', type: 'number', min: 1, max: 8, required: true },
  { name: 'explanation', label: 'Explicación', type: 'text', max: 400 },
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
    { name: 'artist', label: 'Intérprete', type: 'text', max: 120 },
    { name: 'mood', label: 'Tono o tema', type: 'text', max: 160 },
    { name: 'audio', label: 'Audio', type: 'media', accept: 'audio', required: true },
    {
      name: 'lyrics',
      label: 'Letra',
      type: 'list',
      max: 200,
      fields: [
        { name: 'start', label: 'Segundo', type: 'number', min: 0, max: 36000 },
        { name: 'text', label: 'Verso en inglés', type: 'text', required: true, max: 300 },
        { name: 'note', label: 'Traducción', type: 'text', max: 300 },
        { name: 'keywords', label: 'Palabras clave', type: 'tags', max: 80 },
      ],
    },
    glossary,
    {
      name: 'highlights',
      label: 'Fragmentos destacados',
      type: 'list',
      max: 20,
      fields: [
        { name: 'label', label: 'Nombre', type: 'text', required: true, max: 120 },
        { name: 'start', label: 'Desde (s)', type: 'number', min: 0, max: 36000 },
        { name: 'end', label: 'Hasta (s)', type: 'number', min: 0, max: 36000 },
        { name: 'note', label: 'Nota', type: 'text', max: 300 },
      ],
    },
    ...rights,
  ],
  story: [
    ...meta,
    { name: 'author', label: 'Autor', type: 'text', max: 120 },
    { name: 'readingTime', label: 'Minutos de lectura', type: 'number', min: 1, max: 240 },
    { name: 'intro', label: 'Introducción', type: 'textarea', max: 1500 },
    {
      name: 'chapters',
      label: 'Capítulos',
      type: 'list',
      max: 40,
      fields: [
        { name: 'title', label: 'Título del capítulo', type: 'text', required: true, max: 160 },
        { name: 'paragraphs', label: 'Texto (deja una línea en blanco entre párrafos)', type: 'paragraphs', required: true, max: 4000 },
      ],
    },
    glossary,
    questions('comprehension', 'Preguntas de comprensión'),
    ...rights,
  ],
  podcast: [
    ...meta,
    { name: 'show', label: 'Programa', type: 'text', max: 120 },
    { name: 'audio', label: 'Audio', type: 'media', accept: 'audio', required: true },
    {
      name: 'segments',
      label: 'Transcripción',
      type: 'list',
      max: 300,
      fields: [
        { name: 'start', label: 'Segundo', type: 'number', min: 0, max: 36000 },
        { name: 'speaker', label: 'Quién habla', type: 'text', max: 60 },
        { name: 'text', label: 'Texto en inglés', type: 'text', required: true, max: 600 },
        { name: 'note', label: 'Traducción', type: 'text', max: 600 },
      ],
    },
    { ...glossary, name: 'keyTerms', label: 'Palabras clave' },
    questions('comprehension', 'Preguntas de comprensión'),
    ...rights,
  ],
  film: [
    ...meta,
    { name: 'director', label: 'Dirección', type: 'text', max: 120 },
    { name: 'video', label: 'Vídeo', type: 'media', accept: 'video' },
    {
      name: 'scenes',
      label: 'Escenas',
      type: 'list',
      max: 200,
      fields: [
        { name: 'start', label: 'Segundo', type: 'number', min: 0, max: 36000 },
        { name: 'speaker', label: 'Quién habla', type: 'text', max: 60 },
        { name: 'line', label: 'Frase en inglés', type: 'text', required: true, max: 400 },
        { name: 'translation', label: 'Traducción', type: 'text', max: 400 },
      ],
    },
    questions('comprehension', 'Preguntas de comprensión'),
    { name: 'relatedActivityIds', label: 'Actividades relacionadas (identificadores)', type: 'tags', max: 80 },
    ...rights,
  ],
  activity: [
    { name: 'type', label: 'Tipo de actividad', type: 'select', options: ACTIVITY_TYPES, required: true },
    ...meta.map((field) =>
      field.name === 'summary' ? { ...field, label: 'Descripción' } : field.name === 'cover' ? { ...field, label: 'Miniatura' } : field,
    ),
    { name: 'tagline', label: 'Subtítulo corto', type: 'text', max: 80 },
    { name: 'skill', label: 'Habilidad', type: 'select', options: SKILLS, required: true },
    { name: 'minutes', label: 'Minutos estimados', type: 'number', min: 1, max: 120 },
    { name: 'tool', label: 'Herramienta', type: 'select', options: EXTERNAL_TOOLS, required: true, showIf: onlyFor('external') },
    { name: 'url', label: 'Enlace a la actividad', type: 'url', required: true, showIf: onlyFor('external') },
    { name: 'instructions', label: 'Instrucciones para el niño', type: 'textarea', max: 1500 },
    {
      name: 'cards',
      label: 'Tarjetas',
      type: 'list',
      max: 60,
      showIf: onlyFor('vocabulary'),
      fields: glossary.fields,
    },
    questions('questions', 'Preguntas', onlyFor('quiz', 'reading')),
    {
      name: 'pairs',
      label: 'Parejas',
      type: 'list',
      max: 30,
      showIf: onlyFor('matching'),
      fields: [
        { name: 'left', label: 'Izquierda', type: 'text', required: true, max: 120 },
        { name: 'right', label: 'Derecha', type: 'text', required: true, max: 120 },
      ],
    },
    {
      name: 'blanks',
      label: 'Oraciones con hueco',
      type: 'list',
      max: 40,
      showIf: onlyFor('fill-blanks'),
      fields: [
        { name: 'sentence', label: 'Oración (usa ___ para el hueco)', type: 'text', required: true, max: 300 },
        { name: 'answer', label: 'Respuesta', type: 'text', required: true, max: 80 },
        { name: 'options', label: 'Banco de palabras', type: 'tags', max: 80 },
        { name: 'hint', label: 'Pista', type: 'text', max: 200 },
      ],
    },
    {
      name: 'listening',
      label: 'Fragmentos de escucha',
      type: 'list',
      max: 20,
      showIf: onlyFor('listening'),
      fields: [{ name: 'audio', label: 'Audio', type: 'media', accept: 'audio', required: true }, ...questionFields],
    },
    { name: 'passageTitle', label: 'Título del texto', type: 'text', max: 160, showIf: onlyFor('reading') },
    { name: 'passage', label: 'Texto para leer', type: 'paragraphs', max: 8000, showIf: onlyFor('reading') },
    { name: 'relatedIds', label: 'Contenido relacionado (identificadores)', type: 'tags', max: 80 },
    ...rights,
  ],
  page: [
    { name: 'title', label: 'Título', type: 'text', required: true, max: 120 },
    { name: 'summary', label: 'Entradilla', type: 'textarea', max: 600 },
    { name: 'body', label: 'Texto (deja una línea en blanco entre párrafos)', type: 'paragraphs', max: 12000 },
    { name: 'cover', label: 'Foto', type: 'media', accept: 'image' },
    { name: 'credits', label: 'Créditos de la foto', type: 'textarea', max: 600 },
  ],
}

export const SETTINGS_SCHEMA: Field[] = [
  { name: 'easterEgg', label: 'Juego oculto', type: 'select', options: [['on', 'Activado'], ['off', 'Desactivado']], required: true },
  { name: 'dedication', label: 'Dedicatoria del juego', type: 'textarea', max: 600 },
]

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
            errors.push(`${at}: fuera de rango`)
          }
          value = n
        }
        break
      }
      case 'select':
        value = cleanText(raw, 60)
        if (value && !field.options?.some(([option]) => option === value)) {
          errors.push(`${at}: opción no válida`)
          value = ''
        }
        break
      case 'url': {
        const text = cleanText(raw, 2000)
        if (text) {
          try {
            const url = new URL(text)
            if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
            value = url.toString()
          } catch {
            errors.push(`${at}: el enlace debe empezar por https://`)
          }
        }
        break
      }
      case 'media': {
        const text = cleanText(raw, 300)
        if (text && (!MEDIA_PATH.test(text) || text.includes('..'))) errors.push(`${at}: archivo no válido`)
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
    if (field.required && empty) errors.push(`${at}: obligatorio`)
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

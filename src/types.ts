// Tipos del dominio: contenido, actividades y estado persistente.
// Todo el contenido vive en `src/content/` y se puede editar sin tocar componentes.

export type SectionId = 'home' | 'song' | 'storytelling' | 'podcast' | 'short-film' | 'activities'

/** Fuente, licencia y créditos de una pieza (se muestran en su ficha). */
export interface Rights {
  source: string
  license: string
  credits: string
}

/** Lo que comparten todas las piezas editables desde el panel. */
export interface PieceMeta {
  /** Pieza de demostración: se muestra con la etiqueta «Ejemplo». */
  example: boolean
  rights: Rights
  age?: string
  /** Contenido insertado de Canva, Wordwall, Educaplay o YouTube (enlace ya convertido). */
  embed?: string
}

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

/** Un fragmento de letra o transcripción con marca de tiempo. */
export interface TimedLine {
  /** Segundos desde el inicio del audio. */
  start: number
  /** Texto en inglés (contenido de aprendizaje). */
  text: string
  /** Apoyo en español. Opcional: solo en las líneas que lo necesitan. */
  note?: string
  /** Vocabulario clave que se resalta en la línea. */
  keywords?: string[]
  /** Dibujo o foto junto a la línea. */
  image?: string
}

/** Entrada de glosario. */
export interface GlossEntry {
  term: string
  definition: string
  example: string
  /** Traducción al español. */
  translation: string
}

export interface Song extends PieceMeta {
  id: string
  title: string
  /** Nombre del artista o del proyecto de demostración. */
  artist: string
  level: Level
  /** Minutos y segundos del audio real. */
  duration: number
  /** Tono o idea central de la canción. */
  mood: string
  summary: string
  /** Letra completa en inglés. */
  lyrics: TimedLine[]
  glossary: GlossEntry[]
  /** Frases que la persona puede destacar (fragmentos de interés). */
  highlights: { id: string; label: string; start: number; end: number; note: string }[]
  /** Ruta del audio en `public/`. */
  audio: string
  cover: string
  coverTone: string
}

export interface StoryChapter {
  id: string
  title: string
  /** Párrafos del capítulo. */
  paragraphs: string[]
}

export interface Story extends PieceMeta {
  id: string
  title: string
  author: string
  level: Level
  /** Minutos estimados de lectura. */
  readingTime: number
  summary: string
  /** Introducción de un párrafo que se muestra antes de empezar. */
  intro: string
  chapters: StoryChapter[]
  glossary: GlossEntry[]
  /** Preguntas de comprensión lectora. */
  comprehension: QuizQuestion[]
  cover: string
  coverTone: string
}

export interface PodcastSegment {
  id: string
  speaker: string
  start: number
  text: string
  note?: string
}

export interface PodcastEpisode extends PieceMeta {
  id: string
  audio: string
  title: string
  show: string
  level: Level
  duration: number
  summary: string
  segments: PodcastSegment[]
  /** Palabras clave de cada episodio. */
  keyTerms: GlossEntry[]
  comprehension: QuizQuestion[]
  cover: string
  coverTone: string
}

export interface FilmScene {
  id: string
  /** Tiempo de inicio en segundos. */
  start: number
  /** Diálogo o narración en inglés. */
  line: string
  speaker?: string
  /** Traducción al español. */
  translation: string
}

export interface ShortFilm extends PieceMeta {
  id: string
  video?: string
  /** Vídeo de YouTube (youtube-nocookie, se carga al tocar). */
  youtube?: string
  title: string
  director: string
  level: Level
  duration: number
  synopsis: string
  scenes: FilmScene[]
  comprehension: QuizQuestion[]
  relatedActivityIds: string[]
  cover: string
  coverTone: string
}

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: QuizOption[]
  correctOptionId: string
  /** Explicación mostrada tras responder. */
  explanation: string
}

// ─── Actividades ────────────────────────────────────────────────────────────

export type ActivityKind =
  | 'vocabulary'
  | 'quiz'
  | 'matching'
  | 'fill-blanks'
  | 'listening'
  | 'reading'
  | 'external'

export interface VocabularyCard {
  id: string
  term: string
  definition: string
  example: string
  translation: string
}

export interface MatchingPair {
  id: string
  left: string
  right: string
}

export interface FillBlankItem {
  id: string
  /** Oración con `___` en el hueco. */
  sentence: string
  answer: string
  /** Banco de palabras para esta actividad. */
  options: string[]
  hint?: string
}

export interface ListeningItem {
  id: string
  /** Archivo de audio del fragmento. */
  audio: string
  /** Segundos de inicio dentro del fragmento (para clips más largos). */
  start?: number
  question: QuizQuestion
}

export interface ReadingPassage {
  id: string
  title: string
  paragraphs: string[]
  questions: QuizQuestion[]
}

/** Definición de una herramienta pedagógica: la actividad se registra aquí y
 *  la vista genérica la monta sin conocer su implementación. */
export interface ActivityDefinition extends PieceMeta {
  id: string
  kind: ActivityKind
  title: string
  tagline: string
  description: string
  /** Emoji? No. Icono Lucide (nombre) renderizado por el registro. */
  icon: string
  /** Duración estimada en minutos. */
  minutes: number
  level: Level
  /** Contenido de la actividad, según su tipo. */
  cards?: VocabularyCard[]
  pairs?: MatchingPair[]
  blanks?: FillBlankItem[]
  listening?: ListeningItem[]
  passage?: ReadingPassage
  questions?: QuizQuestion[]
  /** Contenido multimedia al que se relaciona (ids de canciones, historias...). */
  relatedIds: string[]
  skill?: string
  cover?: string
  instructions?: string
  /** Solo actividades externas: plataforma y enlace. */
  tool?: string
  url?: string
}

// ─── Estado persistente ─────────────────────────────────────────────────────

export interface ActivityResult {
  /** Puntuación 0-100. */
  score: number
  correct: number
  total: number
  /** Fecha ISO de la última ejecución. */
  at: string
  /** Segundos invertidos. */
  seconds: number
}

export interface MediaProgress {
  /** Fragmentos destacados por la persona. */
  highlightedIds: string[]
  /** Marcado como completado. */
  completed: boolean
}

export interface UserPreferences {
  /** Nombre mostrado en el saludo de Home. */
  displayName: string
  /** Objetivo diario de minutos. */
  dailyGoalMinutes: number
  /** Sidebar plegado en escritorio. */
  sidebarCollapsed: boolean
  /** Mostrar traducciones al español en las actividades. */
  showTranslations: boolean
  /** Tema de la interfaz. */
  theme: 'light' | 'dark'
}

export interface PersistedState {
  version: number
  preferences: UserPreferences
  /** Resultados por id de actividad. */
  activityResults: Record<string, ActivityResult>
  /** Progreso por id de contenido multimedia. */
  mediaProgress: Record<string, MediaProgress>
  /** Vocabulario que la persona marcó como dominar. */
  masteredTerms: string[]
  /** Ids de actividades completadas. */
  completedActivityIds: string[]
  /** Serie diaria de minutos, en formato YYYY-MM-DD. */
  dailyMinutes: Record<string, number>
  /** Última visita. */
  lastVisit: string
}

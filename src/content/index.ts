/**
 * Índice de contenido.
 *
 * El contenido llega de la API (lo publicado en el panel) o, si falla, de la
 * última copia guardada en el navegador o de la copia empaquetada en el build
 * (`snapshot.json`). `applyContent` rellena estas listas antes del primer
 * render, así que las vistas las leen como datos estáticos.
 */

import type { PublicContent, PublicItem } from '../shared/schema'
import type {
  ActivityDefinition,
  FilmScene,
  GlossEntry,
  PieceMeta,
  PodcastEpisode,
  QuizQuestion,
  ShortFilm,
  Song,
  Story,
  TimedLine,
} from '../types'

// ── Formato guardado en la base (ver src/shared/schema.ts) ──────────────────

interface RawQuestion {
  prompt: string
  options: string[]
  correct: number
  explanation?: string
}
type Raw = Record<string, unknown> & {
  title: string
  summary?: string
  level?: string
  age?: string
  cover?: string
  source?: string
  license?: string
  credits?: string
}

const STATIC = import.meta.env.VITE_STATIC === '1'

/** En la copia estática (file://) las rutas absolutas pasan a relativas. */
export function asset(path: string | undefined): string {
  if (!path) return ''
  return STATIC && path.startsWith('/') ? `.${path}` : path
}

const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
const text = (value: unknown): string => (typeof value === 'string' ? value : '')
const num = (value: unknown): number => (typeof value === 'number' ? value : 0)

function question(raw: RawQuestion, index: number, prefix: string): QuizQuestion {
  return {
    id: `${prefix}q${index + 1}`,
    prompt: raw.prompt,
    options: list<string>(raw.options).map((option, i) => ({ id: `o${i + 1}`, text: option })),
    correctOptionId: `o${raw.correct}`,
    explanation: raw.explanation ?? '',
  }
}
const questions = (value: unknown, prefix: string) =>
  list<RawQuestion>(value).map((raw, index) => question(raw, index, prefix))

function meta(item: PublicItem): PieceMeta {
  const data = item.data as Raw
  return {
    example: item.example,
    age: data.age,
    embed: text(data.embed) || undefined,
    rights: { source: text(data.source), license: text(data.license), credits: text(data.credits) },
  }
}

const level = (data: Raw) => (data.level ?? 'A1') as Song['level']

// ── Listas que leen las vistas ──────────────────────────────────────────────

export const songs: Song[] = []
export const stories: Story[] = []
export const episodes: PodcastEpisode[] = []
export const films: ShortFilm[] = []
export const activityDefinitions: ActivityDefinition[] = []

export interface Page {
  id: string
  title: string
  summary: string
  body: string[]
  cover: string
  credits: string
  example: boolean
}
export const pages: Record<string, Page | undefined> = {}

export const settings = { easterEgg: true, dedication: '' }

export interface ContentItem {
  id: string
  kind: 'song' | 'story' | 'podcast' | 'film'
  title: string
  subtitle: string
  summary: string
  level: string
  minutes: number
  cover: string
  route: string
  keywords: string[]
  example: boolean
}
export const allContent: ContentItem[] = []

const ICONS: Record<string, string> = {
  vocabulary: 'Type',
  quiz: 'ListChecks',
  matching: 'Zap',
  'fill-blanks': 'PenLine',
  listening: 'Headphones',
  reading: 'BookOpen',
  external: 'ExternalLink',
}

function toSong(item: PublicItem): Song {
  const data = item.data as Raw
  const lyrics: TimedLine[] = list<Raw>(data.lyrics).map((line) => ({
    start: num(line.start),
    text: text(line.text),
    note: text(line.note) || undefined,
    keywords: list<string>(line.keywords),
    image: line.image ? asset(text(line.image)) : undefined,
  }))
  const duration = Math.max(0, ...list<Raw>(data.highlights).map((h) => num(h.end)), ...lyrics.map((l) => l.start + 3))
  return {
    ...meta(item),
    id: item.id,
    title: data.title,
    artist: text(data.artist),
    level: level(data),
    duration,
    mood: text(data.mood),
    summary: text(data.summary),
    lyrics,
    glossary: list<GlossEntry>(data.glossary),
    highlights: list<Raw>(data.highlights).map((h, i) => ({
      id: `h${i + 1}`,
      label: text(h.label),
      start: num(h.start),
      end: num(h.end) || num(h.start) + 3.5,
      note: text(h.note),
    })),
    audio: asset(text(data.audio)),
    cover: asset(data.cover),
    coverTone: item.id,
  }
}

function toStory(item: PublicItem): Story {
  const data = item.data as Raw
  return {
    ...meta(item),
    id: item.id,
    title: data.title,
    author: text(data.author),
    level: level(data),
    readingTime: num(data.readingTime) || 5,
    summary: text(data.summary),
    intro: text(data.intro),
    chapters: list<Raw>(data.chapters).map((chapter, i) => ({
      id: `c${i + 1}`,
      title: text(chapter.title),
      paragraphs: list<string>(chapter.paragraphs),
    })),
    glossary: list<GlossEntry>(data.glossary),
    comprehension: questions(data.comprehension, `${item.id}-`),
    cover: asset(data.cover),
    coverTone: item.id,
  }
}

function toEpisode(item: PublicItem): PodcastEpisode {
  const data = item.data as Raw
  const segments = list<Raw>(data.segments).map((segment, i) => ({
    id: `${item.id}-s${i + 1}`,
    speaker: text(segment.speaker),
    start: num(segment.start),
    text: text(segment.text),
    note: text(segment.note) || undefined,
  }))
  return {
    ...meta(item),
    id: item.id,
    title: data.title,
    show: text(data.show),
    level: level(data),
    duration: (segments.at(-1)?.start ?? 0) + 10,
    summary: text(data.summary),
    segments,
    keyTerms: list<GlossEntry>(data.keyTerms),
    comprehension: questions(data.comprehension, `${item.id}-`),
    audio: asset(text(data.audio)),
    cover: asset(data.cover),
    coverTone: item.id,
  }
}

function toFilm(item: PublicItem): ShortFilm {
  const data = item.data as Raw
  const scenes: FilmScene[] = list<Raw>(data.scenes).map((scene, i) => ({
    id: `${item.id}-sc${i + 1}`,
    start: num(scene.start),
    line: text(scene.line),
    speaker: text(scene.speaker) || undefined,
    translation: text(scene.translation),
  }))
  return {
    ...meta(item),
    id: item.id,
    title: data.title,
    director: text(data.director),
    level: level(data),
    duration: (scenes.at(-1)?.start ?? 0) + 5,
    synopsis: text(data.summary),
    scenes,
    comprehension: questions(data.comprehension, `${item.id}-`),
    relatedActivityIds: list<string>(data.relatedActivityIds),
    video: data.video ? asset(text(data.video)) : undefined,
    youtube: text(data.youtube) || undefined,
    cover: asset(data.cover),
    coverTone: item.id,
  }
}

function toActivity(item: PublicItem): ActivityDefinition {
  const data = item.data as Raw
  const type = text(data.type) as ActivityDefinition['kind']
  const qs = questions(data.questions, `${item.id}-`)
  return {
    ...meta(item),
    id: item.id,
    kind: type,
    title: data.title,
    tagline: text(data.tagline),
    description: text(data.summary),
    icon: ICONS[type] ?? 'Target',
    minutes: num(data.minutes) || 5,
    level: level(data),
    skill: text(data.skill),
    cover: data.cover ? asset(data.cover) : undefined,
    instructions: text(data.instructions),
    tool: text(data.tool) || undefined,
    url: text(data.url) || undefined,
    relatedIds: list<string>(data.relatedIds),
    cards:
      type === 'vocabulary'
        ? list<Raw>(data.cards).map((card, i) => ({
            id: `k${i + 1}`,
            term: text(card.term),
            definition: text(card.definition),
            example: text(card.example),
            translation: text(card.translation),
          }))
        : undefined,
    questions: type === 'quiz' ? qs : undefined,
    pairs:
      type === 'matching'
        ? list<Raw>(data.pairs).map((pair, i) => ({ id: `p${i + 1}`, left: text(pair.left), right: text(pair.right) }))
        : undefined,
    blanks:
      type === 'fill-blanks'
        ? list<Raw>(data.blanks).map((blank, i) => ({
            id: `b${i + 1}`,
            sentence: text(blank.sentence),
            answer: text(blank.answer),
            options: list<string>(blank.options),
            hint: text(blank.hint) || undefined,
          }))
        : undefined,
    listening:
      type === 'listening'
        ? list<Raw & RawQuestion>(data.listening).map((entry, i) => ({
            id: `l${i + 1}`,
            audio: asset(text(entry.audio)),
            question: question(entry, i, `${item.id}-l`),
          }))
        : undefined,
    passage:
      type === 'reading'
        ? { id: 'p1', title: text(data.passageTitle), paragraphs: list<string>(data.passage), questions: qs }
        : undefined,
  }
}

const fill = <T>(target: T[], values: T[]) => target.splice(0, target.length, ...values)

/** Sustituye todo el contenido. Se llama una vez antes del primer render. */
export function applyContent(content: PublicContent): void {
  const of = (kind: PublicItem['kind']) => content.items.filter((item) => item.kind === kind)
  fill(songs, of('song').map(toSong))
  fill(stories, of('story').map(toStory))
  fill(episodes, of('podcast').map(toEpisode))
  fill(films, of('film').map(toFilm))
  fill(activityDefinitions, of('activity').map(toActivity))

  for (const key of Object.keys(pages)) delete pages[key]
  for (const item of of('page')) {
    const data = item.data as Raw
    pages[item.id] = {
      id: item.id,
      title: data.title,
      summary: text(data.summary),
      body: list<string>(data.body),
      cover: asset(data.cover),
      credits: text(data.credits),
      example: item.example,
    }
  }
  Object.assign(settings, content.settings)

  fill(allContent, [
    ...songs.map((song) => ({
      id: song.id,
      kind: 'song' as const,
      title: song.title,
      subtitle: song.artist,
      summary: song.summary,
      level: song.level,
      minutes: Math.max(1, Math.round(song.duration / 60)),
      cover: song.cover,
      route: `/song/${song.id}`,
      keywords: [song.title, song.mood, ...song.glossary.map((g) => g.term)],
      example: song.example,
    })),
    ...stories.map((story) => ({
      id: story.id,
      kind: 'story' as const,
      title: story.title,
      subtitle: story.author,
      summary: story.summary,
      level: story.level,
      minutes: story.readingTime,
      cover: story.cover,
      route: `/storytelling/${story.id}`,
      keywords: [story.title, ...story.glossary.map((g) => g.term)],
      example: story.example,
    })),
    ...episodes.map((episode) => ({
      id: episode.id,
      kind: 'podcast' as const,
      title: episode.title,
      subtitle: episode.show,
      summary: episode.summary,
      level: episode.level,
      minutes: Math.max(1, Math.round(episode.duration / 60)),
      cover: episode.cover,
      route: `/podcast/${episode.id}`,
      keywords: [episode.title, episode.show, ...episode.keyTerms.map((g) => g.term)],
      example: episode.example,
    })),
    ...films.map((film) => ({
      id: film.id,
      kind: 'film' as const,
      title: film.title,
      subtitle: film.director,
      summary: film.synopsis,
      level: film.level,
      minutes: Math.max(1, Math.round(film.duration / 60)),
      cover: film.cover,
      route: `/short-film/${film.id}`,
      keywords: [film.title, film.synopsis.slice(0, 60)],
      example: film.example,
    })),
  ])
}

export function findContent(id: string): ContentItem | undefined {
  return allContent.find((item) => item.id === id)
}

/** Contenido relacionado por término compartido: es la recomendación real. */
export function relatedContent(id: string, limit = 3): ContentItem[] {
  const source = allContent.find((item) => item.id === id)
  if (!source) return []
  const words = (item: ContentItem) =>
    item.keywords
      .join(' ')
      .toLowerCase()
      .split(/[^a-záéíóúñ]+/)
      .filter((word) => word.length > 4)
  const sourceWords = new Set(words(source))

  return allContent
    .filter((item) => item.id !== id)
    .map((item) => ({
      item,
      score: words(item).filter((word) => sourceWords.has(word)).length * 2 + (item.kind === source.kind ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item)
}

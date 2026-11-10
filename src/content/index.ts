/**
 * Índice de contenido.
 *
 * Los datos viven en `content/*.json` (editables sin tocar componentes) y aquí
 * se transforman al formato interno con las marcas de tiempo reales que dejó
 * el generador de multimedia.
 */

import filmsJson from '../../content/films.json'
import podcastsJson from '../../content/podcasts.json'
import songsJson from '../../content/songs.json'
import storiesJson from '../../content/stories.json'
import timingsJson from './timings.json'

import type {
  FilmScene,
  GlossEntry,
  PodcastEpisode,
  PodcastSegment,
  QuizQuestion,
  ShortFilm,
  Song,
  Story,
  StoryChapter,
  TimedLine,
} from '../types'

interface RawSong {
  id: string
  title: string
  artist: string
  level: Song['level']
  mood: string
  summary: string
  cover: string
  audio: string
  bed: string
  lyrics: { text: string; note?: string; keywords?: string[] }[]
  glossary: GlossEntry[]
  highlights: { id: string; label: string; start?: number; end?: number; note: string }[]
  relatedActivityIds: string[]
}

interface RawStory {
  id: string
  title: string
  author: string
  level: Story['level']
  readingTime: number
  cover: string
  summary: string
  intro: string
  chapters: { id: string; title: string; paragraphs: string[] }[]
  glossary: GlossEntry[]
  comprehension: QuizQuestion[]
}

interface RawEpisode {
  id: string
  title: string
  show: string
  level: PodcastEpisode['level']
  cover: string
  summary: string
  segments: { speaker: string; start: number; text: string; note?: string }[]
  keyTerms: GlossEntry[]
  comprehension: QuizQuestion[]
}

interface RawFilm {
  id: string
  title: string
  director: string
  level: ShortFilm['level']
  cover: string
  synopsis: string
  scenes: { start: number; speaker?: string; line: string; translation: string }[]
  comprehension: QuizQuestion[]
  relatedActivityIds: string[]
}

type Timings = Record<string, unknown>

const timings = timingsJson as Timings

function getTimings(key: string): { start: number; end: number }[] {
  const value = timings[key]
  return Array.isArray(value) ? (value as { start: number; end: number }[]) : []
}

export function mediaDuration(key: string): number {
  const value = timings[`duration:${key}`]
  return typeof value === 'number' ? value : 0
}

// ── Canciones ───────────────────────────────────────────────────────────────

export const songs: Song[] = (songsJson.songs as RawSong[]).map((song) => {
  const marks = getTimings(`songs:${song.id}`)
  const lyrics: TimedLine[] = song.lyrics.map((line, index) => {
    const mark = marks[index]
    return {
      start: mark?.start ?? 0,
      text: line.text,
      note: line.note,
      keywords: line.keywords,
    }
  })

  // Los fragmentos destacados se anclan a la línea que mencionan.
  const highlights = song.highlights.map((highlight, index) => {
    const fallback = lyrics[Math.min(index, lyrics.length - 1)]
    const start = highlight.start ?? fallback?.start ?? 0
    const end = highlight.end ?? start + 3.5
    return { ...highlight, start, end }
  })

  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    level: song.level,
    duration: mediaDuration(`songs:${song.id}`),
    mood: song.mood,
    summary: song.summary,
    lyrics,
    glossary: song.glossary,
    highlights,
    audio: song.audio.startsWith('/') ? song.audio : `/${song.audio}`,
    cover: `/media/covers/${song.cover}.jpg`,
    coverTone: song.cover,
  }
})

// ── Historias ───────────────────────────────────────────────────────────────

export const stories: Story[] = (storiesJson.stories as RawStory[]).map((story) => ({
  id: story.id,
  title: story.title,
  author: story.author,
  level: story.level,
  readingTime: story.readingTime,
  summary: story.summary,
  intro: story.intro,
  chapters: story.chapters as StoryChapter[],
  glossary: story.glossary,
  comprehension: story.comprehension,
  cover: `/media/covers/${story.cover}.jpg`,
  coverTone: story.cover,
}))

// ── Podcasts ────────────────────────────────────────────────────────────────

export const episodes: PodcastEpisode[] = (podcastsJson.episodes as RawEpisode[]).map(
  (episode) => {
    const marks = getTimings(`podcasts:${episode.id}`)
    const segments: PodcastSegment[] = episode.segments.map((segment, index) => {
      const mark = marks[index]
      return {
        id: `${episode.id}-s${index + 1}`,
        speaker: segment.speaker,
        start: mark?.start ?? segment.start ?? 0,
        text: segment.text,
        note: segment.note,
      }
    })

    return {
      id: episode.id,
      title: episode.title,
      show: episode.show,
      level: episode.level,
      duration: mediaDuration(`podcasts:${episode.id}`),
      summary: episode.summary,
      segments,
      keyTerms: episode.keyTerms,
      comprehension: episode.comprehension,
      cover: `/media/covers/${episode.cover}.jpg`,
      coverTone: episode.cover,
    }
  },
)

// ── Cortiempres ─────────────────────────────────────────────────────────────

export const films: ShortFilm[] = (filmsJson.films as RawFilm[]).map((film) => {
  const marks = getTimings(`films:${film.id}`)
  const scenes: FilmScene[] = film.scenes.map((scene, index) => {
    const mark = marks[index]
    return {
      id: `${film.id}-sc${index + 1}`,
      start: mark?.start ?? scene.start ?? 0,
      line: scene.line,
      speaker: scene.speaker,
      translation: scene.translation,
    }
  })

  return {
    id: film.id,
    title: film.title,
    director: film.director,
    level: film.level,
    duration: mediaDuration(`films:${film.id}`),
    synopsis: film.synopsis,
    scenes,
    comprehension: film.comprehension,
    relatedActivityIds: film.relatedActivityIds,
    cover: `/media/covers/${film.cover}.jpg`,
    coverTone: film.cover,
  }
})

// ── Búsquedas transversales ─────────────────────────────────────────────────

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
}

export const allContent: ContentItem[] = [
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
  })),
]

export function findContent(id: string): ContentItem | undefined {
  return allContent.find((item) => item.id === id)
}

/** Contenido relacionado por término compartido: es la recomendación real. */
export function relatedContent(id: string, limit = 3): ContentItem[] {
  const source = allContent.find((item) => item.id === id)
  if (!source) return []
  const sourceWords = new Set(
    source.keywords
      .join(' ')
      .toLowerCase()
      .split(/[^a-záéíóúñ]+/)
      .filter((word) => word.length > 4),
  )

  return allContent
    .filter((item) => item.id !== id)
    .map((item) => {
      const overlap = item.keywords
        .join(' ')
        .toLowerCase()
        .split(/[^a-záéíóúñ]+/)
        .filter((word) => word.length > 4 && sourceWords.has(word)).length
      const sameKind = item.kind === source.kind ? 1 : 0
      return { item, score: overlap * 2 + sameKind }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item)
}

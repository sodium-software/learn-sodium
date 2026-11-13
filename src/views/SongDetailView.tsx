import { Link, useParams } from 'react-router-dom'
import { Cover } from '../components/Cover'
import { PieceActivities } from '../components/PieceActivities'
import { TextPictures } from '../components/TextPictures'
import { Embed } from '../components/Embeds'
import { useState } from 'react'

import { AudioPlayer } from '../components/AudioPlayer'
import { Icon, LevelTag, Credits } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { relatedContent, songs } from '../content'
import { formatDuration, formatTime } from '../lib/format'
import { clsx } from '../lib/cn'

/**
 * Vista de una canción: reproductor, letra sincronizada, fragmentos
 * destacables y vocabulario.
 */
export function SongDetailView() {
  const { id } = useParams<{ id: string }>()
  const song = songs.find((entry) => entry.id === id)
  const { state, updateMedia, toggleMastered } = useProgress()
  const [time, setTime] = useState(0)

  if (!song) {
    return (
      <div className="frame py-16">
        <h1 className="text-head text-ink">We can't find that song</h1>
        <p className="mt-3 text-ink-soft">Go back to the list and pick another one.</p>
        <Link to="/song" className="btn btn-primary mt-6">
          Back to the list
        </Link>
      </div>
    )
  }

  const progress = state.mediaProgress[song.id]
  const highlighted = progress?.highlightedIds ?? []
  const activeLine = song.lyrics.findIndex(
    (line) => time >= line.start && time < line.start + 4.5,
  )
  const related = relatedContent(song.id, 3)

  const toggleHighlight = (highlightId: string) => {
    const next = highlighted.includes(highlightId)
      ? highlighted.filter((entry) => entry !== highlightId)
      : [...highlighted, highlightId]
    updateMedia(song.id, { highlightedIds: next })
  }

  const jumpTo = (start: number) => {
    setTime(start)
    const audio = document.querySelector<HTMLAudioElement>(`audio[src="${song.audio}"]`)
    if (audio) {
      audio.currentTime = start
      void audio.play().catch(() => undefined)
    }
  }

  return (
    <div>
      {/* ── Cabecera ───────────────────────────────────────────────────── */}
      <header className="bg-sheet">
        <div className="frame grid grid-cols-1 gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-14">
          <Cover src={song.cover} kind="song" alt={`Cover of ${song.title}`} className="aspect-[4/3] lg:aspect-square" />

          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <LevelTag level={song.level} />
              <span className="text-sm text-ink-mute">{song.artist}</span>
              <span className="text-sm text-ink-mute tnum">
                {formatDuration(song.duration)}
              </span>
            </div>

            <h1 className="mt-4 text-display font-display leading-[0.98] text-ink">
              {song.title}
            </h1>

            <p className="mt-5 max-w-2xl text-lead text-ink-soft">{song.summary}</p>

            <p className="mt-4 max-w-2xl text-sm italic text-ink-mute">
              {song.mood}
            </p>
          </div>
        </div>
      </header>

      <div className="frame py-12">
        {song.embed ? (
          <div className="mb-12">
            <Embed src={song.embed} title={song.title} poster={song.cover} />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            {/* ── Reproductor ───────────────────────────────────────────── */}
            <AudioPlayer
              src={song.audio}
              time={time}
              onTimeChange={setTime}
              label={song.title}
            />

            {/* ── Letra ────────────────────────────────────────────────── */}
            <section className="mt-12" aria-labelledby="letra">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 id="letra" className="text-head text-ink">
                    The words
                  </h2>
                  {song.lyrics.length > 0 ? (
                    <p className="mt-2 text-sm text-ink-soft">
                      The line you hear lights up. Tap a line to jump to that part.
                    </p>
                  ) : null}
                </div>
              </div>

              <TextPictures pictures={song.textPictures} title={`Lyrics of ${song.title}`} />
              <ol className="mt-6">
                {song.lyrics.map((line, index) => {
                  const isActive = index === activeLine
                  const keywordHit = line.keywords?.some((word) =>
                    highlighted.some((id) => {
                      const highlight = song.highlights.find((entry) => entry.id === id)
                      return highlight?.label
                        .toLowerCase()
                        .split(' ')
                        .some((token) => word.toLowerCase().includes(token))
                    }),
                  )

                  return (
                    <li key={`${line.start}-${index}`}>
                      <button
                        type="button"
                        onClick={() => jumpTo(line.start)}
                        className={clsx(
                          'flex w-full items-start gap-4 px-1 py-3 text-left transition-colors',
                          isActive ? 'bg-accent-pale/40' : 'hover:bg-sheet',
                        )}
                      >
                        <span className="tnum w-12 shrink-0 pt-1 text-xs text-ink-faint">
                          {formatTime(line.start)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={clsx(
                              'block font-read text-lg leading-relaxed',
                              isActive ? 'text-ink' : 'text-ink-soft',
                              keywordHit && 'text-accent',
                            )}
                          >
                            {line.text}
                          </span>
                          {line.note ? (
                            <span className="mt-1 block text-sm text-ink-mute">{line.note}</span>
                          ) : null}
                        </span>
                        {line.image ? (
                          <img src={line.image} alt="" loading="lazy" className="h-20 w-20 shrink-0 object-cover sm:h-28 sm:w-28" />
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>

            {/* ── Fragmentos destacables ────────────────────────────────── */}
            <section className="mt-14" aria-labelledby="fragmentos">
              <h2 id="fragmentos" className="text-head text-ink">
                Parts to come back to
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-soft">
                Save the lines you want to keep close. They stay saved in this
                browser.
              </p>

              <div className="mt-6 space-y-3">
                {song.highlights.map((highlight) => {
                  const isOn = highlighted.includes(highlight.id)
                  return (
                    <div
                      key={highlight.id}
                      className={clsx(
                        'flex flex-col gap-4 border-2 px-5 py-4 sm:flex-row sm:items-start',
                        isOn ? 'border-accent bg-accent-pale' : 'border-transparent bg-sheet',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => jumpTo(highlight.start)}
                        className="shrink-0 text-left"
                        aria-label={`Play from ${highlight.label}`}
                      >
                        <span className="flex items-center gap-2 font-display text-base text-ink">
                          <Icon name="Play" size={15} />
                          {highlight.label}
                        </span>
                        <span className="mt-1 block text-xs text-ink-mute tnum">
                          {formatTime(highlight.start)}
                        </span>
                      </button>

                      <p className="flex-1 text-sm text-ink-soft">{highlight.note}</p>

                      <button
                        type="button"
                        onClick={() => toggleHighlight(highlight.id)}
                        aria-pressed={isOn}
                        className={clsx(
                          'shrink-0 min-h-12 px-5 text-base font-bold transition-colors',
                          isOn
                            ? 'bg-accent text-accent-ink'
                            : 'bg-tint text-ink hover:bg-tint-deep',
                        )}
                      >
                        {isOn ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ── Columna lateral ──────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <section className="panel px-5 py-5">
              <h2 className="font-display text-lg text-ink">
                Words
              </h2>
              <dl className="mt-4 space-y-4">
                {song.glossary.map((entry) => {
                  const isMastered = state.masteredTerms.includes(entry.term)
                  return (
                    <div key={entry.term}>
                      <dt className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-ink">{entry.term}</span>
                        <button
                          type="button"
                          onClick={() => toggleMastered(entry.term)}
                          aria-pressed={isMastered}
                          className={clsx(
                            'shrink-0 min-h-12 px-4 text-base font-bold transition-colors',
                            isMastered
                              ? 'bg-green text-white'
                              : 'bg-tint text-ink hover:bg-tint-deep',
                          )}
                        >
                          {isMastered ? 'Learned' : 'Mark as learned'}
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-ink-soft">{entry.definition}</dd>
                      <dd className="mt-1 font-read text-sm italic text-ink-mute">
                        {entry.example}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>

            {related.length > 0 ? (
              <section className="panel mt-6 px-5 py-5">
                <h2 className="font-display text-lg text-ink">
                  Try next
                </h2>
                <ul className="mt-3">
                  {related.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.route}
                        className="block py-3 text-sm text-ink transition-colors hover:text-accent"
                      >
                        {item.title}
                        <span className="mt-0.5 block text-xs text-ink-mute">
                          {item.subtitle}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
      <div className="frame">
        <PieceActivities pieceId={song.id} title={song.title} />
      </div>
      <div className="frame pb-12">
        <Credits piece={song} />
      </div>
    </div>
  )
}

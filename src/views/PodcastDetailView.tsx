import { useState } from 'react'
import { Cover } from '../components/Cover'
import { PieceActivities } from '../components/PieceActivities'
import { TextPictures } from '../components/TextPictures'
import { Embed } from '../components/Embeds'
import { Link, useParams } from 'react-router-dom'

import { AudioPlayer } from '../components/AudioPlayer'
import { Icon, LevelTag, ProgressBar, Credits } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { episodes, relatedContent } from '../content'
import { clsx } from '../lib/cn'
import { formatTime } from '../lib/format'

/**
 * Episodio de podcast: reproductor, transcripción sincronizada y comprensión
 * audible.
 */
export function PodcastDetailView() {
  const { id } = useParams<{ id: string }>()
  const episode = episodes.find((entry) => entry.id === id)
  const { state, toggleMastered } = useProgress()
  const [time, setTime] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  if (!episode) {
    return (
      <div className="frame py-16">
        <h1 className="text-head text-ink">We can't find that episode</h1>
        <Link to="/podcast" className="btn btn-primary mt-6">
          Back to the list
        </Link>
      </div>
    )
  }

  const related = relatedContent(episode.id, 3)
  const correct = episode.comprehension.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length
  const allAnswered = episode.comprehension.every((question) => answers[question.id])
  const activeSegment = episode.segments.findIndex(
    (segment) => time >= segment.start && time < segment.start + 12,
  )

  const jumpTo = (start: number) => {
    setTime(start)
    const audio = document.querySelector<HTMLAudioElement>(
      `audio[src="${episode.audio}"]`,
    )
    if (audio) {
      audio.currentTime = start
      void audio.play().catch(() => undefined)
    }
  }

  return (
    <div>
      <header className="bg-sheet">
        <div className="frame grid grid-cols-1 gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-14">
          <Cover src={episode.cover} kind="podcast" alt={`Cover of ${episode.title}`} className="aspect-[4/3] lg:aspect-square" />
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <LevelTag level={episode.level} />
              <span className="text-sm text-ink-mute">{episode.show}</span>
            </div>
            <h1 className="mt-4 text-display font-display leading-[0.98] text-ink">
              {episode.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lead text-ink-soft">{episode.summary}</p>
          </div>
        </div>
      </header>

      <div className="frame py-12">
        {episode.embed ? (
          <div className="mb-12">
            <Embed src={episode.embed} title={episode.title} poster={episode.cover} />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            {episode.audio ? (
              <AudioPlayer src={episode.audio} time={time} onTimeChange={setTime} label={episode.title} />
            ) : null}

            {/* ── Transcripción ────────────────────────────────────────── */}
            <section className="mt-12" aria-labelledby="transcripcion">
              <h2 id="transcripcion" className="text-head text-ink">
                What they say
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {episode.audio
                  ? 'Tap a part to jump to that moment. The part you hear lights up.'
                  : 'The words of the episode, part by part.'}
              </p>

              <TextPictures pictures={episode.textPictures} title={`Script of ${episode.title}`} />
              <div className="mt-6">
                {episode.segments.map((segment, index) => {
                  const isActive = index === activeSegment
                  return (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => jumpTo(segment.start)}
                      className={clsx(
                        'flex w-full items-start gap-4 px-1 py-4 text-left transition-colors',
                        isActive ? 'bg-accent-pale/40' : 'hover:bg-sheet',
                      )}
                    >
                      <span className="tnum w-12 shrink-0 pt-1 text-xs text-ink-faint">
                        {formatTime(segment.start)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={clsx(
                            'block text-sm font-medium',
                            isActive ? 'text-accent' : 'text-ink-mute',
                          )}
                        >
                          {segment.speaker}
                        </span>
                        <span
                          className={clsx(
                            'mt-1 block font-read text-lg leading-relaxed',
                            isActive ? 'text-ink' : 'text-ink-soft',
                          )}
                        >
                          {segment.text}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ── Comprensión ──────────────────────────────────────────── */}
            {episode.comprehension.length > 0 ? (
            <section className="mt-16" aria-labelledby="comprension-podcast">
              <h2 id="comprension-podcast" className="text-head text-ink">
                Questions
              </h2>

              <div className="mt-6 space-y-4">
                {episode.comprehension.map((question) => {
                  const chosen = answers[question.id]
                  const isCorrect = chosen === question.correctOptionId
                  return (
                    <div key={question.id} className="panel px-5 py-5">
                      <p className="text-base font-medium text-ink">{question.prompt}</p>
                      <div className="mt-4 space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isChosen = chosen === option.id
                          const isAnswer = option.id === question.correctOptionId
                          const showState = checked && (isChosen || isAnswer)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                              }
                              disabled={checked}
                              aria-pressed={isChosen}
                              className={clsx(
                                'flex min-h-14 w-full items-center gap-3 border-2 px-4 py-2.5 text-left text-lg transition-colors',
                                showState && isAnswer
                                  ? 'border-accent bg-accent-pale/40'
                                  : showState && isChosen
                                    ? 'border-wrong bg-wrong-pale/50'
                                    : 'border-transparent bg-tint hover:bg-tint-deep',
                                checked && !showState && 'opacity-55',
                              )}
                            >
                              <span
                                className={clsx(
                                  'flex h-9 w-9 shrink-0 items-center justify-center border-2 text-base font-bold',
                                  showState && isAnswer
                                    ? 'border-accent bg-accent text-accent-ink'
                                    : showState && isChosen
                                      ? 'border-wrong bg-wrong text-white'
                                      : 'border-transparent bg-sheet text-ink',
                                )}
                              >
                                {showState && isAnswer ? (
                                  <Icon name="Check" size={11} strokeWidth={3} />
                                ) : showState && isChosen ? (
                                  <Icon name="X" size={11} strokeWidth={3} />
                                ) : (
                                  String.fromCharCode(65 + optionIndex)
                                )}
                              </span>
                              <span className="text-sm leading-relaxed text-ink">
                                {option.text}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      {checked ? (
                        <p className="mt-3 text-sm text-ink-soft">
                          {isCorrect ? 'Correct. ' : 'Not quite. '}
                          {question.explanation}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setChecked(true)}
                  disabled={!allAnswered}
                  className="btn btn-primary"
                >
                  Check answers
                </button>
                {checked ? (
                  <div className="flex items-center gap-3">
                    <ProgressBar value={correct} max={episode.comprehension.length} />
                    <p className="text-sm text-ink-soft tnum">
                      {correct} of {episode.comprehension.length}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <section className="panel px-5 py-5">
              <h2 className="font-display text-lg text-ink">
                Key words
              </h2>
              <dl className="mt-4 space-y-4">
                {episode.keyTerms.map((entry) => {
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
                            isMastered ? 'bg-green text-white' : 'bg-tint text-ink hover:bg-tint-deep',
                          )}
                        >
                          {isMastered ? 'Learned' : 'Mark as learned'}
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-ink-soft">{entry.definition}</dd>
                      <dd className="mt-1 text-xs text-ink-mute">{entry.translation}</dd>
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
        <PieceActivities pieceId={episode.id} title={episode.title} />
      </div>
      <div className="frame pb-12">
        <Credits piece={episode} />
      </div>
    </div>
  )
}

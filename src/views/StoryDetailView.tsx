import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Icon, LevelTag, ProgressBar, Credits } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { relatedContent, stories } from '../content'
import { clsx } from '../lib/cn'

/**
 * Lectura inmersiva de una historia: capítulos, glosario en el margen y
 * preguntas de comprensión al final.
 */
export function StoryDetailView() {
  const { id } = useParams<{ id: string }>()
  const story = stories.find((entry) => entry.id === id)
  const { state, updateMedia, toggleMastered } = useProgress()
  const [chapterIndex, setChapterIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  if (!story) {
    return (
      <div className="frame py-16">
        <h1 className="text-head text-ink">No encontramos esa historia</h1>
        <Link to="/storytelling" className="btn btn-primary mt-6">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const chapter = story.chapters[chapterIndex]
  const related = relatedContent(story.id, 3)
  const correct = story.comprehension.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length
  const allAnswered = story.comprehension.every((question) => answers[question.id])

  const markComplete = () => {
    updateMedia(story.id, { completed: true })
  }

  return (
    <div>
      <header className="border-b border-tint-deep bg-sheet">
        <div className="frame grid grid-cols-1 gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-14">
          <img
            src={story.cover}
            alt={`Portada de ${story.title}`}
            className="aspect-[4/3] w-full object-cover lg:aspect-square"
          />
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <LevelTag level={story.level} />
              <span className="text-sm text-ink-mute">{story.author}</span>
              <span className="text-sm text-ink-mute tnum">{story.readingTime} min</span>
            </div>
            <h1 className="mt-4 text-display font-display font-semibold leading-[0.98] tracking-[-0.04em] text-ink">
              {story.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lead text-ink-soft">{story.summary}</p>
          </div>
        </div>
      </header>

      <div className="frame py-12">
        {/* ── Introducción ─────────────────────────────────────────────── */}
        <p className="max-w-3xl border-l-2 border-accent pl-5 font-read text-xl leading-relaxed text-ink">
          {story.intro}
        </p>

        {/* ── Capítulos ────────────────────────────────────────────────── */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <nav className="mb-8 flex flex-wrap gap-2" aria-label="Capítulos">
              {story.chapters.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setChapterIndex(index)}
                  aria-current={index === chapterIndex}
                  className={clsx(
                    'border px-3 py-2 text-sm transition-colors',
                    index === chapterIndex
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-tint-deep text-ink-soft hover:border-ink-mute hover:text-ink',
                  )}
                >
                  {entry.title}
                </button>
              ))}
            </nav>

            <article className="panel px-6 py-8 sm:px-10 sm:py-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                {chapter.title}
              </h2>
              <div className="prose-read mt-6">
                {chapter.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </article>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {chapterIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setChapterIndex(chapterIndex - 1)}
                  className="btn btn-secondary"
                >
                  <Icon name="ChevronLeft" size={16} />
                  Capítulo anterior
                </button>
              ) : null}
              {chapterIndex < story.chapters.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setChapterIndex(chapterIndex + 1)}
                  className="btn btn-secondary"
                >
                  Capítulo siguiente
                  <Icon name="ChevronRight" size={16} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={markComplete}
                className="btn btn-primary ml-auto"
              >
                <Icon name="Check" size={16} />
                Marcar como leída
              </button>
            </div>

            {/* ── Comprensión lectora ──────────────────────────────────── */}
            <section className="mt-16" aria-labelledby="comprension">
              <h2 id="comprension" className="text-head text-ink">
                Preguntas de comprensión
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-soft">
                Responde todas y comprueba. No hay penalización: volver a leer es parte
                del método.
              </p>

              <div className="mt-6 space-y-4">
                {story.comprehension.map((question) => {
                  const chosen = answers[question.id]
                  const isCorrect = chosen === question.correctOptionId
                  return (
                    <div key={question.id} className="panel px-5 py-5">
                      <p className="text-base font-medium text-ink">{question.prompt}</p>

                      <div className="mt-4 space-y-2">
                        {question.options.map((option) => {
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
                                'flex w-full items-start gap-3 border px-4 py-2.5 text-left transition-colors',
                                showState && isAnswer
                                  ? 'border-accent bg-accent-pale/40'
                                  : showState && isChosen
                                    ? 'border-wrong bg-wrong-pale/50'
                                    : 'border-tint-deep bg-sheet hover:border-ink-mute',
                                checked && !showState && 'opacity-55',
                              )}
                            >
                              <span
                                className={clsx(
                                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[0.6875rem] font-semibold',
                                  showState && isAnswer
                                    ? 'border-accent bg-accent text-accent-ink'
                                    : showState && isChosen
                                      ? 'border-wrong bg-wrong text-white'
                                      : 'border-tint-deep text-ink-mute',
                                )}
                              >
                                {showState && isAnswer ? (
                                  <Icon name="Check" size={11} strokeWidth={3} />
                                ) : showState && isChosen ? (
                                  <Icon name="X" size={11} strokeWidth={3} />
                                ) : (
                                  option.id.toUpperCase()
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
                        <p
                          className={clsx(
                            'mt-3 border-l-2 pl-4 text-sm',
                            isCorrect
                              ? 'border-accent text-ink-soft'
                              : 'border-wrong text-ink-soft',
                          )}
                        >
                          {isCorrect ? 'Correcto. ' : 'No es correcto. '}
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
                  Comprobar respuestas
                </button>
                {checked ? (
                  <div className="flex items-center gap-3">
                    <ProgressBar value={correct} max={story.comprehension.length} />
                    <p className="text-sm text-ink-soft tnum">
                      {correct} de {story.comprehension.length}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          {/* ── Glosario ─────────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <section className="panel px-5 py-5">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                Vocabulario
              </h2>
              <dl className="mt-4 space-y-4">
                {story.glossary.map((entry) => {
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
                            'shrink-0 text-xs transition-colors',
                            isMastered ? 'text-accent' : 'text-ink-faint hover:text-ink',
                          )}
                        >
                          {isMastered ? 'Dominada' : 'Marcar'}
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
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                  Sigue con
                </h2>
                <ul className="mt-3 divide-y divide-tint-deep">
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
      <div className="frame pb-12">
        <Credits piece={story} />
      </div>
    </div>
  )
}

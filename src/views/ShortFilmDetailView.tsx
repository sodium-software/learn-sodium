import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Icon, LevelTag, ProgressBar } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { films, relatedContent } from '../content'
import { clsx } from '../lib/cn'
import { formatTime } from '../lib/format'

/**
 * Cortometraje: reproductor de vídeo, sinopsis, escenas y comprensión.
 */
export function ShortFilmDetailView() {
  const { id } = useParams<{ id: string }>()
  const film = films.find((entry) => entry.id === id)
  const { state, updateMedia } = useProgress()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [time, setTime] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  if (!film) {
    return (
      <div className="frame py-16">
        <h1 className="text-head text-ink">No encontramos ese cortometraje</h1>
        <Link to="/short-film" className="btn btn-primary mt-6">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const related = relatedContent(film.id, 3)
  const correct = film.comprehension.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length
  const allAnswered = film.comprehension.every((question) => answers[question.id])
  const activeScene = film.scenes.findIndex(
    (scene) => time >= scene.start && time < scene.start + 8,
  )

  const jumpTo = (start: number) => {
    const video = videoRef.current
    setTime(start)
    if (video) {
      video.currentTime = start
      void video.play().catch(() => undefined)
    }
  }

  return (
    <div>
      <header className="border-b border-tint-deep bg-sheet">
        <div className="frame grid grid-cols-1 gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-14">
          <img
            src={film.cover}
            alt={`Portada de ${film.title}`}
            className="aspect-[4/3] w-full object-cover lg:aspect-square"
          />
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <LevelTag level={film.level} />
              <span className="text-sm text-ink-mute">{film.director}</span>
              <span className="text-sm text-ink-mute tnum">
                {formatTime(film.duration)}
              </span>
            </div>
            <h1 className="mt-4 text-display font-display font-semibold leading-[0.98] tracking-[-0.04em] text-ink">
              {film.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lead text-ink-soft">{film.synopsis}</p>
          </div>
        </div>
      </header>

      <div className="frame py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            {/* ── Reproductor ───────────────────────────────────────────── */}
            <div className="panel overflow-hidden bg-ink p-0">
              <video
                ref={videoRef}
                src={`/media/video/${film.id}.mp4`}
                controls
                preload="metadata"
                className="block aspect-video w-full"
                onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
              />
            </div>

            <p className="mt-3 text-xs text-ink-mute">
              Cortometraje de demostración generado localmente: imágenes tipográficas con
              la narración original en inglés.
            </p>

            {/* ── Escenas ───────────────────────────────────────────────── */}
            <section className="mt-12" aria-labelledby="escenas">
              <h2 id="escenas" className="text-head text-ink">
                Las escenas
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Diálogo con traducción. Pulsa una escena para saltar a ese momento.
              </p>

              <ol className="mt-6 divide-y divide-tint-deep border-y border-tint-deep">
                {film.scenes.map((scene, index) => {
                  const isActive = index === activeScene
                  return (
                    <li key={scene.id}>
                      <button
                        type="button"
                        onClick={() => jumpTo(scene.start)}
                        className={clsx(
                          'flex w-full items-start gap-4 px-1 py-4 text-left transition-colors',
                          isActive ? 'bg-accent-pale/40' : 'hover:bg-sheet',
                        )}
                      >
                        <span className="tnum w-12 shrink-0 pt-1 text-xs text-ink-faint">
                          {formatTime(scene.start)}
                        </span>
                        <span className="min-w-0 flex-1">
                          {scene.speaker ? (
                            <span className="block text-xs font-medium text-ink-mute">
                              {scene.speaker}
                            </span>
                          ) : null}
                          <span
                            className={clsx(
                              'mt-1 block font-read text-lg leading-relaxed',
                              isActive ? 'text-ink' : 'text-ink-soft',
                            )}
                          >
                            {scene.line}
                          </span>
                          <span className="mt-1 block text-sm text-ink-mute">
                            {scene.translation}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>

            {/* ── Comprensión ──────────────────────────────────────────── */}
            <section className="mt-16" aria-labelledby="comprension-film">
              <h2 id="comprension-film" className="text-head text-ink">
                Preguntas de comprensión
              </h2>

              <div className="mt-6 space-y-4">
                {film.comprehension.map((question) => {
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
                        <p className="mt-3 border-l-2 border-tint-deep pl-4 text-sm text-ink-soft">
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
                    <ProgressBar value={correct} max={film.comprehension.length} />
                    <p className="text-sm text-ink-soft tnum">
                      {correct} de {film.comprehension.length}
                    </p>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => updateMedia(film.id, { completed: true })}
                  className="btn btn-secondary ml-auto"
                >
                  <Icon name="Check" size={16} />
                  Marcar como visto
                </button>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            {film.relatedActivityIds.length > 0 ? (
              <section className="panel px-5 py-5">
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                  Practica con esto
                </h2>
                <ul className="mt-3 divide-y divide-tint-deep">
                  {film.relatedActivityIds.map((activityId) => (
                    <li key={activityId}>
                      <Link
                        to={`/activities/${activityId}`}
                        className="block py-3 text-sm text-ink transition-colors hover:text-accent"
                      >
                        {activityId.replace('act-', '').replace(/-/g, ' ')}
                        <span className="mt-0.5 block text-xs text-ink-mute">
                          Actividad relacionada
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

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

            <p className="mt-6 text-xs text-ink-mute">
              Progreso guardado:{' '}
              {state.mediaProgress[film.id]?.completed ? 'visto' : 'pendiente'}.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

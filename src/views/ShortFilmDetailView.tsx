import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Icon, LevelTag, ProgressBar, Credits } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { films, relatedContent } from '../content'
import { activityDefinitions } from '../activities/registry'
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
      <header className="bg-sheet">
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
            <h1 className="mt-4 text-display font-display font-extrabold leading-[0.98] text-ink">
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
              {film.video ? (
                <video
                  ref={videoRef}
                  src={film.video}
                  poster={film.cover}
                  controls
                  preload="metadata"
                  className="block aspect-video w-full"
                  onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
                />
              ) : (
                <img src={film.cover} alt="" className="block aspect-video w-full object-cover" />
              )}
            </div>

            <p className="mt-3 text-xs text-ink-mute">
              {film.video
                ? 'Pulsa una escena para saltar a ese momento del vídeo.'
                : 'Este cortometraje todavía no tiene vídeo: puedes leer sus escenas.'}
            </p>

            {/* ── Escenas ───────────────────────────────────────────────── */}
            <section className="mt-12" aria-labelledby="escenas">
              <h2 id="escenas" className="text-head text-ink">
                Las escenas
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Diálogo con traducción. Pulsa una escena para saltar a ese momento.
              </p>

              <ol className="mt-6">
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
                                'flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-sm)] border-2 px-4 py-2.5 text-left text-lg transition-colors',
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
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold',
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
                <h2 className="font-display text-lg font-extrabold text-ink">
                  Practica con esto
                </h2>
                <ul className="mt-3">
                  {film.relatedActivityIds.map((activityId) => {
                    const activity = activityDefinitions.find((entry) => entry.id === activityId)
                    if (!activity) return null
                    return (
                      <li key={activityId}>
                        <Link
                          to={`/activities/${activityId}`}
                          className="block py-3 text-sm text-ink transition-colors hover:text-accent"
                        >
                          {activity.title}
                          <span className="mt-0.5 block text-xs text-ink-mute">
                            {activity.tagline}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            {related.length > 0 ? (
              <section className="panel mt-6 px-5 py-5">
                <h2 className="font-display text-lg font-extrabold text-ink">
                  Sigue con
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

            <p className="mt-6 text-xs text-ink-mute">
              Progreso guardado:{' '}
              {state.mediaProgress[film.id]?.completed ? 'visto' : 'pendiente'}.
            </p>
          </aside>
        </div>
      </div>
      <div className="frame pb-12">
        <Credits piece={film} />
      </div>
    </div>
  )
}

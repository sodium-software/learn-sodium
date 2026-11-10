import { Link } from 'react-router-dom'

import { Icon, LevelTag, ProgressBar } from '../components/ui'
import { activityDefinitions, activityTools } from '../activities/registry'
import { useProgress } from '../lib/progress-context'
import { allContent } from '../content'
import { clsx } from '../lib/cn'

/**
 * Centro de herramientas pedagógicas.
 *
 * El catálogo se arma desde el registro, así que añadir una herramienta nueva
 * no obliga a tocar esta vista.
 */
export function ActivitiesView() {
  const { state, overallProgress } = useProgress()

  const done = state.completedActivityIds.length
  const total = activityDefinitions.length

  const byKind = activityTools.reduce<Record<string, typeof activityDefinitions>>(
    (groups, tool) => {
      const definition = activityDefinitions.find((entry) => entry.id === tool.id)
      if (!definition) return groups
      groups[tool.kind] = [...(groups[tool.kind] ?? []), definition]
      return groups
    },
    {},
  )

  const kindLabels: Record<string, string> = {
    vocabulary: 'Tarjetas de vocabulario',
    quiz: 'Cuestionarios',
    matching: 'Relacionar y emparejar',
    'fill-blanks': 'Completar oraciones',
    listening: 'Práctica de escucha',
    reading: 'Comprensión lectora',
  }

  return (
    <div className="frame py-10 lg:py-16">
      <header className="grid-editorial items-end gap-y-6">
        <div className="col-span-4 lg:col-span-7">
          <h1 className="text-hero font-display font-semibold leading-[0.96] tracking-[-0.04em] text-ink">
            Actividades
          </h1>
        </div>
        <div className="col-span-4 lg:col-span-4 lg:col-start-9">
          <p className="text-lead text-ink-soft">
            Seis herramientas que se corrigen solas y guardan lo que hiciste.
          </p>
        </div>
      </header>

      {/* ── Resumen ────────────────────────────────────────────────────── */}
      <section className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-5 border-y border-tint-deep py-7">
        <div>
          <p className="label">Completadas</p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink tnum">
            {done}
            <span className="text-base text-ink-mute"> / {total}</span>
          </p>
        </div>
        <div className="min-w-[12rem] flex-1">
          <ProgressBar value={overallProgress} max={100} label="Avance total" />
          <p className="mt-2 text-xs text-ink-mute">
            {overallProgress}% del cuaderno de actividades
          </p>
        </div>
      </section>

      {/* ── Catálogo por tipo ──────────────────────────────────────────── */}
      <div className="mt-16 space-y-16">
        {Object.entries(byKind).map(([kind, definitions]) => (
          <section key={kind} aria-labelledby={`kind-${kind}`}>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-tint-deep pb-4">
              <div>
                <h2
                  id={`kind-${kind}`}
                  className="font-display text-2xl font-semibold tracking-tight text-ink"
                >
                  {kindLabels[kind] ?? kind}
                </h2>
                <p className="mt-1 text-sm text-ink-mute">
                  {definitions.length}{' '}
                  {definitions.length === 1 ? 'herramienta' : 'herramientas'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {definitions.map((definition) => {
                const tool = activityTools.find((entry) => entry.id === definition.id)
                const result = state.activityResults[definition.id]
                const isDone = state.completedActivityIds.includes(definition.id)

                return (
                  <Link
                    key={definition.id}
                    to={`/activities/${definition.id}`}
                    className="group flex flex-col border border-tint-deep bg-sheet px-5 py-5 transition-colors hover:border-ink-mute"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft">
                        <Icon
                          name={(tool?.typeLabel === 'Quiz'
                            ? 'ListChecks'
                            : tool?.typeLabel === 'Tarjetas'
                              ? 'Type'
                              : tool?.typeLabel === 'Relacionar'
                                ? 'Zap'
                                : tool?.typeLabel === 'Completar'
                                  ? 'PenLine'
                                  : tool?.typeLabel === 'Escucha'
                                    ? 'Headphones'
                                    : 'BookOpen') as 'ListChecks'}
                          size={15}
                          strokeWidth={1.75}
                        />
                        {tool?.typeLabel}
                      </span>
                      <LevelTag level={definition.level} />
                    </div>

                    <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">
                      {definition.title}
                    </h3>
                    <p className="mt-1 text-sm text-ink-mute">{definition.tagline}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                      {definition.description}
                    </p>

                    <div className="mt-5 border-t border-tint-deep pt-4">
                      {result ? (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-ink-mute">Última vez</span>
                            <span
                              className={clsx(
                                'font-display text-lg font-semibold tnum',
                                result.score >= 70 ? 'text-accent' : 'text-ink',
                              )}
                            >
                              {result.score}/100
                            </span>
                          </div>
                          <ProgressBar
                            value={result.score}
                            max={100}
                            label={`Puntuación de ${definition.title}`}
                          />
                        </>
                      ) : (
                        <p className="text-xs text-ink-mute">
                          {definition.minutes} min · sin empezar
                        </p>
                      )}
                      {isDone ? (
                        <p className="mt-2 text-xs text-accent">Completada</p>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ── Material relacionado ───────────────────────────────────────── */}
      <section className="mt-20" aria-labelledby="material-actividades">
        <h2 id="material-actividades" className="text-head text-ink">
          Material con el que practicar
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-soft">
          Cada actividad se apoya en material concreto del catálogo. Ábrelo primero si
          quieres llegar a la actividad con el contexto.
        </p>

        <div className="mt-8 divide-y divide-tint-deep border-y border-tint-deep">
          {allContent.map((item) => {
            const linked = activityDefinitions.filter((definition) =>
              definition.relatedIds.includes(item.id),
            )
            if (linked.length === 0) return null
            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-6"
              >
                <img
                  src={item.cover}
                  alt=""
                  className="h-16 w-full shrink-0 object-cover sm:w-24"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={item.route}
                    className="font-display text-lg font-semibold tracking-tight text-ink hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-ink-mute">
                    {linked.length}{' '}
                    {linked.length === 1 ? 'actividad relacionada' : 'actividades relacionadas'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {linked.map((definition) => (
                    <Link
                      key={definition.id}
                      to={`/activities/${definition.id}`}
                      className="border border-tint-deep px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
                    >
                      {definition.title}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

import { SectionHeader } from '../components/SectionHeader'
import { Link } from 'react-router-dom'

import { Icon, LevelTag, ProgressBar } from '../components/ui'
import { activityDefinitions, activityTools } from '../activities/registry'
import { useProgress } from '../lib/progress-context'
import { allContent } from '../content'
import { clsx } from '../lib/cn'
import { ExternalActivityCard, toolName } from '../components/ExternalActivity'
import { EXTERNAL_TOOLS } from '../shared/schema'

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
    <div className="pb-24">
      <SectionHeader
        kind="activity"
        title="Actividades"
        description="Juegos que se corrigen solos y actividades en otras plataformas."
      >
        <div className="mt-6 flex max-w-md items-center gap-4">
          <p className="shrink-0 font-display text-3xl font-extrabold tnum">
            {done}
            <span className="text-xl"> de {total}</span>
          </p>
          <div className="flex-1 rounded-full bg-white/25 p-1">
            <ProgressBar value={overallProgress} max={100} label="Actividades completadas" />
          </div>
        </div>
      </SectionHeader>
      <div className="frame">
      {/* ── Catálogo por tipo ──────────────────────────────────────────── */}
      <div className="mt-16 space-y-16">
        {Object.entries(byKind).map(([kind, definitions]) => (
          <section key={kind} aria-labelledby={`kind-${kind}`}>
            <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
              <div>
                <h2
                  id={`kind-${kind}`}
                  className="text-head text-ink"
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
                    className="group flex flex-col rounded-[var(--radius-xs)] bg-sheet px-6 py-6 transition-transform hover:-translate-y-1"
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

                    <h3 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink group-hover:text-blue">
                      {definition.title}
                    </h3>
                    <p className="mt-1 text-sm text-ink-mute">{definition.tagline}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                      {definition.description}
                    </p>

                    <div className="mt-5 pt-4">
                      {result ? (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-ink-mute">Última vez</span>
                            <span
                              className={clsx(
                                'font-display text-lg font-extrabold tnum',
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

      {/* ── Actividades en otras plataformas ───────────────────────────── */}
      {EXTERNAL_TOOLS.map(([tool]) => {
        const external = activityDefinitions.filter(
          (definition) => definition.kind === 'external' && (definition.tool ?? 'other') === tool,
        )
        if (external.length === 0) return null
        return (
          <section key={tool} className="mt-16" aria-labelledby={`tool-${tool}`}>
            <div className="pb-4">
              <h2 id={`tool-${tool}`} className="text-head text-ink">
                En {toolName(tool)}
              </h2>
              <p className="mt-1 text-sm text-ink-mute">
                Se abren fuera de La Cartilla. Al volver, márcalas como hechas.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {external.map((definition) => (
                <ExternalActivityCard key={definition.id} activity={definition} />
              ))}
            </div>
          </section>
        )
      })}

      {/* ── Material relacionado ───────────────────────────────────────── */}
      <section className="mt-20" aria-labelledby="material-actividades">
        <h2 id="material-actividades" className="text-head text-ink">
          Material con el que practicar
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-soft">
          Cada actividad se apoya en material concreto del catálogo. Ábrelo primero si
          quieres llegar a la actividad con el contexto.
        </p>

        <div className="mt-8">
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
                    className="inline-flex min-h-12 items-center font-display text-2xl font-extrabold text-ink hover:text-blue"
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
                      className="inline-flex min-h-12 items-center rounded-full bg-sheet px-5 text-base font-bold text-ink transition-colors hover:bg-tint-deep"
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
    </div>
  )
}

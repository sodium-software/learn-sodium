import { SectionHeader } from '../components/SectionHeader'
import { Link } from 'react-router-dom'

import { Icon, LevelTag, ProgressBar, type IconName } from '../components/ui'
import { activityDefinitions, activityTools } from '../activities/registry'
import { useProgress } from '../lib/progress-context'
import { allContent } from '../content'
import { Cover } from '../components/Cover'
import { clsx } from '../lib/cn'
import { ExternalActivityCard, skillName } from '../components/ExternalActivity'

const KIND_NAME = { song: 'Song', podcast: 'Podcast', film: 'Short film', story: 'Story' } as const

/**
 * Centro de herramientas pedagógicas.
 *
 * El catálogo se arma desde el registro, así que añadir una herramienta nueva
 * no obliga a tocar esta vista.
 */
const KIND_ICONS: Record<string, IconName> = {
  vocabulary: 'Type',
  quiz: 'ListChecks',
  matching: 'Zap',
  'fill-blanks': 'PenLine',
  listening: 'Headphones',
  reading: 'BookOpen',
}

export function ActivitiesView() {
  const { state, overallProgress } = useProgress()

  const done = state.completedActivityIds.length
  const total = activityDefinitions.length

  // Agrupadas por la pieza a la que pertenecen (la guía pide actividades por formato).
  const KIND_ORDER = ['song', 'podcast', 'film', 'story']
  const groups = [...allContent]
    .sort((x, y) => KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind))
    .map((piece) => ({ piece, activities: activityDefinitions.filter((a) => a.relatedIds.includes(piece.id)) }))
    .filter((group) => group.activities.length > 0)
  const loose = activityDefinitions.filter((a) => !a.relatedIds.some((id) => allContent.some((piece) => piece.id === id)))

  const card = (definition: (typeof activityDefinitions)[number]) => {
    if (definition.kind === 'external') return <ExternalActivityCard key={definition.id} activity={definition} />
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
          <span className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft">
            <Icon name={KIND_ICONS[tool?.kind ?? ''] ?? 'BookOpen'} size={16} strokeWidth={1.75} />
            {tool?.typeLabel}
            {definition.skill ? <span>· {skillName(definition.skill)}</span> : null}
          </span>
          <LevelTag level={definition.level} />
        </div>
        <h3 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink group-hover:text-blue">
          {definition.title}
        </h3>
        <p className="mt-1 text-base text-ink-mute">{definition.tagline}</p>
        <p className="mt-3 flex-1 text-base text-ink-soft">{definition.description}</p>
        <div className="mt-5">
          {result ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-mute">Last time</span>
                <span className={clsx('font-display text-lg font-extrabold tnum', result.score >= 70 ? 'text-green' : 'text-ink')}>
                  {result.score}/100
                </span>
              </div>
              <ProgressBar value={result.score} max={100} label={`Score for ${definition.title}`} />
            </>
          ) : (
            <p className="text-sm text-ink-mute">{definition.minutes} min · not started</p>
          )}
          {isDone ? <p className="mt-2 text-sm font-bold text-green">Completed</p> : null}
        </div>
      </Link>
    )
  }

  return (
    <div className="pb-24">
      <SectionHeader
        kind="activity"
        title="Activities"
        description="Games that check your answers, and activities on other websites."
      >
        <div className="mt-6 flex max-w-md items-center gap-4">
          <p className="shrink-0 font-display text-3xl font-extrabold tnum">
            {done}
            <span className="text-xl"> of {total}</span>
          </p>
          <div className="flex-1 rounded-full bg-white/25 p-1">
            <ProgressBar value={overallProgress} max={100} label="Activities completed" />
          </div>
        </div>
      </SectionHeader>
      <div className="frame">
      {groups.map(({ piece, activities }) => (
        <section key={piece.id} className="mt-16" aria-labelledby={`grupo-${piece.id}`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="block h-16 w-20 shrink-0 overflow-hidden rounded-[4px]">
                <Cover src={piece.cover} kind={piece.kind} alt="" className="h-full" />
              </span>
              <div className="min-w-0">
                <h2 id={`grupo-${piece.id}`} className="text-head text-ink">
                  {piece.title}
                </h2>
                <p className="text-base text-ink-mute">
                  {KIND_NAME[piece.kind]} · {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
            </div>
            <Link to={piece.route} className="btn btn-secondary">
              Open the {KIND_NAME[piece.kind].toLowerCase()}
              <Icon name="ArrowRight" size={18} />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{activities.map(card)}</div>
        </section>
      ))}

      {loose.length > 0 ? (
        <section className="mt-16" aria-labelledby="mas-actividades">
          <h2 id="mas-actividades" className="text-head text-ink">
            More activities
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{loose.map(card)}</div>
        </section>
      ) : null}
      </div>
    </div>
  )
}

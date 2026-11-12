import { Link } from 'react-router-dom'

import { activityDefinitions } from '../content'
import { activityTools } from '../activities/registry'
import { skillName, toolName } from './ExternalActivity'
import { Icon, LevelTag } from './ui'

/** Actividades enlazadas a una pieza: las que la nombran en «Story it belongs to», más las que la pieza lista. */
function activitiesFor(pieceId: string, extraIds: string[] = []) {
  return activityDefinitions.filter((a) => a.relatedIds.includes(pieceId) || extraIds.includes(a.id))
}

/** Sección «Activities» de una ficha: cada actividad en su papel, con su habilidad. */
export function PieceActivities({ pieceId, extraIds = [], title }: { pieceId: string; extraIds?: string[]; title: string }) {
  const list = activitiesFor(pieceId, extraIds)
  if (list.length === 0) return null
  return (
    <section className="mt-16" aria-labelledby={`actividades-${pieceId}`}>
      <h2 id={`actividades-${pieceId}`} className="text-head text-ink">
        Activities
      </h2>
      <p className="mt-2 max-w-2xl text-base text-ink-soft">
        {list.length} {list.length === 1 ? 'activity' : 'activities'} to practise with {title}.
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.map((activity) => (
          <li key={activity.id}>
            <Link
              to={`/activities/${activity.id}`}
              className="group flex h-full flex-col rounded-[var(--radius-xs)] bg-sheet p-5 transition-transform hover:-translate-y-1"
            >
              <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-soft">
                {activity.kind === 'external'
                  ? toolName(activity.tool)
                  : activityTools.find((tool) => tool.id === activity.id)?.typeLabel}
                {activity.skill ? <span>· {skillName(activity.skill)}</span> : null}
                <LevelTag level={activity.level} />
              </span>
              <span className="mt-2 font-display text-2xl font-extrabold leading-tight text-ink group-hover:text-blue">
                {activity.title}
              </span>
              {activity.tagline ? <span className="mt-1 text-base text-ink-mute">{activity.tagline}</span> : null}
              <span className="mt-auto inline-flex items-center gap-2 pt-4 font-bold text-blue">
                Open
                <Icon name="ArrowRight" size={20} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

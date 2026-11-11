import { EXTERNAL_TOOLS, SKILLS } from '../shared/schema'
import type { ActivityDefinition } from '../types'
import { useProgress } from '../lib/progress-context'
import { clsx } from '../lib/cn'
import { Credits, Icon, LevelTag, Tag } from './ui'

export const toolName = (tool?: string) => EXTERNAL_TOOLS.find(([id]) => id === tool)?.[1] ?? 'Other platform'
export const skillName = (skill?: string) => SKILLS.find(([id]) => id === skill)?.[1] ?? ''

/**
 * Actividad que vive en otra plataforma (Canva, Wordwall…). Se abre en una
 * pestaña nueva, con aviso, y el niño la marca como hecha a mano: no hay
 * forma de saber el resultado desde aquí.
 */
export function ExternalActivityCard({ activity, detailed = false }: { activity: ActivityDefinition; detailed?: boolean }) {
  const { state, toggleDone } = useProgress()
  const done = state.completedActivityIds.includes(activity.id)
  const noteId = `aviso-${activity.id}`

  return (
    <article className={clsx('panel flex flex-col overflow-hidden', done && 'bg-right-pale')}>
      {activity.cover ? <img src={activity.cover} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" /> : null}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft">
            <Icon name="ExternalLink" size={14} />
            {toolName(activity.tool)}
          </span>
          <LevelTag level={activity.level} />
          {activity.age ? <span className="text-xs text-ink-mute">{activity.age}</span> : null}
          {activity.example ? <Tag>Example</Tag> : null}
        </div>
        <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink">{activity.title}</h3>
        {activity.skill ? <p className="mt-1 text-base text-ink-mute">{skillName(activity.skill)}</p> : null}
        {activity.description ? <p className="mt-3 text-base text-ink-soft">{activity.description}</p> : null}
        {activity.instructions ? (
          <p className="mt-4 whitespace-pre-line rounded-[var(--radius-xs)] bg-yellow-pale px-4 py-3 text-base text-ink">{activity.instructions}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
          {activity.url ? (
            <a href={activity.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" aria-describedby={noteId}>
              Open in {toolName(activity.tool)}
              <Icon name="ExternalLink" size={15} />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => toggleDone(activity.id)}
            aria-pressed={done}
            className="btn bg-tint text-ink hover:bg-tint-deep"
          >
            <Icon name={done ? 'CircleCheck' : 'Circle'} size={16} className={done ? 'text-green' : undefined} />
            {done ? 'Done' : 'Mark as done'}
          </button>
        </div>
        <p id={noteId} className="mt-3 text-sm text-ink-mute">
          Opens in a new tab, outside La Cartilla.
        </p>
        {detailed ? (
          <div className="mt-6">
            <Credits piece={activity} />
          </div>
        ) : null}
      </div>
    </article>
  )
}

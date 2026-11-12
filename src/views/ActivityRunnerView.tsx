import { useMemo } from 'react'
import { Embed } from '../components/Embeds'
import { Link, useParams } from 'react-router-dom'

import { Credits, Icon, LevelTag, ProgressBar } from '../components/ui'
import { ExternalActivityCard } from '../components/ExternalActivity'
import { activityDefinitions, activityTools } from '../activities/registry'
import { useProgress } from '../lib/progress-context'
import { allContent } from '../content'

/**
 * Ejecutor de una actividad. La vista es genérica: monta el componente que
 * el registro asocia al tipo de actividad y guarda el resultado.
 */
export function ActivityRunnerView() {
  const { id } = useParams<{ id: string }>()
  const { recordActivity, state } = useProgress()

  const definition = activityDefinitions.find((entry) => entry.id === id)
  const tool = activityTools.find((entry) => entry.id === id)

  const relatedContent = useMemo(() => {
    if (!definition) return []
    return definition.relatedIds
      .map((contentId) => allContent.find((item) => item.id === contentId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [definition])

  if (definition?.kind === 'external') {
    return (
      <div className="frame py-10 lg:py-14">
        <Link to="/activities" className="btn btn-secondary mb-8">
          <Icon name="ChevronLeft" size={20} />
          All activities
        </Link>
        {definition.embed ? (
          <div className="mb-10">
            <Embed src={definition.embed} title={definition.title} poster={definition.cover} />
          </div>
        ) : null}
        <div className="max-w-2xl">
          <ExternalActivityCard activity={definition} detailed />
        </div>
      </div>
    )
  }

  if (!definition || !tool) {
    return (
      <div className="frame py-16">
        <h1 className="text-head text-ink">We can't find that activity</h1>
        <p className="mt-3 text-ink-soft">
          The link may have a typo, or the activity was removed.
        </p>
        <Link to="/activities" className="btn btn-primary mt-6">
          Back to activities
        </Link>
      </div>
    )
  }

  const result = state.activityResults[definition.id]
  const isDone = state.completedActivityIds.includes(definition.id)

  const Tool = tool.component

  return (
    <div className="frame py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          to="/activities"
          className="btn btn-secondary"
        >
          <Icon name="ChevronLeft" size={20} />
          All activities
        </Link>
      </nav>

      <header className="grid-editorial items-end gap-y-6 pb-8">
        <div className="col-span-4 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3">
            <LevelTag level={definition.level} />
            <span className="text-sm text-ink-mute">{tool.typeLabel}</span>
            <span className="text-sm text-ink-mute tnum">{definition.minutes} min</span>
          </div>
          <h1 className="mt-4 text-display font-display font-extrabold leading-[0.98] text-ink">
            {definition.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lead text-ink-soft">{definition.description}</p>
        </div>

        <div className="col-span-4 lg:col-span-4 lg:col-start-9">
          {result ? (
            <div className="panel px-5 py-4">
              <p className="label">Last time</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-ink tnum">
                {result.score}
                <span className="text-base text-ink-mute">/100</span>
              </p>
              <div className="mt-3">
                <ProgressBar value={result.score} max={100} label="Last score" />
              </div>
              <p className="mt-2 text-xs text-ink-mute">
                {result.correct} of {result.total} correct
                {isDone ? ' · completed' : ''}
              </p>
            </div>
          ) : (
            <div className="panel-quiet px-5 py-4">
              <p className="label">No results yet</p>
              <p className="mt-2 text-sm text-ink-soft">
                When you finish, your result is saved in this browser.
              </p>
            </div>
          )}
        </div>
      </header>

      {definition.embed ? (
        <div className="mt-10">
          <Embed src={definition.embed} title={definition.title} poster={definition.cover} />
        </div>
      ) : null}
      <div className="mt-10">
        <Tool definition={definition} onComplete={(result) => recordActivity(definition.id, result)} />
      </div>

      {relatedContent.length > 0 ? (
        <section className="mt-16 pt-8" aria-labelledby="relacionado">
          <h2 id="relacionado" className="font-display text-xl font-extrabold text-ink">
            Related pieces
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedContent.map((item) => (
              <Link
                key={item.id}
                to={item.route}
                className="flex min-w-0 items-center gap-4 border-2 border-transparent bg-sheet px-4 py-3 transition-colors hover:border-ink-mute"
              >
                <img src={item.cover} alt="" className="h-12 w-16 shrink-0 object-cover" loading="lazy" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{item.title}</span>
                  <span className="block truncate text-xs text-ink-mute">{item.subtitle}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12">
        <Credits piece={definition} />
      </div>
    </div>
  )
}

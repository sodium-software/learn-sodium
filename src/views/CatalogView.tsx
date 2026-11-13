import { Link } from 'react-router-dom'

import { Cover } from '../components/Cover'
import { SectionHeader } from '../components/SectionHeader'
import { Icon, LevelTag, Tag } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { allContent, type ContentItem } from '../content'

/**
 * Catálogo. Compartido por canciones, historias, podcasts y cortometrajes:
 * cada pieza es un papel sujeto con un imán.
 */
export function CatalogView({
  kind,
  title,
  description,
  intro,
}: {
  kind: ContentItem['kind']
  title: string
  description: string
  intro: string
}) {
  const { state } = useProgress()
  const items = allContent.filter((item) => item.kind === kind)

  return (
    <div className="pb-24">
      <SectionHeader kind={kind} title={title} description={description} />
      <div className="frame">
        <p className="mt-10 max-w-[60ch] text-lg text-ink-soft">{intro}</p>
        <PieceGrid items={items} done={(id) => state.mediaProgress[id]?.completed ?? false} doneLabel="Done" />
      </div>
    </div>
  )
}

/** Catálogo de historias: lleva el tiempo de lectura. */
export function StoryCatalogView() {
  const { state } = useProgress()
  const items = allContent.filter((item) => item.kind === 'story')

  return (
    <div className="pb-24">
      <SectionHeader kind="story" title="Stories" description="Stories to read in English, one chapter at a time." />
      <div className="frame">
        <PieceGrid items={items} done={(id) => state.mediaProgress[id]?.completed ?? false} doneLabel="Read" reading />
      </div>
    </div>
  )
}

function PieceGrid({
  items,
  done,
  doneLabel,
  reading = false,
}: {
  items: ContentItem[]
  done: (id: string) => boolean
  doneLabel: string
  reading?: boolean
}) {
  return (
    <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item.route}
            className="group relative flex h-full flex-col border-[3px] border-ink bg-sheet p-3 transition-transform hover:-translate-y-1"
          >
            <span className="tape" />
            <span className="relative block">
              <Cover src={item.cover} kind={item.kind} alt={`Cover of ${item.title}`} className="aspect-[4/3]" />
              {done(item.id) ? (
                <span className="absolute right-3 top-3 flex items-center gap-1.5 bg-green px-3 py-1 text-sm font-bold text-white">
                  <Icon name="Check" size={16} strokeWidth={3} />
                  {doneLabel}
                </span>
              ) : null}
            </span>
            <span className="flex flex-1 flex-col px-2 pb-2 pt-4">
              <h2 className="font-display text-3xl leading-tight text-ink group-hover:text-blue">
                {item.title}
              </h2>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <LevelTag level={item.level} />
                <span className="text-sm text-ink-mute tnum">
                  {item.minutes} min{reading ? ' read' : ''}
                </span>
                {item.example ? <Tag>Example</Tag> : null}
              </span>
              <span className="mt-1 text-base text-ink-mute">{item.subtitle}</span>
              <span className="mt-3 line-clamp-4 flex-1 text-base text-ink-soft">{item.summary}</span>
              <span className="mt-5 inline-flex items-center gap-2 font-bold text-blue">
                Open
                <Icon name="ArrowRight" size={20} className="transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

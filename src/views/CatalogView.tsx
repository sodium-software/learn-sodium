import { Link } from 'react-router-dom'

import { Icon, LevelTag } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { allContent, type ContentItem } from '../content'

/**
 * Catálogo. Compartido por canciones, historias, podcasts y cortiempres:
 * cambia el título, la descripción y el filtro de nivel.
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
    <div className="frame py-10 lg:py-16">
      <header className="grid-editorial items-end gap-y-6">
        <div className="col-span-4 lg:col-span-7">
          <h1 className="text-hero font-display font-semibold leading-[0.96] tracking-[-0.04em] text-ink">
            {title}
          </h1>
        </div>
        <div className="col-span-4 lg:col-span-4 lg:col-start-9">
          <p className="text-lead text-ink-soft">{description}</p>
        </div>
      </header>

      <p className="mt-10 max-w-3xl border-l-2 border-tint-deep pl-5 text-base text-ink-mute">
        {intro}
      </p>

      <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const progress = state.mediaProgress[item.id]
          const done = progress?.completed ?? false
          return (
            <Link
              key={item.id}
              to={item.route}
              className="group flex flex-col bg-sheet transition-colors hover:bg-tint"
            >
              <div className="relative">
                <img
                  src={item.cover}
                  alt={`Portada de ${item.title}`}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                {done ? (
                  <span className="absolute right-3 top-3 flex items-center gap-1.5 bg-accent px-2 py-1 text-xs font-medium text-accent-ink">
                    <Icon name="Check" size={12} strokeWidth={2.5} />
                    Completado
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col px-5 py-5">
                <div className="flex items-center gap-3">
                  <LevelTag level={item.level} />
                  <span className="text-xs text-ink-mute tnum">{item.minutes} min</span>
                </div>

                <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm text-ink-mute">{item.subtitle}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                  {item.summary}
                </p>

                <p className="mt-5 flex items-center gap-2 border-t border-tint-deep pt-4 text-sm font-medium text-accent">
                  Abrir
                  <Icon
                    name="ArrowRight"
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** Catálogo simple para las historias, que llevan además tiempo de lectura. */
export function StoryCatalogView() {
  const { state } = useProgress()
  const items = allContent.filter((item) => item.kind === 'story')

  return (
    <div className="frame py-10 lg:py-16">
      <header className="grid-editorial items-end gap-y-6">
        <div className="col-span-4 lg:col-span-7">
          <h1 className="text-hero font-display font-semibold leading-[0.96] tracking-[-0.04em] text-ink">
            Historias
          </h1>
        </div>
        <div className="col-span-4 lg:col-span-4 lg:col-start-9">
          <p className="text-lead text-ink-soft">
            Textos escritos para leer en inglés y entender sin diccionario.
          </p>
        </div>
      </header>

      <div className="mt-14 divide-y divide-tint-deep border-y border-tint-deep">
        {items.map((item) => {
          const done = state.mediaProgress[item.id]?.completed ?? false
          return (
            <Link
              key={item.id}
              to={item.route}
              className="group grid grid-cols-1 gap-6 py-8 transition-colors hover:bg-sheet md:grid-cols-[14rem_minmax(0,1fr)_auto] md:items-start md:gap-8"
            >
              <img
                src={item.cover}
                alt={`Portada de ${item.title}`}
                className="aspect-[4/3] w-full object-cover md:aspect-square"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <LevelTag level={item.level} />
                  <span className="text-xs text-ink-mute tnum">
                    {item.minutes} min de lectura
                  </span>
                  {done ? (
                    <span className="text-xs text-accent">Leído</span>
                  ) : null}
                </div>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-ink-mute">{item.subtitle}</p>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
                  {item.summary}
                </p>
              </div>
              <Icon
                name="ArrowRight"
                size={22}
                className="hidden text-ink-faint transition-colors group-hover:text-accent md:block"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

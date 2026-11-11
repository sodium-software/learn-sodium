import { pages } from '../content'
import { Tag } from '../components/ui'
import { NotFoundView } from './NotFoundView'

/** Páginas de texto editables desde el panel: Introducción y Biodata. */
export function PageView({ id }: { id: 'introduccion' | 'biodata' }) {
  const page = pages[id]
  if (!page) return <NotFoundView />
  return (
    <article className="frame py-10 lg:py-16">
      <div className="grid-editorial gap-y-8">
        <header className="col-span-4 lg:col-span-8">
          {page.example ? <Tag>Ejemplo</Tag> : null}
          <h1 className="mt-3 text-hero font-display font-semibold leading-[0.98] tracking-[-0.04em] text-ink">{page.title}</h1>
          {page.summary ? <p className="mt-5 max-w-2xl text-lead text-ink-soft">{page.summary}</p> : null}
        </header>
        <div className="prose-read col-span-4 max-w-[65ch] lg:col-span-7">
          {page.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {page.cover ? (
          <figure className="col-span-4 lg:col-span-4 lg:col-start-9">
            <img src={page.cover} alt="" className="w-full object-cover" />
            {page.credits ? <figcaption className="mt-2 text-xs text-ink-mute">{page.credits}</figcaption> : null}
          </figure>
        ) : null}
      </div>
    </article>
  )
}

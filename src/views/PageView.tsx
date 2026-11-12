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
          {page.example ? <Tag>Example</Tag> : null}
          <h1 className="mt-3 text-hero font-display font-extrabold leading-[0.98] text-ink">{page.title}</h1>
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

      {page.people.length > 0 ? (
        <ul className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {page.people.map((person) => (
            <li key={person.name} className="flex flex-col gap-5 rounded-[var(--radius-xs)] bg-sheet p-6 sm:flex-row">
              {person.photo ? (
                <img src={person.photo} alt={`Photo of ${person.name}`} className="h-36 w-36 shrink-0 rounded-full object-cover" />
              ) : null}
              <div className="min-w-0">
                <h2 className="font-display text-3xl font-extrabold text-ink">{person.name}</h2>
                <div className="prose-read mt-3">
                  {person.story.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {page.references.length > 0 ? (
        <section className="mt-16 max-w-[70ch]" aria-labelledby={`referencias-${id}`}>
          <h2 id={`referencias-${id}`} className="text-head text-ink">
            References
          </h2>
          <ul className="mt-4 space-y-3 text-base text-ink-soft">
            {page.references.map((reference) => (
              <li key={reference} className="pl-8 -indent-8">
                {reference}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}

import { Link } from 'react-router-dom'

import { siteConfig } from '../config/site'
import { useProgress } from '../lib/progress-context'
import { clsx } from '../lib/cn'
import { Cover } from '../components/Cover'
import { Drawing, type DrawingName } from '../components/Drawings'
import { SECTION_COLORS } from '../components/sections'
import { MagnetWord } from '../components/SiteHeader'
import { Icon, LevelTag, Tag } from '../components/ui'
import { WordGame } from '../components/WordGame'
import { activityDefinitions, allContent, episodes, films, pages, songs, stories, type ContentItem } from '../content'

/**
 * Inicio: la puerta de la nevera. El nombre en letras-imán, el juego de armar
 * palabras y, debajo, las secciones como papeles de distintos tamaños y
 * colores. El nombre del niño, si lo escribió en Ajustes, solo vive en su
 * navegador.
 */
export function HomeView() {
  const { preferences, state } = useProgress()
  const name = preferences.displayName.trim()
  const done = state.completedActivityIds.length
  const featured = [songs[0], stories[0], films[0]]
    .filter(Boolean)
    .map((piece) => allContent.find((item) => item.id === piece.id))
    .filter((item): item is ContentItem => Boolean(item))

  return (
    <div>
      {/* ── Portada ────────────────────────────────────────────────────── */}
      <section className="frame grid-editorial items-center gap-y-12 pb-20 pt-8 lg:min-h-[calc(100dvh-4.5rem)] lg:pb-24">
        <div className="col-span-4 lg:col-span-7">
          <h1 className="text-[clamp(4.25rem,2rem+10vw,11.5rem)] leading-[0.86] tracking-[-0.02em]">
            <MagnetWord text={siteConfig.platformName} animate />
          </h1>
          <p className="mt-8 max-w-[30ch] text-lead text-ink animate-rise [animation-delay:500ms]">
            {name ? <strong>¡Hola, {name}! </strong> : null}
            {siteConfig.heroText}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-rise [animation-delay:600ms]">
            <Link to="/activities" className="btn btn-primary min-h-16 px-8 text-xl">
              Empezar a jugar
              <Icon name="ArrowRight" size={22} />
            </Link>
            {done > 0 ? (
              <p className="text-base font-bold text-ink-soft">
                Llevas {done} {done === 1 ? 'actividad hecha' : 'actividades hechas'}.
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative col-span-4 lg:col-span-5">
          <div className="relative animate-rise [animation-delay:350ms]">
            <WordGame />
          </div>
          <div className="mt-8 hidden justify-end gap-6 pr-4 sm:flex">
            <DecorPaper drawing="sun" word="sun" className="tilt-l relative w-36" />
            <DecorPaper drawing="boat" word="boat" className="tilt-r relative mt-6 w-40" />
          </div>
        </div>
      </section>

      {/* ── Secciones: papeles de distinto tamaño y color ──────────────── */}
      <section className="frame pb-24" aria-labelledby="secciones">
        <h2 id="secciones" className="text-display">
          Elige qué hacer hoy
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
          <SectionPaper to="/song" kind="song" title="Canciones" body="Escucha, sigue la letra y canta." count={songs.length} unit={['canción', 'canciones']} className="lg:col-span-5 lg:row-span-2" large />
          <SectionPaper to="/storytelling" kind="story" title="Historias" body="Cuentos por capítulos con palabras nuevas." count={stories.length} unit={['historia', 'historias']} className="lg:col-span-4" />
          <SectionPaper to="/podcast" kind="podcast" title="Podcast" body="Escucha conversaciones cortas." count={episodes.length} unit={['episodio', 'episodios']} className="lg:col-span-3" />
          <SectionPaper to="/short-film" kind="film" title="Cortometrajes" body="Películas cortas con preguntas al final." count={films.length} unit={['corto', 'cortos']} className="lg:col-span-3" />
          <SectionPaper to="/activities" kind="activity" title="Actividades" body="Juegos para practicar lo que aprendiste." count={activityDefinitions.length} unit={['juego', 'juegos']} className="lg:col-span-4" />
        </div>
      </section>

      {/* ── Para empezar ───────────────────────────────────────────────── */}
      {featured.length > 0 ? (
        <section className="bg-tint py-20" aria-labelledby="empezar">
          <div className="frame">
            <h2 id="empezar" className="text-display">
              Para empezar
            </h2>
            <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-3">
              {featured.map((item, i) => (
                <li key={item.id} className="animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
                  <Link to={item.route} className="group relative flex h-full flex-col rounded-[var(--radius-xs)] bg-sheet p-3 pt-5 transition-transform hover:-translate-y-1">
                    <span className="magnet" style={magnetStyle(i)} />
                    <Cover src={item.cover} kind={item.kind} alt="" className="aspect-[4/3] rounded-[4px]" />
                    <span className="flex flex-1 flex-col px-2 pb-2 pt-4">
                      <span className="font-display text-3xl font-extrabold leading-tight text-ink group-hover:text-blue">{item.title}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <LevelTag level={item.level} />
                        <span className="text-sm text-ink-mute">{item.minutes} min</span>
                        {item.example ? <Tag>Ejemplo</Tag> : null}
                      </span>
                      <span className="mt-2 line-clamp-3 text-base text-ink-soft">{item.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Para las familias ──────────────────────────────────────────── */}
      <section className="frame grid-editorial gap-y-10 py-24" aria-labelledby="familias">
        <div className="col-span-4 lg:col-span-6">
          <h2 id="familias" className="text-display">
            Para las familias
          </h2>
          <p className="mt-6 max-w-[46ch] text-lead text-ink">
            {siteConfig.platformName} no pide cuentas, no usa cookies de terceros ni analítica, y no tiene
            publicidad. El progreso y el nombre del niño se guardan solo en este dispositivo.
          </p>
          <p className="mt-4 max-w-[46ch] text-base text-ink-soft">
            Cada canción, cuento y película lleva en su ficha la fuente, la licencia y los créditos.
          </p>
        </div>
        <div className="col-span-4 flex flex-col gap-5 lg:col-span-5 lg:col-start-8">
          {(['introduccion', 'biodata'] as const).map((id) => {
            const page = pages[id]
            if (!page) return null
            return (
              <Link key={id} to={`/${id}`} className="group flex items-center gap-5 rounded-[var(--radius-xs)] bg-sheet p-5 transition-colors hover:bg-tint">
                <Drawing name={id === 'biodata' ? 'author' : 'info'} className="h-16 w-20 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-display text-3xl font-extrabold text-ink group-hover:text-blue">{page.title}</span>
                  <span className="mt-1 block text-base text-ink-soft">{page.summary}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function magnetStyle(i: number) {
  const colors = ['red', 'blue', 'green']
  const c = colors[i % colors.length]
  return { '--m': `var(--color-${c})`, '--md': `var(--color-${c}-deep)` } as React.CSSProperties
}

/** Un dibujo pegado en la puerta. Decorativo: se inclina un poco. */
function DecorPaper({ drawing, word, className }: { drawing: DrawingName; word: string; className?: string }) {
  return (
    <div aria-hidden="true" className={clsx('rounded-[var(--radius-xs)] bg-sheet px-3 pb-2 pt-4', className)}>
      <span className="magnet" style={{ '--m': 'var(--color-green)', '--md': 'var(--color-green-deep)' } as React.CSSProperties} />
      <Drawing name={drawing} className="w-full" />
      <p lang="en" className="text-center font-display text-2xl font-extrabold">
        {word}
      </p>
    </div>
  )
}

function SectionPaper({
  to,
  kind,
  title,
  body,
  count,
  unit,
  className,
  large = false,
}: {
  to: string
  kind: keyof typeof SECTION_COLORS
  title: string
  body: string
  count: number
  unit: [string, string]
  className?: string
  large?: boolean
}) {
  const section = SECTION_COLORS[kind]
  return (
    <Link
      to={to}
      className={clsx(
        'group flex justify-between gap-5 rounded-[var(--radius-xs)] p-6 transition-transform hover:-translate-y-1 sm:p-8',
        large ? 'flex-col' : 'flex-row-reverse items-center sm:flex-col sm:items-start',
        section.bg,
        section.ink,
        large && 'sm:col-span-2 lg:col-span-5',
        className,
      )}
    >
      <span className={clsx('grid place-items-center rounded-full bg-sheet p-3', large ? 'h-36 w-36 lg:h-48 lg:w-48' : 'h-20 w-20 shrink-0 sm:h-24 sm:w-24')}>
        <Drawing name={section.drawing} className="w-full" />
      </span>
      <span className="min-w-0">
        <span className={clsx('block font-display font-extrabold leading-none [overflow-wrap:anywhere]', large ? 'text-[clamp(3rem,2rem+3vw,5rem)]' : 'text-[clamp(1.875rem,1.4rem+1.6vw,2.25rem)]')}>
          {title}
        </span>
        <span className="mt-3 block text-lg">{body}</span>
        <span className="mt-4 inline-flex items-center gap-2 font-bold">
          {count} {count === 1 ? unit[0] : unit[1]}
          <Icon name="ArrowRight" size={20} className="transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  )
}

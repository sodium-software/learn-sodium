import { Link } from 'react-router-dom'

import { siteConfig } from '../config/site'
import { useProgress } from '../lib/progress-context'
import { Icon, LevelTag, Tag } from '../components/ui'
import { Wordmark } from '../components/Sidebar'
import { activityDefinitions, allContent, episodes, films, pages, songs, stories, type ContentItem } from '../content'

/**
 * Inicio: la portada pública. Explica qué es la plataforma, muestra lo que
 * hay dentro y lleva a cada sección. El nombre del niño, si lo escribió en
 * Ajustes, solo vive en su navegador.
 */
export function HomeView() {
  const { preferences, state } = useProgress()
  const name = preferences.displayName.trim()
  const featured = [songs[0], stories[0], films[0]].filter(Boolean)
  const featuredItems = featured
    .map((piece) => allContent.find((item) => item.id === piece.id))
    .filter((item): item is ContentItem => Boolean(item))
  const covers = allContent.filter((item) => item.cover).slice(0, 3)

  return (
    <div>
      {/* ── Portada ────────────────────────────────────────────────────── */}
      <section className="frame grid-editorial items-center gap-y-10 py-10 lg:py-16">
        <div className="col-span-4 lg:col-span-7">
          <Wordmark size="lg" />
          <h1 className="mt-6 text-display font-display font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
            {name ? `¡Hola, ${name}! ` : ''}
            {siteConfig.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-lead text-ink-soft">{siteConfig.heroText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/song" className="btn btn-primary">
              Empezar por las canciones
              <Icon name="ArrowRight" size={16} />
            </Link>
            <Link to="/activities" className="btn btn-secondary">
              Ver las actividades
            </Link>
          </div>
          {state.completedActivityIds.length > 0 ? (
            <p className="mt-4 text-sm text-ink-mute">
              Llevas {state.completedActivityIds.length}{' '}
              {state.completedActivityIds.length === 1 ? 'actividad hecha' : 'actividades hechas'}. ¡Sigue así!
            </p>
          ) : null}
        </div>

        <div className="col-span-4 lg:col-span-5" aria-hidden="true">
          <div className="grid grid-cols-6 grid-rows-6 gap-3 sm:h-[22rem] lg:h-[26rem]">
            {covers.map((item, index) => (
              <img
                key={item.id}
                src={item.cover}
                alt=""
                className={
                  [
                    'col-span-4 row-span-4 h-full w-full object-cover',
                    'col-span-2 col-start-5 row-span-3 h-full w-full object-cover',
                    'col-span-3 col-start-4 row-span-3 row-start-4 h-full w-full object-cover',
                  ][index]
                }
              />
            ))}
            {covers.length > 0 ? (
              <div className="col-span-3 row-span-2 row-start-5 flex items-end bg-accent p-4 text-accent-ink">
                <p className="font-display text-lg font-semibold leading-tight">
                  {allContent.length + activityDefinitions.length} piezas para aprender
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Secciones ──────────────────────────────────────────────────── */}
      <section className="frame border-t border-tint-deep py-12" aria-labelledby="secciones">
        <h2 id="secciones" className="text-head text-ink">
          Qué hay dentro
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
          <SectionTile to="/song" icon="Music" title="Canciones" body="Escucha, lee la letra y canta." count={songs.length} />
          <SectionTile to="/storytelling" icon="BookOpen" title="Historias" body="Cuentos por capítulos con palabras nuevas." count={stories.length} />
          <SectionTile to="/podcast" icon="Podcast" title="Podcast" body="Conversaciones cortas para entrenar el oído." count={episodes.length} />
          <SectionTile to="/short-film" icon="Film" title="Cortometrajes" body="Historias en vídeo con preguntas al final." count={films.length} />
          <SectionTile to="/activities" icon="Target" title="Actividades" body="Juegos y ejercicios para practicar." count={activityDefinitions.length} />
        </div>
      </section>

      {/* ── Para empezar ───────────────────────────────────────────────── */}
      {featuredItems.length > 0 ? (
        <section className="frame border-t border-tint-deep py-12" aria-labelledby="empezar">
          <h2 id="empezar" className="text-head text-ink">
            Para empezar
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {featuredItems.map((item) => (
              <Link key={item.id} to={item.route} className="group panel flex flex-col overflow-hidden">
                <img src={item.cover} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelTag level={item.level} />
                    <span className="text-xs text-ink-mute">{item.minutes} min</span>
                    {item.example ? <Tag>Ejemplo</Tag> : null}
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold tracking-tight text-ink group-hover:text-accent">
                    {item.title}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Sobre el proyecto ──────────────────────────────────────────── */}
      <section className="frame border-t border-tint-deep py-12" aria-labelledby="proyecto">
        <h2 id="proyecto" className="text-head text-ink">
          Sobre el proyecto
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {(['introduccion', 'biodata'] as const).map((id) => {
            const page = pages[id]
            if (!page) return null
            return (
              <Link key={id} to={`/${id}`} className="group panel-quiet flex items-start gap-4 p-6">
                <Icon name={id === 'biodata' ? 'UserRound' : 'Info'} size={22} className="mt-1 shrink-0 text-accent" />
                <span>
                  <span className="block font-display text-xl font-semibold text-ink group-hover:text-accent">{page.title}</span>
                  <span className="mt-1 block text-sm text-ink-soft">{page.summary}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <footer className="frame border-t border-tint-deep py-8 text-sm text-ink-mute">
        <p>
          {siteConfig.platformName} no usa cuentas, cookies de terceros ni analítica. El progreso se guarda solo en
          este dispositivo.
        </p>
        <p className="mt-2">
          Los créditos y licencias de cada pieza están en su ficha.{' '}
          <Link to="/settings" className="underline underline-offset-2 hover:text-accent">
            Ajustes
          </Link>
        </p>
      </footer>
    </div>
  )
}

function SectionTile({
  to,
  title,
  body,
  icon,
  count,
}: {
  to: string
  title: string
  body: string
  icon: 'Music' | 'BookOpen' | 'Podcast' | 'Film' | 'Target'
  count: number
}) {
  return (
    <Link to={to} className="group flex flex-col border-t-2 border-accent pt-4">
      <span className="flex items-center gap-2.5">
        <Icon name={icon} size={20} strokeWidth={1.8} className="shrink-0 text-accent" />
        <span className="font-display text-lg font-semibold tracking-tight text-ink group-hover:text-accent">{title}</span>
      </span>
      <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{body}</span>
      <span className="mt-3 text-xs text-ink-mute">
        {count} {count === 1 ? 'pieza' : 'piezas'}
        <Icon
          name="ArrowRight"
          size={14}
          className="ml-1.5 inline-block align-[-1px] transition-transform duration-200 group-hover:translate-x-1"
        />
      </span>
    </Link>
  )
}

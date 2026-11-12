import { Link } from 'react-router-dom'

import { siteConfig } from '../config/site'
import { useProgress } from '../lib/progress-context'
import { clsx } from '../lib/cn'
import { Cover } from '../components/Cover'
import { SECTION_COLORS, SECTION_NAMES } from '../components/sections'
import { Icon } from '../components/ui'
import { WordGame } from '../components/WordGame'
import { activityDefinitions, episodes, films, pages, songs, stories } from '../content'

/**
 * Inicio: la portada del fanzine. El titular recortado en tiras, el juego de
 * armar palabras pegado con cinta y, debajo, las cuatro historias como
 * páginas de distinto tamaño. El nombre del estudiante, si lo escribió en
 * Ajustes, solo vive en su navegador.
 */
export function HomeView() {
  const { preferences, state } = useProgress()
  const name = preferences.displayName.trim()
  const done = state.completedActivityIds.length

  return (
    <div>
      {/* ── Portada ────────────────────────────────────────────────────── */}
      <section className="frame grid-editorial items-center gap-y-12 pb-20 pt-10 lg:min-h-[calc(100dvh-4.5rem)] lg:pb-24">
        <div className="col-span-4 lg:col-span-7">
          <h1 className="text-[clamp(4rem,1.6rem+9vw,10.5rem)]">
            <span className="strip animate-stick">Stories</span>
            <br />
            <span className="strip animate-stick [--strip:var(--color-ink)] [--strip-ink:var(--color-sheet)] [animation-delay:90ms]">in</span>{' '}
            <span className="strip animate-stick [--strip:var(--color-yellow)] [animation-delay:180ms]">English</span>
          </h1>
          <p className="mt-8 max-w-[38ch] text-lead animate-rise [animation-delay:300ms]">
            {name ? <strong>Hi, {name}! </strong> : null}
            {siteConfig.heroText}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-rise [animation-delay:380ms]">
            <Link to="/song" className="btn btn-primary min-h-14 px-7 text-lg">
              Start with the song
              <Icon name="ArrowRight" size={20} />
            </Link>
            {done > 0 ? (
              <p className="text-base font-bold">
                You have done {done} {done === 1 ? 'activity' : 'activities'}.
              </p>
            ) : null}
          </div>
        </div>

        <div className="col-span-4 lg:col-span-5 animate-rise [animation-delay:250ms]">
          <WordGame />
        </div>
      </section>

      {/* ── Las cuatro historias ───────────────────────────────────────── */}
      <section className="frame pb-24" aria-labelledby="historias">
        <h2 id="historias" className="text-display">
          <span className="strip">The four stories</span>
        </h2>
        <p className="mt-5 max-w-[52ch] text-lead">
          Each story comes in a different format, with its script and four activities.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
          <StoryPage to="/song" kind="song" cover={songs[0]?.cover} body="An original song. Listen and read the lyrics." count={songs.length} className="lg:col-span-7" />
          <StoryPage to="/podcast" kind="podcast" cover={episodes[0]?.cover} body="A video episode with its script." count={episodes.length} className="lg:col-span-5" />
          <StoryPage to="/short-film" kind="film" cover={films[0]?.cover} body="A film with no dialogue. Watch it and tell the story." count={films.length} className="lg:col-span-5" />
          <StoryPage to="/storytelling" kind="story" cover={stories[0]?.cover} body="A legend, myth or fable, told and illustrated." count={stories.length} className="lg:col-span-7" />
        </div>
      </section>

      {/* ── Actividades ────────────────────────────────────────────────── */}
      <section className="bg-green py-20 text-white" aria-labelledby="actividades-portada">
        <div className="frame grid-editorial items-end gap-y-8">
          <div className="col-span-4 lg:col-span-8">
            <h2 id="actividades-portada" className="text-display">
              <span className="strip">Activities</span>
            </h2>
            <p className="mt-6 max-w-[48ch] text-lead">
              Grammar, speaking, writing, reading, listening and vocabulary: {activityDefinitions.length}{' '}
              activities, four for each story.
            </p>
          </div>
          <div className="col-span-4 lg:col-span-4 lg:justify-self-end">
            <Link to="/activities" className="btn bg-sheet px-7 text-lg text-ink hover:bg-yellow-pale">
              See all the activities
              <Icon name="ArrowRight" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sobre esta guía ────────────────────────────────────────────── */}
      <section className="frame grid-editorial gap-y-10 py-24" aria-labelledby="sobre">
        <div className="col-span-4 lg:col-span-6">
          <h2 id="sobre" className="text-display">
            <span className="strip">About this guide</span>
          </h2>
          <p className="mt-6 max-w-[46ch] text-lead">
            A didactic web guide made by trainee teachers for teenagers who learn English at B1 level in
            Colombian schools.
          </p>
          <p className="mt-4 max-w-[46ch] text-base text-ink-soft">
            No accounts, no analytics and no ads, and this site sets no cookies. Your progress and name stay on
            this device. Every piece shows its source, license and credits.
          </p>
        </div>
        <div className="col-span-4 flex flex-col gap-8 lg:col-span-5 lg:col-start-8">
          {(['introduccion', 'biodata'] as const).map((id) => {
            const page = pages[id]
            if (!page) return null
            return (
              <Link key={id} to={`/${id}`} className="group relative block bg-sheet p-6 pt-8 transition-transform hover:-translate-y-1">
                <span className="tape" />
                <span className="block font-display text-4xl uppercase leading-none group-hover:text-blue">{page.title}</span>
                <span className="mt-2 block text-base text-ink-soft">{page.summary}</span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/** Una de las cuatro historias: una página pegada con cinta, con su portada o su trama. */
function StoryPage({
  to,
  kind,
  cover,
  body,
  count,
  className,
  tall = false,
}: {
  to: string
  kind: keyof typeof SECTION_COLORS
  cover?: string
  body: string
  count: number
  className?: string
  tall?: boolean
}) {
  return (
    <Link to={to} className={clsx('group relative flex flex-col bg-sheet p-3 pt-6 transition-transform hover:-translate-y-1', className)}>
      <span className="tape" />
      <Cover src={cover} kind={kind} alt="" className={clsx('contrast-125 grayscale-[35%]', tall ? 'aspect-[4/5]' : 'aspect-[16/10]')} />
      <span className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <span className="font-display text-[clamp(2.25rem,1.6rem+1.6vw,3.25rem)] uppercase leading-none group-hover:text-blue">
          {SECTION_NAMES[kind]}
        </span>
        <span className="mt-2 text-lg">{body}</span>
        <span className="mt-auto inline-flex items-center gap-2 pt-4 font-bold">
          {count > 0 ? `${count} ${count === 1 ? 'piece' : 'pieces'}` : 'Coming soon'}
          <Icon name="ArrowRight" size={20} className="transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  )
}

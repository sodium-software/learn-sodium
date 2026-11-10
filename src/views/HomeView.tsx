import { Link } from 'react-router-dom'

import { siteConfig } from '../config/site'
import { useProgress } from '../lib/progress-context'
import { Icon, LevelTag, ProgressBar } from '../components/ui'
import { activityDefinitions, activityTools } from '../activities/registry'
import { allContent, relatedContent, type ContentItem } from '../content'

/**
 * Home — la puerta del cuaderno.
 *
 * Responde primero a «¿por dónde sigo?»: el saludo con el nombre de la
 * persona, su progreso de hoy, y un atajo a la actividad que le toca.
 */
export function HomeView() {
  const { preferences, state, streak, minutesToday, overallProgress, updatePreferences } =
    useProgress()

  const goal = preferences.dailyGoalMinutes
  const goalRatio = goal > 0 ? Math.min(1, minutesToday / goal) : 0

  // La actividad sugerida: la primera pendiente; si están todas, la última.
  const pending = activityDefinitions.filter(
    (definition) => !state.completedActivityIds.includes(definition.id),
  )
  const suggested = pending[0] ?? activityDefinitions[0]

  // Contenido recomendado: lo que más se relaciona con lo ya consumido.
  const lastContentId = Object.keys(state.mediaProgress).at(-1)
  const recommended = lastContentId
    ? relatedContent(lastContentId, 3)
    : allContent.slice(0, 3)

  return (
    <div className="frame py-8 lg:py-12">
      {/* ── Saludo ─────────────────────────────────────────────────────── */}
      <section className="grid-editorial items-end gap-y-8">
        <div className="col-span-4 lg:col-span-7">
          <h1 className="text-hero font-display font-semibold leading-[0.94] tracking-[-0.04em] text-ink">
            {siteConfig.welcomeMessage},
            <br />
            {preferences.displayName}.
          </h1>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/activities/${suggested.id}`} className="btn btn-primary">
              {pending.length > 0 ? 'Empezar la actividad' : 'Repasar'}
              <Icon name="ArrowRight" size={16} />
            </Link>
            <Link to="/activities" className="btn btn-secondary">
              Ver las {activityDefinitions.length} actividades
            </Link>
          </div>
        </div>

        <div className="col-span-4 lg:col-span-4 lg:col-start-9">
          <p className="text-lead text-ink-soft">{siteConfig.welcomeSubtitle}</p>
          <p className="mt-4 text-base text-ink-mute">{siteConfig.purpose}</p>
        </div>
      </section>

      {/* ── Indicadores de progreso ─────────────────────────────────────── */}
      <section className="mt-10 border-y border-tint-deep py-7" aria-label="Tu progreso">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:gap-10">
          <div>
            <p className="label">Objetivo de hoy</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink tnum">
              {minutesToday}
              <span className="text-base text-ink-mute"> / {goal} min</span>
            </p>
            <div className="mt-3 max-w-xs">
              <ProgressBar value={minutesToday} max={goal} label="Minutos de hoy" />
            </div>
            <p className="mt-2 text-xs text-ink-mute">
              {goalRatio >= 1
                ? 'Objetivo cumplido. Lo que hagas ahora es extra.'
                : `Te faltan ${goal - minutesToday} minutos para el objetivo de hoy.`}
            </p>
          </div>

          <div>
            <p className="label">Racha</p>
            <p className="mt-2 flex items-center gap-2 font-display text-3xl font-semibold text-ink tnum">
              <Icon name="Flame" size={22} className="text-accent" />
              {streak}
              <span className="text-base text-ink-mute">
                {streak === 1 ? 'día' : 'días'}
              </span>
            </p>
          </div>

          <div>
            <p className="label">Actividades</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink tnum">
              {state.completedActivityIds.length}
              <span className="text-base text-ink-mute"> / {activityDefinitions.length}</span>
            </p>
          </div>

          <div>
            <p className="label">Avance total</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink tnum">
              {overallProgress}
              <span className="text-base text-ink-mute">%</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Accesos directos a cada experiencia ──────────────────────────── */}
      <section className="mt-14" aria-labelledby="experiencias">
        <h2 id="experiencias" className="text-head text-ink">
          Las cinco formas de aprender
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-soft">
          Cada sección tiene su propio ritmo: se escucha, se lee, se ve y se practica. El
          progreso se guarda en todas ellas.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
          <ExperienceTile
            to="/song"
            title="Canciones"
            body="Cuatro piezas con letra sincronizada y vocabulario."
            icon="Music"
            count={allContent.filter((item) => item.kind === 'song').length}
          />
          <ExperienceTile
            to="/storytelling"
            title="Historias"
            body="Lectura por capítulos con glosario y preguntas."
            icon="BookOpen"
            count={allContent.filter((item) => item.kind === 'story').length}
          />
          <ExperienceTile
            to="/podcast"
            title="Podcast"
            body="Episodios con transcripción y comprensión audible."
            icon="Podcast"
            count={allContent.filter((item) => item.kind === 'podcast').length}
          />
          <ExperienceTile
            to="/short-film"
            title="Cortometrajes"
            body="Piezas cortas con sinopsis y escenas."
            icon="Film"
            count={allContent.filter((item) => item.kind === 'film').length}
          />
          <ExperienceTile
            to="/activities"
            title="Actividades"
            body="Seis herramientas que se corrigen solas."
            icon="Target"
            count={activityDefinitions.length}
          />
        </div>
      </section>

      {/* ── Atajo: la actividad que toca ────────────────────────────────── */}
      <section className="mt-12" aria-labelledby="siguiente">
        <div className="grid-editorial items-stretch gap-y-6">
          <div className="col-span-4 lg:col-span-5">
            <h2 id="siguiente" className="text-head text-ink">
              Tu siguiente paso
            </h2>
            <p className="mt-3 max-w-md text-base text-ink-soft">
              {pending.length > 0
                ? 'Una sola actividad, elegida para que no tengas que decidir nada ahora.'
                : 'Has terminado todas las actividades del catálogo. Puedes repasar la que quieras.'}
            </p>

          </div>

          <div className="col-span-4 lg:col-span-6 lg:col-start-7">
            <div className="panel h-full px-6 py-6">
              <div className="flex items-center gap-3">
                <LevelTag level={suggested.level} />
                <p className="text-xs text-ink-mute">
                  {suggested.minutes} min · {activityTools.find((t) => t.id === suggested.id)?.typeLabel ?? 'Actividad'}
                </p>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
                {suggested.title}
              </p>
              <p className="mt-2 text-base text-ink-soft">{suggested.description}</p>

              <div className="mt-5 border-t border-tint-deep pt-4">
                <p className="label">Se relaciona con</p>
                <ul className="mt-2 space-y-1">
                  {suggested.relatedIds.slice(0, 3).map((id) => {
                    const item = allContent.find((entry) => entry.id === id)
                    if (!item) return null
                    return (
                      <li key={id}>
                        <Link
                          to={item.route}
                          className="text-sm text-ink-soft underline decoration-tint-deep underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                        >
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Actividades destacadas ───────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="destacadas">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="destacadas" className="text-head text-ink">
              Actividades destacadas
            </h2>
            <p className="mt-3 max-w-2xl text-base text-ink-soft">
              Las tres primeras del catálogo. Haz una y vuelve cuando quieras: tu
              resultado se guarda.
            </p>
          </div>
          <Link
            to="/activities"
            className="btn btn-secondary"
            aria-label="Ver todas las actividades"
          >
            Todas las actividades
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {activityDefinitions.slice(0, 3).map((definition) => {
            const result = state.activityResults[definition.id]
            const done = state.completedActivityIds.includes(definition.id)
            return (
              <Link
                key={definition.id}
                to={`/activities/${definition.id}`}
                className="panel group flex flex-col px-5 py-5 transition-colors hover:border-ink-mute"
              >
                <div className="flex items-center justify-between gap-3">
                  <LevelTag level={definition.level} />
                  <span className="text-xs text-ink-mute">{definition.minutes} min</span>
                </div>
                <p className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                  {definition.title}
                </p>
                <p className="mt-2 flex-1 text-sm text-ink-soft">{definition.tagline}</p>
                <p className="mt-4 border-t border-tint-deep pt-3 text-xs text-ink-mute">
                  {done && result
                    ? `Última vez: ${result.score}/100`
                    : 'Todavía sin empezar'}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Recomendado ─────────────────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="recomendado">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="recomendado" className="text-head text-ink">
              Recomendado para ti
            </h2>
            <p className="mt-3 max-w-2xl text-base text-ink-soft">
              {lastContentId
                ? 'Elegido por lo que comparte tema con lo que ya empezaste.'
                : 'Una muestra del catálogo para que veas de qué va el cuaderno.'}
            </p>
          </div>
        </div>

        <div className="mt-8 divide-y divide-tint-deep border-y border-tint-deep">
          {recommended.map((item) => (
            <ContentRow key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* ── Personalización ─────────────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="perfil">
        <div className="grid-editorial gap-y-8">
          <div className="col-span-4 lg:col-span-5">
            <h2 id="perfil" className="text-head text-ink">
              Este cuaderno es tuyo
            </h2>
            <p className="mt-3 text-base text-ink-soft">
              Cambia tu nombre, tu objetivo diario y lo que ves. Todo se guarda en este
              navegador.
            </p>
          </div>

          <div className="col-span-4 lg:col-span-6 lg:col-start-7">
            <div className="panel px-6 py-6">
              <label className="label block" htmlFor="display-name">
                Tu nombre
              </label>
              <input
                id="display-name"
                className="field mt-2"
                value={preferences.displayName}
                onChange={(event) => updatePreferences({ displayName: event.target.value })}
                placeholder="¿Cómo te llamamos?"
              />

              <label className="label mt-6 block" htmlFor="daily-goal">
                Objetivo diario: {goal} minutos
              </label>
              <input
                id="daily-goal"
                type="range"
                min={5}
                max={90}
                step={5}
                value={goal}
                onChange={(event) =>
                  updatePreferences({ dailyGoalMinutes: Number(event.target.value) })
                }
                className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tint-deep accent-accent"
              />

              <label className="mt-6 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.showTranslations}
                  onChange={(event) =>
                    updatePreferences({ showTranslations: event.target.checked })
                  }
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm text-ink">
                  Mostrar las traducciones al español en las actividades
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Una entrada del índice de secciones. No es una tarjeta: es una línea de
 * un índice impreso, con el icono en línea junto al nombre.
 */
function ExperienceTile({
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
    <Link to={to} className="group flex flex-col border-t border-tint-deep pt-4">
      <span className="flex items-center gap-2.5">
        <Icon
          name={icon}
          size={18}
          strokeWidth={1.7}
          className="shrink-0 text-accent"
        />
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          {title}
        </span>
      </span>
      <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{body}</span>
      <span className="mt-3 text-xs text-ink-mute">
        {count} piezas
        <Icon
          name="ArrowRight"
          size={14}
          className="ml-1.5 inline-block align-[-1px] text-ink-faint transition-transform duration-200 group-hover:translate-x-1"
        />
      </span>
    </Link>
  )
}

function ContentRow({ item }: { item: ContentItem }) {
  return (
    <Link
      to={item.route}
      className="group flex flex-col gap-3 py-5 transition-colors hover:bg-sheet sm:flex-row sm:items-center sm:gap-6"
    >
      <img
        src={item.cover}
        alt=""
        className="h-20 w-full shrink-0 object-cover sm:h-16 sm:w-24"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold tracking-tight text-ink">
          {item.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.summary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <LevelTag level={item.level} />
        <span className="text-sm text-ink-mute tnum">{item.minutes} min</span>
        <Icon
          name="ArrowRight"
          size={18}
          className="text-ink-faint transition-colors group-hover:text-accent"
        />
      </div>
    </Link>
  )
}

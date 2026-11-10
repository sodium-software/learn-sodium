import { Link } from 'react-router-dom'

import { Icon } from '../components/ui'
import { useProgress } from '../lib/progress-context'
import { activityDefinitions } from '../activities/registry'

/** Ajustes: preferencias, progreso y datos locales. */
export function SettingsView() {
  const { preferences, updatePreferences, state, resetAll, streak, minutesToday } = useProgress()

  const results = Object.entries(state.activityResults)
  const average = results.length
    ? Math.round(results.reduce((sum, [, result]) => sum + result.score, 0) / results.length)
    : 0

  return (
    <div className="frame py-10 lg:py-16">
      <header className="grid-editorial items-end gap-y-6">
        <div className="col-span-4 lg:col-span-7">
          <h1 className="text-hero font-display font-semibold leading-[0.96] tracking-[-0.04em] text-ink">
            Ajustes
          </h1>
        </div>
        <div className="col-span-4 lg:col-span-4 lg:col-start-9">
          <p className="text-lead text-ink-soft">
            Todo se guarda en este navegador. No hay cuentas ni servidores.
          </p>
        </div>
      </header>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* ── Preferencias ─────────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Preferencias
          </h2>

          <div className="panel mt-5 px-6 py-6">
            <label className="label block" htmlFor="settings-name">
              Tu nombre
            </label>
            <input
              id="settings-name"
              className="field mt-2"
              value={preferences.displayName}
              onChange={(event) => updatePreferences({ displayName: event.target.value })}
            />

            <label className="label mt-6 block" htmlFor="settings-goal">
              Objetivo diario: {preferences.dailyGoalMinutes} minutos
            </label>
            <input
              id="settings-goal"
              type="range"
              min={5}
              max={90}
              step={5}
              value={preferences.dailyGoalMinutes}
              onChange={(event) =>
                updatePreferences({ dailyGoalMinutes: Number(event.target.value) })
              }
              className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tint-deep accent-accent"
            />

            <label className="mt-6 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.showTranslations}
                onChange={(event) =>
                  updatePreferences({ showTranslations: event.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span>
                <span className="block text-sm text-ink">
                  Mostrar las traducciones al español
                </span>
                <span className="mt-1 block text-xs text-ink-mute">
                  Afecta a las tarjetas de vocabulario y a las pistas de las oraciones.
                </span>
              </span>
            </label>

            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.sidebarCollapsed}
                onChange={(event) =>
                  updatePreferences({ sidebarCollapsed: event.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span>
                <span className="block text-sm text-ink">Barra lateral plegada</span>
                <span className="mt-1 block text-xs text-ink-mute">
                  Muestra sólo los iconos en escritorio.
                </span>
              </span>
            </label>
          </div>
        </section>

        {/* ── Progreso ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Tu progreso
          </h2>

          <div className="panel mt-5 px-6 py-6">
            <dl className="grid grid-cols-2 gap-6">
              <div>
                <dt className="label">Actividades completadas</dt>
                <dd className="mt-1 font-display text-3xl font-semibold text-ink tnum">
                  {state.completedActivityIds.length}
                  <span className="text-base text-ink-mute">
                    /{activityDefinitions.length}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="label">Media de aciertos</dt>
                <dd className="mt-1 font-display text-3xl font-semibold text-ink tnum">
                  {average}
                  <span className="text-base text-ink-mute">/100</span>
                </dd>
              </div>
              <div>
                <dt className="label">Minutos hoy</dt>
                <dd className="mt-1 font-display text-3xl font-semibold text-ink tnum">
                  {minutesToday}
                </dd>
              </div>
              <div>
                <dt className="label">Racha</dt>
                <dd className="mt-1 font-display text-3xl font-semibold text-ink tnum">
                  {streak}
                  <span className="text-base text-ink-mute"> días</span>
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-tint-deep pt-5">
              <p className="label">Vocabulario dominado</p>
              <p className="mt-1 text-sm text-ink-soft">
                {state.masteredTerms.length} palabras marcadas
              </p>
              {state.masteredTerms.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {state.masteredTerms.map((term) => (
                    <li
                      key={term}
                      className="bg-accent-pale px-2.5 py-1 text-xs font-medium text-accent"
                    >
                      {term}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mt-6 border-t border-tint-deep pt-5">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Esto borra todo tu progreso guardado en este navegador. ¿Continuar?',
                    )
                  ) {
                    resetAll()
                  }
                }}
                className="btn btn-secondary"
              >
                <Icon name="RotateCcw" size={15} />
                Borrar todo el progreso
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Estado técnico ─────────────────────────────────────────────── */}
      <section className="mt-16 border-t border-tint-deep pt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
          Sobre este cuaderno
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-soft">
          La Cartilla es una aplicación estática: todo el material (canciones, podcasts,
          cortiempres y sus imágenes) se genera localmente y se sirve desde el mismo
          sitio. No hay backend, ni cuentas, ni servicios externos. Tu progreso vive en
          el almacenamiento local de este navegador.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-ink-mute">
          Última visita:{' '}
          {new Date(state.lastVisit).toLocaleDateString('es', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div className="mt-5">
          <Link to="/activities" className="btn btn-secondary">
            Volver a las actividades
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}

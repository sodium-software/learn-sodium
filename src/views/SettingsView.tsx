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
          <h1 className="text-hero font-display font-extrabold leading-[0.96] text-ink">
            Settings
          </h1>
        </div>
        <div className="col-span-4 lg:col-span-4 lg:col-start-9">
          <p className="text-lead text-ink-soft">
            Everything is saved in this browser. No accounts, no servers.
          </p>
        </div>
      </header>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* ── Preferencias ─────────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-extrabold text-ink">
            Preferences
          </h2>

          <div className="panel mt-5 px-6 py-6">
            <label className="label block" htmlFor="settings-name">
              Your name
            </label>
            <input
              id="settings-name"
              className="field mt-2"
              value={preferences.displayName}
              onChange={(event) => updatePreferences({ displayName: event.target.value })}
            />

            <label className="label mt-6 block" htmlFor="settings-goal">
              Daily goal: {preferences.dailyGoalMinutes} minutes
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
              className="mt-1 w-full"
            />

            <label className="mt-6 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.showTranslations}
                onChange={(event) =>
                  updatePreferences({ showTranslations: event.target.checked })
                }
                className="mt-0.5 h-6 w-6 shrink-0"
              />
              <span>
                <span className="block text-sm text-ink">
                  Show Spanish translations
                </span>
                <span className="mt-1 block text-xs text-ink-mute">
                  Used in word cards and in sentence hints.
                </span>
              </span>
            </label>

          </div>
        </section>

        {/* ── Progreso ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-extrabold text-ink">
            Your progress
          </h2>

          <div className="panel mt-5 px-6 py-6">
            <dl className="grid grid-cols-2 gap-6">
              <div>
                <dt className="label">Activities completed</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-ink tnum">
                  {state.completedActivityIds.length}
                  <span className="text-base text-ink-mute">
                    /{activityDefinitions.length}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="label">Average score</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-ink tnum">
                  {average}
                  <span className="text-base text-ink-mute">/100</span>
                </dd>
              </div>
              <div>
                <dt className="label">Minutes today</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-ink tnum">
                  {minutesToday}
                </dd>
              </div>
              <div>
                <dt className="label">Streak</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-ink tnum">
                  {streak}
                  <span className="text-base text-ink-mute"> days</span>
                </dd>
              </div>
            </dl>

            <div className="mt-6 pt-5">
              <p className="label">Words learned</p>
              <p className="mt-1 text-sm text-ink-soft">
                {state.masteredTerms.length} words marked
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

            <div className="mt-6 pt-5">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'This deletes all the progress saved in this browser. Continue?',
                    )
                  ) {
                    resetAll()
                  }
                }}
                className="btn btn-secondary"
              >
                <Icon name="RotateCcw" size={15} />
                Delete all progress
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Estado técnico ─────────────────────────────────────────────── */}
      <section className="mt-16 pt-8">
        <h2 className="font-display text-xl font-extrabold text-ink">
          About this notebook
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-soft">
          La Cartilla is a static site: all the songs, podcasts, short films and their
          pictures are served from this same site. There is no backend, no accounts and
          no outside services. Your progress lives in this browser's local storage.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-ink-mute">
          Last visit:{' '}
          {new Date(state.lastVisit).toLocaleDateString('en', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div className="mt-5">
          <Link to="/activities" className="btn btn-secondary">
            Back to activities
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}

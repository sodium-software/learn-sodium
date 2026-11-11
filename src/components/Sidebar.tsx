import { useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { currentIdentity, siteConfig } from '../config/site'
import { settings } from '../content'
import { useProgress } from '../lib/progress-context'
import { clsx } from '../lib/cn'
import { Icon } from '../components/ui'
import { navEntries } from './nav'

/** Wordmark de la identidad activa (ver src/config/site.ts). */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const big = size === 'lg'
  if (currentIdentity() === 'recreo') {
    return (
      <span className={clsx('inline-flex items-center gap-2 font-display font-semibold text-ink', big ? 'text-3xl' : 'text-lg')}>
        <span aria-hidden="true" className="flex gap-1">
          <span className={clsx('rounded-full bg-accent', big ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5')} />
          <span className={clsx('rounded-full bg-ink', big ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5')} />
          <span className={clsx('rounded-full bg-[#e9a23b]', big ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5')} />
        </span>
        {siteConfig.platformName}
      </span>
    )
  }
  return (
    <span className={clsx('inline-flex items-baseline gap-2 font-display font-semibold lowercase tracking-[-0.03em] text-ink', big ? 'text-3xl' : 'text-lg')}>
      <span className="border-b-[3px] border-double border-accent pb-0.5">{siteConfig.platformName}</span>
      <span aria-hidden="true" className="text-accent">
        abc
      </span>
    </span>
  )
}

/**
 * La marca: enlaza a Inicio. Cinco toques seguidos abren el juego oculto
 * (si está activado en el panel).
 */
export function Brand({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const taps = useRef<number[]>([])
  const onClick = (event: React.MouseEvent) => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < 2500), now]
    if (taps.current.length >= 5 && settings.easterEgg) {
      event.preventDefault()
      taps.current = []
      navigate('/juego')
    }
  }
  return (
    <Link to="/" onClick={onClick} className="flex min-w-0 items-center gap-3" aria-label={`${siteConfig.platformName}, ir a Inicio`}>
      {compact ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent font-display text-base font-semibold text-accent-ink" aria-hidden="true">
          {siteConfig.platformName.replace(/^La /, '').slice(0, 1)}
        </span>
      ) : (
        <span className="min-w-0">
          <Wordmark />
          <span className="block truncate text-xs text-ink-mute">{siteConfig.tagline}</span>
        </span>
      )}
    </Link>
  )
}

/**
 * Barra lateral. En escritorio se pliega a una tira de iconos; en móvil es un
 * cajón que se abre desde la barra superior.
 *
 * La barra móvil (MobileHeader) vive fuera de esta fila horizontal: si
 * compartiera fila con el contenido, se quedaría con su ancho intrínseco y
 * aplastaría la columna principal en pantallas pequeñas.
 */
export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const { preferences, updatePreferences, state } = useProgress()
  const collapsed = preferences.sidebarCollapsed

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMobile()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, onCloseMobile])

  const doneCount = state.completedActivityIds.length

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Secciones de la plataforma">
      {navEntries.map((entry) => (
        <NavLink
          key={entry.id}
          to={entry.to}
          end={entry.to === '/'}
          onClick={onCloseMobile}
          title={collapsed ? entry.label : undefined}
          className={({ isActive }) =>
            clsx(
              'group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-accent text-accent-ink'
                : 'text-ink-soft hover:bg-tint hover:text-ink',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={entry.icon} size={18} strokeWidth={1.75} />
              {!collapsed ? (
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{entry.label}</span>
                  <span
                    className={clsx(
                      'truncate text-xs',
                      isActive ? 'text-accent-ink/75' : 'text-ink-mute',
                    )}
                  >
                    {entry.id === 'activities' && doneCount > 0
                      ? `${doneCount} completadas`
                      : entry.hint}
                  </span>
                </span>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            onClick={onCloseMobile}
            aria-label="Cerrar el menú"
          />
          <div className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col bg-paper shadow-menu">
            <div className="flex items-center justify-between border-b border-tint-deep px-4 py-3">
              <Brand />
              <button
                type="button"
                onClick={onCloseMobile}
                className="btn btn-ghost h-10 w-10 p-0"
                aria-label="Cerrar el menú"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
          </div>
        </div>
      ) : null}

      {/* Escritorio */}
      <aside
        className={clsx(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-tint-deep bg-paper transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-[17rem]',
        )}
      >
        <div className="px-4 py-5">
          <Brand compact={collapsed} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">{nav}</div>

        <div className="border-t border-tint-deep px-3 py-3">
          <button
            type="button"
            onClick={() => updatePreferences({ sidebarCollapsed: !collapsed })}
            className={clsx(
              'flex w-full items-center gap-3 px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-tint hover:text-ink',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Expandir la barra lateral' : 'Plegar la barra lateral'}
          >
            <Icon name="ChevronLeft" size={18} className={clsx(collapsed && 'rotate-180')} />
            {!collapsed ? <span>Plegar la barra</span> : null}
          </button>
        </div>
      </aside>
    </>
  )
}

/**
 * Barra superior de móvil. Va fuera de la fila de contenido para que la
 * columna principal conserve todo el ancho disponible.
 */
export function MobileHeader({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex w-full items-center gap-3 border-b border-tint-deep bg-paper px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        className="btn btn-secondary h-10 w-10 shrink-0 p-0"
        aria-label="Abrir el menú"
      >
        <Icon name="LayoutGrid" size={18} />
      </button>
      <Brand />
    </header>
  )
}

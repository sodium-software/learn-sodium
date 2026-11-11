import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { siteConfig } from '../config/site'
import { settings } from '../content'
import { clsx } from '../lib/cn'
import { Icon } from './ui'
import { navEntries } from './nav'

/** Colores de las letras-imán del nombre, en orden. */
const LETTER_COLORS = [
  ['var(--color-red)', 'var(--color-red-deep)'],
  ['var(--color-blue)', 'var(--color-blue-deep)'],
  ['var(--color-green)', 'var(--color-green-deep)'],
] as const

/**
 * El nombre hecho de letras-imán. `animate` las deja caer una a una sobre la
 * puerta (solo en la portada); sin animación ya están en su sitio.
 */
export function MagnetWord({
  text,
  className,
  animate = false,
  offset = 0,
}: {
  text: string
  className?: string
  animate?: boolean
  offset?: number
}) {
  let index = offset
  return (
    <span className={clsx('inline-flex flex-wrap gap-x-[0.28em]', className)}>
      {text.split(' ').map((word, w) => (
        <span key={w} className="inline-flex">
          {[...word].map((char, c) => {
            const [color, deep] = LETTER_COLORS[index % LETTER_COLORS.length]
            const style = {
              '--c': color,
              '--d': deep,
              animationDelay: animate ? `${index * 55}ms` : undefined,
            } as React.CSSProperties
            index += 1
            return (
              <span key={c} className={clsx('mag-letter', animate && 'animate-stick')} style={style}>
                {char}
              </span>
            )
          })}
        </span>
      ))}
    </span>
  )
}

/**
 * La marca: enlaza a Inicio. Cinco toques seguidos abren el juego oculto
 * (si está activado en el panel).
 */
export function Brand() {
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
    <Link
      to="/"
      onClick={onClick}
      className="flex min-h-12 items-center rounded-full pr-2 text-[1.75rem] leading-none"
      aria-label={`${siteConfig.platformName}, go to Home`}
    >
      <MagnetWord text={siteConfig.platformName} />
    </Link>
  )
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'inline-flex min-h-12 items-center rounded-full px-4 font-bold transition-colors',
    isActive ? 'bg-ink text-white' : 'text-ink hover:bg-tint',
  )

/**
 * Barra superior. En pantallas anchas muestra las secciones y agrupa lo del
 * adulto en «Para adultos»; en las estrechas todo va en un menú.
 */
export function SiteHeader() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [adultOpen, setAdultOpen] = useState(false)
  const [lastPath, setLastPath] = useState(location.pathname)
  const adultRef = useRef<HTMLDivElement>(null)

  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
    setAdultOpen(false)
  }

  useEffect(() => {
    if (!menuOpen && !adultOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setAdultOpen(false)
      }
    }
    const onClick = (event: MouseEvent) => {
      if (adultRef.current && !adultRef.current.contains(event.target as Node)) setAdultOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen, adultOpen])

  const kids = navEntries.filter((entry) => !entry.adult)
  const adults = navEntries.filter((entry) => entry.adult)
  const adultActive = adults.some((entry) => location.pathname.startsWith(entry.to))

  return (
    <header className="frame sticky top-0 z-30 bg-paper/95 py-3">
      <div className="flex items-center gap-3">
        <Brand />

        <nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label="Sections">
          {kids.map((entry) => (
            <NavLink key={entry.id} to={entry.to} end={entry.to === '/'} className={linkClass}>
              {entry.label}
            </NavLink>
          ))}
          <div className="relative" ref={adultRef}>
            <button
              type="button"
              className={clsx(
                'inline-flex min-h-12 items-center gap-1.5 rounded-full px-4 font-bold transition-colors',
                adultActive ? 'bg-ink text-white' : 'bg-sheet text-ink hover:bg-tint',
              )}
              aria-expanded={adultOpen}
              aria-controls="menu-adultos"
              onClick={() => setAdultOpen((open) => !open)}
            >
              For grown-ups
              <Icon name="ChevronDown" size={18} className={clsx('transition-transform', adultOpen && 'rotate-180')} />
            </button>
            {adultOpen ? (
              <div id="menu-adultos" className="absolute right-0 top-full mt-2 w-60 rounded-[var(--radius-md)] bg-sheet p-2 shadow-menu">
                {adults.map((entry) => (
                  <NavLink
                    key={entry.id}
                    to={entry.to}
                    className={({ isActive }) =>
                      clsx(
                        'flex min-h-12 items-center rounded-[var(--radius-sm)] px-4 font-bold',
                        isActive ? 'bg-ink text-white' : 'text-ink hover:bg-tint',
                      )
                    }
                  >
                    {entry.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <button
          type="button"
          className="btn btn-secondary ml-auto xl:hidden"
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="LayoutGrid" size={20} />
          Menu
        </button>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink/50" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div id="menu-movil" className="absolute inset-y-0 right-0 flex w-[22rem] max-w-[90vw] flex-col overflow-y-auto bg-paper p-4 shadow-menu">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-extrabold">Menu</span>
              <button type="button" className="btn btn-secondary" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <Icon name="X" size={20} />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-2" aria-label="Sections">
              {kids.map((entry) => (
                <NavLink
                  key={entry.id}
                  to={entry.to}
                  end={entry.to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex min-h-14 items-center rounded-[var(--radius-md)] px-5 font-display text-2xl font-extrabold',
                      isActive ? 'bg-ink text-white' : 'bg-sheet text-ink',
                    )
                  }
                >
                  {entry.label}
                </NavLink>
              ))}
            </nav>
            <p className="mt-8 px-1 font-bold text-ink-mute">For grown-ups</p>
            <nav className="mt-2 flex flex-col gap-1" aria-label="For grown-ups">
              {adults.map((entry) => (
                <NavLink key={entry.id} to={entry.to} className={linkClass}>
                  {entry.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  )
}

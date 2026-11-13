import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { clsx } from '../lib/cn'
import { SiteHeader } from './SiteHeader'

const BLOCKS = ['bg-red text-ink', 'bg-yellow text-ink', 'bg-sheet text-ink', 'bg-blue text-sheet', 'bg-green text-sheet']
const HEIGHTS = [86, 64, 100, 72, 92, 60, 80, 96, 68, 88]

/** Créditos de las fotos y el video de la portada (public/media/zine/credits.json). */
const CREDITS = [
  { text: '“Caño Cristales” by Mario Carvajal, CC BY 3.0', page: 'https://commons.wikimedia.org/w/index.php?curid=27473188' },
  { text: '“Amazon River, Colombia” by Pedro Szekely, CC BY-SA 2.0', page: 'https://commons.wikimedia.org/w/index.php?curid=82961839' },
  { text: '“Bus chiva tradicional 02” by pat_ossa, CC BY 2.0', page: 'https://commons.wikimedia.org/w/index.php?curid=18867480' },
  { text: '“Frailejones” by Jusezam, CC BY-SA 3.0', page: 'https://commons.wikimedia.org/w/index.php?curid=75788888' },
  { text: '“Printing in a letterpress” by Subhashish Panigrahi, CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Printing_in_a_letterpress.webm' },
  { text: 'all via Wikimedia Commons', page: 'https://commons.wikimedia.org/' },
]
import { useProgress } from '../lib/progress-context'

/**
 * Marco de la aplicación: la barra superior y la vista actual.
 */
export function AppShell() {
  const location = useLocation()
  const { addMinutes } = useProgress()
  const [lastPath, setLastPath] = useState(location.pathname)

  // Al cambiar de sección se vuelve arriba.
  // El ajuste se hace durante el render y no en un efecto, para no provocar
  // una segunda pasada de dibujado.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  // Entrada escalonada de secciones, tarjetas y titulares al hacer scroll.
  // Sin JavaScript o con movimiento reducido, todo se ve desde el principio.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const targets = [...document.querySelectorAll<HTMLElement>('main h2, main li, main article, main section > p')]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    targets.forEach((el, i) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return
      el.classList.add('reveal')
      el.style.transitionDelay = `${(i % 3) * 70}ms`
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [location.pathname])

  // Registrar minutos de práctica: se cuenta el tiempo que la persona pasa
  // con una actividad abierta.
  useEffect(() => {
    if (!location.pathname.startsWith('/activities/')) return
    const started = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - started) / 1000
      if (elapsed >= 600) {
        window.clearInterval(timer)
        addMinutes(10)
      }
    }, 1000)
    return () => {
      window.clearInterval(timer)
      const elapsed = (Date.now() - started) / 1000
      if (elapsed >= 60) addMinutes(Math.round(elapsed / 60))
    }
  }, [location.pathname, addMinutes])

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SiteHeader />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <footer className="bg-ink pb-10 pt-16 text-sheet">
        <div className="frame">
          {/* El nombre construido con bloques: cada letra recortada de su propio rectángulo. */}
          <p aria-hidden="true" className="flex h-[22svh] items-end gap-1 sm:h-[34svh]">
            {[...'LACARTILLA'].map((letter, i) => (
              <span
                key={i}
                className={clsx('flex flex-1 items-end justify-center pb-[0.05em] font-display leading-none', BLOCKS[i % BLOCKS.length])}
                style={{ height: `${HEIGHTS[i % HEIGHTS.length]}%`, fontSize: 'clamp(2rem, 1rem + 6vw, 9rem)' }}
              >
                {letter}
              </span>
            ))}
          </p>
          <div className="mt-14 grid gap-8 lg:grid-cols-12">
            <nav aria-label="Footer" className="flex flex-wrap gap-1 lg:col-span-6">
              <Link to="/introduccion" className="btn btn-ghost text-sheet hover:bg-sheet hover:text-ink">Introduction</Link>
              <Link to="/biodata" className="btn btn-ghost text-sheet hover:bg-sheet hover:text-ink">Bio</Link>
              <Link to="/activities" className="btn btn-ghost text-sheet hover:bg-sheet hover:text-ink">Activities</Link>
              <Link to="/settings" className="btn btn-ghost text-sheet hover:bg-sheet hover:text-ink">Settings</Link>
            </nav>
            <p className="text-base lg:col-span-6">
              No accounts, no analytics and no ads. Progress is saved only on this device.
            </p>
          </div>
          <p className="mt-10 max-w-[110ch] text-sm text-tint">
            Photos and video:{' '}
            {CREDITS.map((credit, i) => (
              <span key={credit.page}>
                <a href={credit.page} target="_blank" rel="noopener noreferrer" className="underline">
                  {credit.text}
                </a>
                {i < CREDITS.length - 1 ? '; ' : '.'}
              </span>
            ))}
          </p>
        </div>
      </footer>
    </div>
  )
}

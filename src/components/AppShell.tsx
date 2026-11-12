import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { SiteHeader, Wordmark } from './SiteHeader'
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
      <footer className="frame bg-sheet pb-10 pt-14">
        <p className="text-[clamp(3rem,1.5rem+7vw,8rem)] leading-none" aria-hidden="true">
          <Wordmark />
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-base text-ink-soft">
          <p className="max-w-[60ch]">
            No accounts, no third-party cookies and no analytics. Progress is saved only on this device.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-1">
            <Link to="/introduccion" className="btn btn-ghost">Introduction</Link>
            <Link to="/biodata" className="btn btn-ghost">Bio</Link>
            <Link to="/settings" className="btn btn-ghost">Settings</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

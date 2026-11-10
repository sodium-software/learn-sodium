import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { MobileHeader, Sidebar } from './Sidebar'
import { useProgress } from '../lib/progress-context'

/**
 * Marco de la aplicación: barra superior en móvil, barra lateral en escritorio
 * y la vista actual.
 *
 * La columna de contenido y la barra lateral comparten una fila; la barra
 * superior de móvil va por encima, en su propia fila, para que el contenido
 * use todo el ancho en pantallas pequeñas.
 */
export function AppShell() {
  const location = useLocation()
  const { addMinutes } = useProgress()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastPath, setLastPath] = useState(location.pathname)

  // Al cambiar de sección se vuelve arriba y se cierra el menú de móvil.
  // El ajuste se hace durante el render y no en un efecto, para no provocar
  // una segunda pasada de dibujado.
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

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
    <div className="flex min-h-screen flex-col bg-paper">
      <MobileHeader onOpen={() => setMobileOpen(true)} />
      <div className="flex flex-1 items-start">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

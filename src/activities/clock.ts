import { useCallback, useEffect, useRef } from 'react'

/**
 * Cronómetro de la actividad.
 *
 * El punto de partida se guarda en una referencia y se actualiza dentro de un
 * manejador de evento, nunca durante el render: así el tiempo que se registra
 * es siempre el real, y reiniciar es explícito.
 */
export function useActivityClock() {
  const startedAt = useRef(0)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const restart = useCallback(() => {
    startedAt.current = Date.now()
  }, [])

  const elapsed = useCallback(() => (Date.now() - startedAt.current) / 1000, [])

  return { restart, elapsed }
}

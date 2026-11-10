/** Formatea un número de segundos como m:ss. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

/** Formatea un número de segundos como "1 min 20 s" (para duraciones visible). */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  if (total < 60) return `${total} s`
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  if (rest === 0) return `${minutes} min`
  return `${minutes} min ${rest} s`
}

/** Fecha corta en español: "9 de noviembre". */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(date)
}

/** Limpia un texto para usarlo como clave o id. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Normaliza para comparar respuestas: minúsculas, sin tildes ni signos. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

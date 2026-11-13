/**
 * Color de cada sección: el fondo, el texto que va encima y la trama de
 * fotocopia (puntos en el tono oscuro del mismo color).
 */
export const SECTION_COLORS = {
  song: { bg: 'bg-red', ink: 'text-ink', ht: 'var(--color-red-deep)', base: 'var(--color-red)' },
  story: { bg: 'bg-blue', ink: 'text-white', ht: 'var(--color-blue-deep)', base: 'var(--color-blue)' },
  podcast: { bg: 'bg-yellow', ink: 'text-ink', ht: 'var(--color-yellow-deep)', base: 'var(--color-yellow)' },
  film: { bg: 'bg-ink', ink: 'text-white', ht: '#3a3a36', base: 'var(--color-ink)' },
  activity: { bg: 'bg-green', ink: 'text-white', ht: 'var(--color-green-deep)', base: 'var(--color-green)' },
} as const

export const SECTION_NAMES = {
  song: 'Song',
  story: 'Storytale',
  podcast: 'Podcast',
  film: 'Short film',
  activity: 'Activities',
} as const

/** Estilo de la trama de una sección (ver .halftone en index.css). */
export const halftone = (kind: keyof typeof SECTION_COLORS) =>
  ({ '--ht-bg': SECTION_COLORS[kind].base, '--ht': SECTION_COLORS[kind].ht }) as React.CSSProperties

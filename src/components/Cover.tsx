import { clsx } from '../lib/cn'
import { SECTION_COLORS, SECTION_NAMES, halftone } from './sections'

/**
 * Portada de una pieza. Si la pieza no trae imagen, se muestra una página
 * fotocopiada del color de su sección con su nombre, para que nunca quede un
 * hueco gris.
 */
export function Cover({
  src,
  kind,
  alt,
  className,
}: {
  src?: string
  kind: keyof typeof SECTION_COLORS
  alt: string
  className?: string
}) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={clsx('w-full object-cover', className)} />
  return (
    <div role="img" aria-label={alt} className={clsx('halftone grid w-full place-items-center p-4', className)} style={halftone(kind)}>
      <span className="bg-sheet px-3 py-1 font-display text-2xl uppercase text-ink">{SECTION_NAMES[kind]}</span>
    </div>
  )
}

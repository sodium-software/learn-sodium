import { clsx } from '../lib/cn'
import { Drawing } from './Drawings'
import { SECTION_COLORS } from './sections'

/**
 * Portada de una pieza. Si la pieza no trae imagen, se muestra el dibujo de
 * su sección sobre su color, para que nunca quede un hueco gris.
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
  const section = SECTION_COLORS[kind]
  return (
    <div role="img" aria-label={alt} className={clsx('grid w-full place-items-center', section.bg, className)}>
      <span className="grid aspect-square w-2/5 place-items-center rounded-full bg-sheet p-3">
        <Drawing name={section.drawing} className="w-full" />
      </span>
    </div>
  )
}

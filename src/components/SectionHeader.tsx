import type { ReactNode } from 'react'

import { clsx } from '../lib/cn'
import { Drawing } from './Drawings'
import { SECTION_COLORS } from './sections'

/**
 * Cabecera de una sección: un papel grande del color de la sección, con su
 * dibujo pegado a la derecha. Es el mismo color que la sección tiene en la
 * portada, para que el niño la reconozca sin leer.
 */
export function SectionHeader({
  kind,
  title,
  description,
  children,
}: {
  kind: keyof typeof SECTION_COLORS
  title: string
  description: string
  children?: ReactNode
}) {
  const section = SECTION_COLORS[kind]
  return (
    <header className="frame pt-6">
      <div
        className={clsx(
          'grid grid-cols-1 items-center gap-6 rounded-[var(--radius-xs)] px-6 py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-10 sm:py-12',
          section.bg,
          section.ink,
        )}
      >
        <div className="min-w-0 animate-rise">
          <h1 className="text-hero leading-[0.95]">{title}</h1>
          <p className="mt-4 max-w-[34ch] text-lead">{description}</p>
          {children}
        </div>
        <span className="hidden h-36 w-36 place-items-center rounded-full bg-sheet p-5 sm:grid lg:h-52 lg:w-52">
          <Drawing name={section.drawing} className="w-full" />
        </span>
      </div>
    </header>
  )
}

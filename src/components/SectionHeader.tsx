import type { ReactNode } from 'react'

import { clsx } from '../lib/cn'
import { SECTION_COLORS, halftone } from './sections'

/**
 * Cabecera de una sección: el titular recortado en tiras sobre una hoja del
 * color de la sección, con la trama de fotocopia a la derecha.
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
      <div className={clsx('grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]', section.bg, section.ink)}>
        <div className="min-w-0 px-6 py-10 sm:px-10 sm:py-14">
          <h1 className="text-hero animate-stick">
            <span className="strip">{title}</span>
          </h1>
          <p className="mt-6 max-w-[36ch] text-lead animate-rise [animation-delay:150ms]">{description}</p>
          {children}
        </div>
        <div aria-hidden="true" className="halftone hidden sm:block" style={halftone(kind)} />
      </div>
    </header>
  )
}

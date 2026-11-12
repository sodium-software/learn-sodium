import type { ReactNode } from 'react'

import { clsx } from '../lib/cn'
import { Icon, type IconName } from './icons'

export { Icon }
export type { IconName }


// ── Botón ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export function Button({
  variant = 'secondary',
  className,
  children,
  ...props
}: {
  variant?: ButtonVariant
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={clsx('btn', `btn-${variant}`, className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Tarjeta ─────────────────────────────────────────────────────────────────

export function Card({
  className,
  children,
  as: Component = 'article',
  ...props
}: {
  as?: 'article' | 'div' | 'section' | 'li'
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Component className={clsx('panel', className)} {...props}>
      {children}
    </Component>
  )
}

// ── Etiqueta ────────────────────────────────────────────────────────────────

export function Tag({
  children,
  tone = 'quiet',
  className,
}: {
  children: ReactNode
  tone?: 'quiet' | 'solid' | 'accent'
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex h-7 items-center gap-1.5 px-2 text-sm font-bold',
        tone === 'quiet' && 'bg-yellow-pale text-ink',
        tone === 'solid' && 'bg-ink text-white',
        tone === 'accent' && 'bg-accent text-accent-ink',
        className,
      )}
    >
      {children}
    </span>
  )
}

// ── Nivel (A1, B2…) ─────────────────────────────────────────────────────────

export function LevelTag({ level }: { level: string }) {
  return (
    <span className="inline-flex h-7 min-w-9 items-center justify-center bg-ink px-2 text-sm font-bold text-white">
      {level}
    </span>
  )
}

// ── Barra de progreso ───────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  label,
}: {
  value: number
  max?: number
  label?: string
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}

// ── Estado vacío ────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="panel-quiet px-6 py-10 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

// ── Cabecera de sección ─────────────────────────────────────────────────────

export function SectionHeading({
  title,
  description,
  action,
  id,
}: {
  title: string
  description?: string
  action?: ReactNode
  id?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2 id={id} className="text-head text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-base text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

// ── Créditos de una pieza ───────────────────────────────────────────────────

const LICENSE_TEXT: Record<string, string> = {
  propio: 'Own work',
  'dominio-publico': 'Public domain',
  cc: 'Creative Commons',
  permiso: 'Used with permission',
}

/** Fuente, licencia y créditos: van en la ficha de cada pieza. */
export function Credits({ piece }: { piece: { example: boolean; rights: { source: string; license: string; credits: string } } }) {
  const { source, license, credits } = piece.rights
  if (!source && !license && !credits && !piece.example) return null
  return (
    <section aria-label="Credits" className="pt-5 text-sm text-ink-mute">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink-soft">Credits</span>
        {piece.example ? <Tag>Example</Tag> : null}
      </p>
      <dl className="mt-2 grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
        {source ? (
          <>
            <dt>Source</dt>
            <dd className="text-ink-soft">{source}</dd>
          </>
        ) : null}
        {license ? (
          <>
            <dt>License</dt>
            <dd className="text-ink-soft">{LICENSE_TEXT[license] ?? license}</dd>
          </>
        ) : null}
      </dl>
      {credits ? <p className="mt-2 whitespace-pre-line">{credits}</p> : null}
    </section>
  )
}

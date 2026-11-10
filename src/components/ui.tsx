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
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium',
        tone === 'quiet' && 'bg-tint text-ink-soft',
        tone === 'solid' && 'bg-ink text-paper',
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
    <span className="inline-flex h-5 min-w-8 items-center justify-center bg-ink px-1.5 text-xs font-semibold tracking-wide text-paper">
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
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
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

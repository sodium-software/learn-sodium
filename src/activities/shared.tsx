import type { ReactNode } from 'react'

import { clsx } from '../lib/cn'
import { Button, Icon, ProgressBar } from '../components/ui'
import type {
  ActivityDefinition,
  ActivityResult,
  FillBlankItem,
  ListeningItem,
  MatchingPair,
  QuizQuestion,
  ReadingPassage,
  VocabularyCard,
} from '../types'

/**
 * Props que recibe toda herramienta pedagógica.
 *
 * Las herramientas reciben la definición tal como viene del contenido, sin
 * transformarla: así una actividad nueva no necesita tocar nada aquí.
 */
export interface ActivityToolProps {
  definition: ActivityDefinition
  /** Se llama al terminar la actividad con el resultado. */
  onComplete: (result: ActivityResult) => void
}

export type {
  ActivityDefinition,
  ActivityResult,
  FillBlankItem,
  ListeningItem,
  MatchingPair,
  QuizQuestion,
  ReadingPassage,
  VocabularyCard,
}

// ── Cabecera común ──────────────────────────────────────────────────────────

export function ActivityShell({
  step,
  total,
  title,
  children,
}: {
  step: number
  total: number
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <p className="label">
            {title} · step {step} of {total}
          </p>
        </div>
        <ProgressBar value={step} max={total} label="Activity progress" />
      </div>
      {children}
    </div>
  )
}

// ── Resultado ───────────────────────────────────────────────────────────────

export function ResultPanel({
  score,
  correct,
  total,
  onRetry,
  seconds,
}: {
  score: number
  correct: number
  total: number
  onRetry: () => void
  seconds: number
}) {
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)

  return (
    <div className="panel px-6 py-8 text-center">
      <p className="label">Result</p>
      <p className="mt-3 font-display text-6xl font-extrabold text-ink tnum">
        {score}
        <span className="text-2xl text-ink-mute">/100</span>
      </p>
      <p className="mt-3 text-base text-ink-soft">
        {correct} of {total} correct · {minutes} min {rest} s
      </p>

      <div className="mx-auto mt-6 max-w-md">
        <ProgressBar value={score} max={100} label="Score" />
      </div>

      <p className="mx-auto mt-6 max-w-md text-sm text-ink-soft">
        {score >= 90
          ? 'You got it! Play again any time to keep it fresh.'
          : score >= 60
            ? 'Good job! Go back to the ones you missed and try again.'
            : 'Look at it again and have another go. Trying is how we learn!'}
      </p>

      <div className="mt-7 flex justify-center">
        <Button variant="secondary" onClick={onRetry}>
          <Icon name="RotateCcw" size={15} />
          Try again
        </Button>
      </div>
    </div>
  )
}

// ── Retroalimentación de una respuesta ──────────────────────────────────────

export function Feedback({
  correct,
  explanation,
}: {
  correct: boolean
  explanation: string
}) {
  return (
    <div
      className={clsx(
        'mt-4 px-4 py-3',
        correct ? 'border-accent bg-accent-pale/40' : 'border-wrong bg-wrong-pale/50',
      )}
      role="status"
    >
      <p
        className={clsx(
          'font-display text-sm font-extrabold',
          correct ? 'text-accent' : 'text-wrong',
        )}
      >
        {correct ? 'Correct' : 'Not quite'}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{explanation}</p>
    </div>
  )
}

import { useState } from 'react'

import { Button, Icon } from '../../components/ui'
import { clsx } from '../../lib/cn'
import {
  ActivityShell,
  Feedback,
  ResultPanel,
  type ActivityToolProps,
} from '../shared'
import { useActivityClock } from '../clock'

/**
 * Quiz — preguntas de selección múltiple con retroalimentación inmediata.
 *
 * Se responde, se ve por qué, se pasa a la siguiente. Al final, la puntuación
 * sobre 100 y el detalle de lo que falló.
 */
export function QuizTool({ definition, onComplete }: ActivityToolProps) {
  const questions = definition.questions ?? []
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [finishedSeconds, setFinishedSeconds] = useState(0)
  const { restart, elapsed } = useActivityClock()

  const question = questions[index]

  if (finished) {
    const correct = Object.values(answers).filter(Boolean).length
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0
    const missed = questions.filter((q) => !answers[q.id])
    return (
      <div className="space-y-6">
        <ResultPanel
          score={score}
          correct={correct}
          total={questions.length}
          seconds={finishedSeconds}
          onRetry={() => {
            setIndex(0)
            setChosen(null)
            setAnswers({})
            setFinished(false)
          setFinishedSeconds(0)
          restart()
            }}
        />

        {missed.length > 0 ? (
          <div className="panel px-5 py-4">
            <p className="label">Review these</p>
            <ul className="mt-3 space-y-3">
              {missed.map((q) => (
                <li key={q.id}>
                  <p className="text-sm font-medium text-ink">{q.prompt}</p>
                  <p className="mt-1 text-sm text-ink-soft">{q.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  if (!question) {
    return <p className="text-ink-soft">This activity has no questions yet.</p>
  }

  const answered = chosen !== null
  const isCorrect = chosen === question.correctOptionId

  const choose = (optionId: string) => {
    if (answered) return
    setChosen(optionId)
    setAnswers((prev) => ({ ...prev, [question.id]: optionId === question.correctOptionId }))
  }

  const next = () => {
    if (index + 1 >= questions.length) {
      const correct = Object.values({ ...answers, [question.id]: isCorrect }).filter(Boolean).length
      const score = questions.length ? Math.round((correct / questions.length) * 100) : 0
      const seconds = elapsed()
      setFinishedSeconds(seconds)
      onComplete({
        score,
        correct,
        total: questions.length,
        at: new Date().toISOString(),
        seconds,
      })
      setFinished(true)
    } else {
      setIndex(index + 1)
      setChosen(null)
    }
  }

  return (
    <ActivityShell step={index + 1} total={questions.length} title={definition.title}>
      <div className="panel px-6 py-6">
        <p className="text-lg font-medium text-ink">{question.prompt}</p>

        <div className="mt-5 space-y-2">
          {question.options.map((option, optionIndex) => {
            const isChosen = chosen === option.id
            const isAnswer = option.id === question.correctOptionId
            const showState = answered && (isChosen || isAnswer)

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option.id)}
                disabled={answered}
                aria-pressed={isChosen}
                className={clsx(
                  'flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-sm)] border-2 px-4 py-3 text-left text-lg transition-colors',
                  showState && isAnswer
                    ? 'border-accent bg-accent-pale/40'
                    : showState && isChosen
                      ? 'border-wrong bg-wrong-pale/50'
                      : 'border-transparent bg-tint hover:bg-tint-deep',
                  answered && !showState && 'opacity-55',
                )}
              >
                <span
                  className={clsx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold',
                    showState && isAnswer
                      ? 'border-accent bg-accent text-accent-ink'
                      : showState && isChosen
                        ? 'border-wrong bg-wrong text-white'
                        : 'border-transparent bg-sheet text-ink',
                  )}
                >
                  {showState && isAnswer ? (
                    <Icon name="Check" size={13} strokeWidth={2.5} />
                  ) : showState && isChosen ? (
                    <Icon name="X" size={13} strokeWidth={2.5} />
                  ) : (
                    String.fromCharCode(65 + optionIndex)
                  )}
                </span>
                <span className="text-base text-ink">{option.text}</span>
              </button>
            )
          })}
        </div>

        {answered ? <Feedback correct={isCorrect} explanation={question.explanation} /> : null}

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={next} disabled={!answered}>
            {index + 1 >= questions.length ? 'See result' : 'Next'}
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>
    </ActivityShell>
  )
}

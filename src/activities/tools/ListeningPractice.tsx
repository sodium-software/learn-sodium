import { useState } from 'react'

import { AudioPlayer } from '../../components/AudioPlayer'
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
 * Listening Practice — escuchar un fragmento y responder.
 *
 * Cada fragmento es un archivo real de la plataforma (recorte de un podcast o
 * de un cortometraje). El audio se puede repetir antes de contestar.
 */
export function ListeningPractice({ definition, onComplete }: ActivityToolProps) {
  const items = definition.listening ?? []
  const [index, setIndex] = useState(0)
  const [time, setTime] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [finishedSeconds, setFinishedSeconds] = useState(0)
  const { restart, elapsed } = useActivityClock()

  const item = items[index]

  if (finished) {
    const correct = Object.values(results).filter(Boolean).length
    const score = items.length ? Math.round((correct / items.length) * 100) : 0
    return (
      <ResultPanel
        score={score}
        correct={correct}
        total={items.length}
        seconds={finishedSeconds}
        onRetry={() => {
          setIndex(0)
          setTime(0)
          setChosen(null)
          setResults({})
          setFinished(false)
          setFinishedSeconds(0)
          restart()
        }}
      />
    )
  }

  if (!item) {
    return <p className="text-ink-soft">Esta actividad no tiene fragmentos cargados.</p>
  }

  const question = item.question
  const answered = chosen !== null
  const isCorrect = chosen === question.correctOptionId

  const choose = (optionId: string) => {
    if (answered) return
    setChosen(optionId)
    setResults((prev) => ({ ...prev, [question.id]: optionId === question.correctOptionId }))
  }

  const next = () => {
    if (index + 1 >= items.length) {
      const correct = Object.values(results).filter(Boolean).length
      const score = items.length ? Math.round((correct / items.length) * 100) : 0
      const seconds = elapsed()
      setFinishedSeconds(seconds)
      onComplete({
        score,
        correct,
        total: items.length,
        at: new Date().toISOString(),
        seconds,
      })
      setFinished(true)
    } else {
      setIndex(index + 1)
      setTime(0)
      setChosen(null)
    }
  }

  return (
    <ActivityShell step={index + 1} total={items.length} title={definition.title}>
      <AudioPlayer
        src={item.audio}
        time={time}
        onTimeChange={setTime}
        label={`fragmento ${index + 1}`}
      />

      <div className="panel mt-6 px-6 py-6">
        <p className="text-lg font-medium text-ink">{question.prompt}</p>

        <div className="mt-5 space-y-2">
          {question.options.map((option) => {
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
                  'flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors',
                  showState && isAnswer
                    ? 'border-accent bg-accent-pale/40'
                    : showState && isChosen
                      ? 'border-wrong bg-wrong-pale/50'
                      : 'border-tint-deep bg-sheet hover:border-ink-mute',
                  answered && !showState && 'opacity-55',
                )}
              >
                <span
                  className={clsx(
                    'flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-semibold',
                    showState && isAnswer
                      ? 'border-accent bg-accent text-accent-ink'
                      : showState && isChosen
                        ? 'border-wrong bg-wrong text-white'
                        : 'border-tint-deep text-ink-mute',
                  )}
                >
                  {showState && isAnswer ? (
                    <Icon name="Check" size={13} strokeWidth={2.5} />
                  ) : showState && isChosen ? (
                    <Icon name="X" size={13} strokeWidth={2.5} />
                  ) : (
                    option.id.toUpperCase()
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
            {index + 1 >= items.length ? 'Ver resultado' : 'Siguiente fragmento'}
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>
    </ActivityShell>
  )
}

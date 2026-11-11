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
 * Reading Comprehension — leer un texto y responder.
 *
 * El texto se lee en una columna de medida cómoda, con un interlineado de
 * lectura, y las preguntas van debajo.
 */
export function ReadingComprehension({ definition, onComplete }: ActivityToolProps) {
  const passages = definition.passage ? [definition.passage] : []
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [finishedSeconds, setFinishedSeconds] = useState(0)
  const { restart, elapsed } = useActivityClock()

  const passage = passages[index]

  if (finished) {
    const correct = Object.values(results).filter(Boolean).length
    const total = passages.reduce((sum, item) => sum + item.questions.length, 0)
    const score = total ? Math.round((correct / total) * 100) : 0
    return (
      <ResultPanel
        score={score}
        correct={correct}
        total={total}
        seconds={finishedSeconds}
        onRetry={() => {
          setIndex(0)
          setChosen(null)
          setResults({})
          setFinished(false)
          setFinishedSeconds(0)
          restart()
        }}
      />
    )
  }

  if (!passage) {
    return <p className="text-ink-soft">This activity has no texts yet.</p>
  }

  const question = passage.questions[0]
  const answered = chosen !== null
  const isCorrect = chosen === question.correctOptionId

  const choose = (optionId: string) => {
    if (answered) return
    setChosen(optionId)
    setResults((prev) => ({ ...prev, [question.id]: optionId === question.correctOptionId }))
  }

  const next = () => {
    const withinPassage = passage.questions.indexOf(question) + 1
    if (withinPassage < passage.questions.length) {
      // Hay más preguntas de este texto.
      setChosen(null)
      return
    }
    if (index + 1 < passages.length) {
      setIndex(index + 1)
      setChosen(null)
      return
    }
    const correct = Object.values(results).filter(Boolean).length
    const total = passages.reduce((sum, item) => sum + item.questions.length, 0)
    const score = total ? Math.round((correct / total) * 100) : 0
    const seconds = elapsed()
    setFinishedSeconds(seconds)
    onComplete({
      score,
      correct,
      total,
      at: new Date().toISOString(),
      seconds,
    })
    setFinished(true)
  }

  const totalQuestions = passages.reduce((sum, item) => sum + item.questions.length, 0)
  const answeredCount = Object.keys(results).length

  return (
    <ActivityShell step={answeredCount + 1} total={totalQuestions} title={definition.title}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <article className="panel px-6 py-7">
          <h3 className="text-head text-ink">{passage.title}</h3>
          <div className="prose-read mt-5">
            {passage.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>

        <div className="panel self-start px-5 py-5">
          <p className="text-base font-medium text-ink">{question.prompt}</p>

          <div className="mt-4 space-y-2">
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
                    'flex w-full items-start gap-3 border-2 px-3 py-2.5 text-left transition-colors',
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
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 text-[0.6875rem] font-bold',
                      showState && isAnswer
                        ? 'border-accent bg-accent text-accent-ink'
                        : showState && isChosen
                          ? 'border-wrong bg-wrong text-white'
                          : 'border-transparent bg-sheet text-ink',
                    )}
                  >
                    {showState && isAnswer ? (
                      <Icon name="Check" size={11} strokeWidth={3} />
                    ) : showState && isChosen ? (
                      <Icon name="X" size={11} strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + optionIndex)
                    )}
                  </span>
                  <span className="text-sm leading-relaxed text-ink">{option.text}</span>
                </button>
              )
            })}
          </div>

          {answered ? <Feedback correct={isCorrect} explanation={question.explanation} /> : null}

          <div className="mt-5 flex justify-end">
            <Button variant="primary" onClick={next} disabled={!answered}>
              Next
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </div>
      </div>
    </ActivityShell>
  )
}

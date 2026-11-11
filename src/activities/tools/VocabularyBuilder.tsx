import { useState } from 'react'

import { Button, Icon } from '../../components/ui'
import {
  ActivityShell,
  ResultPanel,
  type ActivityToolProps,
} from '../shared'
import { useActivityClock } from '../clock'

/**
 * Vocabulary Builder — tarjetas interactivas.
 *
 * Se ve el término, se voltea la tarjeta, y la persona decide si lo domina.
 * El resultado es el porcentaje de tarjetas marcadas como dominadas.
 */
export function VocabularyBuilder({ definition, onComplete }: ActivityToolProps) {
  const cards = definition.cards ?? []
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [finishedSeconds, setFinishedSeconds] = useState(0)
  const { restart, elapsed } = useActivityClock()

  const card = cards[index]

  if (finished) {
    const correct = cards.filter((c) => known[c.id]).length
    const score = cards.length ? Math.round((correct / cards.length) * 100) : 0
    return (
      <ResultPanel
        score={score}
        correct={correct}
        total={cards.length}
        seconds={finishedSeconds}
        onRetry={() => {
          setIndex(0)
          setKnown({})
          setFinished(false)
          setFinishedSeconds(0)
          restart()
        }}
      />
    )
  }

  if (!card) {
    return <p className="text-ink-soft">This activity has no cards yet.</p>
  }

  const mastered = known[card.id] === true

  const advance = (markKnown: boolean) => {
    const nextKnown = { ...known, [card.id]: markKnown }
    setKnown(nextKnown)
    if (index + 1 >= cards.length) {
      const correct = cards.filter((c) => nextKnown[c.id]).length
      const score = cards.length ? Math.round((correct / cards.length) * 100) : 0
      const seconds = elapsed()
      setFinishedSeconds(seconds)
      onComplete({
        score,
        correct,
        total: cards.length,
        at: new Date().toISOString(),
        seconds,
      })
      setFinished(true)
    } else {
      setIndex(index + 1)
      setFlipped(false)
    }
  }

  return (
    <ActivityShell step={index + 1} total={cards.length} title={definition.title}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="panel group relative min-h-[19rem] w-full cursor-pointer p-8 text-left transition-colors hover:border-ink-mute"
          aria-pressed={flipped}
        >
          <span className="label">
            {flipped ? 'Meaning' : 'Tap to flip'}
          </span>

          <p className="mt-5 font-display text-4xl font-extrabold text-ink">
            {card.term}
          </p>

          {flipped ? (
            <div className="mt-6">
              <p className="text-lg text-ink">{card.definition}</p>
              <p className="mt-4 font-read text-base italic text-ink-soft">
                {card.example}
              </p>
              <p className="mt-4 text-sm text-ink-mute">Translation: {card.translation}</p>
            </div>
          ) : (
            <p className="mt-6 max-w-sm text-ink-soft">
              Think of the word. If you know it, tap below. If not, flip the card and
              try again in a little while.
            </p>
          )}

          <span className="pointer-events-none absolute right-5 top-5 text-ink-faint">
            <Icon name="RotateCcw" size={16} />
          </span>
        </button>

        <div className="flex flex-col gap-3">
          <div className="panel-quiet px-4 py-3">
            <p className="label">Your progress</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink tnum">
              {Object.values(known).filter(Boolean).length}
              <span className="text-base text-ink-mute"> / {cards.length}</span>
            </p>
            <p className="mt-1 text-xs text-ink-mute">cards learned</p>
          </div>

          <Button variant="primary" onClick={() => advance(true)}>
            <Icon name="Check" size={16} />
            I know it
          </Button>
          <Button variant="secondary" onClick={() => advance(false)}>
            Not yet
          </Button>

          {mastered ? (
            <p className="text-xs text-accent">This card is already marked.</p>
          ) : null}
        </div>
      </div>
    </ActivityShell>
  )
}

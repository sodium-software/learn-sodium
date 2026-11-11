import { useMemo, useState } from 'react'

import { Button, Icon } from '../../components/ui'
import { clsx } from '../../lib/cn'
import {
  ResultPanel,
  type ActivityToolProps,
} from '../shared'
import { useActivityClock } from '../clock'

/**
 * Word Matching — relacionar palabras con definiciones.
 *
 * Interacción por clic: se elige una palabra y después su definición. La
 * evaluación es automática en cuanto se completa cada par.
 */
export function WordMatching({ definition, onComplete }: ActivityToolProps) {
  const pairs = useMemo(() => definition.pairs ?? [], [definition.pairs])
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [matched, setMatched] = useState<Record<string, string>>({})
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [finishedSeconds, setFinishedSeconds] = useState(0)
  const { restart, elapsed } = useActivityClock()

  // Las definiciones se barajan para que no coincidan por posición.
  const shuffled = useMemo(() => {
    const items = [...pairs]
    // Barajado determinista por id: estable entre recargas pero no en orden.
    return items
      .map((pair, index) => ({
        pair,
        order: (pair.id.charCodeAt(1) * 7 + index * 13) % 97,
      }))
      .sort((a, b) => a.order - b.order)
      .map(({ pair }) => pair)
  }, [pairs])

  const complete = (finalMatched: Record<string, string>) => {
    const correct = Object.keys(finalMatched).length
    const score = pairs.length ? Math.round((correct / pairs.length) * 100) : 0
    const seconds = elapsed()
    setFinishedSeconds(seconds)
    onComplete({
      score,
      correct,
      total: pairs.length,
      at: new Date().toISOString(),
      seconds,
    })
    setFinished(true)
  }

  if (finished) {
    const correct = Object.keys(matched).length
    const score = pairs.length ? Math.round((correct / pairs.length) * 100) : 0
    return (
      <ResultPanel
        score={score}
        correct={correct}
        total={pairs.length}
        seconds={finishedSeconds}
        onRetry={() => {
          setSelectedWord(null)
          setMatched({})
          setWrongId(null)
          setFinished(false)
          setFinishedSeconds(0)
          restart()
        }}
      />
    )
  }

  const chooseDefinition = (pairId: string) => {
    if (!selectedWord) return
    if (matched[selectedWord]) return

    if (selectedWord === pairId) {
      const nextMatched = { ...matched, [selectedWord]: pairId }
      setMatched(nextMatched)
      setSelectedWord(null)
      setWrongId(null)
      if (Object.keys(nextMatched).length === pairs.length) {
        complete(nextMatched)
      }
    } else {
      setWrongId(pairId)
      window.setTimeout(() => setWrongId(null), 620)
    }
  }

  const pairedIds = new Set(Object.keys(matched))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="label">
          {pairedIds.size} de {pairs.length} pares relacionados
        </p>
        <p className="text-sm text-ink-soft">
          {selectedWord ? 'Ahora elige su definición' : 'Elige una palabra para empezar'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          {pairs.map((pair) => {
            const done = pairedIds.has(pair.id)
            const active = selectedWord === pair.id
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => !done && setSelectedWord(pair.id)}
                disabled={done}
                className={clsx(
                  'flex w-full items-center justify-between gap-3 border-2 px-4 py-3 text-left transition-colors',
                  done
                    ? 'border-accent bg-accent-pale/30 text-ink-mute'
                    : active
                      ? 'border-accent bg-accent-pale/40'
                      : 'border-transparent bg-tint hover:bg-tint-deep',
                )}
              >
                <span className={clsx('text-base', done && 'line-through')}>{pair.left}</span>
                {done ? <Icon name="Check" size={16} className="text-accent" /> : null}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          {shuffled.map((pair) => {
            const done = pairedIds.has(pair.id)
            const isWrong = wrongId === pair.id
            return (
              <button
                key={`def-${pair.id}`}
                type="button"
                onClick={() => chooseDefinition(pair.id)}
                disabled={done}
                className={clsx(
                  'flex w-full items-start gap-3 border-2 px-4 py-3 text-left transition-colors',
                  done
                    ? 'border-accent bg-accent-pale/30 text-ink-mute'
                    : isWrong
                      ? 'border-wrong bg-wrong-pale/50'
                      : 'border-transparent bg-tint hover:bg-tint-deep',
                )}
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 bg-tint-deep" aria-hidden="true" />
                <span className="text-sm leading-relaxed text-ink">{pair.right}</span>
              </button>
            )
          })}
        </div>
      </div>

      {pairedIds.size > 0 && !finished ? (
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={() => setSelectedWord(null)}>
            Cancelar selección
          </Button>
        </div>
      ) : null}
    </div>
  )
}

import { useState } from 'react'

import { Button, Icon } from '../../components/ui'
import { clsx } from '../../lib/cn'
import { normalizeAnswer } from '../../lib/format'
import {
  ResultPanel,
  type ActivityToolProps,
} from '../shared'
import { useActivityClock } from '../clock'

/**
 * Fill in the Blanks — completar oraciones con un banco de palabras.
 *
 * Se elige una palabra del banco, se coloca en el hueco y se valida. La
 * validación acepta la forma canónica y avisa con la explicación.
 */
export function FillInBlanks({ definition, onComplete }: ActivityToolProps) {
  const blanks = definition.blanks ?? []
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [finishedSeconds, setFinishedSeconds] = useState(0)
  const { restart, elapsed } = useActivityClock()

  const blank = blanks[current]

  // Banco de palabras de todas las oraciones, sin repetir.
  const bank = Array.from(
    new Set(blanks.flatMap((item) => item.options)),
  )

  if (finished) {
    const correct = Object.values(results).filter(Boolean).length
    const score = blanks.length ? Math.round((correct / blanks.length) * 100) : 0
    const missed = blanks.filter((item) => !results[item.id])
    return (
      <div className="space-y-6">
        <ResultPanel
          score={score}
          correct={correct}
          total={blanks.length}
          seconds={finishedSeconds}
          onRetry={() => {
            setCurrent(0)
            setSelected(null)
            setRevealed(false)
            setResults({})
            setFinished(false)
          setFinishedSeconds(0)
          restart()
            }}
        />
        {missed.length > 0 ? (
          <div className="panel px-5 py-4">
            <p className="label">Oraciones por repasar</p>
            <ul className="mt-3 space-y-3">
              {missed.map((item) => (
                <li key={item.id}>
                  <p className="text-sm text-ink">{item.sentence.replace('___', item.answer)}</p>
                  <p className="mt-1 text-sm text-ink-soft">{item.hint}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  if (!blank) {
    return <p className="text-ink-soft">Esta actividad no tiene oraciones cargadas.</p>
  }

  const check = () => {
    if (!selected) return
    const ok = normalizeAnswer(selected) === normalizeAnswer(blank.answer)
    const nextResults = { ...results, [blank.id]: ok }
    setResults(nextResults)
    setRevealed(true)

    if (current + 1 >= blanks.length) {
      const correct = Object.values(nextResults).filter(Boolean).length
      const score = blanks.length ? Math.round((correct / blanks.length) * 100) : 0
      const seconds = elapsed()
      setFinishedSeconds(seconds)
      onComplete({
        score,
        correct,
        total: blanks.length,
        at: new Date().toISOString(),
        seconds,
      })
      setFinished(true)
    }
  }

  const advance = () => {
    setCurrent(current + 1)
    setSelected(null)
    setRevealed(false)
  }

  const ok = selected ? normalizeAnswer(selected) === normalizeAnswer(blank.answer) : false

  const parts = blank.sentence.split('___')

  return (
    <div>
      <p className="label mb-4">
        Oración {current + 1} de {blanks.length}
      </p>

      <div className="panel px-6 py-6">
        <p className="text-xl leading-relaxed text-ink">
          {parts[0]}
          <span
            className={clsx(
              'mx-1 inline-block min-w-[5.5rem] border-b-2 px-2 text-center font-bold',
              revealed ? (ok ? 'border-accent text-accent' : 'border-wrong text-wrong') : 'border-ink-mute',
            )}
          >
            {selected ?? '…'}
          </span>
          {parts[1] ?? ''}
        </p>

        {revealed && !ok ? (
          <p className="mt-4 text-sm text-ink-soft">
            La respuesta correcta es <strong className="text-ink">{blank.answer}</strong>.
          </p>
        ) : null}
        {revealed && ok ? (
          <p className="mt-4 text-sm text-accent">Correcto.</p>
        ) : null}
        {!revealed && blank.hint ? (
          <p className="mt-4 text-sm text-ink-mute">Pista: {blank.hint}</p>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="label mb-3">Banco de palabras</p>
        <div className="flex flex-wrap gap-2">
          {bank.map((word) => {
            const isSelected = selected === word
            return (
              <button
                key={word}
                type="button"
                onClick={() => !revealed && setSelected(word)}
                disabled={revealed}
                aria-pressed={isSelected}
                className={clsx(
                  'min-h-12 rounded-full border-2 px-5 text-lg font-bold transition-colors',
                  isSelected
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-transparent bg-tint text-ink hover:bg-tint-deep',
                  revealed && !isSelected && 'opacity-45',
                )}
              >
                {word}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {revealed ? (
          <Button variant="primary" onClick={advance}>
            {current + 1 >= blanks.length ? 'Ver resultado' : 'Siguiente oración'}
            <Icon name="ChevronRight" size={16} />
          </Button>
        ) : (
          <Button variant="primary" onClick={check} disabled={!selected}>
            Comprobar
          </Button>
        )}
      </div>
    </div>
  )
}

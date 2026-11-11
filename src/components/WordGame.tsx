import { useMemo, useState } from 'react'

import { clsx } from '../lib/cn'
import { Drawing, type DrawingName } from './Drawings'

/** Palabras del juego de la portada: cortas, concretas y con dibujo. */
const WORDS: { en: string; es: string; drawing: DrawingName }[] = [
  { en: 'cat', es: 'gato', drawing: 'cat' },
  { en: 'sun', es: 'sol', drawing: 'sun' },
  { en: 'fish', es: 'pez', drawing: 'fish' },
  { en: 'boat', es: 'barco', drawing: 'boat' },
  { en: 'tree', es: 'árbol', drawing: 'tree' },
  { en: 'apple', es: 'manzana', drawing: 'apple' },
]

const TILE_COLORS = ['red', 'blue', 'green'] as const

/** Baraja las letras sin dejarlas en el orden de la respuesta. */
function scramble(word: string): string[] {
  const letters = [...word]
  for (let shift = 1; shift < letters.length; shift++) {
    const rotated = [...letters.slice(shift), ...letters.slice(0, shift)].reverse()
    if (rotated.join('') !== word) return rotated
  }
  return letters
}

/** Voz del navegador solo si es local: nada sale del dispositivo. */
function localEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return window.speechSynthesis.getVoices().find((v) => v.localService && v.lang.toLowerCase().startsWith('en')) ?? null
}

/**
 * «Arma la palabra»: el niño ve un dibujo y su nombre en español, y toca las
 * letras-imán en orden para escribirlo en inglés. Los huecos muestran lo que
 * falta.
 */
export function WordGame() {
  const [wordIndex, setWordIndex] = useState(0)
  const [placed, setPlaced] = useState<number[]>([])
  const [miss, setMiss] = useState<number | null>(null)
  const word = WORDS[wordIndex]
  const tiles = useMemo(() => scramble(word.en), [word.en])
  const done = placed.length === word.en.length
  const voice = done ? localEnglishVoice() : null

  const tap = (tileIndex: number) => {
    if (done || placed.includes(tileIndex)) return
    if (tiles[tileIndex] === word.en[placed.length]) {
      setPlaced([...placed, tileIndex])
      setMiss(null)
    } else {
      setMiss(tileIndex)
    }
  }

  const next = () => {
    setWordIndex((wordIndex + 1) % WORDS.length)
    setPlaced([])
    setMiss(null)
  }

  const say = () => {
    if (!voice) return
    const utterance = new SpeechSynthesisUtterance(word.en)
    utterance.voice = voice
    utterance.lang = voice.lang
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  return (
    <section aria-labelledby="arma-la-palabra" className="relative rounded-[var(--radius-xs)] bg-yellow px-5 pb-6 pt-8 sm:px-7">
      <span className="magnet" style={{ '--m': 'var(--color-blue)', '--md': 'var(--color-blue-deep)' } as React.CSSProperties} />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 id="arma-la-palabra" className="font-display text-3xl font-extrabold text-ink">
            Build the word
          </h2>
          <p className="mt-1 text-lg text-ink">
            What is this in English? Tap the letters in order.
          </p>
        </div>
        <Drawing name={word.drawing} className="h-20 w-24 shrink-0 rounded-[var(--radius-sm)] bg-sheet p-1.5" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label={`Your word: ${placed.map((i) => tiles[i]).join('') || 'empty'}`}>
        {[...word.en].map((_, slot) => (
          <span
            key={slot}
            className={clsx(
              'grid h-16 w-14 place-items-center rounded-[var(--radius-sm)] text-[2.75rem] leading-none',
              placed[slot] === undefined ? 'bg-yellow-pale' : 'bg-sheet',
            )}
          >
            {placed[slot] !== undefined ? (
              <span className="mag-letter animate-stick" style={tileStyle(placed[slot])}>
                {tiles[placed[slot]]}
              </span>
            ) : null}
          </span>
        ))}
      </div>

      {done ? (
        <div className="mt-5 flex flex-wrap items-center gap-3" role="status">
          <p className="mr-auto text-lg font-bold text-ink">
            Well done! <span lang="en">{word.en}</span>
          </p>
          {voice ? (
            <button type="button" className="btn btn-secondary" onClick={say}>
              Listen
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={next}>
            Another word
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {tiles.map((letter, i) => (
              <button
                key={`${word.en}-${i}`}
                type="button"
                onClick={() => tap(i)}
                disabled={placed.includes(i)}
                aria-label={`Letter ${letter}`}
                className={clsx(
                  'grid h-16 w-14 place-items-center rounded-[var(--radius-sm)] bg-sheet text-[2.75rem] leading-none transition-transform active:scale-95 disabled:opacity-25',
                  miss === i && 'animate-wobble',
                )}
              >
                <span className="mag-letter" style={tileStyle(i)}>
                  {letter}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 min-h-7 text-base text-ink" aria-live="polite">
            {miss !== null ? 'Not that one. Try another letter.' : ''}
          </p>
        </>
      )}
    </section>
  )
}

function tileStyle(i: number) {
  const color = TILE_COLORS[i % TILE_COLORS.length]
  return { '--c': `var(--color-${color})`, '--d': `var(--color-${color}-deep)` } as React.CSSProperties
}

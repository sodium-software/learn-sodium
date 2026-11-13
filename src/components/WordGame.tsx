import { useMemo, useState } from 'react'

import { clsx } from '../lib/cn'

/**
 * Palabras del juego de la portada: nivel B1, abstractas y ligadas a los temas
 * de la guía (naturaleza, inclusión y pertenencia). La pista es una definición
 * en inglés sencillo.
 */
const WORDS: { en: string; clue: string }[] = [
  { en: 'courage', clue: 'Being brave when something is difficult or scary.' },
  { en: 'belonging', clue: 'The feeling of being accepted as part of a group.' },
  { en: 'freedom', clue: 'The right to do, say or think what you want.' },
  { en: 'journey', clue: 'A long trip from one place to another.' },
  { en: 'memory', clue: 'Something you remember from the past.' },
  { en: 'kindness', clue: 'Being friendly, generous and caring with other people.' },
  { en: 'wisdom', clue: 'The ability to make good decisions from what you have learned.' },
  { en: 'harmony', clue: 'When people or things live together peacefully.' },
]

/** Colores de marcador de las letras colocadas, en orden. */
const MARKERS = ['bg-yellow text-ink', 'bg-red text-white', 'bg-blue text-white', 'bg-green text-white'] as const

/** Baraja las letras sin dejarlas en el orden de la respuesta (determinista). */
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
 * «Build the word»: el estudiante lee una definición en inglés y toca las
 * letras en orden para escribir la palabra. Los huecos muestran lo que falta.
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
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  const tile = 'grid h-14 w-12 place-items-center font-display text-3xl uppercase leading-none sm:h-16 sm:text-4xl'

  return (
    <section aria-labelledby="arma-la-palabra" className="relative bg-sheet px-5 pb-6 pt-8 sm:px-7">
      <span className="tape" />
      <h2 id="arma-la-palabra" className="text-4xl">
        Build the word
      </h2>
      <p className="mt-2 text-lg">
        <strong>Clue:</strong> {word.clue}
      </p>
      <p className="text-base text-ink-mute">Tap the letters in order. B1 vocabulary.</p>

      <div className="mt-5 flex flex-wrap gap-1.5" aria-label={`Your word: ${placed.map((i) => tiles[i]).join('') || 'empty'}`}>
        {[...word.en].map((_, slot) => (
          <span
            key={slot}
            className={clsx(tile, placed[slot] === undefined ? 'bg-tint' : clsx(MARKERS[slot % MARKERS.length], 'animate-stick'))}
          >
            {placed[slot] !== undefined ? tiles[placed[slot]] : null}
          </span>
        ))}
      </div>

      {done ? (
        <div className="mt-5 flex flex-wrap items-center gap-3" role="status">
          <p className="mr-auto text-lg font-bold">
            Well done! <span lang="en">{word.en}</span>
          </p>
          {voice ? (
            <button type="button" className="btn bg-tint text-ink hover:bg-yellow-pale" onClick={say}>
              Listen
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={next}>
            Another word
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tiles.map((letter, i) => (
              <button
                key={`${word.en}-${i}`}
                type="button"
                onClick={() => tap(i)}
                disabled={placed.includes(i)}
                aria-label={`Letter ${letter}`}
                className={clsx(
                  tile,
                  'bg-ink text-sheet transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-20',
                  miss === i && 'animate-wobble',
                )}
              >
                {letter}
              </button>
            ))}
          </div>
          <p className="mt-3 min-h-7 text-base" aria-live="polite">
            {miss !== null ? 'Not that one. Try another letter.' : ''}
          </p>
        </>
      )}
    </section>
  )
}

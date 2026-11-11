import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { settings } from '../content'
import { hasMoves, isComplete, isSolved, newLevel, pour, type Jar } from './logic'

/**
 * «Frascos de colores»: el juego oculto. Mecánica genérica de ordenar
 * colores, con arte, nombres y sonidos propios. Cada color lleva además un
 * símbolo, para que se pueda jugar sin distinguir colores, y su nombre en
 * inglés aparece al completar un frasco.
 */

const COLORS = [
  { name: 'red', es: 'rojo', fill: '#e5484d', mark: '●' },
  { name: 'blue', es: 'azul', fill: '#3e7bfa', mark: '▲' },
  { name: 'yellow', es: 'amarillo', fill: '#f5c518', mark: '■' },
  { name: 'green', es: 'verde', fill: '#30a46c', mark: '◆' },
  { name: 'purple', es: 'morado', fill: '#8e4ec6', mark: '★' },
  { name: 'orange', es: 'naranja', fill: '#f76b15', mark: '♥' },
  { name: 'pink', es: 'rosa', fill: '#e93d82', mark: '✚' },
]

const SAVE_KEY = 'la-cartilla:juego:v1'
const colorsFor = (level: number) => Math.min(3 + Math.floor((level - 1) / 2), COLORS.length)

function loadLevel(): number {
  try {
    return Math.max(1, Number(window.localStorage.getItem(SAVE_KEY)) || 1)
  } catch {
    return 1
  }
}

// Sonidos sintetizados en el navegador: sin archivos ni peticiones.
function useSound(enabled: boolean) {
  const ctx = useRef<AudioContext | null>(null)
  return useCallback(
    (notes: number[], length = 0.12) => {
      if (!enabled) return
      try {
        ctx.current ??= new AudioContext()
        const audio = ctx.current
        notes.forEach((freq, i) => {
          const osc = audio.createOscillator()
          const gain = audio.createGain()
          const start = audio.currentTime + i * length
          osc.type = 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.18, start)
          gain.gain.exponentialRampToValueAtTime(0.001, start + length * 1.6)
          osc.connect(gain).connect(audio.destination)
          osc.start(start)
          osc.stop(start + length * 1.7)
        })
      } catch {
        /* sin audio disponible */
      }
    },
    [enabled],
  )
}

export default function GameView() {
  const [started, setStarted] = useState(false)
  const [level, setLevel] = useState(loadLevel)
  const [history, setHistory] = useState<Jar[][]>(() => [newLevel(colorsFor(loadLevel()))])
  const [selected, setSelected] = useState<number | null>(null)
  const [sound, setSound] = useState(true)
  const [named, setNamed] = useState<string>('')
  const play = useSound(sound)
  const jars = history[history.length - 1]
  const solved = isSolved(jars)
  const stuck = !solved && !hasMoves(jars)

  useEffect(() => {
    document.title = 'Frascos de colores · La Cartilla'
  }, [])

  const startLevel = useCallback((next: number) => {
    setLevel(next)
    setHistory([newLevel(colorsFor(next))])
    setSelected(null)
    setNamed('')
    try {
      window.localStorage.setItem(SAVE_KEY, String(next))
    } catch {
      /* sin almacenamiento */
    }
  }, [])

  const choose = useCallback(
    (index: number) => {
      if (solved) return
      if (selected === null) {
        if (jars[index].length && !isComplete(jars[index])) {
          setSelected(index)
          play([520])
        }
        return
      }
      if (selected === index) {
        setSelected(null)
        return
      }
      const next = pour(jars, selected, index)
      if (!next) {
        play([180], 0.15)
        setSelected(jars[index].length && !isComplete(jars[index]) ? index : null)
        return
      }
      setHistory((h) => [...h, next])
      setSelected(null)
      if (isComplete(next[index])) {
        const color = COLORS[next[index][0]]
        setNamed(`${color.name.toUpperCase()}! · ${color.es}`)
        play(isSolved(next) ? [523, 659, 784, 1047] : [660, 880], isSolved(next) ? 0.14 : 0.1)
      } else {
        play([392, 330], 0.07)
      }
    },
    [jars, selected, solved, play],
  )

  const undo = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
    setSelected(null)
  }, [])
  const restart = useCallback(() => {
    setHistory((h) => h.slice(0, 1))
    setSelected(null)
    setNamed('')
  }, [])

  useEffect(() => {
    if (!started) return
    const onKey = (event: KeyboardEvent) => {
      const n = Number(event.key)
      if (n >= 1 && n <= jars.length) choose(n - 1)
      else if (event.key.toLowerCase() === 'z') undo()
      else if (event.key.toLowerCase() === 'r') restart()
      else if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, jars.length, choose, undo, restart])

  const fullscreen = () => {
    const root = document.documentElement
    if (document.fullscreenElement) void document.exitFullscreen()
    else void root.requestFullscreen?.().catch(() => undefined)
  }

  return (
    <div className="game fixed inset-0 flex flex-col overflow-hidden bg-[#1f1a3d] text-white" style={{ height: '100dvh' }}>
      <header className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-5">
        <Link to="/" className="game-btn">
          ← Volver
        </Link>
        <p className="mr-auto font-display text-lg font-semibold">
          Frascos de colores <span className="text-white/70">· nivel {level}</span>
        </p>
        <button type="button" className="game-btn" onClick={undo} disabled={history.length < 2 || !started} aria-keyshortcuts="Z">
          Deshacer
        </button>
        <button type="button" className="game-btn" onClick={restart} disabled={!started} aria-keyshortcuts="R">
          Reiniciar
        </button>
        <button type="button" className="game-btn" onClick={() => setSound((s) => !s)} aria-pressed={sound}>
          {sound ? 'Sonido: sí' : 'Sonido: no'}
        </button>
        <button type="button" className="game-btn" onClick={fullscreen}>
          Pantalla completa
        </button>
      </header>

      {!started ? (
        <section className="m-auto max-w-md px-6 text-center">
          <div className="flex justify-center gap-3" aria-hidden="true">
            <JarArt jar={[0, 0, 0, 0]} complete />
            <JarArt jar={[1, 2, 3]} complete={false} />
            <JarArt jar={[4, 4]} complete={false} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold">Frascos de colores</h1>
          {settings.dedication ? <p className="mt-4 whitespace-pre-line text-lg text-white/90">{settings.dedication}</p> : null}
          <p className="mt-5 text-white/80">
            Toca un frasco y luego otro para pasar el color de arriba. Solo cae sobre el mismo color o en un frasco vacío. Deja cada
            frasco de un solo color.
          </p>
          <p className="mt-2 text-sm text-white/60">Teclado: números 1–9 para elegir frasco, Z deshace, R reinicia.</p>
          <button type="button" className="game-btn game-btn-primary mt-6" onClick={() => setStarted(true)} autoFocus>
            Jugar
          </button>
        </section>
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-3 pb-6">
          <p className="h-7 font-display text-xl font-semibold text-[#ffd84d]" role="status" aria-live="polite">
            {solved ? '¡Lo lograste! · Well done!' : named}
          </p>
          <div className="flex max-w-3xl flex-wrap justify-center gap-x-3 gap-y-8 sm:gap-x-5">
            {jars.map((jar, index) => (
              <button
                key={index}
                type="button"
                onClick={() => choose(index)}
                aria-pressed={selected === index}
                aria-label={`Frasco ${index + 1}: ${jar.length ? jar.map((c) => COLORS[c].es).join(', ') : 'vacío'}`}
                className="game-jar rounded-b-[1.4rem] rounded-t-md transition-transform duration-150"
                style={{ transform: selected === index ? 'translateY(-14px)' : undefined }}
              >
                <JarArt jar={jar} complete={isComplete(jar)} />
                <span className="mt-1 block text-center text-xs text-white/60" aria-hidden="true">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
          {solved ? (
            <button type="button" className="game-btn game-btn-primary" onClick={() => startLevel(level + 1)} autoFocus>
              Siguiente nivel
            </button>
          ) : stuck ? (
            <p className="text-white/80" role="status">
              No quedan jugadas: deshaz o reinicia.
            </p>
          ) : null}
          {solved ? <Confetti /> : null}
        </main>
      )}
    </div>
  )
}

function JarArt({ jar, complete }: { jar: Jar; complete: boolean }) {
  const layer = 30
  return (
    <svg width="54" height="164" viewBox="0 0 54 164" aria-hidden="true" className="block">
      <rect x="15" y="0" width="24" height="10" rx="3" fill={complete ? '#ffd84d' : '#b98a55'} />
      <path d="M8 14 h38 v124 a19 19 0 0 1 -38 0 z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" />
      <g>
        {jar.map((c, i) => {
          const y = 150 - (i + 1) * layer
          const color = COLORS[c]
          return (
            <g key={i}>
              <path
                d={i === 0 ? `M10 ${y} h34 v${layer - 12} a17 17 0 0 1 -34 0 z` : `M10 ${y} h34 v${layer} h-34 z`}
                fill={color.fill}
              />
              <text x="27" y={y + layer / 2 + 5} textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.85)">
                {color.mark}
              </text>
            </g>
          )
        })}
      </g>
      <path d="M14 22 v100" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => i)
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((i) => (
        <span
          key={i}
          className="game-confetti"
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length].fill,
            animationDelay: `${(i % 9) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'

import { clsx } from '../lib/cn'
import { formatTime } from '../lib/format'
import { Icon } from './ui'

interface AudioPlayerProps {
  src: string
  /** Momento actual en segundos, controlado desde fuera (sincroniza la letra). */
  time: number
  onTimeChange: (seconds: number) => void
  onPlayingChange?: (playing: boolean) => void
  /** Etiqueta accesible del reproductor. */
  label: string
  /** Marca de tiempo del fragmento seleccionado, si aplica. */
  clipStart?: number
  clipEnd?: number
  className?: string
}

/**
 * Reproductor de audio. La barra de progreso es el control principal y el
 * tiempo se levanta hacia el padre, de modo que la letra o la transcripción
 * puedan seguirlo sin duplicar el estado.
 */
export function AudioPlayer({
  src,
  time,
  onTimeChange,
  onPlayingChange,
  label,
  clipStart,
  clipEnd,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.85)
  const [rate, setRate] = useState(1)
  const [ready, setReady] = useState(false)

  const lowerBound = clipStart ?? 0
  const upperBound = clipEnd ?? Number.POSITIVE_INFINITY

  // El elemento de audio es la fuente de verdad; el padre sólo escucha.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoaded = () => {
      setDuration(audio.duration || 0)
      setReady(true)
    }
    const onEnded = () => {
      setPlaying(false)
      onPlayingChange?.(false)
    }
    const onPause = () => {
      setPlaying(false)
      onPlayingChange?.(false)
    }
    const onPlay = () => {
      setPlaying(true)
      onPlayingChange?.(true)
    }

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('durationchange', onLoaded)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('durationchange', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
    }
  }, [onPlayingChange])

  // Cuando el padre cambia el tiempo (por ejemplo al pulsar un fragmento),
  // el audio se mueve con él — salvo que ya esté sonando, en cuyo caso se
  // respeta la posición real.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !ready) return
    if (Math.abs(audio.currentTime - time) > 0.6) {
      audio.currentTime = time
    }
  }, [time, ready])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [])

  const seek = useCallback(
    (next: number) => {
      const audio = audioRef.current
      const clamped = Math.min(Math.max(next, lowerBound), upperBound)
      if (audio) audio.currentTime = clamped
      onTimeChange(clamped)
    },
    [lowerBound, upperBound, onTimeChange],
  )

  // Al terminar un fragmento marcado, se detiene en el límite.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !ready) return
    const onTick = () => {
      if (clipEnd !== undefined && audio.currentTime >= clipEnd) {
        audio.pause()
        audio.currentTime = clipEnd
        onTimeChange(clipEnd)
        return
      }
      onTimeChange(audio.currentTime)
    }
    const interval = window.setInterval(onTick, 90)
    return () => window.clearInterval(interval)
  }, [clipEnd, onTimeChange, ready])

  const total = duration || 0
  const played = Math.min(Math.max(time - lowerBound, 0), Math.max(total - lowerBound, 0.001))
  const onScrub = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      seek(lowerBound + value)
    },
    [lowerBound, seek],
  )

  return (
    <div className={clsx('panel px-4 py-4 sm:px-5', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className="btn btn-primary h-14 w-14 shrink-0 p-0"
          aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        >
          <Icon name={playing ? 'Pause' : 'Play'} size={24} strokeWidth={2.25} />
        </button>

        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`scrub-${src}`}>
            Position in {label}
          </label>
          <input
            id={`scrub-${src}`}
            type="range"
            min={0}
            max={Math.max(total - lowerBound, 0.001)}
            step={0.05}
            value={played}
            onChange={onScrub}
            className="w-full"
          />
        </div>

        <p className="tnum shrink-0 text-base font-bold tabular-nums text-ink">
          {formatTime(time)} / {formatTime(total)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-ink-soft">
          <Icon name="Volume2" size={20} />
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-28"
          />
        </label>

        <div className="flex items-center gap-1">
          {[0.75, 1, 1.25].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRate(option)}
              className={clsx(
                'min-h-12 min-w-14 rounded-full px-3 font-bold transition-colors',
                rate === option
                  ? 'bg-ink text-white'
                  : 'bg-tint text-ink hover:bg-tint-deep',
              )}
              aria-pressed={rate === option}
            >
              {option}×
            </button>
          ))}
        </div>

        <p className="ml-auto text-sm text-ink-mute">
          {ready ? '' : 'Loading…'}
        </p>
      </div>
    </div>
  )
}

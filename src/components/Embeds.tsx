import { useState } from 'react'

import { embedPlatform, type EmbedPlatform } from '../shared/schema'
import { Icon } from './ui'

const PLATFORM: Record<Exclude<EmbedPlatform, 'youtube'>, { name: string; aspect: string }> = {
  canva: { name: 'Canva', aspect: 'aspect-[16/9]' },
  wordwall: { name: 'Wordwall', aspect: 'aspect-[4/3]' },
  educaplay: { name: 'Educaplay', aspect: 'aspect-[7/6]' },
  heyzine: { name: 'Heyzine', aspect: 'aspect-[4/3]' },
}

/**
 * Contenido de otra plataforma insertado en la ficha. El enlace llega ya
 * validado y convertido (ver embedUrl en src/shared/schema.ts). YouTube no
 * carga hasta que se toca; las demás se muestran directamente.
 */
export function Embed({ src, title, poster }: { src: string; title: string; poster?: string }) {
  const platform = embedPlatform(src)
  if (platform === 'youtube') return <YouTubeOnTap src={src} title={title} poster={poster} />
  const { name, aspect } = PLATFORM[platform]
  return (
    <section aria-label={`${title} on ${name}`} className="overflow-hidden rounded-[var(--radius-xs)] bg-sheet">
      <div className={`relative w-full ${aspect}`}>
        <iframe
          src={src}
          title={`${title} on ${name}`}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allow="fullscreen; autoplay"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <p className="px-4 py-2 text-sm text-ink-mute">From {name}.</p>
    </section>
  )
}

/**
 * Vídeo de YouTube que no carga nada de Google hasta que se toca: antes solo
 * se ve la portada local y un aviso corto.
 */
export function YouTubeOnTap({ src, title, poster }: { src: string; title: string; poster?: string }) {
  const [on, setOn] = useState(false)
  if (on) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-xs)] bg-ink">
        <iframe
          src={`${src}?autoplay=1&rel=0`}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => setOn(true)}
      className="group relative grid aspect-video w-full place-items-center overflow-hidden rounded-[var(--radius-xs)] bg-ink text-white"
      aria-label={`Play ${title} (loads YouTube)`}
    >
      {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" /> : null}
      <span className="relative flex flex-col items-center gap-3">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-red transition-transform group-hover:scale-105">
          <Icon name="Play" size={36} strokeWidth={2.25} />
        </span>
        <span className="rounded-full bg-ink/80 px-4 py-1.5 text-base font-bold">Tap to play · the video comes from YouTube</span>
      </span>
    </button>
  )
}

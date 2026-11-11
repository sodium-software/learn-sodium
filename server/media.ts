/**
 * Validación de subidas: el tipo se decide por los primeros bytes del archivo
 * (no por la extensión ni por lo que diga el navegador) y cada tipo tiene un
 * tamaño máximo. SVG y HTML quedan fuera a propósito.
 */

export type MediaCategory = 'image' | 'audio' | 'video'

interface Sniffed {
  mime: string
  ext: string
  category: MediaCategory
}

const MB = 1024 * 1024
export const MAX_BYTES: Record<MediaCategory, number> = {
  image: 5 * MB,
  audio: 25 * MB,
  video: 50 * MB,
}

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to))

export function sniff(bytes: Uint8Array): Sniffed | null {
  if (bytes.length < 12) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg', category: 'image' }
  if (ascii(bytes, 0, 8) === '\x89PNG\r\n\x1a\n') return { mime: 'image/png', ext: 'png', category: 'image' }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp', category: 'image' }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WAVE') return { mime: 'audio/wav', ext: 'wav', category: 'audio' }
  if (ascii(bytes, 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))
    return { mime: 'audio/mpeg', ext: 'mp3', category: 'audio' }
  if (ascii(bytes, 0, 4) === 'OggS') return { mime: 'audio/ogg', ext: 'ogg', category: 'audio' }
  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12)
    return brand.startsWith('M4A')
      ? { mime: 'audio/mp4', ext: 'm4a', category: 'audio' }
      : { mime: 'video/mp4', ext: 'mp4', category: 'video' }
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)
    return { mime: 'video/webm', ext: 'webm', category: 'video' }
  return null
}

export const MEDIA_KEY = /^[a-f0-9-]{36}\.(jpg|png|webp|wav|mp3|ogg|m4a|mp4|webm)$/

/** Claves de /files/ que aparecen en un texto (JSON publicado). */
export function referencedKeys(text: string): Set<string> {
  return new Set([...text.matchAll(/\/files\/([a-f0-9-]{36}\.[a-z0-9]{2,4})/g)].map((m) => m[1]))
}

/**
 * Carga del contenido publicado. Si la API no responde, la plataforma sigue
 * funcionando con la última versión que vio este navegador o, si es la
 * primera visita, con la copia empaquetada en el build.
 */

import type { PublicContent } from '../shared/schema'
import snapshot from './snapshot.json'
import { applyContent } from '.'

const CACHE_KEY = 'la-cartilla:content:v1'
const TIMEOUT_MS = 4000

function isContent(value: unknown): value is PublicContent {
  return typeof value === 'object' && value !== null && Array.isArray((value as PublicContent).items)
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    window.clearTimeout(timer)
  }
}

/** `?preview=1` (con sesión del panel) muestra los borradores. */
export const isPreview = new URLSearchParams(window.location.search).has('preview')

export async function loadContent(): Promise<'api' | 'cache' | 'snapshot' | 'preview'> {
  if (import.meta.env.VITE_STATIC !== '1') {
    if (isPreview) {
      try {
        const preview = await fetchJson('/api/admin/preview')
        if (isContent(preview)) {
          applyContent(preview)
          return 'preview'
        }
      } catch {
        /* sin sesión: se muestra lo publicado */
      }
    }
    try {
      const content = await fetchJson('/api/content')
      if (isContent(content)) {
        applyContent(content)
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(content))
        } catch {
          /* almacenamiento lleno o bloqueado */
        }
        return 'api'
      }
    } catch {
      /* se usa el respaldo */
    }
    try {
      const cached: unknown = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? 'null')
      if (isContent(cached)) {
        applyContent(cached)
        return 'cache'
      }
    } catch {
      /* caché corrupta */
    }
  }
  applyContent(snapshot as PublicContent)
  return 'snapshot'
}

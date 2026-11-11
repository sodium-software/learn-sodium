/** Cliente de la API del panel: añade el token CSRF a toda escritura. */

let csrf = ''

export class ApiError extends Error {
  status: number
  details: string[]
  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.method && init.method !== 'GET') headers.set('X-CSRF-Token', csrf)
  let body = init.body
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(init.json)
  }
  const response = await fetch(`/api/admin/${path}`, { ...init, headers, body, credentials: 'same-origin' })
  const data = (await response.json().catch(() => ({}))) as { error?: string; details?: string[] }
  if (!response.ok) throw new ApiError(response.status, data.error ?? `Error ${response.status}`, data.details)
  return data as T
}

export function setCsrf(token: string) {
  csrf = token
}

export interface ItemSummary {
  id: string
  kind: string
  position: number
  example: boolean
  title: string
  status: 'draft' | 'published' | 'changed'
  updatedAt: string
}

export const STATUS_LABEL: Record<ItemSummary['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  changed: 'Published · unpublished changes',
}

/** Ruta pública de cada pieza, para la vista previa. */
export function publicRoute(kind: string, id: string): string {
  const base: Record<string, string> = {
    song: '/song/',
    story: '/storytelling/',
    podcast: '/podcast/',
    film: '/short-film/',
    activity: '/activities/',
    page: '/',
  }
  return `${base[kind] ?? '/'}${id}`
}

/** Sube un archivo y devuelve su ruta pública (/files/…). */
export async function uploadFile(file: File, category?: string, key?: string): Promise<string> {
  const headers: Record<string, string> = { 'X-File-Name': encodeURIComponent(file.name) }
  if (category) headers['X-Media-Category'] = category
  if (key) headers['X-Media-Key'] = key
  const result = await api<{ url: string }>('upload', { method: 'POST', headers, body: file })
  return result.url
}

/**
 * Archivos subidos (R2). El bucket no es público: aquí se sirve solo lo que
 * usa una pieza publicada; los borradores, únicamente con sesión del panel.
 */

import { getSession, type Env } from '../../server/auth'
import { MEDIA_KEY } from '../../server/media'

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const key = String(params.key ?? '')
  const notFound = () => new Response('No encontrado', { status: 404 })
  if (!MEDIA_KEY.test(key)) return notFound()

  const row = await env.DB.prepare('SELECT is_public FROM media WHERE key = ?').bind(key).first<{ is_public: number }>()
  if (!row) return notFound()
  const isPublic = row.is_public === 1
  if (!isPublic && !(await getSession(request, env))) return notFound()

  const object = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers })
  if (!object) return notFound()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Accept-Ranges', 'bytes')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Content-Security-Policy', "default-src 'none'; sandbox")
  headers.set('Content-Disposition', 'inline')
  headers.set('Cache-Control', isPublic ? 'public, max-age=300' : 'private, no-store')

  if (!('body' in object)) return new Response(null, { status: 304, headers })
  const range = object.range as { offset?: number; length?: number } | undefined
  if (range && request.headers.has('Range')) {
    const offset = range.offset ?? 0
    const length = range.length ?? object.size - offset
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`)
    headers.set('Content-Length', String(length))
    return new Response(object.body, { status: 206, headers })
  }
  headers.set('Content-Length', String(object.size))
  return new Response(object.body, { headers })
}

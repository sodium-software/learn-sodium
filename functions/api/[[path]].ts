/**
 * API de La Cartilla (Pages Functions).
 *
 * Público:  GET /api/content
 * Panel:    /api/admin/*  (sesión + CSRF en toda escritura)
 */

import {
  DUMMY_HASH,
  createSession,
  destroySession,
  getSession,
  claimAttempt,
  passesCsrf,
  releaseAttempt,
  verifyPassword,
  type Env,
  type Session,
} from '../../server/auth'
import { MAX_BYTES, MEDIA_KEY, referencedKeys, sniff, type MediaCategory } from '../../server/media'
import {
  ID_PATTERN,
  KINDS,
  SCHEMAS,
  SETTINGS_SCHEMA,
  sanitize,
  slugify,
  type Kind,
  type PublicContent,
} from '../../src/shared/schema'

interface Row {
  id: string
  kind: Kind
  position: number
  draft: string
  published: string | null
  is_example: number
  updated_at: string
  published_at: string | null
}

const MAX_JSON = 2 * 1024 * 1024

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })
}

const fail = (status: number, error: string, details?: string[]) => json({ error, details }, status)

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message)
  }
}

async function readJson(request: Request): Promise<unknown> {
  if (!(request.headers.get('Content-Type') ?? '').startsWith('application/json')) throw new HttpError(415, 'Expected JSON')
  const text = await request.text()
  if (text.length > MAX_JSON) throw new HttpError(413, 'Too large')
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
}

const now = () => new Date().toISOString()

async function readSettings(env: Env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
  const map = Object.fromEntries(results.map((row) => [row.key, row.value]))
  return { easterEgg: map.easterEgg !== 'off', dedication: map.dedication ?? '' }
}

async function content(env: Env, preview: boolean): Promise<PublicContent> {
  const { results } = await env.DB.prepare(
    preview
      ? 'SELECT * FROM items ORDER BY kind, position, id'
      : 'SELECT * FROM items WHERE published IS NOT NULL ORDER BY kind, position, id',
  ).all<Row>()
  return {
    items: results.map((row) => ({
      id: row.id,
      kind: row.kind,
      example: row.is_example === 1,
      data: JSON.parse(preview ? row.draft : (row.published as string)),
    })),
    settings: await readSettings(env),
    version: results.reduce((latest, row) => ((row.published_at ?? '') > latest ? (row.published_at as string) : latest), ''),
  }
}

/** Marca como públicos solo los archivos que usa alguna pieza publicada. */
async function refreshPublicMedia(env: Env) {
  const { results } = await env.DB.prepare('SELECT published FROM items WHERE published IS NOT NULL').all<{ published: string }>()
  const keys = [...referencedKeys(results.map((row) => row.published).join('\n'))]
  await env.DB.batch([
    env.DB.prepare('UPDATE media SET is_public = 0'),
    ...keys.map((key) => env.DB.prepare('UPDATE media SET is_public = 1 WHERE key = ?').bind(key)),
  ])
}

function validate(kind: unknown, data: unknown) {
  if (!KINDS.includes(kind as Kind)) throw new HttpError(400, 'Invalid type')
  const result = sanitize(SCHEMAS[kind as Kind], data)
  if (result.errors.length) throw new HttpError(422, 'Please check the fields', result.errors)
  return result.data
}

// ── Panel ───────────────────────────────────────────────────────────────────

async function login(request: Request, env: Env): Promise<Response> {
  const body = (await readJson(request)) as { email?: unknown; password?: unknown }
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200)
  const password = String(body.password ?? '').slice(0, 200)
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local'

  const attempt = await claimAttempt(env, ip, email)
  if (attempt === null) return fail(429, 'Too many attempts. Wait 15 minutes and try again.')
  const admin = await env.DB.prepare('SELECT email, password FROM admins WHERE email = ?')
    .bind(email)
    .first<{ email: string; password: string }>()
  const ok = await verifyPassword(password, admin?.password ?? DUMMY_HASH)
  if (!admin || !ok) return fail(401, 'Wrong email or password.')
  await releaseAttempt(env, attempt)
  const { cookie, csrf } = await createSession(env, admin.email)
  return json({ email: admin.email, csrf }, 200, { 'Set-Cookie': cookie })
}

async function admin(request: Request, env: Env, session: Session, parts: string[]): Promise<Response> {
  const method = request.method
  const [section, id, action] = parts

  if (method !== 'GET' && method !== 'HEAD' && !passesCsrf(request, session)) {
    return fail(403, 'Invalid CSRF token')
  }

  if (section === 'session' && method === 'GET') return json(session)

  if (section === 'logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': await destroySession(request, env) })
  }

  if (section === 'preview' && method === 'GET') return json(await content(env, true))

  if (section === 'items' && !id && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT id, kind, position, is_example, updated_at, published_at, draft, published FROM items ORDER BY kind, position, id',
    ).all<Row>()
    return json(
      results.map((row) => ({
        id: row.id,
        kind: row.kind,
        position: row.position,
        example: row.is_example === 1,
        title: (JSON.parse(row.draft) as { title?: string }).title ?? row.id,
        status: row.published === null ? 'draft' : row.published === row.draft ? 'published' : 'changed',
        updatedAt: row.updated_at,
      })),
    )
  }

  if (section === 'items' && !id && method === 'POST') {
    const body = (await readJson(request)) as { kind?: unknown; data?: unknown }
    const data = validate(body.kind, body.data)
    const base = slugify(String(data.title))
    let newId = base
    for (let n = 2; await env.DB.prepare('SELECT 1 FROM items WHERE id = ?').bind(newId).first(); n++) newId = `${base}-${n}`
    const last = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM items WHERE kind = ?')
      .bind(body.kind)
      .first<{ next: number }>()
    await env.DB.prepare('INSERT INTO items (id, kind, position, draft, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(newId, body.kind, last?.next ?? 0, JSON.stringify(data), now())
      .run()
    return json({ id: newId }, 201)
  }

  if (section === 'items' && id) {
    if (!ID_PATTERN.test(id)) return fail(400, 'Invalid ID')
    const row = await env.DB.prepare('SELECT * FROM items WHERE id = ?').bind(id).first<Row>()
    if (!row) return fail(404, 'Not found')

    if (!action && method === 'GET') {
      return json({
        id: row.id,
        kind: row.kind,
        example: row.is_example === 1,
        data: JSON.parse(row.draft),
        status: row.published === null ? 'draft' : row.published === row.draft ? 'published' : 'changed',
      })
    }
    if (!action && method === 'PUT') {
      const body = (await readJson(request)) as { data?: unknown }
      const data = validate(row.kind, body.data)
      // Al editarla, la pieza deja de ser de ejemplo: ya es de la autora.
      await env.DB.prepare('UPDATE items SET draft = ?, updated_at = ?, is_example = 0 WHERE id = ?').bind(JSON.stringify(data), now(), id).run()
      return json({ ok: true })
    }
    if (!action && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run()
      await refreshPublicMedia(env)
      return json({ ok: true })
    }
    if (action === 'publish' && method === 'POST') {
      validate(row.kind, JSON.parse(row.draft))
      await env.DB.prepare('UPDATE items SET published = draft, published_at = ? WHERE id = ?').bind(now(), id).run()
      await refreshPublicMedia(env)
      return json({ ok: true })
    }
    if (action === 'unpublish' && method === 'POST') {
      await env.DB.prepare('UPDATE items SET published = NULL WHERE id = ?').bind(id).run()
      await refreshPublicMedia(env)
      return json({ ok: true })
    }
  }

  if (section === 'reorder' && method === 'POST') {
    const body = (await readJson(request)) as { ids?: unknown }
    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter((value) => ID_PATTERN.test(value)).slice(0, 500) : []
    if (ids.length) {
      await env.DB.batch(ids.map((itemId, index) => env.DB.prepare('UPDATE items SET position = ? WHERE id = ?').bind(index, itemId)))
    }
    return json({ ok: true })
  }

  if (section === 'examples' && method === 'DELETE') {
    const result = await env.DB.prepare("DELETE FROM items WHERE is_example = 1 AND kind <> 'page'").run()
    await refreshPublicMedia(env)
    return json({ deleted: result.meta.changes })
  }

  if (section === 'settings' && method === 'PUT') {
    const result = sanitize(SETTINGS_SCHEMA, await readJson(request))
    if (result.errors.length) return fail(422, 'Please check the fields', result.errors)
    await env.DB.batch(
      Object.entries(result.data).map(([key, value]) =>
        env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, String(value)),
      ),
    )
    return json({ ok: true })
  }

  if (section === 'settings' && method === 'GET') {
    const settings = await readSettings(env)
    return json({ easterEgg: settings.easterEgg ? 'on' : 'off', dedication: settings.dedication })
  }

  if (section === 'upload' && method === 'POST') return upload(request, env)

  if (section === 'export' && method === 'GET') {
    const [items, media] = await Promise.all([
      env.DB.prepare('SELECT * FROM items ORDER BY kind, position').all<Row>(),
      env.DB.prepare('SELECT key, type, size, name FROM media').all(),
    ])
    return json({
      format: 'la-cartilla-backup',
      version: 1,
      exportedAt: now(),
      settings: await readSettings(env),
      items: items.results.map((row) => ({
        id: row.id,
        kind: row.kind,
        position: row.position,
        example: row.is_example === 1,
        draft: JSON.parse(row.draft),
        published: row.published === null ? null : JSON.parse(row.published),
      })),
      media: media.results,
    })
  }

  if (section === 'import' && method === 'POST') return importBackup(request, env)

  return fail(404, 'Route not found')
}

async function upload(request: Request, env: Env): Promise<Response> {
  const declared = Number(request.headers.get('Content-Length') ?? 0)
  if (declared > MAX_BYTES.video) return fail(413, 'File too large')
  // Se lee con contador: Content-Length puede faltar (transfer chunked).
  const chunks: Uint8Array[] = []
  let total = 0
  const reader = request.body?.getReader()
  for (;;) {
    const part = reader ? await reader.read() : { done: true as const, value: undefined }
    if (part.done) break
    total += part.value.length
    if (total > MAX_BYTES.video) {
      await reader?.cancel()
      return fail(413, 'File too large')
    }
    chunks.push(part.value)
  }
  const bytes = new Uint8Array(total)
  chunks.reduce((offset, chunk) => (bytes.set(chunk, offset), offset + chunk.length), 0)
  const kind = sniff(bytes)
  if (!kind) return fail(415, 'File type not allowed. Use JPG, PNG, WebP, MP3, M4A, OGG, WAV, MP4 or WebM.')
  const expected = request.headers.get('X-Media-Category') as MediaCategory | null
  if (expected && expected !== kind.category) return fail(415, `Expected a ${expected} file`)
  if (bytes.length > MAX_BYTES[kind.category]) {
    return fail(413, `Maximum ${MAX_BYTES[kind.category] / 1024 / 1024} MB for this file type`)
  }

  // Al importar un respaldo se conserva la clave original para que las referencias sigan valiendo.
  const wanted = request.headers.get('X-Media-Key')
  const key = wanted && MEDIA_KEY.test(wanted) && wanted.endsWith(`.${kind.ext}`) ? wanted : `${crypto.randomUUID()}.${kind.ext}`
  const name = decodeURIComponent(request.headers.get('X-File-Name') ?? 'archivo').replace(/[^\w.\- ]/g, '').slice(0, 120)

  // Nunca se sobrescribe un archivo existente (un respaldo manipulado podría cambiar medios publicados).
  if (await env.DB.prepare('SELECT 1 FROM media WHERE key = ?').bind(key).first()) {
    return json({ key, url: `/files/${key}`, type: kind.mime, existing: true }, 200)
  }
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: kind.mime } })
  await env.DB.prepare(
    'INSERT INTO media (key, type, size, name, is_public, created_at) VALUES (?, ?, ?, ?, 0, ?) ',
  )
    .bind(key, kind.mime, bytes.length, name || 'archivo', now())
    .run()
  return json({ key, url: `/files/${key}`, type: kind.mime }, 201)
}

async function importBackup(request: Request, env: Env): Promise<Response> {
  const body = (await readJson(request)) as {
    format?: string
    items?: { id?: unknown; kind?: unknown; position?: unknown; example?: unknown; draft?: unknown; published?: unknown }[]
    settings?: { easterEgg?: boolean; dedication?: string }
  }
  if (body.format !== 'la-cartilla-backup' || !Array.isArray(body.items)) return fail(400, 'This is not a La Cartilla backup')

  const statements = [env.DB.prepare('DELETE FROM items')]
  const errors: string[] = []
  for (const item of body.items.slice(0, 2000)) {
    const id = String(item.id ?? '')
    if (!ID_PATTERN.test(id) || !KINDS.includes(item.kind as Kind)) {
      errors.push(`Piece with an invalid ID or type: ${id.slice(0, 40)}`)
      continue
    }
    const draft = sanitize(SCHEMAS[item.kind as Kind], item.draft)
    const published = item.published ? sanitize(SCHEMAS[item.kind as Kind], item.published) : null
    errors.push(...[...draft.errors, ...(published?.errors ?? [])].map((error) => `${id}: ${error}`))
    statements.push(
      env.DB.prepare(
        'INSERT INTO items (id, kind, position, draft, published, is_example, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(
        id,
        item.kind,
        Number(item.position) || 0,
        JSON.stringify(draft.data),
        published ? JSON.stringify(published.data) : null,
        item.example ? 1 : 0,
        now(),
        published ? now() : null,
      ),
    )
  }
  if (errors.length) return fail(422, 'The backup has errors; nothing was imported.', errors.slice(0, 50))

  const settings = sanitize(SETTINGS_SCHEMA, {
    easterEgg: body.settings?.easterEgg === false ? 'off' : 'on',
    dedication: body.settings?.dedication ?? '',
  }).data
  for (const [key, value] of Object.entries(settings)) {
    statements.push(
      env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, String(value)),
    )
  }
  await env.DB.batch(statements)
  await refreshPublicMedia(env)
  return json({ imported: statements.length - 1 })
}

// ── Entrada ─────────────────────────────────────────────────────────────────

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const parts = (Array.isArray(params.path) ? params.path : [params.path ?? '']).filter(Boolean) as string[]
  try {
    if (parts[0] === 'content' && parts.length === 1 && request.method === 'GET') {
      return json(await content(env, false), 200, { 'Cache-Control': 'no-cache' })
    }
    if (parts[0] === 'admin') {
      if (parts[1] === 'login' && request.method === 'POST') return await login(request, env)
      const session = await getSession(request, env)
      // Consultar la sesión sin tenerla no es un error: el panel decide si muestra el acceso.
      if (parts[1] === 'session' && parts.length === 2 && request.method === 'GET') {
        return json(session ?? { email: null, csrf: null })
      }
      if (!session) return fail(401, 'Please sign in')
      return await admin(request, env, session, parts.slice(1))
    }
    return fail(404, 'Route not found')
  } catch (error) {
    if (error instanceof HttpError) return fail(error.status, error.message, error.details)
    console.error(error)
    return fail(500, 'Internal error')
  }
}

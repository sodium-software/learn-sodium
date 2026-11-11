/**
 * Autenticación del panel: contraseña con PBKDF2, sesión en D1 con cookie
 * HttpOnly y token CSRF, y límite de intentos por IP y por correo.
 */

export interface Env {
  DB: D1Database
  MEDIA: R2Bucket
}

export interface Session {
  email: string
  csrf: string
}

const ITERATIONS = 100_000 // máximo que admite PBKDF2 en Workers
export const COOKIE = '__Host-lc_session'
const SESSION_SECONDS = 8 * 60 * 60
const WINDOW_MS = 15 * 60 * 1000
export const MAX_FAILURES_IP = 5
const MAX_FAILURES_EMAIL = 10

const enc = new TextEncoder()
const b64 = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))))
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

export function randomToken(bytes = 32): string {
  return b64(crypto.getRandomValues(new Uint8Array(bytes))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c] ?? '')
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return new Uint8Array(bits)
}

/** Formato: pbkdf2$<iteraciones>$<sal>$<hash>, todo en base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await pbkdf2(password, salt, ITERATIONS))}`
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split('$')
  if (scheme !== 'pbkdf2' || !salt || !hash) return false
  return sameBytes(await pbkdf2(password, unb64(salt), Number(iterations)), unb64(hash))
}

export async function sha256(text: string): Promise<string> {
  return b64(await crypto.subtle.digest('SHA-256', enc.encode(text)))
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') ?? ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

export async function getSession(request: Request, env: Env): Promise<Session | null> {
  const token = readCookie(request, COOKIE)
  if (!token) return null
  const row = await env.DB.prepare('SELECT email, csrf FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await sha256(token), Date.now())
    .first<Session>()
  return row ?? null
}

export async function createSession(env: Env, email: string): Promise<{ cookie: string; csrf: string }> {
  const token = randomToken()
  const csrf = randomToken()
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()),
    env.DB.prepare('INSERT INTO sessions (token_hash, email, csrf, expires_at) VALUES (?, ?, ?, ?)').bind(
      await sha256(token),
      email,
      csrf,
      Date.now() + SESSION_SECONDS * 1000,
    ),
  ])
  return {
    csrf,
    cookie: `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`,
  }
}

export async function destroySession(request: Request, env: Env): Promise<string> {
  const token = readCookie(request, COOKIE)
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run()
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

/** true si la IP o el correo superaron el límite de fallos en la ventana. */
export async function isLockedOut(env: Env, ip: string, email: string): Promise<boolean> {
  const since = Date.now() - WINDOW_MS
  const row = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM login_failures WHERE ip = ?1 AND at > ?3) AS byIp,
            (SELECT COUNT(*) FROM login_failures WHERE email = ?2 AND at > ?3) AS byEmail`,
  )
    .bind(ip, email, since)
    .first<{ byIp: number; byEmail: number }>()
  return (row?.byIp ?? 0) >= MAX_FAILURES_IP || (row?.byEmail ?? 0) >= MAX_FAILURES_EMAIL
}

export async function recordFailure(env: Env, ip: string, email: string): Promise<void> {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM login_failures WHERE at < ?').bind(Date.now() - WINDOW_MS),
    env.DB.prepare('INSERT INTO login_failures (ip, email, at) VALUES (?, ?, ?)').bind(ip, email, Date.now()),
  ])
}

/** Escrituras: mismo origen y token CSRF de la sesión. */
export function passesCsrf(request: Request, session: Session): boolean {
  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) return false
  return request.headers.get('X-CSRF-Token') === session.csrf
}

// Hash de referencia para igualar el tiempo de respuesta cuando el correo no existe.
export const DUMMY_HASH = 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

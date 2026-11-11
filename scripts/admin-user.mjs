/**
 * Crea (o cambia la contraseña de) la cuenta del panel.
 *
 *   node scripts/admin-user.mjs <correo> [--remote] [--env preview]
 *
 * La contraseña se pide en el terminal sin mostrarla (o se lee de stdin con
 * --password-stdin), se convierte en hash aquí mismo y solo el hash viaja a
 * la base de datos. Nunca se guarda en ningún archivo.
 *
 *   node scripts/admin-user.mjs <correo> --delete [--remote] [--env preview]   borra la cuenta y sus sesiones
 */
import { execFileSync } from 'node:child_process'
import { webcrypto as crypto } from 'node:crypto'
import { createInterface } from 'node:readline'

const args = process.argv.slice(2)
const email = (args.find((a) => !a.startsWith('--') && a.includes('@')) ?? '').trim().toLowerCase()
const remote = args.includes('--remote')
const envIndex = args.indexOf('--env')
const env = envIndex >= 0 ? args[envIndex + 1] : null
const db = env === 'preview' ? 'learn-sodium-preview' : 'learn-sodium'

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Uso: node scripts/admin-user.mjs <correo> [--remote] [--env preview] [--password-stdin] [--delete]')
  process.exit(1)
}

function d1(sql) {
  const cmd = ['wrangler', 'd1', 'execute', db, remote ? '--remote' : '--local', '--command', sql]
  if (env) cmd.push('--env', env)
  execFileSync('npx', cmd, { stdio: ['ignore', 'ignore', 'inherit'] })
}
const q = (text) => `'${text.replaceAll("'", "''")}'`

if (args.includes('--delete')) {
  d1(`DELETE FROM sessions WHERE email = ${q(email)}; DELETE FROM admins WHERE email = ${q(email)};`)
  console.log(`Cuenta ${email} borrada de ${db}${remote ? ' (remoto)' : ' (local)'}.`)
  process.exit(0)
}

async function readPassword() {
  if (args.includes('--password-stdin')) {
    let data = ''
    for await (const chunk of process.stdin) data += chunk
    return data.replace(/\r?\n$/, '')
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  rl._writeToOutput = (text) => {
    if (text.includes('Contraseña')) process.stdout.write(text)
  }
  const ask = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))
  const first = await ask('Contraseña (mín. 12 caracteres): ')
  process.stdout.write('\n')
  const second = await ask('Repítela: ')
  process.stdout.write('\n')
  rl.close()
  if (first !== second) throw new Error('No coinciden.')
  return first
}

const password = await readPassword()
if (password.length < 12) {
  console.error('La contraseña debe tener al menos 12 caracteres.')
  process.exit(1)
}

// Mismo formato que server/auth.ts: pbkdf2$<iteraciones>$<sal>$<hash>
const iterations = 100_000
const salt = crypto.getRandomValues(new Uint8Array(16))
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
const b64 = (bytes) => Buffer.from(bytes).toString('base64')
const hash = `pbkdf2$${iterations}$${b64(salt)}$${b64(new Uint8Array(bits))}`

d1(
  `INSERT INTO admins (email, password, created_at) VALUES (${q(email)}, ${q(hash)}, ${q(new Date().toISOString())}) ` +
    `ON CONFLICT(email) DO UPDATE SET password = excluded.password; DELETE FROM sessions WHERE email = ${q(email)};`,
)
console.log(`Cuenta ${email} lista en ${db}${remote ? ' (remoto)' : ' (local)'}.`)

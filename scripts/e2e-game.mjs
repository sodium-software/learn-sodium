/**
 * Prueba del juego oculto en móvil (táctil) y escritorio (ratón y teclado), y
 * de su desactivación desde el panel.
 *
 *   ADMIN_EMAIL=… node scripts/e2e-game.mjs <baseUrl> <carpetaCapturas> < archivo-con-contraseña
 */
import { mkdirSync } from 'node:fs'
import { chromium, devices } from 'playwright'

const BASE = (process.argv[2] ?? 'http://localhost:8788').replace(/\/$/, '')
const OUT = process.argv[3] ?? 'evidencia/juego'
mkdirSync(OUT, { recursive: true })
let password = ''
for await (const chunk of process.stdin) password += chunk
password = password.trim()

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const checks = []
const check = (name, ok, detail = '') => {
  checks.push(ok)
  console.log(`${ok ? 'OK   ' : 'FALLO'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function setEgg(value, dedication) {
  const login = await fetch(`${BASE}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password }) })
  const cookie = login.headers.get('set-cookie').split(';')[0]
  const { csrf } = await login.json()
  const r = await fetch(`${BASE}/api/admin/settings`, { method: 'PUT', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json', Origin: BASE }, body: JSON.stringify({ easterEgg: value, dedication }) })
  await fetch(`${BASE}/api/admin/logout`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, Origin: BASE } })
  return r.status
}

const dedication = 'Para Mariana, con cariño.'
check('activar y escribir dedicatoria desde el panel', (await setEgg('on', dedication)) === 200)

for (const [name, options] of [
  ['movil', { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }],
  ['escritorio', { viewport: { width: 1440, height: 900 } }],
]) {
  const ctx = await browser.newContext(options)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(BASE, { waitUntil: 'networkidle' })

  // Cinco toques sobre la marca (en móvil la de la barra superior).
  const brand = page.getByRole('link', { name: /ir a Inicio/ }).locator('visible=true').first()
  for (let i = 0; i < 5; i++) await (name === 'movil' ? brand.tap() : brand.click())
  await page.waitForURL(/\/juego$/)
  await page.getByRole('button', { name: 'Jugar' }).waitFor()
  check(`${name}: 5 toques en la marca abren el juego`, true)
  check(`${name}: dedicatoria visible`, (await page.locator('body').innerText()).includes(dedication))
  await page.screenshot({ path: `${OUT}/${name}-inicio.png` })
  await page.getByRole('button', { name: 'Jugar' }).click()

  const jars = page.getByRole('button', { name: /^Frasco \d/ })
  const count = await jars.count()
  check(`${name}: frascos en pantalla`, count >= 5, `${count}`)
  const box = await jars.last().boundingBox()
  const viewport = page.viewportSize()
  check(`${name}: todo cabe sin desplazarse`, box.y + box.height <= viewport.height && (await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)))

  // Vierte desde el primer frasco lleno al primero vacío.
  const before = await jars.first().getAttribute('aria-label')
  if (name === 'movil') {
    await jars.first().tap()
    await jars.nth(count - 1).tap()
  } else {
    await page.keyboard.press('1')
    await page.keyboard.press(String(count))
  }
  const after = await jars.first().getAttribute('aria-label')
  check(`${name}: verter cambia los frascos (${name === 'movil' ? 'táctil' : 'teclado'})`, before !== after, `${before} → ${after}`)
  await page.screenshot({ path: `${OUT}/${name}-jugando.png` })
  await page.getByRole('button', { name: 'Deshacer' }).click()
  check(`${name}: deshacer`, (await jars.first().getAttribute('aria-label')) === before)
  check(`${name}: sin errores de consola`, errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// Desactivado: ni la ruta ni los toques lo abren.
check('desactivar desde el panel', (await setEgg('off', dedication)) === 200)
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(`${BASE}/juego`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
check('desactivado: /juego no existe', !(await page.locator('body').innerText()).includes('Frascos de colores'))
await page.goto(BASE, { waitUntil: 'networkidle' })
const brand = page.getByRole('link', { name: /ir a Inicio/ }).locator('visible=true').first()
for (let i = 0; i < 5; i++) await brand.click()
await page.waitForTimeout(500)
check('desactivado: los toques no lo abren', !page.url().endsWith('/juego'), page.url())
await setEgg('on', dedication)
await browser.close()

const failed = checks.filter((ok) => !ok).length
console.log(`\n${checks.length - failed}/${checks.length} comprobaciones correctas. Capturas en ${OUT}`)
process.exit(failed ? 1 : 0)

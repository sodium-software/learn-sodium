/**
 * Abre la copia estática del paquete de entrega desde el disco (file://), con
 * la red cortada, y recorre las secciones.
 *   node scripts/test-handover.mjs <carpeta/sitio> [carpetaCapturas]
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const site = resolve(process.argv[2])
const OUT = process.argv[3] ?? 'evidencia/entrega'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } })
const network = []
await ctx.route(/^https?:/, (route) => {
  network.push(route.request().url())
  return route.abort()
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
const checks = []
const check = (name, ok, detail = '') => {
  checks.push(ok)
  console.log(`${ok ? 'OK   ' : 'FALLO'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

await page.goto(`file://${site}/index.html`)
await page.waitForTimeout(1200)
check('portada carga', (await page.locator('main').innerText()).includes('Pick something to do'))
for (const [label, hash] of [['Introduction', '#/introduccion'], ['Songs', '#/song'], ['Stories', '#/storytelling'], ['Podcast', '#/podcast'], ['Short films', '#/short-film'], ['Activities', '#/activities'], ['Bio', '#/biodata']]) {
  await page.getByRole('link', { name: new RegExp(`^${label}`) }).first().click()
  await page.waitForTimeout(300)
  check(`navega a ${label}`, page.url().endsWith(hash), page.url())
}
await page.locator('main a[href^="#/song/"]').first().click().catch(() => undefined)
await page.goto(`file://${site}/index.html#/song`)
await page.waitForTimeout(300)
await page.locator('main a[href*="song/"]').first().click()
await page.waitForTimeout(800)
const audio = await page.evaluate(() => new Promise((ok) => {
  const a = document.querySelector('audio')
  if (!a) return ok('sin audio')
  if (a.readyState >= 1) return ok(`duración ${a.duration.toFixed(1)} s`)
  a.addEventListener('loadedmetadata', () => ok(`duración ${a.duration.toFixed(1)} s`))
  a.load()
  setTimeout(() => ok('no cargó'), 4000)
}))
check('audio local carga', audio.startsWith('duración'), audio)
await page.screenshot({ path: `${OUT}/cancion-sin-servidor.png` })
check('ninguna petición a internet', network.length === 0, network.slice(0, 3).join(' '))
check('sin errores de consola', errors.length === 0, errors.slice(0, 3).join(' | '))
await browser.close()
const failed = checks.filter((ok) => !ok).length
console.log(`\n${checks.length - failed}/${checks.length} comprobaciones correctas`)
process.exit(failed ? 1 : 0)

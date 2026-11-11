/**
 * Comprueba que los controles de cada ruta midan al menos 48 × 48 px
 * (los enlaces dentro de un párrafo quedan fuera: son texto).
 * Uso: node scripts/check-targets.mjs [baseUrl] [ancho]
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173'
const WIDTH = Number(process.argv[3] ?? 390)
const ROUTES = [
  '/', '/introduccion', '/biodata', '/song', '/song/counting-the-miles', '/storytelling',
  '/storytelling/cartographers-apprentice', '/podcast', '/podcast/the-practice-room-ep1', '/short-film',
  '/short-film/the-last-tram', '/activities', '/activities/ejemplo-wordwall', '/activities/act-vocab-roads',
  '/activities/act-quiz-roads', '/activities/act-matching-market', '/activities/act-fill-water',
  '/activities/act-listening-roads', '/activities/act-reading-letters', '/settings', '/no-existe',
]
const MIN = 48

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' })
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } })
let total = 0
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  const small = await page.evaluate((min) => {
    const out = []
    for (const el of document.querySelectorAll('a, button, input, select, textarea, summary, [role="button"], [role="slider"]')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (getComputedStyle(el).visibility === 'hidden') continue
      if (el.closest('p, li > span, dd') && el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue
      // Un control dentro de una etiqueta cuenta por la etiqueta entera.
      const target = el.closest('label') ?? el
      const t = target.getBoundingClientRect()
      if (t.height < min - 0.5 || t.width < min - 0.5) {
        out.push(`${el.tagName.toLowerCase()} ${Math.round(t.width)}×${Math.round(t.height)} «${(el.getAttribute('aria-label') || el.textContent || el.getAttribute('type') || '').trim().slice(0, 40)}»`)
      }
    }
    return out
  }, MIN)
  if (small.length) {
    total += small.length
    console.log(`\n${route}`)
    for (const s of [...new Set(small)]) console.log(`  ${s}`)
  }
}
await browser.close()
console.log(`\n${total ? `${total} controles por debajo de ${MIN} px` : `Todos los controles miden ${MIN} px o más`} (ancho ${WIDTH})`)
process.exit(total ? 1 : 0)

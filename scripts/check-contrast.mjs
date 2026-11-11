/**
 * Contraste AA del texto en cada ruta: 4.5:1 (3:1 si es grande).
 * Toma el color del texto y el primer fondo opaco de sus antecesores.
 * Uso: node scripts/check-contrast.mjs [baseUrl]
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173'
const ROUTES = ['/', '/introduccion', '/song', '/song/counting-the-miles', '/storytelling', '/storytelling/cartographers-apprentice',
  '/podcast', '/podcast/the-practice-room-ep1', '/short-film', '/short-film/the-last-tram', '/activities',
  '/activities/ejemplo-wordwall', '/activities/act-quiz-roads', '/activities/act-matching-market', '/activities/act-fill-water',
  '/activities/act-vocab-roads', '/settings', '/no-existe', '/admin']

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
let bad = 0
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  const found = await page.evaluate(() => {
    const parse = (c) => (c.match(/[\d.]+/g) ?? []).map(Number)
    const lum = ([r, g, b]) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const out = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement
      if (!walker.currentNode.textContent.trim() || !el || el.closest('[aria-hidden="true"], svg')) continue
      const st = getComputedStyle(el)
      if (st.visibility === 'hidden' || Number(st.opacity) === 0 || el.closest('button:disabled')) continue
      const fg = parse(st.color)
      let node = el, bg = null
      while (node) {
        const c = parse(getComputedStyle(node).backgroundColor)
        if (c.length === 3 || (c.length === 4 && c[3] === 1)) { bg = c; break }
        if (getComputedStyle(node).backgroundImage !== 'none') { bg = null; break }
        node = node.parentElement
      }
      if (!bg) continue
      const [a, b] = [lum(fg), lum(bg)]
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      const size = parseFloat(st.fontSize), bold = Number(st.fontWeight) >= 700
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5
      if (ratio < need) out.push(`${ratio.toFixed(2)} < ${need} «${walker.currentNode.textContent.trim().slice(0, 40)}» ${st.color} sobre rgb(${bg.slice(0, 3)})`)
    }
    return [...new Set(out)]
  })
  if (found.length) { bad += found.length; console.log(route); found.forEach((f) => console.log('  ' + f)) }
}
await browser.close()
console.log(bad ? `${bad} textos sin contraste AA` : 'Todo el texto cumple AA')
process.exit(bad ? 1 : 0)

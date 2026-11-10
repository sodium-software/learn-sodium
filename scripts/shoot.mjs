/**
 * Captura pantallas de la aplicación en tres anchos y varias rutas.
 * Uso: node scripts/shoot.mjs [baseUrl] [outDir]
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173'
const OUT = process.argv[3] ?? '.taste-skill/shots'

const ROUTES = [
  ['home', '/'],
  ['song', '/song'],
  ['song-detail', '/song/counting-the-miles'],
  ['stories', '/storytelling'],
  ['story-detail', '/storytelling/cartographers-apprentice'],
  ['podcast', '/podcast'],
  ['podcast-detail', '/podcast/the-practice-room-ep1'],
  ['film', '/short-film'],
  ['film-detail', '/short-film/the-last-tram'],
  ['activities', '/activities'],
  ['activity-vocab', '/activities/act-vocab-roads'],
  ['activity-quiz', '/activities/act-quiz-roads'],
  ['activity-matching', '/activities/act-matching-market'],
  ['activity-blanks', '/activities/act-fill-water'],
  ['activity-listening', '/activities/act-listening-roads'],
  ['activity-reading', '/activities/act-reading-letters'],
  ['settings', '/settings'],
  ['notfound', '/no-existe'],
]

const VIEWPORTS = [
  ['desktop', 1440, 900],
  ['tablet', 768, 1024],
  ['mobile', 390, 844],
]

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const problems = []

for (const [vpName, width, height] of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[${vpName}] console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => problems.push(`[${vpName}] pageerror: ${err.message}`))

  for (const [name, route] of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(450)
    await page.screenshot({
      path: `${OUT}/${vpName}-${name}.png`,
      fullPage: vpName === 'mobile' ? false : false,
    })

    // Comprobación de desbordamiento horizontal.
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return {
        scroll: doc.scrollWidth,
        client: doc.clientWidth,
        offenders: [...document.querySelectorAll('*')]
          .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 2)
          .slice(0, 4)
          .map((el) => `${el.tagName}.${String(el.className).slice(0, 60)}`),
      }
    })
    if (overflow.scroll > overflow.client + 2) {
      problems.push(
        `[${vpName}] ${route} desborda: ${overflow.scroll} > ${overflow.client} :: ${overflow.offenders.join(' | ')}`,
      )
    }
  }

  await context.close()
}

await browser.close()

if (problems.length) {
  console.log('PROBLEMAS DETECTADOS:')
  for (const p of problems) console.log(' -', p)
} else {
  console.log('Sin errores de consola ni desbordamiento horizontal.')
}
console.log(`Capturas en ${OUT}`)

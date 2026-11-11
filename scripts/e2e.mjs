/**
 * Prueba funcional: comprueba que los controles de cada sección funcionan.
 * Usa el build de producción servido en http://127.0.0.1:4173
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173'
const results = []
const errors = []

function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  if (!ok) errors.push(`${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

// ── 1. Navegación por la barra superior ─────────────────────────────────────
await page.goto(BASE, { waitUntil: 'networkidle' })
for (const [label, expectPath] of [
  ['Songs', '/song'],
  ['Stories', '/storytelling'],
  ['Podcast', '/podcast'],
  ['Short films', '/short-film'],
  ['Activities', '/activities'],
  ['Home', '/'],
]) {
  await page.getByRole('link', { name: new RegExp(`^${label}`) }).first().click()
  await page.waitForTimeout(350)
  const url = new URL(page.url()).pathname
  check(`nav → ${label}`, url === expectPath, ` landed en ${url}`)
}

// ── 2. El menú «Para adultos» se abre y lleva a sus páginas ───────────────
await page.getByRole('button', { name: 'For grown-ups' }).click()
await page.getByRole('link', { name: 'Bio', exact: true }).first().click()
await page.waitForTimeout(300)
check('menú para adultos', new URL(page.url()).pathname === '/biodata')

// ── 3. El reproductor de audio carga y avanza ──────────────────────────────
await page.goto(`${BASE}/song/counting-the-miles`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const durationText = await page.locator('.panel:has(audio) .tnum').first().innerText()
check('audio con duración', /\/\s*0:3\d/.test(durationText.replace(/\s+/g, ' ')), durationText)

await page.getByRole('button', { name: /^Play Counting/ }).click()
await page.waitForTimeout(1600)
const playing = await page.evaluate(() => {
  const a = document.querySelector('audio')
  return { time: a?.currentTime ?? 0, paused: a?.paused ?? true }
})
check('el audio se reproduce', playing.time > 0.5 && !playing.paused, JSON.stringify(playing))

// La letra activa debe seguir al audio.
const activeLines = await page.locator('ol button.bg-accent-pale\\/40').count()
check('la letra sigue al audio', activeLines >= 1, `${activeLines} líneas activas`)

// ── 4. Destacar un fragmento y comprobar que se guarda ────────────────────
await page.getByRole('button', { name: 'Save' }).first().click()
await page.waitForTimeout(400)
const savedLabel = await page.getByRole('button', { name: 'Saved' }).count()
check('destacar fragmento', savedLabel >= 1)

// ── 5. El salto a un fragmento mueve el audio ──────────────────────────────
await page.getByRole('button', { name: /Play from/ }).first().click()
await page.waitForTimeout(600)
const jumped = await page.evaluate(() => document.querySelector('audio')?.currentTime ?? 0)
check('saltar a un fragmento', jumped > 0.5, `t=${jumped.toFixed(2)}`)

// ── 6. Vocabulario: marcar como dominada ──────────────────────────────────
await page.getByRole('button', { name: 'Mark as learned' }).first().click()
await page.waitForTimeout(300)
check('marcar vocabulario', (await page.getByText('Learned', { exact: true }).count()) >= 1)

// ── 7. Quiz: responder y comprobar ────────────────────────────────────────
await page.goto(`${BASE}/activities/act-quiz-roads`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
const quizOptions = page.locator('button[aria-pressed]')
await quizOptions.first().click()
await page.waitForTimeout(300)
check('el quiz retroalimenta', (await page.getByText('Correct', { exact: true }).count() + await page.getByText('Not quite').count()) >= 1)
await page.getByRole('button', { name: /^(Next|See result)/ }).click()
await page.waitForTimeout(300)
check('el quiz avanza', (await page.getByText(/step 2 of/).count()) >= 1)

// ── 8. Tarjetas de vocabulario: voltear ────────────────────────────────────
await page.goto(`${BASE}/activities/act-vocab-roads`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.getByRole('button', { name: /Tap to flip|Meaning/ }).click()
await page.waitForTimeout(300)
check('la tarjeta se voltea', (await page.getByText('Translation:').count()) >= 1)

// ── 9. Relacionar: clic en palabra y en definición ─────────────────────────
await page.goto(`${BASE}/activities/act-matching-market`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
const wordButtons = page.locator('button:has-text("crate")').first()
await wordButtons.click()
await page.waitForTimeout(250)
await page.locator('button:has-text("A large box used for carrying")').first().click()
await page.waitForTimeout(400)
check('relacionar par correcto', (await page.getByText(/of 6 pairs/).innerText()).includes('1'))

// ── 10. Completar oraciones ────────────────────────────────────────────────
await page.goto(`${BASE}/activities/act-fill-water`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'put', exact: true }).click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Check' }).click()
await page.waitForTimeout(400)
check('completar oración valida', (await page.getByText(/The right answer is|Correct/).count()) >= 1)

// ── 11. Práctica de escucha: el clip se carga ──────────────────────────────
await page.goto(`${BASE}/activities/act-listening-roads`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const clipDuration = await page.locator('.panel:has(audio) .tnum').first().innerText()
check('clip de escucha con duración', /\/\s*0:\d\d/.test(clipDuration.replace(/\s+/g, ' ')), clipDuration)

// ── 12. Comprensión lectora ────────────────────────────────────────────────
await page.goto(`${BASE}/activities/act-reading-letters`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
check('el texto de lectura se muestra', (await page.getByText('banana box').count()) >= 1)

// ── 13. Persistencia: recargar y comprobar que el progreso sigue ──────────
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.locator('#settings-name').fill('Zabdiel')
await page.waitForTimeout(400)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const savedName = await page.locator('#settings-name').inputValue()
check('la preferencia persiste', savedName === 'Zabdiel', savedName)

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
check('el saludo usa el nombre guardado', (await page.getByText('Zabdiel').count()) >= 1)

const stored = await page.evaluate(() => localStorage.getItem('la-cartilla:state:v1'))
check('el estado está en localStorage', Boolean(stored && stored.includes('Zabdiel')))

// ── 14. Vista de error ─────────────────────────────────────────────────────
await page.goto(`${BASE}/ruta-que-no-existe`, { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
check('ruta inexistente → 404 propio', (await page.getByText("This page doesn't exist").count()) === 1)

// ── 15. Sin errores de consola ─────────────────────────────────────────────
check('sin errores de consola', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))

// ── La API cae: la web sigue con la última versión vista o la empaquetada ──
for (const [name, warm] of [['caché del navegador', true], ['copia empaquetada', false]]) {
  const offline = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const p2 = await offline.newPage()
  if (warm) await p2.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await offline.route('**/api/content', (route) => route.abort())
  await p2.goto(`${BASE}/song`, { waitUntil: 'networkidle' })
  const cards = await p2.locator('main a[href^="/song/"]').count()
  check(`API caída → ${name}`, cards > 0, `${cards} canciones`)
  await offline.close()
}

await browser.close()

console.log('\n=== RESULTADOS ===')
for (const r of results) {
  console.log(`${r.ok ? 'PASA' : 'FALLA'}  ${r.name}${r.detail && !r.ok ? ` — ${r.detail}` : ''}`)
}
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} comprobaciones superadas`)
if (errors.length) process.exit(1)

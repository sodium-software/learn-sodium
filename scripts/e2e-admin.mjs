/**
 * Prueba de punta a punta del panel, en Chrome real: Mariana crea, edita,
 * publica y borra una canción, una historia y una actividad externa, y se
 * comprueba en la web pública después de cada paso.
 *
 *   ADMIN_EMAIL=… node scripts/e2e-admin.mjs <baseUrl> <carpetaCapturas> < archivo-con-contraseña
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = (process.argv[2] ?? 'http://localhost:8788').replace(/\/$/, '')
const OUT = process.argv[3] ?? 'evidencia/panel'
mkdirSync(OUT, { recursive: true })
let password = ''
for await (const chunk of process.stdin) password += chunk
password = password.trim()

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const admin = await ctx.newPage()
const site = await ctx.newPage()
const errors = []
for (const page of [admin, site]) {
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
}
const checks = []
const check = (name, ok, detail = '') => {
  checks.push(ok)
  console.log(`${ok ? 'OK   ' : 'FALLO'}  ${name}${detail ? ` — ${detail}` : ''}`)
}
let shot = 0
const snap = (page, name) => page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, '0')}-${name}.png`, fullPage: false })
const stamp = Date.now().toString(36)

async function publicText(path) {
  await site.goto(BASE + path, { waitUntil: 'networkidle' })
  return site.locator('main').textContent()
}
const field = (label) => admin.getByLabel(new RegExp(`^${label}\\s*\\*?$`)).first()

// ── Acceso ──────────────────────────────────────────────────────────────────
await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await snap(admin, 'login')
await admin.getByLabel('Email').fill(process.env.ADMIN_EMAIL)
await admin.getByLabel('Password').fill(password)
await admin.getByRole('button', { name: 'Sign in' }).click()
await admin.getByRole('heading', { name: 'Overview' }).waitFor()
check('inicio de sesión', true)
await snap(admin, 'resumen')

async function create(kind, fill) {
  await admin.goto(`${BASE}/admin/${kind}/nuevo`, { waitUntil: 'networkidle' })
  await fill()
  await admin.getByRole('button', { name: 'Save and publish' }).click()
  await admin.getByText('Saved and published.').waitFor({ timeout: 15000 })
  await admin.waitForURL(new RegExp(`/admin/${kind}/[a-z0-9-]+$`))
  return admin.url().split('/').pop()
}
async function rename(newTitle) {
  await field('Title').fill(newTitle)
  await admin.getByRole('button', { name: 'Save and publish' }).click()
  await admin.getByText('Saved and published.').waitFor()
}
async function remove(kind, id, title) {
  await admin.goto(`${BASE}/admin/${kind}`, { waitUntil: 'networkidle' })
  await admin.getByRole('button', { name: `Delete ${title}` }).click()
  await admin.getByRole('button', { name: 'Confirm delete' }).click()
  await admin.getByRole('link', { name: title, exact: true }).waitFor({ state: 'detached' })
}

// ── Canción ─────────────────────────────────────────────────────────────────
const songTitle = `Canción de prueba ${stamp}`
const songId = await create('song', async () => {
  await field('Title').fill(songTitle)
  await field('Summary').fill('Una canción corta para probar el panel.')
  await field('Recommended age').fill('6 a 8 años')
  await admin.getByLabel(/^Cover or thumbnail/).setInputFiles('public/media/covers/paper-boats.jpg')
  await admin.getByLabel(/^Audio/).first().setInputFiles('public/media/audio/paper-boats.mp3')
  await admin.locator('audio[src^="/files/"]').waitFor({ timeout: 30000 })
  await admin.getByRole('group', { name: /^Lyrics \(/ }).getByRole('button', { name: 'Add' }).click()
  await field('Line in English').fill('Little paper boats go round and round')
  await field('Translation').fill('Barquitos de papel dan vueltas y vueltas')
  await field('Source').fill('Canción propia de Mariana')
  await field('License').selectOption('propio')
  await field('Credits').fill('Letra y voz: Mariana.')
  await snap(admin, 'cancion-formulario')
})
check('canción creada y publicada', Boolean(songId), songId)
let text = await publicText(`/song/${songId}`)
check('canción visible en la web', text.includes(songTitle) && text.includes('Little paper boats'))
check('créditos de la canción en su ficha', text.includes('Canción propia de Mariana') && text.includes('Own work'))
const audioOk = await site.evaluate(async () => {
  const src = document.querySelector('audio')?.getAttribute('src') ?? ''
  const r = await fetch(src, { headers: { Range: 'bytes=0-15' } })
  return `${src} → ${r.status} ${r.headers.get('content-type')}`
})
check('audio subido servido por el Worker', /\/files\/.+ → 20[06] audio\/mpeg/.test(audioOk), audioOk)
await snap(site, 'cancion-publica')

await admin.goto(`${BASE}/admin/song/${songId}`, { waitUntil: 'networkidle' })
await rename(`${songTitle} (editada)`)
text = await publicText(`/song/${songId}`)
check('canción editada en la web', text.includes(`${songTitle} (editada)`))

// Despublicar: deja de verse pero sigue en el panel.
await admin.goto(`${BASE}/admin/song`, { waitUntil: 'networkidle' })
const row = admin.locator('li', { hasText: `${songTitle} (editada)` })
await row.getByRole('button', { name: 'Unpublish' }).click()
await row.getByRole('button', { name: 'Publish' }).waitFor()
text = await publicText(`/song/${songId}`)
check('canción despublicada no se ve', !text.includes(songTitle))
await site.goto(`${BASE}/song/${songId}?preview=1`, { waitUntil: 'networkidle' })
check('vista previa muestra el borrador', (await site.locator('main').textContent()).includes(songTitle))

await remove('song', songId, `${songTitle} (editada)`)
text = await publicText(`/song/${songId}`)
check('canción borrada', !text.includes(songTitle))

// ── Historia ────────────────────────────────────────────────────────────────
const storyTitle = `Historia de prueba ${stamp}`
const storyId = await create('story', async () => {
  await field('Title').fill(storyTitle)
  await field('Summary').fill('Un cuento corto para probar el panel.')
  await field('Introduction').fill('Había una vez un gato que quería aprender inglés.')
  await admin.getByRole('group', { name: /^Chapters \(/ }).getByRole('button', { name: 'Add' }).click()
  await field('Chapter title').fill('The cat')
  await admin.getByLabel(/^Text \(leave a blank line/).fill('The cat is small.\n\nThe cat says hello.')
  await admin.getByRole('group', { name: /^Comprehension questions/ }).getByRole('button', { name: 'Add' }).click()
  await field('Question').fill('Is the cat big?')
  await field('Options \\(one per line\\)').fill('Yes\nNo')
  await field('Number of the correct option').fill('2')
  await field('Source').fill('Cuento propio')
  await field('License').selectOption('propio')
})
text = await publicText(`/storytelling/${storyId}`)
check('historia visible en la web', text.includes(storyTitle))
await snap(site, 'historia-publica')
await admin.goto(`${BASE}/admin/story/${storyId}`, { waitUntil: 'networkidle' })
await rename(`${storyTitle} (editada)`)
text = await publicText(`/storytelling`)
check('historia editada en el catálogo', text.includes(`${storyTitle} (editada)`))
await remove('story', storyId, `${storyTitle} (editada)`)
text = await publicText(`/storytelling`)
check('historia borrada', !text.includes(storyTitle))

// ── Actividad externa ───────────────────────────────────────────────────────
const actTitle = `Actividad externa ${stamp}`
const actId = await create('activity', async () => {
  await field('Activity type').selectOption('external')
  await field('Title').fill(actTitle)
  await field('Description').fill('Relaciona animales con su nombre en inglés.')
  await field('Skill').selectOption('vocabulary')
  await field('Tool').selectOption('wordwall')
  await field('Link to the activity').fill('https://wordwall.net/')
  await field('Instructions for the student').fill('Juega y luego vuelve aquí.')
  await field('Source').fill('Wordwall')
  await field('License').selectOption('permiso')
  await snap(admin, 'actividad-formulario')
})
text = await publicText('/activities')
check('actividad externa visible', text.includes(actTitle))
const card = site.locator('article', { hasText: actTitle })
const link = card.getByRole('link', { name: /Open in Wordwall/ })
check(
  'enlace externo: pestaña nueva y noopener',
  (await link.getAttribute('target')) === '_blank' && (await link.getAttribute('rel')).includes('noopener'),
  `${await link.getAttribute('target')} ${await link.getAttribute('rel')}`,
)
check('aviso de salida visible', (await card.textContent()).includes('outside La Cartilla'))
await card.getByRole('button', { name: 'Mark as done' }).click()
const stored = await site.evaluate(() => localStorage.getItem('la-cartilla:state:v1'))
check('marcado como hecha en localStorage', stored.includes(actId))
await card.scrollIntoViewIfNeeded()
await snap(site, 'actividad-externa-publica')
await admin.goto(`${BASE}/admin/activity/${actId}`, { waitUntil: 'networkidle' })
await rename(`${actTitle} (editada)`)
text = await publicText('/activities')
check('actividad editada', text.includes(`${actTitle} (editada)`))
await remove('activity', actId, `${actTitle} (editada)`)
text = await publicText('/activities')
check('actividad borrada', !text.includes(actTitle))

// ── Ajustes del juego ───────────────────────────────────────────────────────
await admin.goto(`${BASE}/admin/ajustes`, { waitUntil: 'networkidle' })
await snap(admin, 'ajustes-juego')

check('sin errores de consola', errors.length === 0, errors.join(' | '))
await browser.close()
const failed = checks.filter((ok) => !ok).length
console.log(`\n${checks.length - failed}/${checks.length} comprobaciones correctas. Capturas en ${OUT}`)
process.exit(failed ? 1 : 0)

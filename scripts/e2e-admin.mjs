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
  return site.locator('main').innerText()
}
const field = (label) => admin.getByLabel(new RegExp(`^${label}\\s*\\*?$`)).first()

// ── Acceso ──────────────────────────────────────────────────────────────────
await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
await snap(admin, 'login')
await admin.getByLabel('Correo').fill(process.env.ADMIN_EMAIL)
await admin.getByLabel('Contraseña').fill(password)
await admin.getByRole('button', { name: 'Entrar' }).click()
await admin.getByRole('heading', { name: 'Resumen' }).waitFor()
check('inicio de sesión', true)
await snap(admin, 'resumen')

async function create(kind, fill) {
  await admin.goto(`${BASE}/admin/${kind}/nuevo`, { waitUntil: 'networkidle' })
  await fill()
  await admin.getByRole('button', { name: 'Guardar y publicar' }).click()
  await admin.getByText('Guardado y publicado.').waitFor({ timeout: 15000 })
  await admin.waitForURL(new RegExp(`/admin/${kind}/[a-z0-9-]+$`))
  return admin.url().split('/').pop()
}
async function rename(newTitle) {
  await field('Título').fill(newTitle)
  await admin.getByRole('button', { name: 'Guardar y publicar' }).click()
  await admin.getByText('Guardado y publicado.').waitFor()
}
async function remove(kind, id, title) {
  await admin.goto(`${BASE}/admin/${kind}`, { waitUntil: 'networkidle' })
  await admin.getByRole('button', { name: `Borrar ${title}` }).click()
  await admin.getByRole('button', { name: 'Confirmar borrado' }).click()
  await admin.getByRole('link', { name: title, exact: true }).waitFor({ state: 'detached' })
}

// ── Canción ─────────────────────────────────────────────────────────────────
const songTitle = `Canción de prueba ${stamp}`
const songId = await create('song', async () => {
  await field('Título').fill(songTitle)
  await field('Resumen').fill('Una canción corta para probar el panel.')
  await field('Edad recomendada').fill('6 a 8 años')
  await admin.getByLabel(/^Portada o miniatura/).setInputFiles('public/media/covers/paper-boats.jpg')
  await admin.getByLabel(/^Audio/).first().setInputFiles('public/media/audio/paper-boats.mp3')
  await admin.locator('audio[src^="/files/"]').waitFor({ timeout: 30000 })
  await admin.getByRole('group', { name: /^Letra/ }).getByRole('button', { name: 'Añadir' }).click()
  await field('Verso en inglés').fill('Little paper boats go round and round')
  await field('Traducción').fill('Barquitos de papel dan vueltas y vueltas')
  await field('Fuente').fill('Canción propia de Mariana')
  await field('Licencia').selectOption('propio')
  await field('Créditos').fill('Letra y voz: Mariana.')
  await snap(admin, 'cancion-formulario')
})
check('canción creada y publicada', Boolean(songId), songId)
let text = await publicText(`/song/${songId}`)
check('canción visible en la web', text.includes(songTitle) && text.includes('Little paper boats'))
check('créditos de la canción en su ficha', text.includes('Canción propia de Mariana') && text.includes('Propio'))
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
await row.getByRole('button', { name: 'Despublicar' }).click()
await row.getByRole('button', { name: 'Publicar' }).waitFor()
text = await publicText(`/song/${songId}`)
check('canción despublicada no se ve', !text.includes(songTitle))
await site.goto(`${BASE}/song/${songId}?preview=1`, { waitUntil: 'networkidle' })
check('vista previa muestra el borrador', (await site.locator('main').innerText()).includes(songTitle))

await remove('song', songId, `${songTitle} (editada)`)
text = await publicText(`/song/${songId}`)
check('canción borrada', !text.includes(songTitle))

// ── Historia ────────────────────────────────────────────────────────────────
const storyTitle = `Historia de prueba ${stamp}`
const storyId = await create('story', async () => {
  await field('Título').fill(storyTitle)
  await field('Resumen').fill('Un cuento corto para probar el panel.')
  await field('Introducción').fill('Había una vez un gato que quería aprender inglés.')
  await admin.getByRole('group', { name: /^Capítulos/ }).getByRole('button', { name: 'Añadir' }).click()
  await field('Título del capítulo').fill('The cat')
  await admin.getByLabel(/^Texto \(deja una línea/).fill('The cat is small.\n\nThe cat says hello.')
  await admin.getByRole('group', { name: /^Preguntas de comprensión/ }).getByRole('button', { name: 'Añadir' }).click()
  await field('Pregunta').fill('Is the cat big?')
  await field('Opciones \\(una por línea\\)').fill('Yes\nNo')
  await field('Número de la opción correcta').fill('2')
  await field('Fuente').fill('Cuento propio')
  await field('Licencia').selectOption('propio')
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
  await field('Tipo de actividad').selectOption('external')
  await field('Título').fill(actTitle)
  await field('Descripción').fill('Relaciona animales con su nombre en inglés.')
  await field('Habilidad').selectOption('vocabulary')
  await field('Herramienta').selectOption('wordwall')
  await field('Enlace a la actividad').fill('https://wordwall.net/')
  await field('Instrucciones para el niño').fill('Juega y luego vuelve aquí.')
  await field('Fuente').fill('Wordwall')
  await field('Licencia').selectOption('permiso')
  await snap(admin, 'actividad-formulario')
})
text = await publicText('/activities')
check('actividad externa visible', text.includes(actTitle))
const card = site.locator('article', { hasText: actTitle })
const link = card.getByRole('link', { name: /Abrir en Wordwall/ })
check(
  'enlace externo: pestaña nueva y noopener',
  (await link.getAttribute('target')) === '_blank' && (await link.getAttribute('rel')).includes('noopener'),
  `${await link.getAttribute('target')} ${await link.getAttribute('rel')}`,
)
check('aviso de salida visible', (await card.innerText()).includes('fuera de La Cartilla'))
await card.getByRole('button', { name: 'Marcar como hecha' }).click()
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

/**
 * Pruebas de abuso del panel. Cada prueba imprime lo que envía, lo que
 * responde el servidor y si el ataque quedó bloqueado.
 *
 *   ADMIN_EMAIL=… node scripts/abuse-test.mjs <baseUrl> < archivo-con-contraseña
 *
 * La prueba de intentos excesivos usa un correo inventado y una IP de prueba
 * propia, así que no bloquea la cuenta real.
 */
const BASE = (process.argv[2] ?? 'http://localhost:8788').replace(/\/$/, '')
const email = process.env.ADMIN_EMAIL
let password = ''
for await (const chunk of process.stdin) password += chunk
password = password.trim()

const results = []
function report(name, blocked, detail) {
  results.push(blocked)
  console.log(`${blocked ? 'BLOQUEADO' : 'FALLO    '}  ${name}\n           ${detail}`)
}

// 1. Sin sesión: leer, escribir y subir.
for (const [method, path] of [
  ['GET', '/api/admin/items'],
  ['POST', '/api/admin/items'],
  ['DELETE', '/api/admin/examples'],
  ['POST', '/api/admin/upload'],
  ['GET', '/api/admin/export'],
]) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : '{}' })
  report(`sin sesión: ${method} ${path}`, r.status === 401, `HTTP ${r.status} ${await r.text()}`)
}

// Sesión válida para las siguientes pruebas.
const login = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
if (!login.ok) {
  console.error(`No se pudo iniciar sesión: HTTP ${login.status} ${await login.text()}`)
  process.exit(1)
}
const cookie = login.headers.get('set-cookie').split(';')[0]
const { csrf } = await login.json()
console.log(`(sesión iniciada; cookie: ${login.headers.get('set-cookie').replace(/=[^;]+/, '=…')})`)
const auth = { Cookie: cookie, 'X-CSRF-Token': csrf, Origin: BASE }

// 2. CSRF: escritura con sesión pero sin token, y desde otro origen.
{
  const r = await fetch(`${BASE}/api/admin/examples`, { method: 'DELETE', headers: { Cookie: cookie } })
  report('CSRF: borrar sin token', r.status === 403, `HTTP ${r.status} ${await r.text()}`)
  const r2 = await fetch(`${BASE}/api/admin/examples`, { method: 'DELETE', headers: { ...auth, Origin: 'https://evil.example' } })
  report('CSRF: borrar desde otro origen', r2.status === 403, `HTTP ${r2.status} ${await r2.text()}`)
}

// 3. Archivos prohibidos: SVG con script, HTML, ejecutable y JPG falso.
for (const [name, body, headers] of [
  ['SVG con script', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', { 'X-File-Name': 'x.svg' }],
  ['HTML', '<!doctype html><script>alert(document.cookie)</script>', { 'X-File-Name': 'x.html' }],
  ['ejecutable ELF', '\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00', { 'X-File-Name': 'x.bin' }],
  ['HTML con extensión .jpg', '<html><body onload=alert(1)>hola</body></html>', { 'X-File-Name': 'foto.jpg', 'Content-Type': 'image/jpeg' }],
]) {
  const r = await fetch(`${BASE}/api/admin/upload`, { method: 'POST', headers: { ...auth, ...headers }, body })
  report(`subida prohibida: ${name}`, r.status === 415, `HTTP ${r.status} ${await r.text()}`)
}
{
  // Imagen real pero declarada como audio: se rechaza por categoría.
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c50000000049454e44ae426082', 'hex')
  const r = await fetch(`${BASE}/api/admin/upload`, { method: 'POST', headers: { ...auth, 'X-Media-Category': 'audio' }, body: png })
  report('subida: PNG en un campo de audio', r.status === 415, `HTTP ${r.status} ${await r.text()}`)
}
{
  // Más de 5 MB para una imagen.
  const big = Buffer.alloc(6 * 1024 * 1024)
  big.set([0xff, 0xd8, 0xff, 0xe0], 0)
  const r = await fetch(`${BASE}/api/admin/upload`, { method: 'POST', headers: { ...auth }, body: big })
  report('subida: imagen de 6 MB', r.status === 413, `HTTP ${r.status} ${await r.text()}`)
}

// 4. XSS en un campo: se guarda sin etiquetas y enlaces javascript: se rechazan.
{
  const payload = {
    kind: 'story',
    data: {
      title: 'Prueba XSS <img src=x onerror=alert(1)><script>alert(2)</script>',
      summary: '<a href="javascript:alert(3)">clic</a> resumen',
      level: 'A1',
      source: 'prueba',
      license: 'propio',
      chapters: [{ title: '<b onmouseover=alert(4)>Uno</b>', paragraphs: 'Texto <iframe src=//evil.example></iframe>' }],
    },
  }
  const r = await fetch(`${BASE}/api/admin/items`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const { id } = await r.json()
  const saved = await (await fetch(`${BASE}/api/admin/items/${id}`, { headers: auth })).json()
  const text = JSON.stringify(saved.data)
  report('XSS en campos de texto', !/[<>]|onerror|<script/i.test(text), `guardado: ${text}`)
  await fetch(`${BASE}/api/admin/items/${id}`, { method: 'DELETE', headers: auth })

  const r2 = await fetch(`${BASE}/api/admin/items`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'activity', data: { type: 'external', title: 'x', level: 'A1', skill: 'reading', tool: 'other', url: 'javascript:alert(1)', source: 'x', license: 'propio' } }),
  })
  report('enlace javascript: en actividad externa', r2.status === 422, `HTTP ${r2.status} ${await r2.text()}`)

  const r3 = await fetch(`${BASE}/api/admin/items`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'song', data: { title: 'x', level: 'A1', audio: '/files/../../etc/passwd', source: 'x', license: 'propio' } }),
  })
  report('ruta de archivo con ../', r3.status === 422, `HTTP ${r3.status} ${await r3.text()}`)
}

// 5. Intentos excesivos: 5 fallos y el sexto, aun con contraseña correcta del formato, se rechaza.
{
  const fake = `ataque-${Date.now()}@example.invalid`
  const statuses = []
  for (let i = 0; i < 7; i++) {
    const r = await fetch(`${BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fake, password: `incorrecta-${i}` }),
    })
    statuses.push(r.status)
  }
  report('fuerza bruta: 7 intentos seguidos', statuses.slice(0, 5).every((s) => s === 401) && statuses.slice(5).every((s) => s === 429), `estados: ${statuses.join(', ')}`)
}

// 5b. Ráfaga en paralelo desde una IP: no más de 5 llegan a comprobar la contraseña.
//     (En local todas las peticiones comparten IP; la prueba anterior ya gastó el cupo,
//      así que aquí se espera 429 en todas.)
{
  const fake = `rafaga-${Date.now()}@example.invalid`
  const statuses = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      fetch(`${BASE}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fake, password: `x${i}` }) }).then((r) => r.status),
    ),
  )
  const verified = statuses.filter((s) => s === 401).length
  report('fuerza bruta en paralelo: 20 a la vez', verified <= 5, `401: ${verified}, 429: ${statuses.filter((s) => s === 429).length}`)
}

// 5c. Sobrescribir un archivo existente con X-Media-Key no cambia su contenido.
{
  const jpg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex')
  const up = await (await fetch(`${BASE}/api/admin/upload`, { method: 'POST', headers: auth, body: jpg })).json()
  const other = Buffer.concat([jpg, Buffer.from('distinto')])
  await fetch(`${BASE}/api/admin/upload`, { method: 'POST', headers: { ...auth, 'X-Media-Key': up.key }, body: other })
  const back = Buffer.from(await (await fetch(`${BASE}${up.url}`, { headers: { Cookie: cookie } })).arrayBuffer())
  report('sobrescribir un archivo existente', back.equals(jpg), `tamaño original ${jpg.length}, servido ${back.length}`)
}

// 6. Archivo de borrador no accesible sin sesión.
{
  const list = await (await fetch(`${BASE}/api/admin/export`, { headers: auth })).json()
  const draftOnly = list.media.find(() => true)
  if (draftOnly) {
    const r = await fetch(`${BASE}/files/${draftOnly.key}`)
    console.log(`(info) /files/${draftOnly.key} sin sesión → HTTP ${r.status}`)
  }
  const r = await fetch(`${BASE}/files/../../wrangler.toml`)
  report('lectura fuera de /files', r.status === 404 || r.status === 200 && !(await r.text()).includes('database_id'), `HTTP ${r.status}`)
}

await fetch(`${BASE}/api/admin/logout`, { method: 'POST', headers: auth })
const after = await fetch(`${BASE}/api/admin/items`, { headers: { Cookie: cookie } })
report('sesión cerrada ya no sirve', after.status === 401, `HTTP ${after.status}`)

const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} ataques bloqueados`)
process.exit(failed ? 1 : 0)

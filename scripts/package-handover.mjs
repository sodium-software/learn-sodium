/**
 * Paquete de entrega para Mariana: su contenido, todos sus archivos y una
 * copia de la web que se abre sin servidor ni base de datos.
 *
 *   node scripts/package-handover.mjs [--env preview] [--local]
 *
 * Lee la base de datos y el almacenamiento con wrangler (sesión de quien lo
 * ejecuta: no necesita la contraseña del panel). No borra nada.
 *
 * Resultado: entrega/la-cartilla-entrega-AAAA-MM-DD/ y el mismo .zip
 *   contenido.json   todas las piezas (borradores y publicado) y ajustes
 *   medios/          archivos subidos desde el panel + material de ejemplo
 *   sitio/           la web; abrir sitio/index.html con doble clic
 *   LEEME.txt
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const preview = args.includes('--env') && args[args.indexOf('--env') + 1] === 'preview'
const local = args.includes('--local')
const db = preview ? 'learn-sodium-preview' : 'learn-sodium'
const bucket = preview ? 'learn-sodium-media-preview' : 'learn-sodium-media'
const where = local ? ['--local'] : ['--remote']
const envFlag = preview ? ['--env', 'preview'] : []

const day = new Date().toISOString().slice(0, 10)
const out = join('entrega', `la-cartilla-entrega-${day}`)
mkdirSync(join(out, 'medios', 'archivos'), { recursive: true })

const wrangler = (...cmd) => execFileSync('npx', ['wrangler', ...cmd], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
const query = (sql) => JSON.parse(wrangler('d1', 'execute', db, ...where, ...envFlag, '--json', '--command', sql))[0].results

// 1. Contenido completo.
const rows = query('SELECT id, kind, position, draft, published, is_example FROM items ORDER BY kind, position')
const settingRows = query('SELECT key, value FROM settings')
const media = query('SELECT key, type, size, name FROM media')
const items = rows.map((row) => ({
  id: row.id,
  kind: row.kind,
  position: row.position,
  example: row.is_example === 1,
  draft: JSON.parse(row.draft),
  published: row.published ? JSON.parse(row.published) : null,
}))
const settings = Object.fromEntries(settingRows.map((row) => [row.key, row.value]))
writeFileSync(
  join(out, 'contenido.json'),
  JSON.stringify(
    {
      format: 'la-cartilla-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: { easterEgg: settings.easterEgg !== 'off', dedication: settings.dedication ?? '' },
      items,
      media,
    },
    null,
    2,
  ),
)
console.log(`contenido.json: ${items.length} piezas`)

// 2. Archivos subidos (R2) y material de ejemplo.
for (const { key } of media) {
  wrangler('r2', 'object', 'get', `${bucket}/${key}`, ...where, ...envFlag, '--file', join(out, 'medios', 'archivos', key))
}
cpSync('public/media', join(out, 'medios', 'ejemplos'), { recursive: true })
console.log(`medios: ${media.length} archivos subidos + material de ejemplo`)

// 3. Copia estática con lo publicado.
const published = {
  items: items.filter((item) => item.published).map((item) => ({ id: item.id, kind: item.kind, example: item.example, data: item.published })),
  settings: { easterEgg: settings.easterEgg !== 'off', dedication: settings.dedication ?? '' },
  version: new Date().toISOString(),
}
const snapshotPath = 'src/content/snapshot.json'
const original = readFileSync(snapshotPath, 'utf8')
try {
  writeFileSync(snapshotPath, JSON.stringify(published))
  execFileSync('npx', ['vite', 'build', '--logLevel', 'error'], { env: { ...process.env, VITE_STATIC: '1' }, stdio: 'inherit' })
} finally {
  writeFileSync(snapshotPath, original) // el repositorio queda como estaba
}
cpSync('dist-static', join(out, 'sitio'), { recursive: true })
mkdirSync(join(out, 'sitio', 'files'), { recursive: true })
for (const { key } of media) cpSync(join(out, 'medios', 'archivos', key), join(out, 'sitio', 'files', key))

writeFileSync(
  join(out, 'LEEME.txt'),
  `La Cartilla — paquete de entrega (${day})

sitio/index.html   Abre este archivo con doble clic: es la web completa, sin
                   conexión a internet ni base de datos. Funciona en Chrome,
                   Edge y Firefox.
contenido.json     Todo el contenido (borradores y publicado) y los ajustes.
                   Se puede volver a cargar en el panel: Respaldo → Importar
                   (comprimiendo contenido.json como backup.json junto con la
                   carpeta files/).
medios/archivos/   Los archivos que subiste desde el panel.
medios/ejemplos/   El material de las piezas de ejemplo.

El progreso de cada niño se guardaba solo en su navegador; no hay datos
personales en este paquete.
`,
)

if (existsSync(`${out}.zip`)) console.log(`(se sobrescribe ${out}.zip)`)
execFileSync('zip', ['-qr', `la-cartilla-entrega-${day}.zip`, `la-cartilla-entrega-${day}`], { cwd: 'entrega' })
console.log(`Listo: ${out}/ y ${out}.zip`)

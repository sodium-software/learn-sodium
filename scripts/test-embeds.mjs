/** Comprueba la conversión de enlaces para insertar (embedUrl). Uso: node scripts/test-embeds.mjs */
import assert from 'node:assert/strict'
import { embedPlatform, embedUrl, sanitize, SCHEMAS } from '../src/shared/schema.ts'

const view = 'https://www.canva.com/design/DAHady_Yi-0/c_fZNkwNHAv-hR8NAMtZkw/view?utm_content=x&utm_source=link'
const canvaEmbed = 'https://www.canva.com/design/DAHady_Yi-0/c_fZNkwNHAv-hR8NAMtZkw/view?embed'
assert.equal(embedUrl(view), canvaEmbed)
assert.equal(embedUrl(view.replace('/view?', '/edit?')), canvaEmbed)
assert.match(embedUrl('https://www.canva.com.evil.example/design/a/b/view').error, /only Canva/)
for (const link of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3', 'https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/shorts/dQw4w9WgXcQ'])
  assert.equal(embedUrl(link), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
assert.match(embedUrl('https://vimeo.com/1').error, /only Canva/)
assert.match(embedUrl(view, 'youtube').error, /YouTube/)
const ww = 'https://wordwall.net/embed/0123456789abcdef0123456789abcdef?themeId=1&templateId=5'
assert.equal(embedUrl(ww), ww)
assert.match(embedUrl('https://wordwall.net/resource/123/colores').error, /Wordwall embed code/)
assert.equal(embedUrl('https://es.educaplay.com/juego/123-colores.html'), 'https://es.educaplay.com/juego/123-colores.html')
assert.equal(embedPlatform(canvaEmbed), 'canva')

// El servidor acepta el código <iframe> completo, guarda la forma insertable y convierte el de edición en uno de solo ver.
const code = `<iframe style="max-width:100%" src="${ww.replace('&', '&amp;')}" width="500" height="380" frameborder="0" allowfullscreen></iframe>`
assert.equal(sanitize(SCHEMAS.activity, { type: 'quiz', embed: code }).data.embed, ww)
assert.equal(sanitize(SCHEMAS.story, { embed: view }).data.embed, canvaEmbed)
assert.equal(sanitize(SCHEMAS.story, { embed: view.replace('/view?', '/edit?') }).data.embed, canvaEmbed)
assert.ok(sanitize(SCHEMAS.film, { youtube: view }).errors.some((e) => e.includes('YouTube')))
console.log('embeds OK')

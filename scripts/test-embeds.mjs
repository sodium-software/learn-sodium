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
const hz = 'https://heyzine.com/flip-book/7ae08737f4.html'
assert.equal(embedUrl(hz), hz)
assert.equal(embedPlatform(hz), 'heyzine')
assert.match(embedUrl('https://heyzine.com.evil.example/flip-book/x.html').error, /only Canva/)
const voc = 'https://vocaroo.com/embed/1i2zeXiW6t2S?autoplay=0'
for (const link of ['https://vocaroo.com/1i2zeXiW6t2S', 'https://voca.ro/1i2zeXiW6t2S', voc]) assert.equal(embedUrl(link), voc)
assert.equal(embedPlatform(voc), 'vocaroo')
assert.match(embedUrl('https://vocaroo.com.evil.example/1i2zeXiW6t2S').error, /only Canva/)
const pad = 'https://padlet.com/embed/abc123xyz789'
for (const link of ['https://padlet.com/maria_t/our-class-wall-abc123xyz789', 'https://padlet.com/maria_t/abc123xyz789', pad]) assert.equal(embedUrl(link), pad)
assert.equal(embedPlatform(pad), 'padlet')
assert.equal(sanitize(SCHEMAS.activity, { type: 'quiz', embed: `<iframe src="${pad}" frameborder="0" allow="camera;microphone"></iframe>` }).data.embed, pad)

// El servidor acepta el código <iframe> completo, guarda la forma insertable y convierte el de edición en uno de solo ver.
const code = `<iframe style="max-width:100%" src="${ww.replace('&', '&amp;')}" width="500" height="380" frameborder="0" allowfullscreen></iframe>`
assert.equal(sanitize(SCHEMAS.activity, { type: 'quiz', embed: code }).data.embed, ww)
assert.equal(sanitize(SCHEMAS.story, { embed: view }).data.embed, canvaEmbed)
assert.equal(sanitize(SCHEMAS.story, { embed: view.replace('/view?', '/edit?') }).data.embed, canvaEmbed)
assert.ok(sanitize(SCHEMAS.film, { youtube: view }).errors.some((e) => e.includes('YouTube')))
console.log('embeds OK')

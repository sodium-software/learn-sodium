/** Comprueba que todos los recursos multimedia referenciados existen en dist/. */
import { readFileSync, existsSync } from 'node:fs'
import { globSync } from 'node:fs'

const dist = 'dist'
const missing = []

const contentFiles = ['content/songs.json', 'content/podcasts.json', 'content/films.json', 'content/activities.json']
for (const file of contentFiles) {
  const raw = readFileSync(file, 'utf8')
  for (const m of raw.matchAll(/"(?:audio|cover)":\s*"([^"]+)"/g)) {
    const path = m[1]
    if (!path.startsWith('/')) continue
    const target = `${dist}${path}`
    if (!existsSync(target)) missing.push(`${file} → ${path}`)
  }
}

// Rutas de vídeo y clips derivadas en el código.
const films = JSON.parse(readFileSync('content/films.json', 'utf8')).films
for (const film of films) {
  const target = `${dist}/media/video/${film.id}.mp4`
  if (!existsSync(target)) missing.push(`film → /media/video/${film.id}.mp4`)
}
const episodes = JSON.parse(readFileSync('content/podcasts.json', 'utf8')).episodes
for (const ep of episodes) {
  const target = `${dist}/media/audio/${ep.id}.mp3`
  if (!existsSync(target)) missing.push(`podcast → /media/audio/${ep.id}.mp3`)
}

if (missing.length) {
  console.log('FALTAN:')
  for (const m of missing) console.log(' -', m)
  process.exit(1)
}
console.log('Todos los recursos multimedia referenciados existen en dist/.')

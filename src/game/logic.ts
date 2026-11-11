/**
 * Lógica de «Frascos de colores»: frascos de 4 capas; se vierte la capa de
 * arriba (y las iguales que tenga debajo) sobre el mismo color o en un frasco
 * vacío. Se gana cuando cada frasco está vacío o lleno de un solo color.
 */

export const CAPACITY = 4

/** Cada frasco es una lista de colores de abajo arriba. */
export type Jar = number[]

const top = (jar: Jar) => jar[jar.length - 1]

export function canPour(from: Jar, to: Jar): boolean {
  if (from.length === 0 || to.length >= CAPACITY) return false
  return to.length === 0 || top(to) === top(from)
}

export function pour(jars: Jar[], fromIndex: number, toIndex: number): Jar[] | null {
  const from = jars[fromIndex]
  const to = jars[toIndex]
  if (fromIndex === toIndex || !canPour(from, to)) return null
  const color = top(from)
  const nextFrom = [...from]
  const nextTo = [...to]
  while (nextFrom.length && top(nextFrom) === color && nextTo.length < CAPACITY) nextTo.push(nextFrom.pop() as number)
  return jars.map((jar, i) => (i === fromIndex ? nextFrom : i === toIndex ? nextTo : jar))
}

export const isComplete = (jar: Jar) => jar.length === CAPACITY && jar.every((c) => c === jar[0])
export const isSolved = (jars: Jar[]) => jars.every((jar) => jar.length === 0 || isComplete(jar))

export function hasMoves(jars: Jar[]): boolean {
  return jars.some((from, i) => !isComplete(from) && jars.some((to, j) => i !== j && canPour(from, to) && !(to.length === 0 && from.every((c) => c === from[0]))))
}

/** Nivel aleatorio con `colors` colores y dos frascos vacíos. */
export function newLevel(colors: number, random: () => number = Math.random): Jar[] {
  for (;;) {
    const pool = Array.from({ length: colors * CAPACITY }, (_, i) => Math.floor(i / CAPACITY))
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const jars: Jar[] = Array.from({ length: colors }, (_, i) => pool.slice(i * CAPACITY, (i + 1) * CAPACITY))
    jars.push([], [])
    if (!isSolved(jars) && hasMoves(jars)) return jars
  }
}

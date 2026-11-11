// Autocomprobación de la lógica del juego: node scripts/test-game.mjs
import assert from 'node:assert/strict'
import { CAPACITY, canPour, hasMoves, isSolved, newLevel, pour } from '../src/game/logic.ts'

assert.equal(canPour([0], []), true, 'a un frasco vacío se puede verter')
assert.equal(canPour([0, 1], [2]), false, 'colores distintos no')
assert.equal(canPour([1], [1, 1, 1, 1]), false, 'frasco lleno no')
assert.deepEqual(pour([[0, 1, 1], [1]], 0, 1), [[0], [1, 1, 1]], 'vierte todas las capas iguales')
assert.deepEqual(pour([[1, 1, 1], [0, 0, 1]], 0, 1), [[1, 1], [0, 0, 1, 1]], 'solo hasta llenar')
assert.equal(pour([[0], [1]], 0, 1), null)
assert.equal(isSolved([[0, 0, 0, 0], [], [1, 1, 1, 1]]), true)
assert.equal(isSolved([[0, 0, 0], [0]]), false)
assert.equal(hasMoves([[0, 1, 0, 1], [1, 0, 1, 0]]), false, 'sin huecos no hay jugadas')

let seed = 7
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
for (let colors = 3; colors <= 7; colors++) {
  const level = newLevel(colors, random)
  assert.equal(level.length, colors + 2)
  assert.equal(level.flat().length, colors * CAPACITY)
  for (let c = 0; c < colors; c++) assert.equal(level.flat().filter((x) => x === c).length, CAPACITY)
  assert.equal(isSolved(level), false)
}
console.log('lógica del juego: todas las comprobaciones pasan')

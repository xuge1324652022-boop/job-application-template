import test from 'node:test'
import assert from 'node:assert/strict'
import { validateEffectCatalog } from '../scripts/source-catalog.mjs'

test('source releases accept the actual definition set as it grows', () => {
  for (const count of [38, 40, 41]) {
    const definitions = Array.from({ length: count }, (_, index) => ({ id: `effect-${index}` }))
    assert.doesNotThrow(() => validateEffectCatalog({ effectCount: count, effects: definitions }, definitions))
  }
})

test('source releases reject missing, substituted or duplicate effect records', () => {
  const definitions = [{ id: 'a' }, { id: 'b' }]
  for (const effects of [[{ id: 'a' }], [{ id: 'a' }, { id: 'c' }], [{ id: 'a' }, { id: 'a' }]])
    assert.throws(() => validateEffectCatalog({ effectCount: 2, effects }, definitions))
  assert.throws(() => validateEffectCatalog({ effectCount: 2, effects: definitions }, [{ id: 'a' }, { id: 'a' }]))
  assert.throws(() => validateEffectCatalog({ effectCount: 0, effects: [] }, []))
})

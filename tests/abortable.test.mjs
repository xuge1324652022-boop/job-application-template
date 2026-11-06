import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function harness() {
  const frames = new Map()
  let next = 0
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync('src/utils/abortable.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  vm.runInNewContext(code, {
    exports,
    DOMException,
    requestAnimationFrame: (fn) => {
      frames.set(++next, fn)
      return next
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  })
  const controller = new AbortController()
  const listeners = new Set()
  const signal = controller.signal
  const add = signal.addEventListener.bind(signal),
    remove = signal.removeEventListener.bind(signal)
  signal.addEventListener = (type, handler, options) => {
    listeners.add(handler)
    add(type, handler, options)
  }
  signal.removeEventListener = (type, handler) => {
    listeners.delete(handler)
    remove(type, handler)
  }
  return { ...exports, controller, signal, listeners, frames }
}

test('async waits release abort listeners on success and propagate actual work failures', async () => {
  const h = harness()
  const value = {}
  assert.equal(await h.abortable(Promise.resolve(value), h.signal), value)
  assert.equal(h.listeners.size, 0)
  const failure = Error('Original failure')
  await assert.rejects(h.abortable(Promise.reject(failure), h.signal), failure)
  assert.equal(h.listeners.size, 0)
})

test('already-cancelled work consumes late rejection without registering listeners', async () => {
  const h = harness()
  h.controller.abort()
  await assert.rejects(h.abortable(Promise.reject(Error('Too late')), h.signal), {
    name: 'AbortError',
  })
  assert.equal(h.listeners.size, 0)
  await assert.rejects(h.nextFrame(h.signal), { name: 'AbortError' })
  assert.equal(h.frames.size, 0)
})

test('a frame releases its listener after painting or cancellation', async () => {
  const painted = harness()
  const ready = painted.nextFrame(painted.signal)
  for (const fn of painted.frames.values()) fn(0)
  await ready
  assert.equal(painted.listeners.size, 0)
  const cancelled = harness()
  const pending = cancelled.nextFrame(cancelled.signal)
  cancelled.controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(cancelled.frames.size, 0)
  assert.equal(cancelled.listeners.size, 0)
})

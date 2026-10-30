import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'

const script = parse(fs.readFileSync('src/views/CardListView.vue', 'utf8')).descriptor.scriptSetup
  .content
const ast = ts.createSourceFile('card.ts', script, ts.ScriptTarget.Latest, true)
const functions = ast.statements
  .filter(
    (node) =>
      ts.isFunctionDeclaration(node) &&
      ['onCardClick', 'resetExpansion', 'cancelExpansionDelay', 'onCurtainChange'].includes(
        node.name?.text,
      ),
  )
  .map((node) => node.getText(ast))
  .join('\n')
const code = ts.transpileModule(functions, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText
function harness() {
  const classes = new Set(['no-scroll']),
    timers = new Map(),
    pushes = []
  const context = {
    expansionTimer: 0,
    expansionGeneration: 0,
    expandingId: { value: null },
    isTransitioning: { value: false },
    routeCurtainActive: { value: false },
    document: {
      documentElement: {
        classList: { add: (value) => classes.add(value), remove: (value) => classes.delete(value) },
      },
    },
    window: {
      clearTimeout: (id) => timers.delete(id),
      setTimeout: (fn) => {
        timers.set(1, fn)
        return 1
      },
      matchMedia: () => ({ matches: false }),
    },
    jumpPathFor: () => '/about',
    router: {
      push: async (target) => {
        pushes.push(target)
        throw new Error('cancelled')
      },
    },
  }
  vm.createContext(context)
  vm.runInContext(code, context)
  const click = () =>
    context.onCardClick(
      { id: '01', scale: 1.4, rotate: -8, duration: 0.5, easing: 'ease', origin: 'center' },
      { currentTarget: { style: { setProperty() {} } } },
    )
  return { context, classes, timers, pushes, click }
}

test('card expansion keeps global state and viewer lock untouched, and clears its own lock after failure', async () => {
  const h = harness()
  h.click()
  h.click()
  assert.equal(h.timers.size, 1)
  assert.equal(h.context.isTransitioning.value, false)
  assert.equal(h.classes.has('card-expansion-lock'), true)
  h.timers.get(1)()
  for (let i = 0; i < 8; i++) await Promise.resolve()
  assert.equal(h.pushes.length, 1)
  assert.equal(h.context.expandingId.value, null)
  assert.equal(h.classes.has('card-expansion-lock'), false)
  assert.equal(h.classes.has('no-scroll'), true)
})

test('a newer curtain or unmount can cancel the local timer without touching another lock', () => {
  const h = harness()
  h.click()
  h.context.resetExpansion()
  assert.equal(h.timers.size, 0)
  assert.equal(h.context.expandingId.value, null)
  assert.equal(h.classes.has('no-scroll'), true)
})

test('curtain takeover keeps the enlarged card visible and invalidates old completion callbacks', async () => {
  const h = harness()
  let finishOld
  h.context.router.push = () =>
    new Promise((resolve) => {
      finishOld = resolve
    })
  h.click()
  h.timers.get(1)()
  h.context.routeCurtainActive.value = true
  h.context.onCurtainChange(true)
  assert.equal(
    h.context.expandingId.value,
    '01',
    'do not collapse the card under the entering curtain',
  )
  assert.equal(h.classes.has('card-expansion-lock'), false)
  h.context.routeCurtainActive.value = false
  h.context.onCurtainChange(false)
  h.click()
  assert.equal(h.classes.has('card-expansion-lock'), true)
  finishOld()
  for (let i = 0; i < 8; i++) await Promise.resolve()
  assert.equal(h.context.expandingId.value, '01', 'old navigation must not clear the new expansion')
  assert.equal(h.classes.has('card-expansion-lock'), true)
})

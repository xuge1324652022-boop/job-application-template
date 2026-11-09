import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'

function sourceModule(path, imports = {}) {
  const exports = {}
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: id => {
    assert.ok(id in imports, `unexpected import ${id}`)
    return imports[id]
  } })
  return exports
}

test('gallery push-in pauses card loops, preserves geometry and resumes only visible artwork', () => {
  const clamp = sourceModule('src/utils/clamp.ts')
  const geometry = sourceModule('src/utils/galleryMotion.ts', { './clamp': clamp })
  const { createGalleryRenderer } = sourceModule('src/experience/galleryRenderer.ts', {
    '../utils/clamp': clamp, '../utils/galleryMotion': geometry,
  })
  const writes = []
  function node(children = []) {
    const properties = new Map()
    return { dataset: {}, children, firstElementChild: children[0], lastElementChild: children.at(-1),
      style: { get: key => properties.get(key), setProperty(key, value) {
        writes.push(key); properties.set(key, value)
      } },
    }
  }
  const nodes = factory => Array.from({ length: 6 }, factory)
  const state = { entrance: 1, orbit: 0, focus: 0, selected: 0 }
  let transitioning = false
  const calls = nodes(() => ({ play: 0, pause: 0 }))
  const positions = nodes(() => node())
  const planes = nodes(() => node())
  const render = createGalleryRenderer({
    state, getViewport: () => ({ width: 1440, height: 900 }), isDisposed: () => false,
    isTransitioning: () => transitioning, drift: { x: 0, y: 0 }, proximity: [0, 0, 0, 0, 0, 0],
    visuals: calls.map(call => ({ play() { call.play++ }, pause() { call.pause++ } })),
    stageRef: { value: node() }, orbitRef: { value: node() }, titleRef: { value: node() },
    positions, planes, drifts: nodes(() => node()),
    outlines: nodes(() => node(nodes(() => node()).slice(0, 4))),
    labels: nodes(() => node([node(), node()])),
  })
  render()
  transitioning = true
  for (const progress of [0, .2, .5, .9, 1]) { state.focus = progress; render() }
  assert.ok(calls.every(call => call.pause === 1 && call.play === 0), 'all MG loops pause during the push-in')
  assert.equal(planes[0].style.get('clip-path'), 'inset(0% 0%)')
  assert.equal(planes[0].style.get('transform'), 'rotateY(0deg) scale(1)')
  transitioning = false
  render()
  assert.equal(calls[0].play, 1)
  assert.ok(calls.slice(1).every(call => call.play === 0), 'hidden cards remain paused')
  assert.equal(planes[0].style.get('will-change'), '', 'temporary compositing hint is released')
  const settledWrites = writes.length
  render()
  assert.equal(writes.length, settledWrites, 'identical frames do not write styles or restart loops')
  transitioning = true
  state.focus = .4
  render()
  assert.equal(calls[0].pause, 2)
  assert.ok(calls.slice(1).every(call => call.play === 0), 'reverse movement does not wake other card loops')
  transitioning = false
  state.focus = 0
  render()
  assert.ok(calls.every(call => call.play > 0), 'returning to the gallery restores the visible artwork')
  assert.ok(!writes.includes('inset') && !writes.includes('border-width'), 'moving outlines and labels must not trigger box layout')
})

test('gallery releases element listeners before Vue clears template refs', () => {
  const source = parse(fs.readFileSync(new URL('../src/components/ThreeHome.vue', import.meta.url), 'utf8')).descriptor.scriptSetup.content
  const file = ts.createSourceFile('gallery.ts', source, ts.ScriptTarget.Latest, true)
  const cleanup = file.statements.find(node => ts.isExpressionStatement(node) &&
    ts.isCallExpression(node.expression) &&
    ['onBeforeUnmount', 'onUnmounted'].includes(node.expression.expression.getText(file)))
  assert.ok(cleanup, 'the gallery registers an unmount cleanup')

  const listeners = new Map()
  const handlers = Object.fromEntries(['onPointerDown', 'onWheel'].map(name => [name, () => {}]))
  listeners.set('pointerdown', handlers.onPointerDown)
  listeners.set('wheel', handlers.onWheel)
  const host = {
    removeEventListener(type, handler) {
      assert.equal(listeners.get(type), handler)
      listeners.delete(type)
    },
  }
  const rootRef = { value: host }
  const noop = () => {}
  let beforeUnmount, unmounted
  const scope = {
    onBeforeUnmount: callback => { beforeUnmount = callback },
    onUnmounted: callback => { unmounted = callback },
    rootRef, ...handlers, destroyed: false,
    motionMedia: { removeEventListener: noop }, onMotionChange: noop,
    cursorLockState: { value: 'drag' }, bootTimer: null, boot: noop,
    window: { removeEventListener: noop }, document: { removeEventListener: noop },
    stopMotion: noop, indexAnimation: null, pendingResize: null, resizeObserver: { disconnect: noop },
    scheduleResize: noop, flushPendingResize: noop, gsap: { ticker: { remove: noop } },
    parallaxTick: noop, parallaxAttached: true, clickReleaseTimer: null,
    onKeyDown: noop, onPointerMove: noop, onPointerHover: noop, onPointerLeave: noop,
    onPointerUp: noop, onPointerCancel: noop, debugWindow: { __galleryDebug: {} },
  }
  vm.runInNewContext(ts.transpileModule(cleanup.getText(file), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText, scope)

  // Vue's order matters: local refs are available only in beforeUnmount.
  beforeUnmount?.()
  rootRef.value = null
  unmounted?.()
  assert.equal(listeners.size, 0, 'wheel and pointerdown do not retain a detached gallery')
  assert.equal(scope.destroyed, true)
  assert.equal(scope.cursorLockState.value, null)
  assert.equal(scope.parallaxAttached, false)
  assert.equal('__galleryDebug' in scope.debugWindow, false)
})

import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'

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

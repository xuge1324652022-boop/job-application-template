import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const compile = (file) =>
  ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const flush = async () => {
  for (let i = 0; i < 16; i++) await Promise.resolve()
}

function harness({
  ready = () => Promise.resolve(),
  fonts = Promise.resolve(),
  blocked = false,
} = {}) {
  let mount,
    unmount,
    leave,
    nextFrameId = 0,
    refreshes = 0,
    framesRun = 0
  const frames = new Map(),
    listeners = new Map(),
    curtainListeners = new Set(),
    pushes = []
  const curtain = { value: blocked }
  const outer = { open: false, parentElement: null }
  const inner = { open: false, parentElement: { closest: () => outer } }
  const route = { path: '/about', query: { from: 'gallery' } }
  class Element {
    constructor(anchor) {
      this.anchor = anchor
    }
    closest() {
      return this.anchor
    }
  }
  const globals = {
    AbortController,
    DOMException,
    requestAnimationFrame: (fn) => {
      frames.set(++nextFrameId, fn)
      return nextFrameId
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    document: { fonts: { ready: fonts }, getElementById: () => ({ closest: () => inner }) },
    window: {
      addEventListener: (name, handler) => listeners.set(name, handler),
      removeEventListener: (name, handler) => {
        assert.equal(listeners.get(name), handler)
        listeners.delete(name)
      },
    },
    Element,
  }
  const load = (
    file,
    require = () => {
      throw Error('Unexpected import')
    },
  ) => {
    const exports = {}
    vm.runInNewContext(compile(file), { ...globals, exports, require })
    return exports
  }
  const registry = load('src/utils/routeScrollPreparation.ts')
  const waits = load('src/utils/abortable.ts')
  const module = load('src/composables/useAboutScrollPreparation.ts', (name) => {
    if (name === 'vue')
      return {
        ref: (value) => ({ value }),
        nextTick: () => Promise.resolve(),
        onMounted: (fn) => {
          mount = fn
        },
        onBeforeUnmount: (fn) => {
          unmount = fn
        },
        watch(source, fn) {
          assert.equal(source, curtain)
          curtainListeners.add(fn)
          return () => curtainListeners.delete(fn)
        },
      }
    if (name === 'vue-router')
      return {
        useRouter: () => ({
          currentRoute: { value: route },
          push: (to) => {
            pushes.push(to)
            return Promise.resolve()
          },
        }),
        onBeforeRouteLeave: (fn) => {
          leave = fn
        },
      }
    if (name === 'gsap/ScrollTrigger')
      return {
        ScrollTrigger: {
          refresh: () => {
            refreshes++
          },
        },
      }
    if (name.endsWith('routeScrollPreparation')) return registry
    if (name.endsWith('abortable')) return waits
    if (name.endsWith('usePageCurtain')) return { routeCurtainBlocked: curtain }
    throw Error(name)
  })
  const api = module.useAboutScrollPreparation([{ value: { ensureReady: ready } }])
  const prepare = registry.getRouteScrollPreparation('/about')
  mount()
  return {
    ...api,
    prepare,
    listeners,
    registry,
    frames,
    pushes,
    route,
    inner,
    outer,
    refreshes: () => refreshes,
    framesRun: () => framesRun,
    unmount: () => unmount(),
    leave: () => leave(),
    curtain(value) {
      curtain.value = value
      for (const listener of [...curtainListeners]) listener(value)
    },
    curtainWatchers: () => curtainListeners.size,
    async paint() {
      await flush()
      const batch = [...frames]
      frames.clear()
      for (const [, fn] of batch) {
        framesRun++
        fn(0)
      }
      await flush()
    },
    click(overrides = {}, attributes = {}) {
      let prevented = false
      const anchor = {
        target: attributes.target ?? '',
        hasAttribute: (key) => key in attributes,
        getAttribute: () => '#experience',
      }
      api.onAnchorClick({
        button: 0,
        target: new Element(anchor),
        preventDefault() {
          prevented = true
        },
        ...overrides,
      })
      return prevented
    },
  }
}

test('About waits for lazy content, fonts, curtain and paint boundaries before revealing a deep link', async () => {
  const content = deferred(),
    fonts = deferred()
  const h = harness({ ready: () => content.promise, fonts: fonts.promise, blocked: true })
  assert.equal(await h.prepare('', null), true)
  assert.equal(h.eagerAll.value, false)
  const pending = h.prepare('#nested', null)
  await flush()
  assert.equal(h.eagerAll.value, true)
  assert.equal(h.frames.size, 0)
  content.resolve()
  fonts.resolve()
  await flush()
  assert.equal(h.curtainWatchers(), 1)
  h.curtain(false)
  await h.paint()
  await h.paint()
  await h.paint()
  assert.equal(await pending, true)
  assert.equal(h.inner.open, true)
  assert.equal(h.outer.open, true)
  assert.equal(h.framesRun(), 3)
  assert.equal(h.refreshes(), 1)
  h.unmount()
  assert.equal(h.listeners.size, 0)
  assert.equal(h.registry.getRouteScrollPreparation('/about'), undefined)
})

test('a superseded lazy wait consumes late errors and manual scrolling cancels only the current request', async () => {
  const first = deferred(),
    second = deferred()
  const queue = [first, second]
  const h = harness({ ready: () => queue.shift().promise })
  const old = h.prepare('#first', null)
  await flush()
  const current = h.prepare('#second', null)
  await flush()
  assert.equal(await old, false)
  first.reject(Error('Late content failure'))
  await flush()
  h.listeners.get('wheel')()
  assert.equal(await current, false)
  second.resolve()
  await h.paint()
  assert.equal(h.refreshes(), 0)
  assert.equal(h.frames.size, 0)
  h.unmount()
})

test('route exit and teardown release curtain watchers, queued frames and listeners without deleting a newer owner', async () => {
  const h = harness({ blocked: true })
  const pending = h.prepare('#target', null)
  await flush()
  h.leave()
  assert.equal(await pending, false)
  assert.equal(h.curtainWatchers(), 0)
  h.curtain(false)
  const frameWait = h.prepare('', { top: 900 })
  await flush()
  assert.equal(h.frames.size, 1)
  const newer = async () => true
  h.registry.registerRouteScrollPreparation('/about', newer)
  h.unmount()
  assert.equal(await frameWait, false)
  assert.equal(h.frames.size, 0)
  assert.equal(h.listeners.size, 0)
  assert.equal(h.registry.getRouteScrollPreparation('/about'), newer)
})

test('ordinary anchor navigation retains query; modified clicks and downloads keep browser defaults', () => {
  const h = harness()
  for (const event of [
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { button: 1 },
    { defaultPrevented: true },
  ])
    assert.equal(h.click(event), false)
  assert.equal(h.click({}, { download: '' }), false)
  assert.equal(h.click({}, { target: '_blank' }), false)
  assert.equal(h.click(), true)
  assert.equal(h.pushes.length, 1)
  assert.equal(h.pushes[0].hash, '#experience')
  assert.equal(h.pushes[0].query, h.route.query)
  h.unmount()
})

test('a real loading failure remains visible to the router instead of being reported as a cancellation', async () => {
  const failure = Error('Content failed')
  const h = harness({ ready: () => Promise.reject(failure) })
  await assert.rejects(h.prepare('#target', null), failure)
  assert.equal(h.refreshes(), 0)
  assert.equal(await h.prepare('#%E0%A4', null), true)
  h.unmount()
})

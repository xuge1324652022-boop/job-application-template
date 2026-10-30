import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(
  new URL('../src/components/about/useInternshipTextMotion.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText

function harness(reduced = false) {
  let mount,
    unmount,
    preparation,
    cancelCount = 0,
    currentScope
  const observers = [],
    timelines = [],
    scopes = [],
    splits = [],
    watchers = []
  const curtain = { value: false }
  const readings = Array.from({ length: 2 }, (_, index) => {
    const company = { opacity: 1, yPercent: 0 }
    const heading = {
      index,
      querySelector: () => company,
    }
    const period = { opacity: 1, y: 0 },
      role = { opacity: 1, y: 0 }
    const makeNode = (text) => ({ text, cloneNode: () => makeNode(text) })
    const paragraphs = Array.from({ length: 3 }, () => ({
      opacity: 1,
      y: 0,
      textContent: '职责内容',
      childNodes: [makeNode('strong title'), makeNode('body')],
      getAttribute: () => null,
      replaceChildren(...nodes) {
        this.childNodes = nodes
      },
      removeAttribute() {},
      setAttribute() {},
    }))
    paragraphs.forEach((paragraph) => {
      paragraph.originalNodes = [...paragraph.childNodes]
    })
    return {
      heading,
      company,
      period,
      role,
      paragraphs,
      querySelector(selector) {
        if (selector === 'h2') return heading
        return selector.includes('period') ? period : role
      },
      querySelectorAll: () => paragraphs,
    }
  })
  const host = { querySelectorAll: () => readings, x: -900 }
  class Observer {
    observed = new Set()
    disconnected = false
    constructor(callback) {
      this.callback = callback
      observers.push(this)
    }
    observe(node) {
      this.observed.add(node)
    }
    unobserve(node) {
      this.observed.delete(node)
    }
    disconnect() {
      this.disconnected = true
      this.observed.clear()
    }
    fire(target, values = {}) {
      this.callback([
        {
          target,
          isIntersecting: true,
          boundingClientRect: { width: 300, height: 40, right: 800, bottom: 400 },
          ...values,
        },
      ])
    }
  }
  const deactivate = (scope) => {
    scope.cleanup?.()
    for (const timeline of scope.timelines) timeline.revert()
  }
  const build = (scope) => {
    currentScope = scope
    scope.cleanup = scope.run()
    currentScope = undefined
  }
  const SplitText = {
    create(paragraph, options) {
      const split = {
        killed: false,
        reverted: false,
        resplit() {
          split.lines = [
            { opacity: 1, y: 0 },
            { opacity: 1, y: 0 },
          ]
          split.animation = options.onSplit(split)
        },
        kill() {
          split.killed = true
        },
        revert() {
          split.reverted = true
        },
      }
      splits.push(split)
      split.resplit()
      return split
    },
  }
  const gsap = {
    registerPlugin() {},
    matchMedia() {
      const scope = { timelines: [] }
      scopes.push(scope)
      return {
        add(query, run, root) {
          assert.equal(query, '(prefers-reduced-motion: no-preference)')
          assert.equal(root, host, 'all selectors and GSAP cleanup are scoped to the scene')
          scope.run = run
          if (!reduced) build(scope)
        },
        revert() {
          deactivate(scope)
        },
      }
    },
    timeline(options = {}) {
      const changes = []
      const timeline = {
        targets: new Set(),
        plays: 0,
        completions: 0,
        reverted: false,
        fromTo(targets, from, to) {
          for (const target of Array.isArray(targets) ? targets : [targets]) {
            timeline.targets.add(target)
            const original = Object.fromEntries(Object.keys(from).map((key) => [key, target[key]]))
            changes.push({
              target,
              original,
              final: Object.fromEntries(Object.keys(from).map((key) => [key, to[key]])),
            })
            Object.assign(target, from)
          }
          return timeline
        },
        set(targets, values) {
          for (const target of Array.isArray(targets) ? targets : [targets]) {
            timeline.targets.add(target)
            const final = Object.fromEntries(
              Object.entries(values).filter(
                ([key]) => !['duration', 'stagger', 'ease'].includes(key),
              ),
            )
            const original = Object.fromEntries(Object.keys(final).map((key) => [key, target[key]]))
            changes.push({ target, original, final })
            Object.assign(target, final)
          }
          return timeline
        },
        play() {
          timeline.plays++
          return timeline
        },
        progress(value) {
          assert.equal(value, 1)
          timeline.completions++
          for (const { target, final } of changes) Object.assign(target, final)
          options.onComplete?.()
          return timeline
        },
        pause() {
          return timeline
        },
        revert() {
          timeline.reverted = true
          for (const { target, original } of changes) Object.assign(target, original)
        },
      }
      currentScope?.timelines.push(timeline)
      timelines.push(timeline)
      return timeline
    },
  }
  const exports = {}
  vm.runInNewContext(compiled, {
    exports,
    IntersectionObserver: Observer,
    window: { innerWidth: 1440 },
    require(name) {
      if (name === 'vue')
        return {
          nextTick: () => Promise.resolve(),
          watch: (source, callback, options) => {
            watchers.push({ source, callback, options })
          },
          onMounted: (fn) => {
            mount = fn
          },
          onBeforeUnmount: (fn) => {
            unmount = fn
          },
        }
      if (name === 'gsap') return { __esModule: true, default: gsap }
      if (name === 'gsap/SplitText') return { SplitText }
      if (name === '../../composables/usePageCurtain') return { routeCurtainActive: curtain }
      assert.equal(name, '../../utils/motionLayout')
      return {
        prepareMotionLayout(root, run) {
          assert.equal(root, host)
          preparation = run
          return () => {
            cancelCount++
          }
        },
      }
    },
  })
  const language = () => 'zh'
  exports.useInternshipTextMotion({ value: host }, language)
  return {
    host,
    readings,
    observers,
    timelines,
    splits,
    header: (index) => timelines.find((timeline) => timeline.targets.has(readings[index].company)),
    curtain(value) {
      curtain.value = value
      watchers.find((w) => w.source === curtain).callback(value)
    },
    languageChange: () => watchers.find((w) => w.source === language).callback(),
    mount: () => mount(),
    prepare: () => preparation(),
    unmount: () => unmount(),
    cancelCount: () => cancelCount,
    reduce(value) {
      reduced = value
      for (const scope of scopes) value ? deactivate(scope) : build(scope)
    },
  }
}

test('resume entrances play only once and fast/deep-linked past headings settle without touching strip motion', () => {
  const h = harness()
  h.mount()
  assert.equal(h.observers.length, 0, 'wait for the scene layout queue before preparing text')
  h.prepare()
  const observer = h.observers[0]
  observer.fire(h.readings[0].heading)
  observer.fire(h.readings[0].heading)
  assert.equal(h.timelines[0].plays, 1)
  observer.fire(h.readings[1].heading, {
    isIntersecting: false,
    boundingClientRect: { width: 300, height: 40, right: -10, bottom: 400 },
  })
  assert.equal(h.header(1).completions, 1, 'a horizontally skipped heading finishes immediately')
  assert.equal(h.readings[1].company.yPercent, 0)
  assert.equal(h.host.x, -900, 'the parent strip transform is never an entrance target')
  h.unmount()
  assert.equal(observer.disconnected, true)
  assert.ok(h.timelines.every((timeline) => timeline.reverted))
  assert.equal(h.cancelCount(), 1)
})

test('reduced motion leaves text static; changing preference mid-entrance restores styles and never re-hides seen text', () => {
  const h = harness(true)
  h.mount()
  h.prepare()
  assert.equal(h.observers.length, 0)
  assert.equal(h.timelines.length, 0)
  h.reduce(false)
  h.observers[0].fire(h.readings[0].heading)
  h.reduce(true)
  assert.equal(h.readings[0].company.yPercent, 0)
  assert.equal(h.readings[0].paragraphs[0].opacity, 1)
  assert.equal(h.observers[0].disconnected, true)
  const count = h.timelines.length
  h.reduce(false)
  assert.equal(h.timelines.length, count + 4, 'only the unseen resume can receive a new entrance')
  assert.equal(h.readings[0].company.yPercent, 0)
  h.unmount()
})

test('unmount cancels pending preparation and ignores late queued work', () => {
  const h = harness()
  h.mount()
  h.unmount()
  h.prepare()
  assert.equal(h.cancelCount(), 1)
  assert.equal(h.observers.length, 0)
  assert.equal(h.timelines.length, 0)
})

test('the page curtain defers first-paragraph entrances until reveal, then plays exactly once', () => {
  const h = harness()
  h.curtain(true)
  h.mount()
  h.prepare()
  h.observers[0].fire(h.readings[0].heading, {
    isIntersecting: false,
    boundingClientRect: { width: 300, height: 40, right: -10, bottom: 400 },
  })
  h.observers[0].fire(h.readings[0].paragraphs[0])
  assert.equal(h.header(0).plays, 0)
  h.curtain(false)
  assert.equal(h.header(0).plays, 1)
  assert.equal(
    h.header(0).completions,
    0,
    'current visible content wins over stale pre-layout positions',
  )
  h.observers[0].fire(h.readings[0].heading)
  assert.equal(h.header(0).plays, 1)
  h.unmount()
})

test('real-line reflow keeps started content visible and language/unmount restore original Vue nodes', async () => {
  const h = harness()
  h.mount()
  h.prepare()
  const paragraph = h.readings[0].paragraphs[0]
  assert.notEqual(
    paragraph.childNodes[0],
    paragraph.originalNodes[0],
    'SplitText works only on clones',
  )
  h.observers[0].fire(paragraph)
  h.splits[0].resplit()
  assert.ok(
    h.splits[0].lines.every((line) => line.y === 0 && line.opacity === 1),
    'resize never re-hides already started text',
  )
  const rebuild = h.languageChange()
  assert.equal(
    paragraph.childNodes[0],
    paragraph.originalNodes[0],
    'Vue originals are restored before the next render tick',
  )
  await rebuild
  h.prepare()
  assert.ok(
    h.splits.slice(0, 6).every((split) => split.killed && split.reverted),
    'font and ResizeObserver listeners are released',
  )
  assert.equal(
    paragraph.childNodes[0],
    paragraph.originalNodes[0],
    'seen content remains unsplit after language changes',
  )
  h.unmount()
})

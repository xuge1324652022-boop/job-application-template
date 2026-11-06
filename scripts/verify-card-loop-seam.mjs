import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const mql = { matches: false, addEventListener() {}, removeEventListener() {} }

function makeStyle() {
  const store = {}
  return new Proxy(store, {
    has: () => true,
    get: (t, p) => {
      if (p === 'removeAttribute' || p === 'removeProperty') return () => {}
      if (p === 'setProperty') return (k, v) => { t[k] = v }
      if (p === 'getPropertyValue') return (k) => t[k] || ''
      return p in t ? t[p] : ''
    },
    set: (t, p, v) => { t[p] = v; return true },
  })
}

function makeEl(tag) {
  return {
    tag,
    tagName: String(tag).toUpperCase(),
    nodeType: 1,
    style: makeStyle(),
    setAttribute() {},
    getAttribute() { return null },
    getBoundingClientRect() { return { width: 300, height: 400, top: 0, left: 0 } },
    scrollWidth: 320,
    offsetWidth: 300,
    offsetHeight: 400,
    clientWidth: 300,
    clientHeight: 400,
    appendChild() {},
    removeChild() {},
    insertBefore() {},
    contains() { return false },
  }
}

function computedOf(el) {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'transform') return el.style.transform || 'none'
        if (prop === 'display') return 'block'
        if (prop === 'opacity') return el.style.opacity || '1'
        if (prop === 'getPropertyValue') return () => ''
        return ''
      },
    },
  )
}

globalThis.window = {
  matchMedia: () => mql,
  innerWidth: 1440,
  innerHeight: 900,
  addEventListener() {},
  removeEventListener() {},
}
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
  createElement: () => makeEl('div'),
  createElementNS: () => makeEl('svg'),
  documentElement: makeEl('html'),
  body: makeEl('body'),
  querySelector: () => null,
  querySelectorAll: () => [],
}
globalThis.window.document = globalThis.document
globalThis.getComputedStyle = computedOf
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const gsap = (await import('gsap')).default

function parseTransform(el) {
  const s = el.style.transform || ''
  const out = { x: 0, y: 0, z: 0, scaleX: 1, scaleY: 1, rotation: 0, rotateX: 0, rotateY: 0 }
  const grab = (name) => {
    const m = new RegExp(`${name}\\(([^)]*)\\)`).exec(s)
    return m ? m[1].split(',').map((v) => parseFloat(v)) : null
  }
  const t3 = grab('translate3d') || grab('translate')
  if (t3) {
    out.x = t3[0] || 0
    out.y = t3[1] || 0
    out.z = t3[2] || 0
  }
  const sc = grab('scale')
  if (sc) {
    out.scaleX = sc[0]
    out.scaleY = sc.length > 1 ? sc[1] : sc[0]
  }
  const sx = grab('scaleX')
  if (sx) out.scaleX = sx[0]
  const sy = grab('scaleY')
  if (sy) out.scaleY = sy[0]
  const rot = grab('rotate')
  if (rot) out.rotation = rot[0]
  const rx = grab('rotateX')
  if (rx) out.rotateX = rx[0]
  const ry = grab('rotateY')
  if (ry) out.rotateY = ry[0]
  return out
}

const COUNTS = {
  '.cv-news__matrix-cell': 16,
  '.cv-news__quad': 4,
  '.cv-news__char': 4,
  '.quad-stream': 4,
  '.cv-color__strip-bar': 10,
  '.cv-poster__p-char': 6,
  '.about-exp__char': 5,
  '.q-bar': 3,
  '.about-exp__role': 3,
  '.aperture-blade': 7,
  '.cv-photo__letter': 5,
}

function makeHost() {
  const single = new Map()
  const lists = new Map()
  const host = makeEl('host')
  host.querySelector = (sel) => {
    if (!single.has(sel)) single.set(sel, makeEl(sel))
    return single.get(sel)
  }
  host.querySelectorAll = (sel) => {
    if (!lists.has(sel)) {
      const n = COUNTS[sel] ?? 1
      lists.set(sel, Array.from({ length: n }, () => makeEl(sel)))
    }
    return lists.get(sel)
  }
  host._all = () => [...single.entries(), ...lists.entries()]
  return host
}

function snapshot(host) {
  const out = new Map()
  for (const [sel, val] of host._all()) {
    const els = Array.isArray(val) ? val : [val]
    els.forEach((el, i) => {
      const t = parseTransform(el)
      out.set(`${sel}#${i}`, {
        opacity: parseFloat(el.style.opacity ?? '1'),
        clipPath: el.style.clipPath || '',
        ...t,
      })
    })
  }
  return out
}

const round = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : v)

function diff(a, b) {
  const rows = []
  for (const [key, ra] of a) {
    const rb = b.get(key)
    if (!rb) continue
    for (const p of Object.keys(ra)) {
      const va = ra[p]
      const vb = rb[p]
      let delta
      if (typeof va === 'number' && typeof vb === 'number') delta = Math.abs(va - vb)
      else delta = va === vb ? 0 : Infinity
      const th = p === 'opacity' ? 0.05 : typeof va === 'number' ? 2 : 0
      if (delta > th) rows.push({ key, prop: p, from: round(va), to: round(vb), op0: ra.opacity, op1: rb.opacity })
    }
  }
  return rows
}

const compile = (code) => ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText

const baseCode = fs.readFileSync('src/cardAnimations/base.ts', 'utf8')
const baseExports = {}
vm.runInNewContext(compile(baseCode), {
  exports: baseExports,
  require: (id) => {
    if (String(id).includes('motion')) return { prefersReduced: () => false, motionScrollBehavior: () => 'smooth' }
    return { __esModule: true, default: gsap }
  },
  window: globalThis.window,
  document: globalThis.document,
  getComputedStyle: globalThis.getComputedStyle,
})

const BaseAnimation = baseExports.BaseAnimation
const CARDS = ['about', 'edit', 'color', 'news', 'poster', 'photo']

for (const name of CARDS) {
  const code = fs.readFileSync(`src/cardAnimations/${name}.ts`, 'utf8')
  const cardExports = {}
  vm.runInNewContext(compile(code), {
    exports: cardExports,
    require: (id) => {
      if (String(id).includes('base')) return { BaseAnimation }
      if (String(id).includes('motion')) return { prefersReduced: () => false }
      return { __esModule: true, default: gsap }
    },
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
    ResizeObserver: globalThis.ResizeObserver,
  })

  const Cls = Object.values(cardExports).find((v) => typeof v === 'function' && v.prototype instanceof BaseAnimation)
  assert.ok(Cls, `找不到卡片类：${name}`)

  const anim = new Cls()
  const host = makeHost()
  anim.mount(host)
  const tl = anim.tl
  assert.ok(tl, `时间线未构建：${name}`)

  const dur = tl.duration()
  assert.ok(dur < 10, `【${name}】主时间线时长异常，疑似混入 repeat: -1 (duration=${dur})`)
  assert.ok(Math.abs(dur - 6.0) < 0.05, `【${name}】主时间线周期未统一到 6.0s (当前 ${dur.toFixed(2)}s)`)

  const HOLD_WINDOWS = {
    about: 5.3 - 4.0,   // 1.30s
    edit: 5.2 - 4.0,    // 1.20s
    color: 5.45 - 3.82, // 1.63s
    news: 5.2 - 3.7,    // 1.50s
    poster: 5.2 - 4.0,  // 1.20s
    photo: 5.4 - 4.2,   // 1.20s
  }
  const holdWin = HOLD_WINDOWS[name]
  assert.ok(holdWin >= 1.20, `【${name}】定格窗口不足 1.2s：${holdWin}s`)

  const hold = anim.holdTime?.() ?? -1
  assert.ok(hold > 0 && hold < dur, `【${name}】holdTime 非法: ${hold}`)

  // 首尾同构与接缝断言
  tl.pause(0)
  const f0 = snapshot(host)
  tl.pause(dur - 0.0001)
  const fEnd = snapshot(host)

  const seamDiff = diff(f0, fEnd)
  const visibleDiff = seamDiff.filter((d) => Math.max(d.op0 ?? 0, d.op1 ?? 0) > 0.15)
  assert.equal(
    visibleDiff.length,
    0,
    `【${name}】存在两端可见跳变 ${visibleDiff.length} 处：${JSON.stringify(visibleDiff.slice(0, 3))}`,
  )

  anim.destroy()
}

console.log('PASS: 6张卡片循环周期(6.0s)、接缝连续性(0可见跳变)与时间线有限时长全部达标')

gsap.ticker.sleep()

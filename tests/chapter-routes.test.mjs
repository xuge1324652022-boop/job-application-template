import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const metadata = JSON.parse(fs.readFileSync('src/data/routeMetadata.json', 'utf8'))
const load = (file, require, globals = {}) => {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  vm.runInNewContext(code, { exports, require, ...globals })
  return exports
}
const routes = load('src/router/chapterRoutes.ts', () => ({ default: metadata }))

test('client jumps match static legacy redirects and keep unknown-card fallback behavior', () => {
  const expected = ['/about', '/edit', '/color', '/news', '/poster', '/photo']
  expected.forEach((path, index) => {
    const id = String(index + 1).padStart(2, '0')
    assert.equal(routes.jumpPathFor(id), path)
    assert.equal(metadata.legacyPaths[`/card/${id}`], path)
    assert.ok(metadata.routes.some((route) => route.path === path))
    assert.equal(routes.isChapterPath(path), true)
  })
  for (const id of ['00', '07', '99', 'toString', '__proto__'])
    assert.equal(routes.jumpPathFor(id), `/card/${id}`)
  for (const path of ['/', '/cards', '/morph', '/about/', '/aboutish', '/unknown'])
    assert.equal(routes.isChapterPath(path), false)
})

test('initial curtains retain descendant and old-link semantics without covering the gallery or morph demo', () => {
  for (const path of [
    '/about',
    '/color/',
    '/photo/section',
    '/cards',
    '/cards/',
    '/card/01',
    '/card/99',
  ])
    assert.equal(routes.needsInitialCurtain(path), true, path)
  for (const path of ['/', '/morph', '/aboutish', '/card', '/cards-extra', '/unknown'])
    assert.equal(routes.needsInitialCurtain(path), false, path)
})

test('legacy curtain titles and transition compatibility exports use the shared chapter mapping', () => {
  const require = (name) => (name === 'vue' ? { ref: (value) => ({ value }) } : routes)
  const curtain = load('src/composables/usePageCurtain.ts', require, {
    window: { location: { pathname: '/about' } },
  })
  const transition = load('src/composables/useTransition.ts', require)
  assert.equal(transition.jumpPathFor, routes.jumpPathFor)
  for (let index = 1; index <= 6; index++) {
    const id = `0${index}`
    assert.equal(
      curtain.curtainTitleFor(`/card/${id}`).zh,
      curtain.curtainTitleFor(routes.jumpPathFor(id)).zh,
    )
  }
  assert.equal(curtain.routeCurtainActive.value, true)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'

const script = parse(fs.readFileSync('src/components/SubpageIndex.vue', 'utf8')).descriptor
  .scriptSetup.content
const ast = ts.createSourceFile('index.ts', script, ts.ScriptTarget.Latest, true)
const show = ast.statements
  .find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'show')
  .getText(ast)
const code = ts.transpileModule(show, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText

test('index respects semantic modal and route locks without mistaking ordinary intro content for an overlay', async () => {
  for (const blocked of ['modal', 'route', 'viewer-scroll', 'none']) {
    const background = { inert: false },
      classes = new Set()
    const context = {
      open: { value: false },
      closing: false,
      destroyed: false,
      idleTimer: 0,
      background: null,
      hadInert: false,
      routeCurtainActive: { value: blocked === 'route' },
      window: { clearTimeout() {} },
      nextTick: () => Promise.resolve(),
      focusPanel() {},
      document: {
        documentElement: {
          classList: {
            contains: () => blocked === 'viewer-scroll',
            add: (name) => classes.add(name),
          },
        },
        querySelector(selector) {
          assert.equal(selector, '[aria-modal="true"]')
          return blocked === 'modal' ? {} : null
        },
        getElementById: () => background,
      },
    }
    vm.createContext(context)
    vm.runInContext(code, context)
    await context.show()
    assert.equal(context.open.value, blocked === 'none', blocked)
    assert.equal(background.inert, blocked === 'none', blocked)
    assert.equal(classes.has('has-subpage-index'), blocked === 'none', blocked)
  }
})

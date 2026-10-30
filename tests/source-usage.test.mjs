import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { auditSourceUsage } from '../scripts/audit-source-usage.mjs'

function fixture(t, files) {
  const directory = mkdtempSync(path.join(tmpdir(), 'portfolio-source-audit-'))
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(tmpdir()))
    assert.ok(path.basename(directory).startsWith('portfolio-source-audit-'))
    rmSync(directory, { recursive: true, force: true })
  })
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(directory, name)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return directory
}

test('source audit follows lazy Vue imports and styles but detects unreachable cycles', (t) => {
  const root = fixture(t, {
    'src/main.ts': "import('./Lazy.vue')",
    'src/Lazy.vue':
      '<script setup lang="ts">import { value } from "./shared"</script><template>{{value}}</template><style src="./theme.css"/>',
    'src/shared.ts': 'export const value = 1',
    'src/theme.css': '@import "./tokens.css";',
    'src/tokens.css': ':root { color: black; }',
    'src/ghost.ts': "import './ghost-peer'",
    'src/ghost-peer.ts': "import './ghost'",
    'src/types.d.ts': 'declare const fixture: string',
  })
  assert.deepEqual(auditSourceUsage(root), {
    scanned: 8,
    appReachable: [
      'src/Lazy.vue',
      'src/main.ts',
      'src/shared.ts',
      'src/theme.css',
      'src/tokens.css',
    ],
    libraryOnly: [],
    validationOnly: [],
    ambientOnly: ['src/types.d.ts'],
    unreferenced: ['src/ghost-peer.ts', 'src/ghost.ts'],
    unused: ['src/ghost-peer.ts', 'src/ghost.ts'],
    unsupported: [],
    unresolved: [],
  })
})

test('source audit separates library entries, integrations and validation-only dependencies', (t) => {
  const root = fixture(t, {
    'src/main.ts': "import './app-shared'",
    'src/app-shared.ts': 'export const shared = 0',
    'src/library.ts': "export { value } from './shared'",
    'src/shared.ts': 'export const value = 1',
    'src/library-example.ts': "import './library'; import './app-shared'",
    'src/script-target.ts': "import './validation-dependency'; import './library'",
    'src/validation-dependency.ts': 'export const target = 2',
    'src/not-an-entry.ts': 'export const unused = 3',
    '动效组件库/效果定义/example.json': JSON.stringify({
      entryFiles: ['src/library.ts'],
      integrationFiles: ['src/library-example.ts'],
      agentNotes: ['Do not use src/not-an-entry.ts'],
    }),
    'tests/check.mjs': "readFileSync('src/script-target.ts')",
  })
  const result = auditSourceUsage(root)
  assert.deepEqual(result.appReachable, ['src/app-shared.ts', 'src/main.ts'])
  assert.deepEqual(result.libraryOnly, [
    'src/library-example.ts',
    'src/library.ts',
    'src/shared.ts',
  ])
  assert.deepEqual(result.validationOnly, ['src/script-target.ts', 'src/validation-dependency.ts'])
  assert.deepEqual(result.unreferenced, ['src/not-an-entry.ts'])
  assert.deepEqual(result.unused, result.unreferenced)
})

test('HTML application entries and source-reading build scripts retain separate roots', (t) => {
  const root = fixture(t, {
    'src/main.ts': '',
    'index.html': '<script type="module" src="/src/second-entry.ts"></script>',
    'src/second-entry.ts': "import './app-dependency'",
    'src/app-dependency.ts': 'export const app = 1',
    'src/build-only.ts': 'export const value = 2',
    'scripts/build.mjs': "readFileSync('src/build-only.ts')",
  })
  const result = auditSourceUsage(root)
  assert.deepEqual(result.appReachable, [
    'src/app-dependency.ts',
    'src/main.ts',
    'src/second-entry.ts',
  ])
  assert.deepEqual(result.validationOnly, ['src/build-only.ts'])
  assert.deepEqual(result.unused, [])
})

test('source audit reports unknown dynamic edges and missing imports instead of approving cleanup', (t) => {
  const root = fixture(t, {
    'src/main.ts':
      "import './missing'; import(name); import.meta.glob('./*.vue'); import x from '@/alias'",
  })
  const result = auditSourceUsage(root)
  assert.equal(result.unsupported.length, 3)
  assert.deepEqual(result.unresolved, ['src/main.ts: ./missing'])
})

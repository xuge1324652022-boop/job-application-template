import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { assertTemplateArtifact, assertTemplateWorkspace } from '../scripts/workspace-edition.mjs'
import { assetHash, deploy, prepare, validate } from '../scripts/cloudflare-ci.mjs'
import {
  manifest as legacyManifest,
  prepare as legacyPrepare,
  upload as legacyUpload,
} from '../scripts/cloudflare-assets.mjs'

function fixture(t) {
  const temporary = resolve(tmpdir())
  const root = mkdtempSync(join(temporary, 'workspace-edition-test-'))
  t.after(() => {
    assert.equal(dirname(resolve(root)), temporary)
    assert.ok(basename(root).startsWith('workspace-edition-test-'))
    rmSync(root, { recursive: true, force: true })
  })
  const put = (name, bytes) => {
    const target = join(root, name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, bytes)
    return target
  }
  const json = (name, value) => put(name, JSON.stringify(value))
  return { root, put, json }
}

function publicFixture(t) {
  const f = fixture(t)
  const video = Buffer.from('generated fixture video')
  f.put('dist/index.html', '<!doctype html><title>Anonymous fixture</title>')
  f.put('public/color/sample.mp4', video)
  f.json('deploy/cloudflare-assets.json', {
    name: 'job-application-template',
    main_module: 'media-range.mjs',
    assets: { config: {} },
    bindings: [{ name: 'ASSETS', type: 'assets' }],
  })
  f.put('deploy/media-range.mjs', 'export default {}')
  f.json('deploy/media-manifest.json', {
    '/color/sample.mp4': { hash: assetHash(video, '/color/sample.mp4'), size: video.length },
  })
  f.json('public/模板素材清单.json', {
    files: [
      { path: 'public/color/sample.mp4', sha256: createHash('sha256').update(video).digest('hex') },
    ],
  })
  f.json('发布配置/公开第三方素材.json', { files: [] })
  return f
}

test('workspace edition checks the supplied project root without inheriting the caller edition', (t) => {
  const personal = fixture(t)
  const preview = fixture(t)
  personal.json('.workspace-edition.json', {
    edition: 'personal',
    publicPreviewDirectory: '../fixture-github-preview',
  })
  assert.throws(
    () => assertTemplateWorkspace(personal.root),
    (error) =>
      /完整个人项目/u.test(error.message) && error.message.includes('fixture-github-preview'),
  )
  assert.doesNotThrow(() => assertTemplateWorkspace(preview.root))
  preview.json('.workspace-edition.json', { edition: 'template' })
  assert.doesNotThrow(() => assertTemplateWorkspace(preview.root))
  preview.put('.workspace-edition.json', '{ malformed fixture')
  assert.throws(() => assertTemplateWorkspace(preview.root), /版本标记无效/u)
})

test('all template preparation and upload entry points reject personal workspaces first', async (t) => {
  const f = fixture(t)
  f.json('.workspace-edition.json', { edition: 'personal' })
  const output = join(f.root, 'tmp/cloudflare-ci/blocked')
  const noNetwork = () => {
    assert.fail('personal workspace must not reach network')
  }
  const blocked = /完整个人项目.*独立预览项目/u
  await assert.rejects(prepare({ projectRoot: f.root, outputRoot: output }), blocked)
  await assert.rejects(validate({ projectRoot: f.root, outputRoot: output }), blocked)
  await assert.rejects(deploy({ projectRoot: f.root, env: {}, fetchImpl: noNetwork }), blocked)
  await assert.rejects(legacyPrepare(output, f.root), blocked)
  await assert.rejects(legacyManifest(output, f.root), blocked)
  await assert.rejects(legacyUpload(output, { projectRoot: f.root, fetchImpl: noNetwork }), blocked)
  assert.equal(existsSync(output), false)
})

test('personal build signatures are rejected independent of workspace markers', () => {
  for (const markup of [
    '<script id="personal-portfolio" type="application/json">{}</script>',
    "<script id = 'personal-portfolio'>{}</script>",
    '<script id=personal-portfolio>{}</script>',
  ]) {
    assert.throws(
      () => assertTemplateArtifact('/about/index.html', Buffer.from(markup)),
      /个人内容/u,
    )
  }
  for (const path of [
    '/personal/image.webp',
    'personal/resume.pdf',
    '/personal-color-frames/a.jpg',
  ])
    assert.throws(() => assertTemplateArtifact(path, Buffer.from('fixture')), /个人站点素材/u)
  assert.doesNotThrow(() =>
    assertTemplateArtifact('/index.html', Buffer.from('<script id="other-fixture">{}</script>')),
  )
  assert.doesNotThrow(() =>
    assertTemplateArtifact('/portfolio/sample.webp', Buffer.from('fixture')),
  )
})

test('both preparation paths reject copied personal builds before writing snapshots', async (t) => {
  for (const [name, bytes] of [
    ['index.html', '<script id="personal-portfolio">{}</script>'],
    ['personal/portrait.webp', 'fixture portrait'],
    ['personal-color-frames/frame-07.jpg', 'fixture frame'],
  ]) {
    const f = publicFixture(t)
    f.put(`dist/${name}`, bytes)
    const ci = join(f.root, 'tmp/cloudflare-ci/copied-personal')
    const legacy = join(f.root, 'legacy-prepared')
    await assert.rejects(prepare({ projectRoot: f.root, outputRoot: ci }), /模板发布拒绝/u)
    await assert.rejects(legacyPrepare(legacy, f.root), /模板发布拒绝/u)
    assert.equal(existsSync(ci), false)
    assert.equal(existsSync(legacy), false)
  }
})

test('unmarked anonymous fixture projects retain both preparation paths', async (t) => {
  const f = publicFixture(t)
  const ci = join(f.root, 'tmp/cloudflare-ci/anonymous')
  const legacy = join(f.root, 'legacy-prepared')
  await prepare({ projectRoot: f.root, outputRoot: ci })
  await validate({ projectRoot: f.root, outputRoot: ci })
  await legacyPrepare(legacy, f.root)
  assert.equal(existsSync(join(ci, 'site/index.html')), true)
  assert.equal(existsSync(join(legacy, 'site/index.html')), true)
})

test('the demo preparation CLI rejects a personal project before creating its output', (t) => {
  const f = fixture(t)
  f.json('.workspace-edition.json', {
    edition: 'personal',
    publicPreviewDirectory: '../fixture-github-preview',
  })
  f.put(
    'scripts/准备模板演示站.mjs',
    readFileSync(new URL('../scripts/准备模板演示站.mjs', import.meta.url)),
  )
  f.put(
    'scripts/workspace-edition.mjs',
    readFileSync(new URL('../scripts/workspace-edition.mjs', import.meta.url)),
  )
  f.put('scripts/route-pages.mjs', 'export const siteOrigin = (value) => value')
  const child = spawnSync(process.execPath, [join(f.root, 'scripts/准备模板演示站.mjs')], {
    encoding: 'utf8',
    windowsHide: true,
  })
  assert.notEqual(child.status, 0)
  assert.match(child.stderr, /完整个人项目/u)
  assert.match(child.stderr, /fixture-github-preview/u)
  assert.equal(existsSync(join(f.root, 'tmp')), false)
})

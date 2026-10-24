import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { Writable } from 'node:stream'
import { personalPortfolio } from '../scripts/personal-portfolio.mjs'

const directory = '本机私有资料/个人网站'
const fixture = (t, { createDirectory = true } = {}) => {
  const temporary = resolve(tmpdir())
  const root = mkdtempSync(join(temporary, 'personal-portfolio-test-'))
  t.after(() => {
    // Verify the resolved, explicitly created temporary target before deletion.
    assert.equal(dirname(resolve(root)), temporary)
    assert.ok(basename(root).startsWith('personal-portfolio-test-'))
    rmSync(root, { recursive: true, force: true })
  })
  const put = (file, value) => {
    const target = join(root, file)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, value)
    return target
  }
  if (createDirectory) mkdirSync(join(root, directory), { recursive: true })
  const manifest = (content) => put(`${directory}/content.json`, JSON.stringify(content))
  const plugin = personalPortfolio(root)
  return { root, put, manifest, plugin }
}
const selected = (file = 'selected.webp') => `${directory}/assets/${file}`
const enabled = (assets) => ({ enabled: true, profile: { heading: 'Synthetic fixture' }, assets })
const build = (plugin) => {
  const emitted = []
  plugin.generateBundle.call({ emitFile: (asset) => emitted.push(asset) })
  return emitted
}
class Response extends Writable {
  constructor() {
    super()
    this.statusCode = 200
    this.headers = {}
    this.chunks = []
  }
  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.from(chunk))
    callback()
  }
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value
  }
}
const request = async (plugin, url, { method = 'GET', headers = {}, preview = false } = {}) => {
  let middleware
  plugin[preview ? 'configurePreviewServer' : 'configureServer']({
    middlewares: {
      use: (handler) => {
        middleware = handler
      },
    },
  })
  const response = new Response()
  let next = false
  const finished = new Promise((resolve, reject) => {
    response.once('finish', resolve)
    response.once('error', reject)
  })
  middleware({ url, method, headers }, response, () => {
    next = true
    response.end()
  })
  await finished
  return {
    status: response.statusCode,
    headers: response.headers,
    body: Buffer.concat(response.chunks),
    next,
  }
}

test('no local pack or a disabled pack leaves template HTML, build and requests unchanged', async (t) => {
  const f = fixture(t)
  assert.equal(f.plugin.transformIndexHtml.handler(), undefined)
  assert.deepEqual(build(f.plugin), [])
  assert.equal((await request(f.plugin, '/personal/selected.webp')).status, 404)
  f.manifest({
    enabled: false,
    assets: { 'selected.webp': 'outside.webp' },
    profile: { heading: 'Disabled fixture' },
  })
  assert.equal(f.plugin.transformIndexHtml.handler(), undefined)
  assert.deepEqual(build(f.plugin), [])
  assert.equal((await request(f.plugin, '/personal/selected.webp')).status, 404)
})

test('the JSON script escapes HTML boundaries and excludes local mapping or extra fields', (t) => {
  const f = fixture(t)
  const heading = '</script><script>fixture()</script>&\u2028\u2029'
  f.manifest({ ...enabled({}), profile: { heading }, internalNotes: 'not a browser field' })
  const [tag] = f.plugin.transformIndexHtml.handler()
  assert.equal(tag.tag, 'script')
  assert.deepEqual(tag.attrs, { id: 'personal-portfolio', type: 'application/json' })
  assert.ok(!/[<>&\u2028\u2029]/u.test(tag.children))
  assert.deepEqual(JSON.parse(tag.children), { profile: { heading } })
  assert.equal(Object.hasOwn(JSON.parse(tag.children), 'assets'), false)
  assert.equal(Object.hasOwn(JSON.parse(tag.children), 'enabled'), false)
})

test('a build emits only explicitly selected bytes and no directory-wide files', (t) => {
  const f = fixture(t)
  f.put(selected(), Buffer.from('synthetic image fixture'))
  f.put(selected('resume.pdf'), Buffer.from('synthetic PDF fixture'))
  f.put(selected('unselected.webp'), Buffer.from('not selected'))
  f.put(`${directory}/notes.json`, '{}')
  f.manifest(enabled({ 'selected.webp': selected(), 'resume.pdf': selected('resume.pdf') }))
  const emitted = build(f.plugin)
  assert.deepEqual(
    emitted.map((item) => item.fileName),
    ['personal/selected.webp', 'personal/resume.pdf'],
  )
  for (const item of emitted) {
    assert.equal(item.type, 'asset')
    assert.deepEqual(
      item.source,
      readFileSync(join(f.root, directory, 'assets', basename(item.fileName))),
    )
  }
})

test('dev and preview share explicit selection, HEAD and range responses', async (t) => {
  const f = fixture(t)
  f.put(selected(), 'fixture-image')
  f.put(selected('unselected.webp'), 'not selected')
  f.manifest(enabled({ 'selected.webp': selected() }))
  for (const preview of [false, true]) {
    const image = await request(f.plugin, '/personal/selected.webp?v=fixture', { preview })
    assert.equal(image.status, 200)
    assert.equal(image.body.toString(), 'fixture-image')
    assert.equal(image.headers['content-type'], 'image/webp')
    assert.equal(image.headers['x-content-type-options'], 'nosniff')
    const head = await request(f.plugin, '/personal/selected.webp', { method: 'HEAD', preview })
    assert.equal(head.status, 200)
    assert.equal(head.body.length, 0)
    assert.equal(head.headers['content-length'], 13)
    const range = await request(f.plugin, '/personal/selected.webp', {
      headers: { range: 'bytes=0-2' },
      preview,
    })
    assert.equal(range.status, 206)
    assert.equal(range.body.toString(), 'fix')
    assert.equal((await request(f.plugin, '/personal/unselected.webp', { preview })).status, 404)
  }
})

test('malformed encoding and encoded path separators do not escape the media namespace', async (t) => {
  const f = fixture(t)
  f.put(selected(), 'fixture-image')
  f.manifest(enabled({ 'selected.webp': selected() }))
  assert.equal((await request(f.plugin, '/personal/%E0%A4')).status, 400)
  for (const name of [
    '..%2Fselected.webp',
    '..%5Cselected.webp',
    'assets%2Fselected.webp',
    '%2E%2E',
    'constructor',
  ]) {
    assert.equal((await request(f.plugin, `/personal/${name}`)).status, 404)
  }
  assert.equal((await request(f.plugin, '/personal/selected.webp', { method: 'POST' })).status, 405)
  assert.equal((await request(f.plugin, '/other/selected.webp')).next, true)
})

test('outside paths, absolute paths and renamed non-media files fail before any build emission', async (t) => {
  const f = fixture(t)
  const outside = f.put('outside.webp', 'outside the content directory')
  f.put(selected(), 'fixture-image')
  f.put(`${directory}/notes.txt`, 'not media')
  for (const invalid of [
    'outside.webp',
    outside,
    `${directory}/../outside.webp`,
    `${directory}/notes.txt`,
  ]) {
    f.manifest(enabled({ 'selected.webp': selected(), 'invalid.webp': invalid }))
    const emitted = []
    assert.throws(
      () => f.plugin.generateBundle.call({ emitFile: (item) => emitted.push(item) }),
      /个人展示素材/u,
    )
    assert.deepEqual(emitted, [])
    assert.equal((await request(f.plugin, '/personal/invalid.webp')).status, 404)
  }
})

test('unsafe output names, unknown media formats and missing selected files are rejected', async (t) => {
  const f = fixture(t)
  f.put(selected(), 'fixture-image')
  for (const [name, file] of [
    ['../selected.webp', selected()],
    ['nested/selected.webp', selected()],
    ['notes.json', selected()],
    ['missing.webp', selected('missing.webp')],
  ]) {
    f.manifest(enabled({ [name]: file }))
    assert.throws(() => build(f.plugin), /个人展示素材/u)
  }
  f.manifest(enabled({ 'missing.webp': selected('missing.webp') }))
  assert.equal((await request(f.plugin, '/personal/missing.webp')).status, 404)
})

test('an asset junction cannot include files outside the real content directory', async (t) => {
  const f = fixture(t)
  f.put('outside/selected.webp', 'outside fixture')
  mkdirSync(join(f.root, directory, 'assets'), { recursive: true })
  symlinkSync(join(f.root, 'outside'), join(f.root, directory, 'assets', 'linked'), 'junction')
  f.manifest(enabled({ 'selected.webp': `${directory}/assets/linked/selected.webp` }))
  assert.throws(() => build(f.plugin), /个人展示素材/u)
  assert.equal((await request(f.plugin, '/personal/selected.webp')).status, 404)
})

test('the fixed content directory cannot itself redirect into another directory', async (t) => {
  const f = fixture(t, { createDirectory: false })
  f.put('outside-content/assets/selected.webp', 'outside fixture')
  f.put(
    'outside-content/content.json',
    JSON.stringify(enabled({ 'selected.webp': 'outside-content/assets/selected.webp' })),
  )
  mkdirSync(join(f.root, '本机私有资料'), { recursive: true })
  symlinkSync(join(f.root, 'outside-content'), join(f.root, directory), 'junction')
  assert.throws(() => f.plugin.transformIndexHtml.handler(), /本机个人内容包无效/u)
  assert.equal((await request(f.plugin, '/personal/selected.webp')).status, 500)
})

test('invalid content returns a fixed error without echoing JSON data', async (t) => {
  const f = fixture(t)
  const marker = 'fixture-parser-value'
  f.put(`${directory}/content.json`, `{ ${marker}`)
  assert.throws(
    () => f.plugin.transformIndexHtml.handler(),
    (error) => /本机个人内容包无效/u.test(error.message) && !error.message.includes(marker),
  )
  const response = await request(f.plugin, '/personal/selected.webp')
  assert.equal(response.status, 500)
  assert.equal(response.body.toString(), 'personal content unavailable')
  assert.equal((await request(f.plugin, '/unrelated')).next, true)
})

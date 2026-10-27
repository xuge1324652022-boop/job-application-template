import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
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

test('a required personal workspace cannot silently fall back to the template', async (t) => {
  const f = fixture(t)
  const required = personalPortfolio(f.root, { required: true })
  assert.throws(() => required.transformIndexHtml.handler(), /完整个人项目/u)
  assert.throws(() => build(required), /完整个人项目/u)
  assert.equal((await request(required, '/personal/selected.webp')).status, 500)
  for (const content of [{ enabled: false, assets: {} }, enabled({})]) {
    f.manifest(content)
    assert.throws(() => required.transformIndexHtml.handler(), /本机个人内容包无效/u)
  }
  f.manifest({ ...enabled({}), site: { visualPortfolio: {} } })
  assert.ok(required.transformIndexHtml.handler())
  assert.deepEqual(build(required), [])
})

test('an external archive is used only when explicitly selected, with relative and absolute roots', async (t) => {
  const project = fixture(t)
  const archive = fixture(t)
  archive.put(selected(), 'archive-image')
  archive.put(selected('unselected.webp'), 'not selected')
  archive.manifest(enabled({ 'selected.webp': selected() }))

  assert.equal(project.plugin.transformIndexHtml.handler(), undefined)
  assert.deepEqual(build(project.plugin), [])
  assert.equal((await request(project.plugin, '/personal/selected.webp')).status, 404)

  for (const sourceRoot of [archive.root, relative(project.root, archive.root)]) {
    const plugin = personalPortfolio(project.root, { sourceRoot })
    const [tag] = plugin.transformIndexHtml.handler()
    assert.deepEqual(JSON.parse(tag.children), { profile: { heading: 'Synthetic fixture' } })
    const emitted = build(plugin)
    assert.deepEqual(
      emitted.map((item) => item.fileName),
      ['personal/selected.webp'],
    )
    assert.equal(emitted[0].source.toString(), 'archive-image')
    for (const preview of [false, true]) {
      const image = await request(plugin, '/personal/selected.webp', { preview })
      assert.equal(image.status, 200)
      assert.equal(image.body.toString(), 'archive-image')
      assert.equal((await request(plugin, '/personal/unselected.webp', { preview })).status, 404)
    }
  }
})

test('an explicitly selected archive still rejects paths outside its content directory', async (t) => {
  const project = fixture(t)
  const archive = fixture(t)
  const outside = archive.put('outside.webp', 'outside the content directory')
  archive.put(selected(), 'archive-image')
  const plugin = personalPortfolio(project.root, { sourceRoot: archive.root })
  for (const invalid of ['outside.webp', outside, `${directory}/../outside.webp`]) {
    archive.manifest(enabled({ 'selected.webp': selected(), 'invalid.webp': invalid }))
    const emitted = []
    assert.throws(
      () => plugin.generateBundle.call({ emitFile: (item) => emitted.push(item) }),
      /个人展示素材/u,
    )
    assert.deepEqual(emitted, [])
    assert.equal((await request(plugin, '/personal/invalid.webp')).status, 404)
  }
})

test('an archive asset junction cannot expose files outside its content directory', async (t) => {
  const project = fixture(t)
  const archive = fixture(t)
  archive.put('outside/selected.webp', 'outside fixture')
  mkdirSync(join(archive.root, directory, 'assets'), { recursive: true })
  symlinkSync(
    join(archive.root, 'outside'),
    join(archive.root, directory, 'assets', 'linked'),
    'junction',
  )
  archive.manifest(enabled({ 'selected.webp': `${directory}/assets/linked/selected.webp` }))
  const plugin = personalPortfolio(project.root, { sourceRoot: archive.root })
  assert.throws(() => build(plugin), /个人展示素材/u)
  assert.equal((await request(plugin, '/personal/selected.webp')).status, 404)
})

test('an archive content root cannot redirect into another directory', async (t) => {
  const project = fixture(t)
  const archive = fixture(t, { createDirectory: false })
  archive.put('outside-content/assets/selected.webp', 'outside fixture')
  archive.put(
    'outside-content/content.json',
    JSON.stringify(enabled({ 'selected.webp': 'outside-content/assets/selected.webp' })),
  )
  mkdirSync(join(archive.root, '本机私有资料'), { recursive: true })
  symlinkSync(join(archive.root, 'outside-content'), join(archive.root, directory), 'junction')
  const plugin = personalPortfolio(project.root, { sourceRoot: archive.root })
  assert.throws(() => plugin.transformIndexHtml.handler(), /本机个人内容包无效/u)
  assert.throws(() => build(plugin), /本机个人内容包无效/u)
  assert.equal((await request(plugin, '/personal/selected.webp')).status, 500)
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

test('a complete personal site serves and builds only its registered archive assets', async (t) => {
  const f = fixture(t)
  const publicRoot = '本机私有资料/公开素材原件/public'
  const siteAssets = {
    '/portfolio/selected.webp': `${publicRoot}/portfolio/selected.webp`,
    '/internship-clean/selected.webp': `${publicRoot}/internship-clean/selected.webp`,
    '/color-previews/clip-1.mp4': `${publicRoot}/color-previews/clip-1.mp4`,
    '/about/portrait.webp': `${publicRoot}/about/portrait.webp`,
    '/color/调色 1.mp4': 'media/color/调色 1.mp4',
    '/personal-color-frames/frame-07.jpg':
      '本机私有资料/公开素材原件/src/assets/color-frames/frame-07.jpg',
    '/resume.pdf': `${publicRoot}/resume.pdf`,
  }
  const bytes = Buffer.from('registered site fixture')
  for (const file of Object.values(siteAssets)) f.put(file, bytes)
  f.put(`${publicRoot}/portfolio/unselected.webp`, 'not registered')
  const site = { photoPage: { HERO: { zh: 'Synthetic full-site fixture' } } }
  f.manifest({ ...enabled({}), site, siteAssets })
  const [tag] = f.plugin.transformIndexHtml.handler()
  const injected = JSON.parse(tag.children)
  assert.deepEqual(injected.site, site)
  assert.equal(Object.hasOwn(injected, 'siteAssets'), false)
  assert.equal(Object.hasOwn(injected, 'assets'), false)
  const emitted = build(f.plugin)
  assert.deepEqual(
    emitted.map((item) => item.fileName),
    Object.keys(siteAssets).map((url) => url.slice(1)),
  )
  for (const item of emitted) assert.deepEqual(item.source, bytes)
  for (const preview of [false, true]) {
    for (const url of Object.keys(siteAssets)) {
      const response = await request(f.plugin, encodeURI(url), { preview })
      assert.equal(response.status, 200)
      assert.deepEqual(response.body, bytes)
      assert.equal(response.next, false)
      assert.equal(response.headers['x-content-type-options'], 'nosniff')
    }
    const head = await request(f.plugin, '/color/%E8%B0%83%E8%89%B2%201.mp4?v=fixture', {
      method: 'HEAD',
      preview,
    })
    assert.equal(head.status, 200)
    assert.equal(head.body.length, 0)
    assert.equal(head.headers['content-length'], bytes.length)
    assert.equal(head.headers['content-type'], 'video/mp4')
    const range = await request(f.plugin, '/color/%E8%B0%83%E8%89%B2%201.mp4', {
      headers: { range: 'bytes=0-2' },
      preview,
    })
    assert.equal(range.status, 206)
    assert.equal(range.body.toString(), 'reg')
    const unregistered = await request(f.plugin, '/portfolio/unselected.webp', { preview })
    assert.equal(unregistered.status, 404)
    assert.equal(unregistered.next, false)
    assert.equal((await request(f.plugin, '/color/%E0%A4', { preview })).status, 400)
    assert.equal(
      (await request(f.plugin, '/portfolio/selected.webp', { method: 'POST' })).status,
      405,
    )
    assert.equal((await request(f.plugin, '/other/selected.webp', { preview })).next, true)
  }
  f.manifest(enabled({}))
  assert.equal((await request(f.plugin, '/portfolio/unselected.webp')).next, true)
})

test('invalid complete-site mappings fail before any personal or site asset is emitted', async (t) => {
  const f = fixture(t)
  const source = '本机私有资料/公开素材原件/public/portfolio/selected.webp'
  const absolute = f.put(source, 'registered image')
  f.put(selected(), 'personal image')
  f.put('outside.webp', 'outside archive area')
  const valid = { '/portfolio/selected.webp': source }
  for (const [url, file] of [
    ['/portfolio/invalid.webp', 'outside.webp'],
    ['/portfolio/invalid.webp', absolute],
    ['/portfolio/invalid.webp', `${source}/../selected.webp`],
    ['/portfolio/invalid.webp', 'C:\\outside.webp'],
    ['/portfolio/invalid.webp', source.replace('.webp', '.json')],
    ['/portfolio/invalid.jpg', source],
    ['/portfolio/../invalid.webp', source],
    ['/portfolio/nested/invalid.webp', source],
    ['/portfolio/invalid.webp?query=1', source],
    ['/portfolio/invalid.webp#fragment', source],
    ['/unknown/invalid.webp', source],
  ]) {
    f.manifest({
      ...enabled({ 'selected.webp': selected() }),
      siteAssets: { ...valid, [url]: file },
    })
    const emitted = []
    assert.throws(
      () => f.plugin.generateBundle.call({ emitFile: (asset) => emitted.push(asset) }),
      /完整个人站点素材/u,
    )
    assert.deepEqual(emitted, [])
  }
  f.manifest({ ...enabled({}), siteAssets: valid })
  for (const url of [
    '/portfolio/%2E%2E%2Fselected.webp',
    '/portfolio/%2E%2E%5Cselected.webp',
    '/portfolio/nested%2Fselected.webp',
    '/portfolio/%00selected.webp',
  ]) {
    const response = await request(f.plugin, url)
    assert.equal(response.status, 404)
    assert.equal(response.next, false)
  }
})

test('complete-site archive area roots cannot redirect to unrelated directories', async (t) => {
  for (const [area, url] of [
    ['本机私有资料/公开素材原件/public', '/portfolio/selected.webp'],
    ['本机私有资料/公开素材原件/src/assets/color-frames', '/personal-color-frames/selected.webp'],
    ['media/color', '/color/selected.webp'],
  ]) {
    const f = fixture(t)
    f.put('outside/selected.webp', 'outside selected media area')
    mkdirSync(dirname(join(f.root, area)), { recursive: true })
    symlinkSync(join(f.root, 'outside'), join(f.root, area), 'junction')
    f.manifest({ ...enabled({}), siteAssets: { [url]: `${area}/selected.webp` } })
    assert.throws(() => build(f.plugin), /完整个人站点素材/u)
    assert.equal((await request(f.plugin, url)).status, 404)
  }
})

test('a complete-site asset junction cannot escape an otherwise valid archive area', async (t) => {
  const f = fixture(t)
  const area = '本机私有资料/公开素材原件/public'
  f.put('outside/selected.webp', 'outside selected media area')
  mkdirSync(join(f.root, area), { recursive: true })
  symlinkSync(join(f.root, 'outside'), join(f.root, area, 'linked'), 'junction')
  f.manifest({
    ...enabled({}),
    siteAssets: { '/portfolio/selected.webp': `${area}/linked/selected.webp` },
  })
  assert.throws(() => build(f.plugin), /完整个人站点素材/u)
  assert.equal((await request(f.plugin, '/portfolio/selected.webp')).status, 404)
})

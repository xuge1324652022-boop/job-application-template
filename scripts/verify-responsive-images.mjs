import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const records = JSON.parse(
  await readFile(new URL('../src/data/imageVariants.json', import.meta.url), 'utf8'),
)
const source = await readFile(new URL('../src/utils/responsiveImage.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
})
const exports = {}
const personal = { personalPortfolio: null }
vm.runInNewContext(`(function (exports, require) { ${outputText}\n})`)(exports, (specifier) => {
  if (specifier === '../data/personalPortfolio') return personal
  assert.equal(specifier, '../data/imageVariants.json')
  return { default: records }
})
const { visualImageSources, viewerImageSizes } = exports
let groups = 0
for (const [file, size] of Object.entries(records)) {
  if (!file.endsWith('-1600.webp')) continue
  const item = {
    src: file,
    thumb: file.replace('-1600.', '-400.'),
    large: file.replace('-1600.', '-2560.'),
  }
  const candidates = visualImageSources(item)
    .split(', ')
    .map((entry) => entry.split(' '))
  const widths = candidates.map(([, descriptor]) => Number(descriptor.slice(0, -1)))
  assert.ok(widths.every((width, index) => width > 0 && (!index || width > widths[index - 1])))
  for (const [url, descriptor] of candidates) assert.equal(descriptor, `${records[url].width}w`)
  assert.ok(candidates.some(([url]) => url === file))
  assert.ok(size.width > 0 && size.height > 0)
  groups++
}
const portrait = {
  src: '/portfolio/sample-photo-02-1600.webp?v=portrait-v2',
  thumb: '/portfolio/sample-photo-02-400.webp?v=portrait-v2',
  large: '/portfolio/sample-photo-02-2560.webp?v=portrait-v2',
}
const portraitSources = visualImageSources(portrait)
assert.ok(
  portraitSources.includes('sample-photo-02-400.webp?v=portrait-v2 267w'),
  '竖图描述符必须使用真实宽度，保留缓存版本',
)
assert.ok(!portraitSources.includes(' 400w'), '不能将最长边误当作宽度')
assert.equal(visualImageSources(portrait), portraitSources, '重复渲染保持相同描述符')
portrait.thumb = portrait.thumb.replace('v=portrait-v2', 'v=portrait-v3')
assert.ok(
  visualImageSources(portrait).includes('400.webp?v=portrait-v3 267w'),
  '原对象更新 URL 后不能沿用旧缓存',
)
portrait.large = '/missing-after-update.webp'
assert.equal(visualImageSources(portrait), '', '更新为未登记素材后清除 srcset，保留原 src 降级')
assert.equal(
  visualImageSources({ src: '/missing.webp', thumb: '/missing.webp', large: '/missing.webp' }),
  '',
)
const portraitImage = visualImageSources({
  thumb: '/about/portrait-400.webp',
  src: '/about/portrait-900.webp',
  large: '/about/portrait-1448.webp',
})
assert.ok(
  portraitImage.includes('portrait-400.webp 400w') &&
    portraitImage.includes('portrait-900.webp 900w') &&
    portraitImage.includes('portrait-1448.webp 1448w'),
)
assert.notEqual(
  viewerImageSizes({ width: 1000, height: 2000 }),
  viewerImageSizes({ width: 2000, height: 1000 }),
  '查看器竖图必须受高度约束',
)
assert.equal(groups, Object.keys(records).filter((file) => file.endsWith('-1600.webp')).length)
assert.equal(
  Object.keys(records).filter(
    (file) => !file.startsWith('/personal/') && file.endsWith('-1600.webp'),
  ).length,
  47,
)
// The optional edition uses its own widths; incomplete metadata falls back to the bound src.
personal.personalPortfolio = {
  imageDimensions: {
    '/personal/test-400.webp': { width: 267, height: 400 },
    '/personal/test-1600.webp': { width: 1067, height: 1600 },
    '/personal/test-2560.webp': { width: 1707, height: 2560 },
  },
}
assert.equal(
  visualImageSources({
    thumb: '/personal/test-400.webp',
    src: '/personal/test-1600.webp',
    large: '/personal/test-2560.webp',
  }),
  '/personal/test-400.webp 267w, /personal/test-1600.webp 1067w, /personal/test-2560.webp 1707w',
)
assert.equal(
  visualImageSources({
    src: '/personal/unlisted.webp',
    thumb: '/personal/unlisted.webp',
    large: '/personal/unlisted.webp',
  }),
  '',
)
const invalid = {
  src: '/personal/invalid.webp',
  thumb: '/personal/invalid.webp',
  large: '/personal/invalid.webp',
}
for (const width of [0, -1, NaN, Infinity]) {
  personal.personalPortfolio = { imageDimensions: { [invalid.src]: { width, height: 100 } } }
  assert.equal(visualImageSources(invalid), '', '无效宽度不能进入 srcset')
}
personal.personalPortfolio = null
// The actual Vue server renderer must retain the subtree with an unregistered image.
const { createSSRApp, h } = await import('vue')
const { renderToString } = await import('@vue/server-renderer')
const missing = { src: '/missing.webp', thumb: '/missing-thumb.webp', large: '/missing-large.webp' }
const html = await renderToString(
  createSSRApp({
    render: () =>
      h('section', [
        h('img', { src: missing.src, srcset: visualImageSources(missing) }),
        h('p', 'content survives'),
      ]),
  }),
)
assert.ok(html.includes('src="/missing.webp"') && html.includes('content survives'))
console.log(`PASS：${groups}组真实尺寸、竖图、查询版本、未知图片与查看器比例回归；无浏览器依赖`)

/** 无浏览器的页面交付回归；--dist 同时核对实际构建产物。 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import {
  cloudflareRedirects,
  normalizeRoutePath,
  pageFileFor,
  renderRouteHtml,
  robotsFor,
  routeMetadata,
  sitemapFor,
  siteOrigin,
} from './route-pages.mjs'
import worker from '../deploy/media-range.mjs'

const template = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const config = JSON.parse(
  await readFile(new URL('../deploy/cloudflare-assets.json', import.meta.url), 'utf8'),
)
const nginx = await readFile(new URL('../deploy/nginx.conf', import.meta.url), 'utf8')
assert.equal(
  config.assets.config._redirects,
  cloudflareRedirects(),
  '部署路由规则必须与共享元数据一致',
)
assert.equal(
  config.assets.config.not_found_handling,
  'none',
  '不能开启所有坏链返回200的SPA fallback',
)
assert(nginx.includes('error_page 404 /not-found.html;'))
assert(!nginx.includes('try_files $uri $uri/ /index.html;'), 'Nginx不能把坏链伪装成首页')
const serverHeaders = nginx.slice(0, nginx.indexOf('location / {'))
assert(
  serverHeaders.includes('add_header Cache-Control "no-cache";'),
  '正式路由HTML必须继承服务器级no-cache',
)
assert.match(
  nginx,
  /location = \/color\/index\.html \{\s*try_files \$uri =404;\s*\}/u,
  '调色页物理HTML不能继承媒体长缓存',
)
assert.match(nginx, /location \^~ \/assets\/ \{[\s\S]*?public, immutable/u)
assert.match(
  nginx,
  /location = \/not-found\.html \{\s*add_header Cache-Control "no-store" always;/u,
)
const titles = new Set()
for (const page of routeMetadata.routes) {
  const html = renderRouteHtml(template, page.path, 'https://example.test')
  assert.match(html, /<meta name="description" content="[^"<>]+"/u)
  assert.match(html, /<meta property="og:image" content="https:\/\/example\.test\/[^"<>]+\.jpg"/u)
  assert(html.includes(`<link rel="canonical" href="https://example.test${page.path}"`))
  assert(html.includes(`<title>${page.title.zh}</title>`))
  assert.equal((html.match(/<title>/gu) || []).length, 1)
  titles.add(page.title.zh)
  assert(nginx.includes(pageFileFor(page.path)), `Nginx缺少页面HTML：${page.path}`)
  const withQuery = renderRouteHtml(
    template,
    `${page.path === '/' ? '' : page.path}/`,
    'https://example.test',
  )
  assert.equal(withQuery, html, '尾斜线必须沿用同一规范页面')
  const physicalPath = `/${pageFileFor(page.path)}`
  assert.equal(normalizeRoutePath(physicalPath), page.path)
  assert.equal(
    renderRouteHtml(template, physicalPath, 'https://example.test'),
    html,
    '物理HTML入口沿用正式页面head',
  )
}
assert.equal(titles.size, routeMetadata.routes.length)
assert.equal(normalizeRoutePath('/unknown/index.html'), '/unknown/index.html')
assert.throws(() => siteOrigin('https://example.test/nested'), /SITE_ORIGIN/u)
assert.throws(() => siteOrigin('https://user:password@example.test'), /SITE_ORIGIN/u)
assert.throws(() => siteOrigin('javascript:alert(1)'), /SITE_ORIGIN/u)
const notFound = renderRouteHtml(template, '/bad-link', 'https://example.test')
assert(notFound.includes('noindex, follow'))
assert(!notFound.includes('rel="canonical"'))
assert(!notFound.includes('property="og:url"'))

// Synthetic personal data only: static and runtime About heads must agree while
// every other route retains its template metadata, including physical entries.
const aboutMetadata = routeMetadata.routes.find((page) => page.path === '/about')
const personalProfile = {
  IDENTITY: { nameZh: '测试<&"人物', nameEn: 'Fixture <&" Candidate' },
  PROFILE_LINES: [
    { zh: '测试简介：图像、文字与交互。', en: 'Fixture profile: images, words and interaction.' },
    {
      zh: '保留 <标签> 与 "引号"，不执行脚本。',
      en: 'Keep <tags> and "quotes" as text & never execute scripts.',
    },
  ],
}
const personalHtml = (profile, attributes = 'id="personal-portfolio" type="application/json"') =>
  template.replace(
    '</head>',
    `<script ${attributes}>${JSON.stringify({ profile }).replace(/</gu, '\\u003c')}</script></head>`,
  )
const onlyHead = (html) =>
  html.match(/<!-- route-head:start -->[\s\S]*?<!-- route-head:end -->/u)[0]
const escapedHeadValue = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
const personalOutput = renderRouteHtml(
  personalHtml(personalProfile),
  '/about',
  'https://example.test',
)
const personalHead = onlyHead(personalOutput)
const personalTitle = aboutMetadata.title.zh.replaceAll(
  '示例求职者',
  personalProfile.IDENTITY.nameZh,
)
const personalDescription = personalProfile.PROFILE_LINES.map((line) => line.zh).join(' ')
assert(personalHead.includes(`<title>${escapedHeadValue(personalTitle)}</title>`))
assert(
  personalHead.includes(
    `<meta name="description" content="${escapedHeadValue(personalDescription)}"`,
  ),
)
assert(
  personalHead.includes(
    `<meta property="og:site_name" content="${escapedHeadValue(`${personalProfile.IDENTITY.nameZh}的作品集`)}"`,
  ),
)
assert(!personalHead.includes('<标签>') && !personalHead.includes('<script'))
assert.equal(
  renderRouteHtml(personalHtml(personalProfile), '/about/index.html', 'https://example.test'),
  personalOutput,
)
assert.equal(
  renderRouteHtml(personalHtml(personalProfile), '/about/', 'https://example.test'),
  personalOutput,
)
assert.equal(renderRouteHtml(personalOutput, '/about', 'https://example.test'), personalOutput)
for (const page of routeMetadata.routes.filter((page) => page.path !== '/about')) {
  assert.equal(
    onlyHead(renderRouteHtml(personalHtml(personalProfile), page.path, 'https://example.test')),
    onlyHead(renderRouteHtml(template, page.path, 'https://example.test')),
    `${page.path} must retain template metadata`,
  )
}
for (const html of [
  personalHtml({}, 'id="personal-portfolio" type="application/json"'),
  personalHtml(personalProfile, 'data-id="personal-portfolio" type="application/json"'),
  personalHtml(
    personalProfile,
    `data-note=' id="personal-portfolio" type="application/json" > ' type="text/javascript"`,
  ),
  personalHtml(personalProfile, 'id="personal-portfolio" type="text/javascript"'),
  template.replace(
    '</head>',
    '<script id="personal-portfolio" type="application/json">not-valid-json</script></head>',
  ),
])
  assert.equal(
    onlyHead(renderRouteHtml(html, '/about', 'https://example.test')),
    onlyHead(renderRouteHtml(template, '/about', 'https://example.test')),
    'missing or invalid injected data must use the template head',
  )

const runtimeSource = ts.transpileModule(
  await readFile(new URL('../src/composables/useRouteHead.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText
function runtimeHead(profile) {
  const nodes = []
  const createElement = (name) => ({
    nodeName: name,
    setAttribute(key, value) {
      this[key] = value
    },
    remove() {
      const index = nodes.indexOf(this)
      if (index >= 0) nodes.splice(index, 1)
    },
  })
  const canonical = createElement('link')
  Object.assign(canonical, { rel: 'canonical', href: 'https://example.test/about' })
  nodes.push(canonical)
  const document = {
    title: '',
    createElement,
    head: {
      append(node) {
        nodes.push(node)
      },
      querySelector(selector) {
        if (selector === 'link[rel="canonical"]')
          return nodes.find((node) => node.nodeName === 'link' && node.rel === 'canonical')
        const match = /^meta\[(name|property)="([^"]+)"\]$/u.exec(selector)
        return match
          ? nodes.find((node) => node.nodeName === 'meta' && node[match[1]] === match[2])
          : undefined
      },
    },
  }
  const exports = {}
  vm.runInNewContext(runtimeSource, {
    exports,
    URL,
    document,
    window: { location: { origin: 'https://example.test' } },
    require: (name) => {
      if (name === 'vue') return { watch() {} }
      if (name === '../data/routeMetadata.json') return { default: routeMetadata }
      if (name === './useSubpageLanguage') return { subpageLanguage: { value: 'zh' } }
      if (name === '../data/personalPortfolio')
        return { personalPortfolio: profile ? { profile } : null }
      throw new Error('Unexpected runtime head dependency')
    },
  })
  return {
    update: exports.updateRouteHead,
    document,
    meta: (attribute, key) => document.head.querySelector(`meta[${attribute}="${key}"]`)?.content,
  }
}
for (const profile of [personalProfile, null, {}]) {
  const runtime = runtimeHead(profile)
  for (const language of ['zh', 'en']) {
    for (const path of ['/about', '/about/index.html']) {
      runtime.update(path, language)
      const expectedTitle =
        profile === personalProfile
          ? aboutMetadata.title[language].replaceAll(
              language === 'zh' ? '示例求职者' : 'Example Candidate',
              profile.IDENTITY[language === 'zh' ? 'nameZh' : 'nameEn'],
            )
          : aboutMetadata.title[language]
      const expectedDescription =
        profile === personalProfile
          ? profile.PROFILE_LINES.map((line) => line[language]).join(' ')
          : aboutMetadata.description[language]
      const expectedSiteName =
        profile === personalProfile
          ? language === 'zh'
            ? `${profile.IDENTITY.nameZh}的作品集`
            : `${profile.IDENTITY.nameEn} · Portfolio`
          : routeMetadata.siteName[language]
      assert.equal(runtime.document.title, expectedTitle)
      assert.equal(runtime.meta('name', 'description'), expectedDescription)
      assert.equal(runtime.meta('property', 'og:title'), expectedTitle)
      assert.equal(runtime.meta('property', 'og:description'), expectedDescription)
      assert.equal(runtime.meta('property', 'og:site_name'), expectedSiteName)
      assert.equal(runtime.meta('property', 'og:url'), 'https://example.test/about')
    }
    for (const page of routeMetadata.routes.filter((page) => page.path !== '/about')) {
      runtime.update(page.path, language)
      assert.equal(runtime.document.title, page.title[language])
      assert.equal(runtime.meta('name', 'description'), page.description[language])
      assert.equal(runtime.meta('property', 'og:site_name'), routeMetadata.siteName[language])
    }
  }
}

// 站点地图与 robots：只登记正式路由，legacy 重定向不出现，输出确定性可比对。
const sitemap = sitemapFor('https://example.test')
assert.equal(sitemap, sitemapFor('https://example.test'))
for (const page of routeMetadata.routes) {
  assert(
    sitemap.includes(`<loc>https://example.test${page.path === '/' ? '/' : page.path}</loc>`),
    page.path,
  )
}
assert(!sitemap.includes('/card/'))
assert.equal((sitemap.match(/<url>/gu) || []).length, routeMetadata.routes.length)
const robots = robotsFor('https://example.test')
assert(robots.includes('User-agent: *\nAllow: /\n'))
assert(robots.includes('Sitemap: https://example.test/sitemap.xml'))

// 验证真正的生产 Worker：错误页面是404且不重定向；静态资源仍真实委托。
for (const method of ['GET', 'HEAD']) {
  const seen = []
  const env = {
    ASSETS: {
      async fetch(request) {
        const path = new URL(request.url).pathname
        seen.push(path)
        return new Response(
          method === 'HEAD' ? null : path === '/not-found.html' ? notFound : 'missing',
          {
            status: path === '/not-found.html' ? 200 : 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          },
        )
      },
    },
  }
  const response = await worker.fetch(
    new Request('https://example.test/bad-link?from=share', {
      method,
      headers: { Accept: 'text/html' },
    }),
    env,
  )
  assert.equal(response.status, 404)
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex')
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual(seen, ['/bad-link', '/not-found.html'])
  assert.equal(
    method === 'HEAD' ? response.body : await response.text(),
    method === 'HEAD' ? null : notFound,
  )
}
for (const path of ['/assets/missing.js', '/color/missing.mp4', '/.git/config']) {
  let calls = 0
  const env = {
    ASSETS: {
      async fetch() {
        calls++
        return new Response('missing', { status: 404 })
      },
    },
  }
  const response = await worker.fetch(new Request(`https://example.test${path}`), env)
  assert.equal(response.status, 404)
  assert.equal(calls, 1, path)
}
{
  const upstream = new Response('denied', { status: 403 })
  const response = await worker.fetch(new Request('https://example.test/private'), {
    ASSETS: { fetch: () => upstream },
  })
  assert.equal(response, upstream, '非404错误不能伪装成404')
}

if (process.argv.includes('--dist')) {
  const root = new URL('../dist/', import.meta.url)
  for (const page of routeMetadata.routes) {
    const html = await readFile(new URL(pageFileFor(page.path), root), 'utf8')
    assert.equal(renderRouteHtml(html, page.path), html, `实际构建 head 不正确：${page.path}`)
    assert.match(html, /<script[^>]+type="module"[^>]+\/assets\//u)
    assert(!html.includes('/src/main.js') && !html.includes('/src/main.ts'))
  }
  const html = await readFile(new URL('not-found.html', root), 'utf8')
  assert.equal(renderRouteHtml(html, '/bad-link'), html)
  const image = await readFile(new URL(routeMetadata.image.slice(1), root))
  assert(image.length > 0)
  assert.deepEqual([...image.subarray(0, 2)], [0xff, 0xd8], '分享图必须是实际JPEG')
  // 每个输出仍使用同一份编译入口与样式，不能重新打包八套运行时代码。
  const entries = await Promise.all(
    routeMetadata.routes.map(async (page) => {
      const source = await readFile(new URL(pageFileFor(page.path), root), 'utf8')
      return source.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/u)?.[1]
    }),
  )
  assert.equal(new Set(entries).size, 1)
  // 直接访问任一路由都并行预载该路由的视图 chunk 及其样式，避免先入口后路由的额外往返。
  for (const page of routeMetadata.routes) {
    const source = await readFile(new URL(pageFileFor(page.path), root), 'utf8')
    const preloads = [
      ...source.matchAll(/<link rel="(modulepreload|stylesheet)" crossorigin href="([^"]+)"/gu),
    ]
    const module = preloads.filter(([, rel]) => rel === 'modulepreload').map(([, , href]) => href)
    assert.equal(module.length, 1, `${page.path} 必须恰好预载一个视图 chunk`)
    for (const [, , href] of preloads) {
      assert(
        await readFile(new URL(href.slice(1), root), 'utf8').then(
          () => true,
          () => false,
        ),
        `${page.path} 预载的 ${href} 必须存在于产物`,
      )
    }
  }
  // 站点地图与 robots 随构建输出，内容与共享元数据一致。
  assert.equal(await readFile(new URL('sitemap.xml', root), 'utf8'), sitemapFor())
  assert.equal(await readFile(new URL('robots.txt', root), 'utf8'), robotsFor())
  console.log(
    `PASS: ${routeMetadata.routes.length} 个实际路由HTML、视图预载、分享head/JPEG、共用JS入口、sitemap/robots、独立404`,
  )
} else {
  console.log(
    `PASS: ${titles.size} 个独立head、规范域名验证、共享路由规则、Worker GET/HEAD真实404与静态委托`,
  )
}

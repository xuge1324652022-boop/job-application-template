import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { sendMediaFile } from './media-http.mjs'

const mediaTypes = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
}
const browserFields = [
  'profile',
  'portrait',
  'portraits',
  'selectedWorks',
  'storyPanels',
  'imageDimensions',
  'site',
]
const sitePath =
  /^\/(?:portfolio|internship-clean|color-previews|about|color|personal-color-frames)\//u
const validSitePath = (path) =>
  path === '/resume.pdf' ||
  (/^\/(?:portfolio|internship-clean|color-previews|about|color|personal-color-frames)\/[^/\\\0?#]+$/u.test(
    path,
  ) &&
    !path.split('/').includes('..'))
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const within = (directory, file) => {
  const path = relative(directory, file)
  return !isAbsolute(path) && path !== '..' && !path.startsWith('../') && !path.startsWith('..\\')
}

/** Local personal edition: only the explicitly selected content and assets are served. */
export function personalPortfolio(root, { sourceRoot = root, required = false } = {}) {
  // An external archive is read only when the host explicitly configures it.
  // Manifest paths stay relative to that selected root, with the same whitelist.
  const selectedRoot = resolve(root, sourceRoot)
  const contentRoot = resolve(selectedRoot, '本机私有资料/个人网站')
  const contentFile = resolve(contentRoot, 'content.json')
  const prefix = '/personal/'
  const safeContentRoot = () => {
    // The content directory cannot redirect outside the explicitly selected root.
    const expected = resolve(realpathSync(selectedRoot), '本机私有资料/个人网站')
    const actual = realpathSync(contentRoot)
    return relative(expected, actual) === '' ? actual : null
  }
  const readContent = () => {
    if (!existsSync(contentFile)) {
      if (required)
        throw new Error('完整个人项目的素材包未找到，请检查本机素材路径；不会回退为模板预览')
      return null
    }
    try {
      const directory = safeContentRoot()
      if (
        !directory ||
        !within(directory, realpathSync(contentFile)) ||
        !statSync(contentFile).isFile()
      )
        throw new Error()
      const content = JSON.parse(readFileSync(contentFile, 'utf8'))
      if (!isRecord(content)) throw new Error()
      if (content.enabled !== true) {
        if (required) throw new Error()
        return null
      }
      if (!isRecord(content.assets)) throw new Error()
      if (required && !isRecord(content.site)) throw new Error()
      return content
    } catch {
      // JSON parser errors can include source text. Never echo a private field.
      throw new Error('本机个人内容包无效，请检查内容目录与 JSON 结构')
    }
  }
  const assetFile = (content, name) => {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u.test(name)) return null
    if (
      !Object.hasOwn(content.assets, name) ||
      !Object.hasOwn(mediaTypes, extname(name).toLowerCase())
    )
      return null
    const selected = content.assets[name]
    if (
      typeof selected !== 'string' ||
      isAbsolute(selected) ||
      /^[A-Za-z]:/u.test(selected) ||
      selected.includes('\0') ||
      selected.split(/[\\/]/u).includes('..')
    )
      return null
    const file = resolve(selectedRoot, selected)
    try {
      const directory = safeContentRoot()
      if (
        !directory ||
        !within(contentRoot, file) ||
        !within(directory, realpathSync(file)) ||
        !statSync(file).isFile()
      )
        return null
      if (extname(file).toLowerCase() !== extname(name).toLowerCase()) return null
      return file
    } catch {
      return null
    }
  }
  const siteAssetFile = (content, path) => {
    if (
      !validSitePath(path) ||
      !isRecord(content.siteAssets) ||
      !Object.hasOwn(content.siteAssets, path)
    )
      return null
    const selected = content.siteAssets[path]
    if (
      typeof selected !== 'string' ||
      isAbsolute(selected) ||
      /^[A-Za-z]:/u.test(selected) ||
      selected.includes('\0') ||
      selected.split(/[\\/]/u).includes('..') ||
      !Object.hasOwn(mediaTypes, extname(path).toLowerCase())
    )
      return null
    const file = resolve(selectedRoot, selected)
    try {
      // Only registered files in these fixed archive areas can be served.
      const areas = [
        '本机私有资料/公开素材原件/public',
        '本机私有资料/公开素材原件/src/assets/color-frames',
        'media/color',
      ]
      const realFile = realpathSync(file)
      const allowed = areas.some((area) => {
        const directory = resolve(selectedRoot, area)
        if (!within(directory, file) || !existsSync(directory)) return false
        const expected = resolve(realpathSync(selectedRoot), area)
        const actual = realpathSync(directory)
        return relative(expected, actual) === '' && within(actual, realFile)
      })
      if (
        !allowed ||
        !statSync(file).isFile() ||
        extname(file).toLowerCase() !== extname(path).toLowerCase()
      )
        return null
      return file
    } catch {
      return null
    }
  }
  const middleware = (req, res, next) => {
    const pathname = (req.url ?? '').split('?')[0]
    const personal = pathname.startsWith(prefix)
    if (!personal && !sitePath.test(pathname) && pathname !== '/resume.pdf') return next()
    let name
    try {
      name = decodeURIComponent(personal ? pathname.slice(prefix.length) : pathname)
    } catch {
      res.statusCode = 400
      res.end()
      return
    }
    let content
    try {
      content = readContent()
    } catch {
      res.statusCode = 500
      res.end('personal content unavailable')
      return
    }
    if (!personal && !isRecord(content?.siteAssets)) return next()
    const file = content && (personal ? assetFile(content, name) : siteAssetFile(content, name))
    if (!file) {
      res.statusCode = 404
      res.end('not found')
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405
      res.setHeader('Allow', 'GET, HEAD')
      res.end()
      return
    }
    res.setHeader('X-Content-Type-Options', 'nosniff')
    sendMediaFile(req, res, file, {
      size: statSync(file).size,
      type: mediaTypes[extname(file).toLowerCase()],
    })
  }
  return {
    name: 'personal-portfolio',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
    transformIndexHtml: {
      order: 'pre',
      handler() {
        const content = readContent()
        if (!content) return
        const browserContent = Object.fromEntries(
          browserFields
            .filter((field) => Object.hasOwn(content, field))
            .map((field) => [field, content[field]]),
        )
        const escapes = {
          '<': '\\u003c',
          '>': '\\u003e',
          '&': '\\u0026',
          '\u2028': '\\u2028',
          '\u2029': '\\u2029',
        }
        const json = JSON.stringify(browserContent).replace(
          /[<>&\u2028\u2029]/gu,
          (character) => escapes[character],
        )
        return [
          {
            tag: 'script',
            attrs: { id: 'personal-portfolio', type: 'application/json' },
            children: json,
            injectTo: 'head-prepend',
          },
        ]
      },
    },
    generateBundle() {
      const content = readContent()
      if (!content) return
      // Validate the entire explicit set before emitting the first asset.
      const selected = Object.keys(content.assets).map((name) => {
        const file = assetFile(content, name)
        if (!file) throw new Error('个人展示素材缺失、格式不受支持或超出内容目录')
        return { name: `personal/${name}`, file }
      })
      for (const name of Object.keys(content.siteAssets ?? {})) {
        const file = siteAssetFile(content, name)
        if (!file) throw new Error('完整个人站点素材缺失、格式不受支持或超出归档目录')
        selected.push({ name: name.slice(1), file })
      }
      for (const { name, file } of selected) {
        this.emitFile({ type: 'asset', fileName: name, source: readFileSync(file) })
      }
    },
  }
}

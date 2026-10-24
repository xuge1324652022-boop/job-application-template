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
const browserFields = ['profile', 'portrait', 'selectedWorks', 'storyPanels', 'imageDimensions']
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const within = (directory, file) => {
  const path = relative(directory, file)
  return !isAbsolute(path) && path !== '..' && !path.startsWith('../') && !path.startsWith('..\\')
}

/** Local personal edition: only the explicitly selected content and assets are served. */
export function personalPortfolio(root) {
  const contentRoot = resolve(root, '本机私有资料/个人网站')
  const contentFile = resolve(contentRoot, 'content.json')
  const prefix = '/personal/'
  const safeContentRoot = () => {
    // A junction in the fixed content directory must not turn the whitelist
    // into permission to read a different directory outside the workspace.
    const expected = resolve(realpathSync(root), '本机私有资料/个人网站')
    const actual = realpathSync(contentRoot)
    return relative(expected, actual) === '' ? actual : null
  }
  const readContent = () => {
    if (!existsSync(contentFile)) return null
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
      if (content.enabled !== true) return null
      if (!isRecord(content.assets)) throw new Error()
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
    const file = resolve(root, selected)
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
  const middleware = (req, res, next) => {
    const pathname = (req.url ?? '').split('?')[0]
    if (!pathname.startsWith(prefix)) return next()
    let name
    try {
      name = decodeURIComponent(pathname.slice(prefix.length))
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
    const file = content && assetFile(content, name)
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
        return { name, file }
      })
      for (const { name, file } of selected) {
        this.emitFile({ type: 'asset', fileName: `personal/${name}`, source: readFileSync(file) })
      }
    },
  }
}

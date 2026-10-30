import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'

const extensions = ['.ts', '.js', '.vue', '.css', '.json']
const normalize = (value) => value.split(path.sep).join('/')

function filesUnder(root, directory) {
  const absolute = path.join(root, directory)
  if (!existsSync(absolute)) return []
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const name = `${directory}/${entry.name}`
    // Never traverse symlinks or the private archive.
    return entry.isDirectory() ? filesUnder(root, name) : entry.isFile() ? [name] : []
  })
}

/** Conservative, read-only reachability audit; assets and individual exports are out of scope. */
export function auditSourceUsage(root) {
  const files = filesUnder(root, 'src').filter((file) => extensions.includes(path.extname(file)))
  const known = new Set(files)
  const read = (file) => readFileSync(path.join(root, file), 'utf8')
  const edges = new Map()
  const unsupported = []
  const unresolved = []
  for (const file of files) {
    const content = read(file)
    const references = []
    let scripts = [content]
    let styles = file.endsWith('.css') ? [content] : []
    if (file.endsWith('.vue')) {
      const { descriptor, errors } = parse(content, { filename: file })
      if (errors.length) throw new Error(`Invalid Vue source: ${file}`)
      const blocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean)
      scripts = blocks.map((block) => block.content)
      styles = descriptor.styles.map((block) => block.content)
      for (const block of [...blocks, ...descriptor.styles, descriptor.template].filter(Boolean)) {
        if (block.src) references.push(block.src)
      }
    }
    if (!file.endsWith('.json') && !file.endsWith('.css')) {
      for (const script of scripts) {
        references.push(
          ...ts.preProcessFile(script, true, true).importedFiles.map((item) => item.fileName),
        )
        // Unknown dynamic edges must block cleanup, not silently produce false positives.
        const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true)
        const visit = (node) => {
          if (ts.isCallExpression(node)) {
            if (
              node.expression.kind === ts.SyntaxKind.ImportKeyword &&
              !ts.isStringLiteralLike(node.arguments[0])
            ) {
              unsupported.push(`${file}: computed import`)
            }
            if (node.expression.getText(ast).startsWith('import.meta.glob'))
              unsupported.push(`${file}: glob import`)
          }
          ts.forEachChild(node, visit)
        }
        visit(ast)
      }
    }
    for (const css of styles) {
      references.push(
        ...[...css.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/gu)].map((match) => match[1]),
      )
    }
    const dependencies = []
    for (const reference of references) {
      if (reference.startsWith('@/') || reference.startsWith('~/')) {
        unsupported.push(`${file}: alias ${reference}`)
        continue
      }
      if (!reference.startsWith('.')) continue
      const candidate = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), reference.split('?')[0]),
      )
      const options = [
        candidate,
        ...extensions.map((ext) => candidate + ext),
        ...extensions.map((ext) => `${candidate}/index${ext}`),
      ]
      const dependency = options.find((option) => known.has(option))
      if (dependency) dependencies.push(dependency)
      else if (!existsSync(path.join(root, candidate))) unresolved.push(`${file}: ${reference}`)
    }
    edges.set(file, dependencies)
  }
  const appRoots = new Set(['src/main.ts'])
  const libraryRoots = new Set()
  const validationRoots = new Set()
  // A file mentioned in a library note is not an entry point. Only schema fields grant that status.
  for (const definition of filesUnder(root, '动效组件库/效果定义').filter((file) =>
    file.endsWith('.json'),
  )) {
    const data = JSON.parse(read(definition))
    for (const field of ['entryFiles', 'integrationFiles']) {
      for (const file of data[field] ?? []) if (known.has(file)) libraryRoots.add(file)
    }
  }
  // Scripts may read source by full path rather than importing it; preserve those validation inputs.
  const validationEntries = [
    'vite.config.js',
    ...filesUnder(root, 'scripts'),
    ...filesUnder(root, 'tests'),
  ]
  for (const entry of ['index.html', ...validationEntries]) {
    if (!existsSync(path.join(root, entry)) || !/\.(?:html|js|mjs|ts|json|py)$/u.test(entry))
      continue
    const content = read(entry)
    const roots = entry === 'index.html' ? appRoots : validationRoots
    for (const file of files) if (content.includes(file)) roots.add(file)
  }
  const reachableFrom = (roots) => {
    const reachable = new Set()
    const visit = (file) => {
      if (!known.has(file) || reachable.has(file)) return
      reachable.add(file)
      for (const dependency of edges.get(file) ?? []) visit(dependency)
    }
    roots.forEach(visit)
    return reachable
  }
  const app = reachableFrom(appRoots)
  const library = reachableFrom(libraryRoots)
  const validation = reachableFrom(validationRoots)
  const ambient = reachableFrom(files.filter((file) => file.endsWith('.d.ts')))
  const select = (predicate) => files.filter(predicate).sort()
  const unreferenced = select(
    (file) => !app.has(file) && !library.has(file) && !validation.has(file) && !ambient.has(file),
  )
  return {
    scanned: files.length,
    appReachable: select((file) => app.has(file)),
    libraryOnly: select((file) => library.has(file) && !app.has(file)),
    validationOnly: select((file) => validation.has(file) && !app.has(file) && !library.has(file)),
    ambientOnly: select(
      (file) => ambient.has(file) && !app.has(file) && !library.has(file) && !validation.has(file),
    ),
    unreferenced,
    // Keep the original field for callers; only genuinely unreferenced files fail the audit.
    unused: unreferenced,
    unsupported,
    unresolved,
  }
}

if (
  process.argv[1] &&
  normalize(path.resolve(process.argv[1])) === normalize(fileURLToPath(import.meta.url))
) {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const result = auditSourceUsage(root)
  console.log(JSON.stringify(result, null, 2))
  if (result.unused.length || result.unsupported.length || result.unresolved.length)
    process.exitCode = 1
}

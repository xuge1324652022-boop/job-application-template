import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Public-template entry points must not run from a marked personal workspace. */
export function assertTemplateWorkspace(projectRoot) {
  const root = resolve(projectRoot)
  const marker = join(root, '.workspace-edition.json')
  if (!existsSync(marker)) return
  if (!lstatSync(marker).isFile() || lstatSync(marker).isSymbolicLink())
    throw new Error('工作区版本标记必须是普通 JSON 文件')
  let edition
  try {
    edition = JSON.parse(readFileSync(marker, 'utf8'))
  } catch {
    throw new Error('工作区版本标记无效，禁止准备模板发布')
  }
  if (edition?.edition !== 'personal') return
  const preview =
    typeof edition.publicPreviewDirectory === 'string' && edition.publicPreviewDirectory
      ? resolve(root, edition.publicPreviewDirectory)
      : resolve(root, '../portfolio-github-preview')
  throw new Error(`此目录是本机完整个人项目，禁止模板发布；请使用独立预览项目：${preview}`)
}

/** Reject a personal build even if it was copied into an unmarked checkout. */
export function assertTemplateArtifact(publicPath, bytes) {
  const path = publicPath.replace(/^\/+/, '')
  if (/^(?:personal|personal-color-frames)(?:\/|$)/u.test(path))
    throw new Error('模板发布拒绝个人站点素材，请从独立预览项目重新构建')
  if (
    /\.html$/iu.test(path) &&
    /\bid\s*=\s*(?:"personal-portfolio"|'personal-portfolio'|personal-portfolio(?=[\s>]))/iu.test(
      bytes.toString('utf8'),
    )
  )
    throw new Error('模板发布拒绝包含个人内容的 HTML，请从独立预览项目重新构建')
}

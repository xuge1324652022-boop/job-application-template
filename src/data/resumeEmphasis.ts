/**
 * 公开模板的文字强调映射；仅引用虚构占位内容。
 * 与 aboutProfile 的示例正文保持一致，不包含真实简历或履历事实。
 */
import type { Lang } from './aboutProfile'

/** 拆分结果：一段原文 + 是否加粗。仅本文件消费，不对外导出。 */
interface ResumeTextPart {
  text: string
  strong: boolean
}

/*
 * 这里原本还有一张 `DETAIL_EMPHASIS` 表（按经历 id + 详情序号给加粗片段）和它的
 * 取用函数 `resumeDetailParts`。经历详情改用 `resumeSkillParts` / `resumeFactParts`
 * 之后，两者在 src / scripts / tests 里都成了零引用 —— 保留只会让人以为经历详情
 * 还在走这套加粗。需要时从 git 历史取回。
 */

/** 下标与 FACTS 展示顺序绑定。 */
const FACT_EMPHASIS: Readonly<Record<number, Record<Lang, readonly string[]>>> = {
  3: { zh: ['示例院校', '20XX.XX – 20XX.XX'], en: ['Example University', '20XX.XX – 20XX.XX'] },
  5: { zh: ['示例奖项', '示例项目表彰'], en: ['Example Award', 'Example Project Recognition'] },
}

const SKILL_EMPHASIS: Readonly<Record<string, Record<Lang, readonly string[]>>> = {
  'post-production': {
    zh: ['模板示例', '文字排版、图像处理、视频剪辑与文件协作'],
    en: ['Template example', 'typography, image editing, video editing and file collaboration'],
  },
  'ai-software': {
    zh: ['模板示例', '人工检查最终交付'],
    en: ['Template example', 'review the final deliverable manually'],
  },
}

/** 只拆分纯文本给 Vue 转义插值；不插 HTML，保证原文拼接后完全不变。 */
function splitResumeEmphasis(text: string, fragments: readonly string[]): ResumeTextPart[] {
  const ranges: { start: number; end: number }[] = []
  for (const fragment of fragments) {
    if (!fragment) continue
    let start = text.indexOf(fragment)
    while (start !== -1) {
      ranges.push({ start, end: start + fragment.length })
      start = text.indexOf(fragment, start + fragment.length)
    }
  }
  if (!ranges.length) return [{ text, strong: false }]
  ranges.sort((a, b) => a.start - b.start || b.end - a.end)
  // 先合并嵌套与相邻命中，防止长短重点片段重叠造成文字重复或丢失。
  const merged: typeof ranges = []
  for (const range of ranges) {
    const previous = merged[merged.length - 1]
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  const parts: ResumeTextPart[] = []
  let cursor = 0
  for (const range of merged) {
    if (cursor < range.start) parts.push({ text: text.slice(cursor, range.start), strong: false })
    parts.push({ text: text.slice(range.start, range.end), strong: true })
    cursor = range.end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), strong: false })
  return parts
}

/** 资料行按 FACTS 下标关联；调整行序时同步更新 FACT_EMPHASIS。 */
export function resumeFactParts(text: string, factIndex: number, lang: Lang): ResumeTextPart[] {
  return splitResumeEmphasis(text, FACT_EMPHASIS[factIndex]?.[lang] ?? [])
}

/** 技能使用 id 而非显示名称，避免语言切换影响查找。 */
export function resumeSkillParts(text: string, skillId: string, lang: Lang): ResumeTextPart[] {
  return splitResumeEmphasis(text, SKILL_EMPHASIS[skillId]?.[lang] ?? [])
}

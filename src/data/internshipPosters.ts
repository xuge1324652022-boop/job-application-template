import { personalSiteValue } from './personalPortfolio'
/**
 * 合成版面示例登记：plan 管公开文案与页号，manifest 管稳定素材 id 与比例。
 * 所有展示图均为程序生成的几何示例，不包含真实实习、产品品牌或原始 PDF。
 * 保留历史导出接口供组件引用；JSON 字段约定见本目录 README.md。
 */
import plan from './internship-poster-plan.json'
import manifest from './internship-poster-assets.json'
import type { Bi } from './aboutProfile'
import type { VisualAsset } from './visualPortfolio'

export interface InternshipPosterGroup {
  id: string
  title: Bi
  description: Bi
  items: readonly VisualAsset[]
}

const attribution: Bi = { zh: '合成版面示例', en: 'Synthetic layout sample' }
// 图片内容更新时使用同一版本号，开场、卡片和查看器一起刷新浏览器缓存。
const previewVersion = 'synthetic-layout-v2'

// 仅展示选定页号；保留完整清单用于检验素材覆盖，未展示页不会进入查看器。
const posterPageSelection: Readonly<Record<string, readonly number[]>> = {
  'demo-guidance': [1],
  'demo-measure': [1, 12, 13, 14, 15],
  'demo-garden': [1],
}

// 通过 group + 一基页号连接两份清单；缺项立即报错，不静默发布破图。
const templateInternshipGroups: readonly InternshipPosterGroup[] = plan.map((group) => ({
  id: group.id,
  title: group.title,
  description: group.description,
  items: group.pages
    .filter(
      (page) =>
        !posterPageSelection[group.id] || posterPageSelection[group.id]!.includes(page.page),
    )
    .map((page) => {
      const entry = manifest.find((item) => item.group === group.id && item.page === page.page)
      if (!entry) throw new Error(`Missing PDF preview: ${group.id}, page ${page.page}`)
      return {
        id: entry.id,
        title: page.title,
        // manifest 记录版面比例整数，不是 WebP 文件的实际像素尺寸。
        width: entry.width,
        height: entry.height,
        src: `/internship-clean/${entry.id}-1600.webp?v=${previewVersion}`,
        large: `/internship-clean/${entry.id}-2560.webp?v=${previewVersion}`,
        thumb: `/internship-clean/${entry.id}-400.webp?v=${previewVersion}`,
        note: attribution,
        alt: {
          zh: `${page.title.zh}，网格背景上的合成色块与圆环`,
          en: `${page.title.en}, synthetic colour blocks and a ring on a grid`,
        },
      }
    }),
}))
export const internshipGroups: readonly InternshipPosterGroup[] = personalSiteValue(
  'internshipPosters',
  'internshipGroups',
  templateInternshipGroups,
)

/*
 * 这里原本还有一个 `internshipPages`（把 internshipGroups 全部 items 摊平）。
 * 展示区直接用 internshipGroups 分组渲染，开场叠层只用 internshipFeatured，
 * 它在同文件和文件外都没有读者 —— 每次模块求值都白算一遍摊平结果，已删。
 */

// 开场叠层只使用当前保留的海报；筛选后的海报在下方展示区直接展开。
const FEATURED_IDS = ['demo-guidance-01', 'demo-measure-01', 'demo-garden-01']
// 稳定内部 id 连接公开合成素材、页面编排与动效映射。
export const internshipFeatured = personalSiteValue(
  'internshipPosters',
  'internshipFeatured',
  FEATURED_IDS.map((id) => {
    const item = templateInternshipGroups
      .flatMap((group) => group.items)
      .find((page) => page.id === id)
    if (!item) throw new Error(`Missing featured internship poster: ${id}`)
    return item
  }),
)

export const POSTER_INTRO: Bi = personalSiteValue('internshipPosters', 'POSTER_INTRO', {
  zh: '用合成几何素材演示版面与海报模板，体验开场叠层、章节切换和查看器；所有展示内容均为虚构示例',
  en: 'Synthetic geometric assets demonstrate layout and poster templates, opening layers, chapter transitions and the viewer. All content is fictional sample material',
})

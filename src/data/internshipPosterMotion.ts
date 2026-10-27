import { personalSiteValue } from './personalPortfolio'
/**
 * 合成版面示例的动效配置
 * 矩形使用完整页面的归一化坐标（0–1），裁片与展示图共用同一公开素材，避免重复请求。
 * 示例组 id 与 internshipPosters 保持一致；裁片按清单页号索引，不能按筛选后的序号取。
 */
import type { Bi } from './aboutProfile'
import type { VisualAsset } from './visualPortfolio'

export type PosterRect = readonly [x: number, y: number, width: number, height: number]
export interface PosterFragment {
  kind: 'headline' | 'block'
  rect: PosterRect
}
export interface InternshipMotionTheme {
  model: string
  title: Bi
  words: readonly Bi[]
  statements: readonly Bi[]
  background: string
  accent: string
  kind: 'guidance' | 'laser' | 'lawn'
}

export const INTERNSHIP_MOTION_THEMES: Readonly<Record<string, InternshipMotionTheme>> =
  personalSiteValue('internshipPosterMotion', 'INTERNSHIP_MOTION_THEMES', {
    'demo-guidance': {
      model: 'DEMO A',
      title: { zh: '版面示例 A', en: 'LAYOUT SAMPLE A' },
      words: [
        { zh: '网格', en: 'GRID' },
        { zh: '色块', en: 'BLOCK' },
        { zh: '层次', en: 'LAYER' },
      ],
      statements: [{ zh: '合成图形，展示版面', en: 'SYNTHETIC LAYOUT STUDY' }],
      background: '#181a19',
      accent: '#ffbc25',
      kind: 'guidance',
    },
    'demo-measure': {
      model: 'DEMO B',
      title: { zh: '版面示例 B', en: 'LAYOUT SAMPLE B' },
      words: [
        { zh: '圆环', en: 'RING' },
        { zh: '对比', en: 'CONTRAST' },
        { zh: '节奏', en: 'RHYTHM' },
      ],
      statements: [
        { zh: '留白，组织信息', en: 'SPACE ORGANISES CONTENT' },
        { zh: '几何，连接画面', en: 'GEOMETRY CONNECTS FRAMES' },
      ],
      background: '#171717',
      accent: '#ffd22d',
      kind: 'laser',
    },
    'demo-garden': {
      model: 'DEMO C',
      title: { zh: '版面示例 C', en: 'LAYOUT SAMPLE C' },
      words: [
        { zh: '组合', en: 'COMPOSE' },
        { zh: '比例', en: 'RATIO' },
        { zh: '平衡', en: 'BALANCE' },
      ],
      statements: [{ zh: '以合成素材，演示层次', en: 'SYNTHETIC SHAPES, CLEAR LAYERS' }],
      background: '#154d3c',
      accent: '#d9ea99',
      kind: 'lawn',
    },
  })

const fragment = (kind: PosterFragment['kind'], rect: PosterRect): PosterFragment => ({
  kind,
  rect,
})

// 各槽位保留独立裁片配置；更换合成构图后，应逐页复核裁片与展示图的对齐
const laserHeadlines: readonly PosterRect[] = [
  [0.055, 0.52, 0.69, 0.31],
  [0.04, 0.085, 0.68, 0.18],
  [0.12, 0.12, 0.79, 0.17],
  [0.065, 0.13, 0.85, 0.13],
  [0.065, 0.12, 0.84, 0.29],
  [0.065, 0.11, 0.83, 0.13],
  [0.13, 0.12, 0.75, 0.18],
  [0.11, 0.48, 0.81, 0.17],
  [0.14, 0.12, 0.7, 0.14],
  [0.06, 0.145, 0.38, 0.29],
  [0.065, 0.32, 0.52, 0.22],
  [0.14, 0.12, 0.72, 0.2],
  [0.34, 0.115, 0.62, 0.27],
  [0.54, 0.16, 0.41, 0.45],
  [0.49, 0.38, 0.45, 0.16],
  [0.22, 0.35, 0.73, 0.27],
  [0.055, 0.16, 0.44, 0.4],
  [0.52, 0.055, 0.43, 0.23],
  [0.35, 0.055, 0.6, 0.19],
]

/** 每页使用少量裁片，浏览器复用同一张 WebP，避免动画再下载一套大图 */
export function internshipFragments(item: VisualAsset): readonly PosterFragment[] {
  const archived = personalSiteValue<Record<string, readonly PosterFragment[]> | null>(
    'internshipPosterMotion',
    'FRAGMENTS',
    null,
  )?.[item.id]
  if (archived) return archived
  const page = Number(item.id.slice(-2)) - 1
  if (item.id.startsWith('demo-guidance-'))
    return [
      fragment('headline', page === 0 ? [0.04, 0.295, 0.44, 0.31] : [0.04, 0.21, 0.59, 0.235]),
    ]
  if (item.id.startsWith('demo-measure-'))
    return [fragment('headline', laserHeadlines[page] ?? [0.08, 0.14, 0.78, 0.22])]
  return page === 0
    ? [fragment('headline', [0.13, 0.155, 0.76, 0.135]), fragment('block', [0.32, 0.49, 0.5, 0.31])]
    : [
        fragment('headline', [0.07, 0.035, 0.86, 0.105]),
        fragment('block', page === 5 ? [0.065, 0.22, 0.87, 0.11] : [0.075, 0.43, 0.8, 0.12]),
      ]
}

/** 裁片的内部仍是一整张展示图；位置按裁片尺寸反算，不改变文字比例 */
export function cropStyle([x, y, width, height]: PosterRect) {
  return {
    width: `${100 / width}%`,
    height: `${100 / height}%`,
    left: `${(-x / width) * 100}%`,
    top: `${(-y / height) * 100}%`,
  }
}

/** 裁片外框直接使用页面百分比；内部整图由 cropStyle 反向定位，两者必须配套。 */
export function fragmentStyle([x, y, width, height]: PosterRect) {
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
  }
}

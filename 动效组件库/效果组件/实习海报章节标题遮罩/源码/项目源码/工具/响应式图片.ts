import variants from '../数据/图片实际尺寸.json'
import { personalPortfolio } from '../数据/本机个人内容接口'

interface ImageSources {
  src: string
  thumb: string
  large: string
}
const dimensions: Readonly<Record<string, { width: number; height: number }>> = variants
// Vue can render the same asset many times during scrolling. Weak keys release with the asset.
const sourceCache = new WeakMap<
  ImageSources,
  {
    src: string
    thumb: string
    large: string
    registry: typeof personalPortfolio
    value: string
  }
>()

/** 宽度描述符必须是真实宽度；登记缺失时留空 srcset，让浏览器使用原始 src。 */
export function visualImageSources(item: ImageSources): string {
  const cached = sourceCache.get(item)
  if (
    cached &&
    cached.src === item.src &&
    cached.thumb === item.thumb &&
    cached.large === item.large &&
    cached.registry === personalPortfolio
  )
    return cached.value
  const widths = new Map<number, string>()
  for (const source of [item.thumb, item.src, item.large]) {
    const key = source.split(/[?#]/u)[0]!
    const size = personalPortfolio?.imageDimensions[key] ?? dimensions[key]
    // Called while Vue renders: incomplete metadata must not blank the component tree.
    // Never invent a width or mix partially registered candidates with the fallback src.
    if (!size || !Number.isFinite(size.width) || size.width <= 0) {
      widths.clear()
      break
    }
    if (!widths.has(size.width)) widths.set(size.width, source)
  }
  const value = [...widths]
    .sort(([a], [b]) => a - b)
    .map(([width, source]) => `${source} ${width}w`)
    .join(', ')
  sourceCache.set(item, {
    src: item.src,
    thumb: item.thumb,
    large: item.large,
    registry: personalPortfolio,
    value,
  })
  return value
}

/** 查看器受舞台宽高共同限制，竖图不能按整个视口宽度估算。 */
export function viewerImageSizes(item: { width: number; height: number }): string {
  const ratio = item.width / item.height
  return `(max-width: 760px) min(calc(100vw - 48px), ${Math.round(72 * ratio)}vh), min(86vw, ${Math.round(76 * ratio)}vh)`
}

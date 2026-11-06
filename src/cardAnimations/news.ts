import gsap from 'gsap'
import { BaseAnimation, type BoundLayer, type CardTimeline } from './base'

/**
 * 04 / NEWS —— “信息汇聚与发布” (Information Convergence & Broadcast) MG 动画。
 *
 * 核心设计语言：
 * 借鉴几何阵列重组，表达新闻影像的组织、聚焦与全域传播。
 * 所有文案严格采用项目已有真实内容（新闻影像 / LATEST UPDATE / FIELD REPORT / TOKYO 2026）。
 *
 * 动作分镜编排（6.0s 严格有限时长主循环）：
 *
 * 0.0s – 0.8s: 【几何阵列与传播波】
 *   圆、矩形、短线沿 4x4 网格自左上向右下阶梯生成，形成从源点向全域辐射的有序传播波。
 *
 * 0.8s – 1.8s: 【沿路径汇聚到四个区域】
 *   信息单元沿网格路径位移汇聚到 N、E、W、S 四个独立坐标窗口，
 *   窗口之间产生前后深度遮挡与交错穿插。
 *
 * 1.8s – 3.0s: 【字形窗口流动 & 聚合成 NEWS】
 *   四个区域内部的数据流线高速掠过，四个单字脱离局部网格约束向中心急速靠拢，
 *   以强力磁性吸附重组为一体化巨型 NEWS 标题。
 *
 * 3.0s – 4.2s: 【横向信息带穿过 & 背景网格收束】
 *   高亮横向信息带划过标题下沿，带出“新闻影像 · LATEST UPDATE / FIELD REPORT”，
 *   背景网格优雅收束隐退，主标题保持突出。
 *
 * 4.2s – 6.0s: 【张力停留 & 节点扩展闭环】
 *   主排版静止停留供阅读；5.2s 由右上角节点向外脉冲扩展回初始阵列，平滑衔接循环。
 */
export class NewsAnimation extends BaseAnimation {
  readonly name = 'news'

  /** 4.2–5.8s 是完整排版停留，取中段作为减少动态时的定格帧。 */
  protected holdTime(): number {
    return 4.9
  }

  private static readonly LAYERS = [
    { selector: '.cv-news__type', ax: 40, ay: 30, duration: 1.0 },
    { selector: '.cv-news__headline', ax: 32, ay: 22, duration: 1.12 },
    { selector: '.cv-news__quads', ax: 28, ay: 20, duration: 1.2 },
    { selector: '.cv-news__matrix', ax: 20, ay: 14, duration: 1.28 },
    { selector: '.cv-news__live', ax: 15, ay: 10, duration: 1.36 },
  ] as const

  private static readonly SPEED = 30

  private layers: BoundLayer[] = []
  private active = true
  private onMove: ((e: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null
  private isPointerAttached = false
  private ambientTweens: gsap.core.Tween[] = []
  private half = 160
  private ro: ResizeObserver | null = null

  /**
   * 6.0s 环境主循环：严格有限时长（纯 6 秒序列，无无限子动画污染）。
   */
  protected build(tl: CardTimeline, host: HTMLElement): void {
    if (!host || typeof host.querySelector !== 'function') return

    const cells = host.querySelectorAll<HTMLElement>('.cv-news__matrix-cell')
    const matrix = host.querySelector<HTMLElement>('.cv-news__matrix')
    const quads = host.querySelectorAll<HTMLElement>('.cv-news__quad')
    const quadStreams = host.querySelectorAll<HTMLElement>('.quad-stream')
    const chars = host.querySelectorAll<HTMLElement>('.cv-news__char')
    const headlineBar = host.querySelector<HTMLElement>('.cv-news__headline-bar')
    const headlineText = host.querySelector<HTMLElement>('.cv-news__headline-text')
    const expandNode = host.querySelector<HTMLElement>('.cv-news__expand-node')

    // 0.0s – 0.8s: 几何阵列与传播波生成 (从左上到右下)
    if (cells.length) {
      tl.fromTo(
        cells,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 0.8,
          duration: 0.38,
          stagger: {
            each: 0.035,
            from: 'start',
          },
          ease: 'power2.out',
        },
        0,
      )
    }

    // 0.8s – 1.8s: 沿网格路径汇聚到四个区域 (穿插遮挡)
    if (quads.length) {
      tl.fromTo(
        quads,
        { scale: 0.6, opacity: 0, y: (idx: number) => (idx % 2 === 0 ? -20 : 20) },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out',
        },
        0.8,
      )
    }

    // 1.8s – 3.0s: 数据流线掠过，四个单字脱离网格聚合成为 NEWS
    if (quadStreams.length) {
      tl.fromTo(
        quadStreams,
        { scaleX: 0, opacity: 0.2 },
        { scaleX: 1, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
        1.8,
      )
    }

    if (chars.length) {
      const offsets = [
        { x: -50, y: -20 }, // N
        { x: 30, y: -30 },  // E
        { x: -30, y: 30 },  // W
        { x: 40, y: 20 },   // S
      ]
      tl.fromTo(
        chars,
        {
          x: (i: number) => offsets[i]?.x ?? 0,
          y: (i: number) => offsets[i]?.y ?? 0,
          opacity: 0.2,
          scale: 0.85,
        },
        {
          x: 0,
          y: 0,
          opacity: 0.92,
          scale: 1,
          duration: 0.75,
          stagger: 0.06,
          ease: 'power4.out',
        },
        2.2,
      )
    }

    // 3.0s – 4.2s: 横向信息带穿过标题下沿，带出新闻影像字幕；背景网格收束
    if (headlineBar) {
      tl.fromTo(
        headlineBar,
        { width: '0%', opacity: 0.3 },
        { width: '60%', opacity: 1, duration: 0.55, ease: 'power3.out' },
        3.0,
      )
    }
    if (headlineText) {
      tl.fromTo(
        headlineText,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 0.85, duration: 0.45, ease: 'power2.out' },
        3.2,
      )
    }
    if (matrix) {
      tl.to(matrix, { opacity: 0.2, duration: 0.6, ease: 'power2.out' }, 3.0)
    }
    if (quads.length) {
      tl.to(quads, { opacity: 0.15, duration: 0.6, ease: 'power2.out' }, 3.1)
    }

    // 4.2s – 6.0s: 完整排版停留，节点扩展衔接循环
    if (expandNode) {
      tl.fromTo(
        expandNode,
        { scale: 0, opacity: 0 },
        { scale: 28, opacity: 0.8, duration: 0.6, ease: 'power2.in' },
        5.2,
      )
      tl.to(expandNode, { opacity: 0, duration: 0.2 }, 5.8)
    }

    // 5.8s - 6.0s: 归位复原，平滑衔接下一轮
    if (matrix) {
      tl.to(matrix, { opacity: 1, duration: 0.2 }, 5.8)
    }
    if (quads.length) {
      tl.to(quads, { opacity: 0, duration: 0.2 }, 5.8)
    }
    if (chars.length) {
      const offsets = [
        { x: -50, y: -20 }, // N
        { x: 30, y: -30 },  // E
        { x: -30, y: 30 },  // W
        { x: 40, y: 20 },   // S
      ]
      tl.to(
        chars,
        {
          x: (i: number) => offsets[i]?.x ?? 0,
          y: (i: number) => offsets[i]?.y ?? 0,
          opacity: 0.2,
          scale: 0.85,
          duration: 0.16,
          ease: 'power2.in',
        },
        5.82,
      )
    }
    if (quadStreams.length) {
      tl.to(quadStreams, { scaleX: 0, opacity: 0.2, duration: 0.15, ease: 'power2.in' }, 5.82)
    }
    if (cells.length) {
      tl.to(cells, { scale: 0, opacity: 0, duration: 0.15, ease: 'power2.in' }, 5.84)
    }
    if (headlineBar) {
      tl.to(headlineBar, { width: '0%', opacity: 0.3, duration: 0.15 }, 5.84)
    }
    if (headlineText) {
      tl.to(headlineText, { opacity: 0, y: 8, duration: 0.15 }, 5.84)
    }
    if (expandNode) {
      tl.set(expandNode, { scale: 0, opacity: 0 }, 5.98)
    }
    tl.to({}, { duration: 0.01 }, 5.99)
  }

  mount(host: HTMLElement): void {
    super.mount(host)
    this.layers = []
    for (const l of NewsAnimation.LAYERS) {
      const el = host.querySelector<HTMLElement>(l.selector)
      if (!el) continue
      this.layers.push({
        ax: l.ax,
        ay: l.ay,
        sx: gsap.quickTo(el, 'x', { duration: l.duration, ease: 'power3.out' }),
        sy: gsap.quickTo(el, 'y', { duration: l.duration, ease: 'power3.out' }),
      })
    }

    // 环境动画移出主时间线，独立无限运行，绝不破坏 tl.duration()
    this.ambientTweens.forEach((t) => t.kill())
    this.ambientTweens = []

    const track = host.querySelector<HTMLElement>('.cv-news__ticker-track')
    if (track) {
      this.measureTicker(track)
      this.ro = new ResizeObserver(() => this.measureTicker(track))
      this.ro.observe(track)

      this.ambientTweens.push(
        gsap.to(track, {
          x: -10000,
          duration: 10000 / NewsAnimation.SPEED,
          ease: 'none',
          repeat: -1,
          modifiers: {
            x: (raw: string) => {
              const span = this.half || 160
              const n = parseFloat(raw) || 0
              const mod = ((n % span) - span) % span
              return `${mod}px`
            },
          },
        }),
      )
    }

    const liveDot = host.querySelector<HTMLElement>('.cv-news__live-dot')
    if (liveDot) {
      this.ambientTweens.push(
        gsap.to(liveDot, { opacity: 0.35, duration: 1.0, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
      )
    }

    this.onMove = (e: PointerEvent) => {
      if (!this.active) return
      this.apply(e.clientX, e.clientY)
    }
    this.onLeave = () => this.toBase()

    if (this.active) {
      this.attachPointer()
    }
  }

  setActive(active: boolean): void {
    if (this.active === active) return
    this.active = active
    if (!active) {
      this.toBase()
      this.detachPointer()
      this.ambientTweens.forEach((t) => t.pause())
    } else {
      this.attachPointer()
      this.ambientTweens.forEach((t) => t.play())
    }
  }

  destroy(): void {
    this.detachPointer()
    if (this.ro) {
      this.ro.disconnect()
      this.ro = null
    }
    this.ambientTweens.forEach((t) => t.kill())
    this.ambientTweens = []
    this.onMove = null
    this.onLeave = null
    this.layers = []
    super.destroy()
  }

  private attachPointer(): void {
    if (this.isPointerAttached || this.reduced() || !this.onMove || !this.onLeave) return
    window.addEventListener('pointermove', this.onMove, { passive: true })
    document.addEventListener('pointerleave', this.onLeave)
    this.isPointerAttached = true
  }

  private detachPointer(): void {
    if (!this.isPointerAttached) return
    if (this.onMove) window.removeEventListener('pointermove', this.onMove)
    if (this.onLeave) document.removeEventListener('pointerleave', this.onLeave)
    this.isPointerAttached = false
  }

  private measureTicker(track: HTMLElement): void {
    const total = track.scrollWidth || 0
    if (total > 0) this.half = total / 2
  }

  private apply(clientX: number, clientY: number): void {
    if (!this.active) return
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    const nx = Math.max(-1, Math.min(1, (clientX / w) * 2 - 1))
    const ny = Math.max(-1, Math.min(1, (clientY / h) * 2 - 1))
    for (const l of this.layers) {
      l.sx(nx * l.ax)
      l.sy(ny * l.ay)
    }
  }

  private toBase(): void {
    for (const l of this.layers) {
      l.sx(0)
      l.sy(0)
    }
  }
}

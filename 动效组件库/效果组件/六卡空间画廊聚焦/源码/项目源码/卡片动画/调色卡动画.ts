import gsap from 'gsap'
import { BaseAnimation, type BoundLayer, type CardTimeline } from './卡片动画基础'

/**
 * 03 / COLOR —— “色彩塑形” (Color Shaping) MG 动画。
 *
 * 核心设计语言：
 * 借鉴流动色场被分割成竖条的连续转换。
 * 纯代码生成色彩（Canvas 2D 梯度与几何形变），不使用大面积 CSS blur，不恢复退役视频。
 *
 * 动作分镜编排（6.0s 严格有限时长主循环）：
 *
 * 0.0s – 0.7s: 【黑白几何色场】
 *   画面呈现简洁清晰的中性灰阶黑白几何色场，巨型 COLOR 大字以发丝级镂空字形嵌入其中。
 *
 * 0.7s – 1.8s: 【边界推进与色彩弯曲】
 *   一道光色边界自左向右掠过画面（sweep: 0 -> 1），
 *   经过的位置实时获得胶片调色主题色（冷青 -> 蓝绿 -> 暖琥珀 -> 金橙），
 *   同时几何色块产生有方向的波浪形变（bend: 0 -> 1），由同一进度驱动！
 *   色调曲线 Tone Curve 同步从平直拉伸为经典电影 S 曲线。
 *
 * 1.8s – 3.0s: 【等宽竖条切分与抬起遮挡】
 *   连续色场被切分为 10 根等宽竖条，竖条交错依次向前抬起产生物理高度差与阴影遮挡；
 *   随后竖条向两侧错动绕过中心，在 2.8s 重新咬合拼回完整画面。
 *
 * 3.0s – 4.2s: 【实心标题转化与稳定排版】
 *   COLOR 标题从镂空过渡为高对比度实心大字，色场退到中后层，形成稳定、清晰的标题构图；
 *   调色参数点亮落锁。
 *
 * 4.2s – 6.0s: 【缓慢流动与平顺闭环】
 *   色彩在深层背景极慢流动，标题保持稳定，5.45s 后平稳平滑回归黑白几何初态，无缝闭环！
 */
export class ColorAnimation extends BaseAnimation {
  readonly name = 'color'

  /** 4.2s 之后标题已转实心并稳定，取中段作为减少动态时的定格帧。 */
  protected holdTime(): number {
    return 4.6
  }

  /** 每个图层的响应参数，单位是「满偏转时卡片局部坐标的像素数」。 */
  private static readonly LAYERS = [
    { selector: '.cv-color__type', ax: 50, ay: 35, duration: 1.0 },
    { selector: '.cv-color__strips', ax: 35, ay: 25, duration: 1.1 },
    { selector: '.cv-color__field-wrap', ax: 28, ay: 20, duration: 1.15 },
    { selector: '.cv-color__curves', ax: 24, ay: 17, duration: 1.25 },
    { selector: '.cv-color__wheel', ax: 20, ay: 12, duration: 1.35 },
  ] as const

  private layers: BoundLayer[] = []
  private active = true
  private onMove: ((e: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null
  private isPointerAttached = false
  private ambientTweens: gsap.core.Tween[] = []
  private nx = 0
  private ny = 0

  /**
   * 6.0s 环境主循环：严格有限时长（纯 6 秒时间线，无无限子动画污染）。
   */
  protected build(tl: CardTimeline, host: HTMLElement): void {
    if (!host || typeof host.querySelector !== 'function') return

    const canvas = host.querySelector<HTMLCanvasElement>('.cv-color__canvas')
    const ctx = canvas?.getContext?.('2d')
    const wordCutout = host.querySelector<HTMLElement>('.cv-color__word--cutout')
    const wordSolid = host.querySelector<HTMLElement>('.cv-color__word--solid')
    const stripBars = host.querySelectorAll<HTMLElement>('.cv-color__strip-bar')
    const fieldWrap = host.querySelector<HTMLElement>('.cv-color__field-wrap')
    const curvePath = host.querySelector<SVGPathElement>('.cv-color__curve-path')
    const curveDots = host.querySelectorAll<SVGCircleElement>('.cv-color__curve circle')
    const strip = host.querySelector<HTMLElement>('.cv-color__strip')
    const params = host.querySelectorAll<HTMLElement>('.cv-color__params span')

    // 塑形色场 Canvas 状态对象
    const state = {
      sweep: 0,       // 0 -> 1: 色彩边界推进
      bend: 0,        // 0 -> 1: 波浪形态弯曲
      flow: 0,        // 色彩时间流动
    }

    const drawField = () => {
      if (!canvas || !ctx) return
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const barCount = 10
      const barW = w / barCount
      const sweepX = state.sweep * w

      const filmColors = [
        '#23343d', '#2f4350', '#384954', '#42545e', '#5a5652',
        '#78644e', '#8a7155', '#9e815c', '#b59364', '#c4a06d',
      ]
      const bwColors = [
        '#181a1c', '#222426', '#2a2d30', '#33373a', '#414548',
        '#4f5458', '#5c6166', '#6a7075', '#797f85', '#8b9299',
      ]

      for (let i = 0; i < barCount; i++) {
        const x = i * barW
        const cx = x + barW / 2
        const isColored = cx < sweepX
        const transition = Math.max(0, Math.min(1, (sweepX - x) / barW))
        const bendOffset = Math.sin((i / barCount) * Math.PI * 2 + state.flow) * 18 * state.bend

        const baseBw = bwColors[i] ?? '#333333'
        const baseFilm = filmColors[i] ?? '#555555'

        ctx.save()
        ctx.fillStyle = isColored ? (transition < 1 ? baseBw : baseFilm) : baseBw
        if (transition > 0 && transition < 1) {
          ctx.fillStyle = baseFilm
          ctx.globalAlpha = transition
        }
        ctx.fillRect(x + 1, bendOffset, barW - 2, h)
        ctx.restore()
      }
    }

    // 0.0s – 0.7s: 初始黑白几何态，镂空标题清晰嵌入
    if (wordCutout && wordSolid) {
      tl.set(wordCutout, { opacity: 0.85, x: 0 }, 0)
      tl.set(wordSolid, { opacity: 0, x: 0 }, 0)
    }

    // 0.7s – 1.8s: 边界沿画面推进，获得胶片主题色，形态产生有方向弯曲（同一进度驱动）
    tl.to(
      state,
      {
        sweep: 1,
        bend: 1,
        duration: 1.1,
        ease: 'power2.inOut',
        onUpdate: drawField,
      },
      0.7,
    )

    // 曲线同步从平直拉伸为电影 S 曲线
    if (curvePath) {
      const flatD = 'M4 108 C 60 76, 120 40, 196 8'
      const sCurveD = 'M4 108 C 46 100, 62 74, 86 52 S 138 18, 196 8'
      tl.fromTo(
        curvePath,
        { attr: { d: flatD } },
        { attr: { d: sCurveD }, duration: 1.1, ease: 'power2.inOut' },
        0.7,
      )
    }
    if (curveDots.length >= 2) {
      tl.fromTo(
        curveDots[1],
        { attr: { cy: 72 } },
        { attr: { cy: 52 }, duration: 1.1, ease: 'power2.inOut' },
        0.7,
      )
    }

    // 1.8s – 3.0s: 竖条带着各自颜色向前抬起产生遮挡与高度差，随后绕过中心文字重新拼合
    if (stripBars.length) {
      stripBars.forEach((bar, idx) => {
        const lift = (idx % 2 === 0 ? -1 : 1) * (14 + (idx % 3) * 6)
        tl.to(
          bar,
          {
            y: lift,
            scaleY: 1.08,
            backgroundColor: 'rgba(241, 241, 236, 0.08)',
            duration: 0.45,
            ease: 'power2.out',
          },
          1.8 + idx * 0.03,
        )
      })

      stripBars.forEach((bar, idx) => {
        tl.to(
          bar,
          {
            y: 0,
            scaleY: 1.0,
            backgroundColor: 'transparent',
            duration: 0.5,
            ease: 'power3.inOut',
          },
          2.35 + idx * 0.02,
        )
      })
    }

    // 3.0s – 4.2s: COLOR 从镂空转为实心标题，流动色场退到背景形成稳定清晰标题构图
    if (wordCutout && wordSolid) {
      tl.to(wordCutout, { opacity: 0, duration: 0.45, ease: 'power2.out' }, 3.0)
      tl.to(wordSolid, { opacity: 0.92, duration: 0.55, ease: 'power2.out' }, 3.1)
    }
    if (fieldWrap) {
      tl.to(fieldWrap, { opacity: 0.45, scale: 0.98, duration: 0.8, ease: 'power2.out' }, 3.0)
    }
    if (strip) {
      tl.fromTo(
        strip,
        { scaleX: 0.4, opacity: 0.2 },
        { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power2.out' },
        3.1,
      )
    }
    if (params.length) {
      tl.fromTo(
        params,
        { opacity: 0.3, x: 6 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' },
        3.2,
      )
    }

    // 4.2s – 6.0s: 色彩缓慢流动，标题保持稳定，再平顺回到开场状态
    tl.to(
      state,
      {
        flow: Math.PI * 2,
        duration: 1.25,
        ease: 'none',
        onUpdate: drawField,
      },
      4.2,
    )

    // 5.45s - 6.0s: 平滑复位回归黑白初态，完成闭环
    tl.to(
      state,
      {
        sweep: 0,
        bend: 0,
        duration: 0.55,
        ease: 'power2.inOut',
        onUpdate: drawField,
      },
      5.45,
    )
    if (wordCutout && wordSolid) {
      tl.to(wordCutout, { opacity: 0.85, duration: 0.4, ease: 'power2.out' }, 5.55)
      tl.to(wordSolid, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 5.55)
    }
    if (fieldWrap) {
      tl.to(fieldWrap, { opacity: 0.88, scale: 1.0, duration: 0.5, ease: 'power2.out' }, 5.5)
    }
    if (strip) {
      tl.to(strip, { scaleX: 0.4, opacity: 0.2, duration: 0.16, ease: 'power2.in' }, 5.84)
    }
    if (params.length) {
      tl.to(params, { opacity: 0.3, x: 6, duration: 0.16, ease: 'power2.in' }, 5.84)
    }
    tl.to({}, { duration: 0.01 }, 5.99)
  }

  mount(host: HTMLElement): void {
    super.mount(host)
    this.layers = []
    for (const l of ColorAnimation.LAYERS) {
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
    const wheelDisc = host.querySelector<HTMLElement>('.cv-color__wheel-disc')
    if (wheelDisc) {
      this.ambientTweens.push(
        gsap.to(wheelDisc, { rotation: 360, duration: 60, ease: 'none', repeat: -1 }),
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

  private apply(clientX: number, clientY: number): void {
    if (!this.active) return
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    this.nx = Math.max(-1, Math.min(1, (clientX / w) * 2 - 1))
    this.ny = Math.max(-1, Math.min(1, (clientY / h) * 2 - 1))
    for (const l of this.layers) {
      l.sx(this.nx * l.ax)
      l.sy(this.ny * l.ay)
    }
  }

  private toBase(): void {
    for (const l of this.layers) {
      l.sx(0)
      l.sy(0)
    }
    this.nx = 0
    this.ny = 0
  }
}

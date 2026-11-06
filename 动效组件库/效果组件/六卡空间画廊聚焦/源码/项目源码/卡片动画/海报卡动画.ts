import gsap from 'gsap'
import { BaseAnimation, type BoundLayer, type CardTimeline } from './卡片动画基础'
import type { CardMedia } from './卡片动画类型'

/**
 * 05 / POSTER —— “有纵深的动态海报” (Spatial Poster Dynamics) MG 动画。
 *
 * 核心设计语言：
 * 重点参考递进矩形空间，结合粗大窄体字、图形星芒印记与版面层级穿插。
 * 画面由真实 3D 纵深透视空间驱动，展现清晰的层间距离、遮挡与运动先后。
 *
 * 动作分镜编排（6.0s 严格有限时长主循环）：
 *
 * 0.0s – 0.8s: 【多层版面空间递进推进】
 *   远景、主海报、近景三层矩形版面从远处沿 Z 轴向镜头推进，
 *   层与层之间展现明显空间物理距离与先后差。
 *
 * 0.8s – 2.0s: 【镜头穿过版面 & 主海报定格】
 *   近景版面自镜头前景呼啸掠过出画，中间一层主海报稳健停住成为视觉核心，
 *   全程保持透视连续与遮挡层次。
 *
 * 2.0s – 3.2s: 【字母错位落位 & 星芒印记旋转穿出】
 *   P-O-S-T-E-R 字母沿不同基线进入主版面，短暂错位后精确吸附到统一网格；
 *   星芒印记徽标从文字后方旋转穿出并定格落位。
 *
 * 3.2s – 4.4s: 【主海报转正 & 裁切排版完成】
 *   主海报由微透视倾斜平滑转正，裁切十字与辅助说明完成精细排版，
 *   后景版面微透，静止构图仍具深远空间感。
 *
 * 4.4s – 6.0s: 【张力停留 & 向远处退去循环】
 *   海报完整清晰停留；5.2s 后主版面向远处深空退去，平滑衔接下一轮递进。
 */
export class PosterAnimation extends BaseAnimation {
  readonly name = 'poster'

  /** 4.4–5.25s 是海报完整停留，取中段作为减少动态时的定格帧。 */
  protected holdTime(): number {
    return 4.8
  }

  private static readonly LAYERS = [
    { selector: '.cv-poster__type', ax: 46, ay: 30, duration: 1.0 },
    { selector: '.cv-poster__spatial-stage', ax: 35, ay: 24, duration: 1.12 },
    { selector: '.cv-poster__marks', ax: 22, ay: 15, duration: 1.24 },
    { selector: '.cv-poster__grid', ax: 16, ay: 12, duration: 1.38 },
  ] as const

  private layers: BoundLayer[] = []
  private active = true
  private onMove: ((e: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null
  private isPointerAttached = false
  private ambientTweens: gsap.core.Tween[] = []

  /**
   * 6.0s 环境主循环：严格有限时长（纯 6 秒序列，无无限子动画污染）。
   */
  protected build(tl: CardTimeline, host: HTMLElement): void {
    if (!host || typeof host.querySelector !== 'function') return

    const plateDeep = host.querySelector<HTMLElement>('.cv-poster__plate-layer--deep')
    const plateMain = host.querySelector<HTMLElement>('.cv-poster__plate-layer--main')
    const plateFore = host.querySelector<HTMLElement>('.cv-poster__plate-layer--fore')
    const badge = host.querySelector<HTMLElement>('.cv-poster__badge')
    const chars = host.querySelectorAll<HTMLElement>('.cv-poster__p-char')
    const posterType = host.querySelector<HTMLElement>('.cv-poster__type-inner') ?? host.querySelector<HTMLElement>('.cv-poster__type')
    const marks = host.querySelectorAll<HTMLElement>('.cv-poster__crop, .cv-poster__reg')

    // 0.0s – 0.8s: 多层版面从远处向镜头推进
    if (plateDeep) {
      tl.fromTo(
        plateDeep,
        { z: -420, opacity: 0.2 },
        { z: -240, opacity: 0.65, duration: 0.8, ease: 'power2.out' },
        0,
      )
    }
    if (plateMain) {
      tl.fromTo(
        plateMain,
        { z: -360, opacity: 0.2, rotateY: -12, rotateX: 6 },
        { z: -60, opacity: 1, rotateY: -8, rotateX: 4, duration: 0.85, ease: 'power2.out' },
        0.05,
      )
    }
    if (plateFore) {
      tl.fromTo(
        plateFore,
        { z: -140, opacity: 0.3, rotateY: -22 },
        { z: 160, opacity: 1, rotateY: -18, duration: 0.8, ease: 'power2.out' },
        0.1,
      )
    }

    // 0.8s – 2.0s: 近景版面掠过出画，中间一层停住成为主海报
    if (plateFore) {
      tl.to(
        plateFore,
        { z: 540, x: -80, opacity: 0, duration: 0.95, ease: 'power2.in' },
        0.8,
      )
    }
    if (plateMain) {
      tl.to(
        plateMain,
        { z: 0, duration: 1.1, ease: 'power3.out' },
        0.85,
      )
    }
    if (posterType) {
      tl.fromTo(
        posterType,
        { x: -50, opacity: 0.2 },
        { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' },
        0.85,
      )
    }

    // 2.0s – 3.2s: POSTER 字母沿不同基线进入主版面；星芒印记旋转穿出
    if (chars.length) {
      const baselines = [-32, 40, -24, 36, -18, 28]
      tl.fromTo(
        chars,
        { y: (i: number) => baselines[i] ?? 0, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.05,
          ease: 'power4.out',
        },
        2.0,
      )
    }

    if (badge) {
      tl.fromTo(
        badge,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 0.9,
          duration: 0.85,
          ease: 'back.out(1.4)',
        },
        2.2,
      )
    }

    // 3.05s – 4.0s: 主海报略微转正，裁切线和辅助信息完成排版（提前至 3.05s 确保定格窗口 >= 1.2s）
    if (plateMain) {
      tl.to(
        plateMain,
        { rotateY: 0, rotateX: 0, duration: 0.85, ease: 'power2.out' },
        3.05,
      )
    }
    if (marks.length) {
      tl.fromTo(
        marks,
        { opacity: 0.1, scale: 0.8 },
        { opacity: 0.55, scale: 1, duration: 0.6, stagger: 0.05, ease: 'power2.out' },
        3.15,
      )
    }

    // 4.0s – 5.2s: 海报完整构图稳定停留（1.20s+ 窗口）

    // 5.2s – 6.0s: 首尾同构收束，回到 0s 的 from 态，衔接下一轮
    if (plateMain) {
      tl.to(
        plateMain,
        { z: -360, opacity: 0.2, rotateY: -12, rotateX: 6, duration: 0.7, ease: 'power2.in' },
        5.2,
      )
    }
    if (plateDeep) {
      tl.to(plateDeep, { z: -420, opacity: 0.2, duration: 0.6, ease: 'power2.in' }, 5.25)
    }
    if (badge) {
      tl.to(badge, { scale: 0, rotation: -180, opacity: 0, duration: 0.45, ease: 'power2.in' }, 5.3)
    }
    if (posterType) {
      tl.to(posterType, { x: -50, opacity: 0.2, duration: 0.55, ease: 'power2.in' }, 5.35)
    }
    if (chars.length) {
      const baselines = [-32, 40, -24, 36, -18, 28]
      tl.to(
        chars,
        {
          y: (i: number) => baselines[i] ?? 0,
          opacity: 0,
          duration: 0.45,
          ease: 'power2.in',
        },
        5.35,
      )
    }
    if (marks.length) {
      tl.to(marks, { opacity: 0.1, scale: 0.8, duration: 0.4, ease: 'power2.in' }, 5.4)
    }
    if (plateFore) {
      tl.to(
        plateFore,
        { z: -140, opacity: 0.3, rotateY: -22, x: 0, duration: 0.45, ease: 'power2.in' },
        5.45,
      )
    }
    tl.to({}, { duration: 0.01 }, 5.99)
  }

  mount(host: HTMLElement): void {
    super.mount(host)
    this.layers = []
    for (const l of PosterAnimation.LAYERS) {
      const el = host.querySelector<HTMLElement>(l.selector)
      if (!el) continue
      this.layers.push({
        ax: l.ax,
        ay: l.ay,
        sx: gsap.quickTo(el, 'x', { duration: l.duration, ease: 'power3.out' }),
        sy: gsap.quickTo(el, 'y', { duration: l.duration, ease: 'power3.out' }),
      })
    }

    // 套准十字微光移出主时间线，独立无限运行
    this.ambientTweens.forEach((t) => t.kill())
    this.ambientTweens = []
    const reg = host.querySelector<HTMLElement>('.cv-poster__reg')
    if (reg) {
      this.ambientTweens.push(
        gsap.to(reg, { opacity: 0.8, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
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

  setMedia(media: CardMedia): void {
    const plate = this.host?.querySelector<HTMLElement>('.cv-poster__plate-layer--main')
    const art = this.host?.querySelector<HTMLElement>('.cv-poster__art')
    if (!plate) return
    if (media.type === 'image' && media.src) {
      plate.style.backgroundImage = `url("${media.src}")`
      plate.style.backgroundSize = 'cover'
      plate.style.backgroundPosition = 'center'
      if (art) art.style.opacity = '0'
    }
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

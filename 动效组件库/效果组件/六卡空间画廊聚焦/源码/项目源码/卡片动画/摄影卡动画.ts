import gsap from 'gsap'
import { BaseAnimation, type BoundLayer, type CardTimeline } from './卡片动画基础'
import type { CardMedia } from './卡片动画类型'

/**
 * 06 / PHOTO —— “光学结构形成影像” (Optical Structure & Image Formation) MG 动画。
 *
 * 核心设计语言：
 * 借鉴立体环形运动，转化为镜头环、光圈叶片与摄影画幅的连续光学演变。
 * 显露项目已有高画质摄影作品（真实山色与自然影像），
 * 圆形光圈开口连续扩展为严整矩形画幅，不使用频繁闪白，保证极致清晰度。
 *
 * 动作分镜编排（6.0s 严格有限时长主循环）：
 *
 * 0.0s – 1.0s: 【镜头环空间转动】
 *   外环（焦距环）与内环（对焦环）在空间中不同轴转动，具有真实的前后深度与遮挡。
 *
 * 1.0s – 2.0s: 【逐渐同轴 & 光圈叶片闭合张开】
 *   两环逐渐归零同轴，镜头正面朝向观众；
 *   光圈叶片接力闭合到小孔径后顺畅舒展张开，推动下一阶段的光学成像。
 *
 * 2.0s – 3.2s: 【光圈开口连续扩展为矩形画幅】
 *   圆形通光口内显露真实摄影作品，并由圆形开口连续物理插值扩展为矩形画幅，
 *   图像完全连续保持，绝不消失或切换。
 *
 * 3.2s – 4.3s: 【PHOTO 字母穿出 & 空间层级定格】
 *   PHOTO 单字自画幅后方依次穿出落位，作品、画幅、标题与 Exif 形成清晰纵深。
 *
 * 4.3s – 6.0s: 【充分停留 & 收束回光圈闭环】
 *   作品充分停留供品鉴，带极微景深漂移；5.2s 画幅平滑收束回光圈，无缝闭环。
 */
export class PhotoAnimation extends BaseAnimation {
  readonly name = 'photo'

  /** 4.3–5.2s 是作品充分停留，取中段作为减少动态时的定格帧。 */
  protected holdTime(): number {
    return 4.7
  }

  private static readonly LAYERS = [
    { selector: '.cv-photo__image', ax: 30, ay: 22, duration: 1.15 },
    { selector: '.cv-photo__frame', ax: 22, ay: 15, duration: 1.25 },
    { selector: '.cv-photo__type', ax: 16, ay: 11, duration: 1.35 },
    { selector: '.cv-photo__optical-stage', ax: 12, ay: 8, duration: 1.4 },
    { selector: '.cv-photo__meta', ax: 8, ay: 6, duration: 1.45 },
  ] as const

  private layers: BoundLayer[] = []
  private active = true
  private onMove: ((e: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null
  private isPointerAttached = false

  /**
   * 6.0s 环境主循环：严格有限时长（纯 6 秒序列，无无限子动画污染）。
   */
  protected build(tl: CardTimeline, host: HTMLElement): void {
    if (!host || typeof host.querySelector !== 'function') return

    const ringOuter = host.querySelector<HTMLElement>('.cv-photo__lens-ring--outer')
    const ringInner = host.querySelector<HTMLElement>('.cv-photo__lens-ring--inner')
    const apertureWrap = host.querySelector<HTMLElement>('.cv-photo__aperture-wrap')
    const blades = host.querySelectorAll<SVGElement>('.aperture-blade')
    const plate = host.querySelector<HTMLElement>('.cv-photo__plate')
    const artwork = host.querySelector<HTMLElement>('.cv-photo__artwork')
    const letters = host.querySelectorAll<HTMLElement>('.cv-photo__letter')
    const frameBox = host.querySelector<HTMLElement>('.cv-photo__frame-box')
    const light = host.querySelector<HTMLElement>('.cv-photo__light')
    const meta = host.querySelectorAll<HTMLElement>('.cv-photo__mark, .cv-photo__exif, .cv-photo__archive, .cv-photo__year')

    // 0.0s – 1.0s: 两个镜头环在空间中转动
    if (ringOuter) {
      tl.fromTo(
        ringOuter,
        { rotateY: -45, rotateX: 24, z: 90, opacity: 0.3 },
        { rotateY: -15, rotateX: 8, z: 30, opacity: 0.85, duration: 1.0, ease: 'power2.out' },
        0,
      )
    }
    if (ringInner) {
      tl.fromTo(
        ringInner,
        { rotateY: 36, rotateX: -20, z: 40, opacity: 0.3 },
        { rotateY: 12, rotateX: -6, z: 15, opacity: 0.75, duration: 1.0, ease: 'power2.out' },
        0,
      )
    }

    // 1.0s – 2.0s: 两个环逐渐同轴朝向观众；光圈叶片接力闭合与张开
    if (ringOuter) {
      tl.to(ringOuter, { rotateY: 0, rotateX: 0, z: 0, duration: 0.8, ease: 'power3.out' }, 1.0)
    }
    if (ringInner) {
      tl.to(ringInner, { rotateY: 0, rotateX: 0, z: 0, duration: 0.8, ease: 'power3.out' }, 1.0)
    }

    if (blades.length) {
      tl.to(
        blades,
        {
          scale: 0.65,
          rotation: 32,
          duration: 0.35,
          stagger: 0.02,
          ease: 'power2.in',
        },
        1.1,
      )
      tl.to(
        blades,
        {
          scale: 1.25,
          rotation: -18,
          opacity: 0.25,
          duration: 0.45,
          ease: 'power2.out',
        },
        1.5,
      )
    }

    // 2.0s – 3.2s: 圆形开口连续扩展成矩形画幅 (全程 inset 插值，保证对称性与平滑展开)
    if (plate) {
      tl.fromTo(
        plate,
        { clipPath: 'inset(41% 41% 41% 41% round 50%)', opacity: 0.9 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 50%)',
          duration: 0.9,
          ease: 'power2.inOut',
        },
        2.0,
      )
      tl.to(
        plate,
        {
          clipPath: 'inset(0% 0% 0% 0% round 0%)',
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
        },
        2.9,
      )
    }

    if (apertureWrap) {
      tl.to(apertureWrap, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 2.5)
    }
    if (ringOuter && ringInner) {
      tl.to([ringOuter, ringInner], { opacity: 0.2, duration: 0.6, ease: 'power2.out' }, 2.6)
    }

    // 3.2s – 4.3s: PHOTO 字母从画幅后方穿出落位，空间层级定格
    if (letters.length) {
      tl.fromTo(
        letters,
        { x: 35, opacity: 0 },
        {
          x: 0,
          opacity: 0.92,
          duration: 0.65,
          stagger: 0.07,
          ease: 'power3.out',
        },
        3.2,
      )
    }

    if (frameBox) {
      tl.fromTo(
        frameBox,
        { opacity: 0.2, scale: 1.04 },
        { opacity: 0.55, scale: 1.0, duration: 0.6, ease: 'power2.out' },
        3.3,
      )
    }
    if (light) {
      tl.fromTo(
        light,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 0.4, duration: 0.6, ease: 'power2.out' },
        3.4,
      )
    }
    if (meta.length) {
      tl.fromTo(
        meta,
        { opacity: 0, y: 6 },
        { opacity: 0.65, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' },
        3.5,
      )
    }

    // 4.2s – 5.4s: 作品充分停留，微弱景深漂移（4.2-4.6s 跑完，幅值降至 1.012，定格窗口达到 1.20s）
    if (artwork) {
      tl.to(artwork, { scale: 1.012, duration: 0.4, ease: 'sine.inOut' }, 4.2)
    }

    // 5.4s – 6.0s: 首尾同构收束，元素回到 0s 的 from 态，衔接下一轮
    if (letters.length) {
      tl.to(letters, { opacity: 0, x: 35, duration: 0.45, ease: 'power2.in' }, 5.4)
    }
    if (light) {
      tl.to(light, { scaleX: 0, opacity: 0, duration: 0.35, ease: 'power2.in' }, 5.4)
    }
    if (meta.length) {
      tl.to(meta, { opacity: 0, y: 6, duration: 0.4, ease: 'power2.in' }, 5.4)
    }
    if (frameBox) {
      tl.to(frameBox, { opacity: 0.2, scale: 1.04, duration: 0.45, ease: 'power2.in' }, 5.4)
    }
    if (artwork) {
      tl.to(artwork, { scale: 1.0, duration: 0.45, ease: 'power2.in' }, 5.4)
    }
    if (plate) {
      tl.to(
        plate,
        {
          clipPath: 'inset(41% 41% 41% 41% round 50%)',
          opacity: 0.9,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        5.45,
      )
    }
    if (apertureWrap) {
      tl.to(apertureWrap, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 5.45)
    }
    if (ringOuter) {
      tl.to(
        ringOuter,
        { rotateY: -45, rotateX: 24, z: 90, opacity: 0.3, duration: 0.5, ease: 'power2.inOut' },
        5.45,
      )
    }
    if (ringInner) {
      tl.to(
        ringInner,
        { rotateY: 36, rotateX: -20, z: 40, opacity: 0.3, duration: 0.5, ease: 'power2.inOut' },
        5.45,
      )
    }
    tl.to({}, { duration: 0.01 }, 5.99)
  }

  mount(host: HTMLElement): void {
    super.mount(host)
    this.layers = []
    for (const l of PhotoAnimation.LAYERS) {
      const el = host.querySelector<HTMLElement>(l.selector)
      if (!el) continue
      this.layers.push({
        ax: l.ax,
        ay: l.ay,
        sx: gsap.quickTo(el, 'x', { duration: l.duration, ease: 'power3.out' }),
        sy: gsap.quickTo(el, 'y', { duration: l.duration, ease: 'power3.out' }),
      })
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
    } else {
      this.attachPointer()
    }
  }

  destroy(): void {
    this.detachPointer()
    this.onMove = null
    this.onLeave = null
    this.layers = []
    super.destroy()
  }

  setMedia(media: CardMedia): void {
    const artwork = this.host?.querySelector<HTMLImageElement>('.cv-photo__artwork')
    if (!artwork) return
    if (media.type === 'image' && media.src) {
      artwork.src = media.src
      if (media.alt) artwork.alt = media.alt
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

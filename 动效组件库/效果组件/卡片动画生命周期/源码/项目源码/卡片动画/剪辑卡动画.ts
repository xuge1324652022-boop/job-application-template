import gsap from 'gsap'
import { BaseAnimation, type BoundLayer, type CardTimeline } from './卡片动画基础'

/**
 * 02 / EDIT —— “节奏剪辑” (Rhythm & Cut) MG 动画。
 *
 * 核心设计语言：
 * 借鉴斜向文字带和前后遮挡穿插，让「切割」与「吸附」本身成为主要的视觉语言。
 * 画面具备后（视频帧与后方文字带）、中（巨型 EDIT 与水平三切片）、前（前景遮挡文字带、时间线播放头）
 * 明确的三层深度空间，并由指针视差系统提供多层级物理漂移。
 *
 * 动作分镜编排（6.0s 严格有限时长主循环）：
 *
 * 0.0s – 0.6s: 【基线展开】
 *   EDIT 巨型字形沿横向基线由左向右迅速展延展开（scaleX: 0.16 -> 1.0），
 *   配合 power3.out 极速制动，形成强烈的横向排版张力。辅助播放头快速滑入切点。
 *
 * 0.6s – 1.6s: 【切片穿字 & 三次节拍卡点重新对齐】
 *   0.60s 刀光闪现穿过字形，巨字被水平裁切为三个切片（slice--1, slice--2, slice--3）。
 *   三切片在冲击力下分别向左、右产生短距离错位：
 *     - 节拍 1 (0.88s): 下切片率先以 power4.out 重击吸附回原位，时间线片段 B 产生敲击受震；
 *     - 节拍 2 (1.18s): 上切片次卡点反向收拢吸附对齐，时间线片段 C 同步轻震；
 *     - 节拍 3 (1.48s): 中切片压轴严丝合缝咬合归位，刀口与播放头白光微闪锁定，EDIT 恢复严整！
 *
 * 1.6s – 2.8s: 【前后文字带双向飞掠穿梭】
 *   两条宽文字带以 -13° 倾角自相反方向斜向飞梭穿插：
 *     - 后方文字带（.cv-edit__ribbon--back）在 EDIT 巨字后方从右向左疾掠；
 *     - 前方文字带（.cv-edit__ribbon--front）在 EDIT 巨字正前方自左向右高速飞过，
 *       产生强烈的物理遮挡夹层，构建出立体的纵深与剪辑速度感。
 *
 * 2.8s – 4.0s: 【扫过切分 & 错拍震荡同时吸附】
 *   前景文字带向画面外掠过，动量顺势将画面横向切裂为三个区域。
 *   三区域产生富有切分节奏（Syncopation）的错拍震荡与微位移；
 *   在 3.48s 伴随刀口光线一闪，三区域如被强磁场瞬间拽回，【同时吸附】拼合成完整 EDIT！
 *
 * 4.0s – 6.0s: 【张力停顿 & 终末带走收束】
 *   4.0s – 5.20s: 保留有极高张力与清晰可读性的完整排版，静止供审阅（1.20s 定格窗口）；
 *   5.20s – 5.85s: 一道由左至右横扫画面的高光切片（exit-cut）带走画面，各切片微幅收束；
 *   5.85s – 6.0s: 构图平滑复位归零，优雅闭环，无缝衔接下一轮 0s 展开！
 */
export class EditAnimation extends BaseAnimation {
  readonly name = 'edit'

  /** 4.0–5.20s 是张力停顿，取中段作为减少动态时的定格帧。 */
  protected holdTime(): number {
    return 4.5
  }

  /** 每个图层的响应参数，单位是「满偏转时卡片局部坐标的像素数」。 */
  private static readonly LAYERS = [
    { selector: '.cv-edit__ribbon-front-layer', ax: 65, ay: 42, duration: 0.9 },
    { selector: '.cv-edit__type', ax: 55, ay: 36, duration: 1.0 },
    { selector: '.cv-edit__timeline', ax: 30, ay: 20, duration: 1.15 },
    { selector: '.cv-edit__frames', ax: 20, ay: 13, duration: 1.3 },
  ] as const

  private layers: BoundLayer[] = []
  private active = true
  private onMove: ((e: PointerEvent) => void) | null = null
  private onLeave: (() => void) | null = null
  private isPointerAttached = false

  /**
   * 6.0s 环境主循环：严格有限时长（纯 6 秒时间线，无无限子动画污染）。
   */
  protected build(tl: CardTimeline, host: HTMLElement): void {
    if (!host || typeof host.querySelector !== 'function') return

    const slice1 = host.querySelector<HTMLElement>('.cv-edit__slice--1')
    const slice2 = host.querySelector<HTMLElement>('.cv-edit__slice--2')
    const slice3 = host.querySelector<HTMLElement>('.cv-edit__slice--3')
    const cutline1 = host.querySelector<HTMLElement>('.cv-edit__cutline--1')
    const cutline2 = host.querySelector<HTMLElement>('.cv-edit__cutline--2')
    const exitCut = host.querySelector<HTMLElement>('.cv-edit__exit-cut')

    const ribbonBack = host.querySelector<HTMLElement>('.cv-edit__ribbon--back')
    const ribbonFront = host.querySelector<HTMLElement>('.cv-edit__ribbon--front')
    const trackBack = host.querySelector<HTMLElement>('.cv-edit__ribbon-track--back')
    const trackFront = host.querySelector<HTMLElement>('.cv-edit__ribbon-track--front')

    const playhead = host.querySelector<HTMLElement>('.cv-edit__playhead')
    const blade = host.querySelector<HTMLElement>('.cv-edit__blade')
    const clipB = host.querySelector<HTMLElement>('.cv-edit__clip--b')
    const clipC = host.querySelector<HTMLElement>('.cv-edit__clip--c')
    const timecode = host.querySelector<HTMLElement>('.cv-edit__timecode')
    const frameB = host.querySelector<HTMLElement>('.cv-edit__frame--b')

    // 0.0s – 0.6s: EDIT 巨字沿横向基线迅速展开
    const allSlices = [slice1, slice2, slice3].filter((s): s is HTMLElement => Boolean(s))
    if (allSlices.length) {
      tl.fromTo(
        allSlices,
        { scaleX: 0.16, opacity: 0.28, transformOrigin: 'left center' },
        { scaleX: 1.0, opacity: 0.9, duration: 0.56, ease: 'power3.out' },
        0,
      )
    }

    if (playhead) {
      tl.fromTo(
        playhead,
        { x: -90, opacity: 0.25 },
        { x: 0, opacity: 1, duration: 0.54, ease: 'power3.out' },
        0,
      )
    }

    if (timecode) {
      tl.fromTo(
        timecode,
        { opacity: 0.1, x: -10 },
        { opacity: 0.34, x: 0, duration: 0.5, ease: 'power2.out' },
        0.06,
      )
    }

    // 后景视频帧有限轻微呼吸
    if (frameB) {
      tl.to(frameB, { y: 3, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.4)
    }

    // 0.6s – 1.6s: 三条窄切片穿过字形，错位后按三次节拍重新对齐
    if (cutline1 && cutline2) {
      tl.fromTo(
        [cutline1, cutline2],
        { opacity: 0, scaleX: 0 },
        { opacity: 0.95, scaleX: 1, duration: 0.08, stagger: 0.03, ease: 'power2.out' },
        0.6,
      )
      tl.to([cutline1, cutline2], { opacity: 0, duration: 0.14, ease: 'power2.in' }, 0.7)
    }

    if (blade) {
      tl.fromTo(
        blade,
        { opacity: 0, scaleY: 0.2 },
        { opacity: 1, scaleY: 1, duration: 0.06, ease: 'power1.out' },
        0.62,
      )
      tl.to(blade, { opacity: 0, duration: 0.12, ease: 'power2.out' }, 0.68)
    }

    // 三切片受击错位
    if (slice1 && slice2 && slice3) {
      tl.to(slice1, { x: -38, duration: 0.16, ease: 'power2.out' }, 0.62)
      tl.to(slice2, { x: 32, duration: 0.16, ease: 'power2.out' }, 0.62)
      tl.to(slice3, { x: -24, duration: 0.16, ease: 'power2.out' }, 0.62)

      // 节拍 1 (0.88s): 下切片率先以 power4.out 吸附归位
      tl.to(slice3, { x: 0, duration: 0.2, ease: 'power4.out' }, 0.88)
      if (clipB) {
        tl.fromTo(clipB, { x: -8 }, { x: 0, duration: 0.22, ease: 'power2.out' }, 0.88)
      }

      // 节拍 2 (1.18s): 上切片吸附归位
      tl.to(slice1, { x: 0, duration: 0.2, ease: 'power4.out' }, 1.18)
      if (clipC) {
        tl.fromTo(clipC, { x: 10 }, { x: 0, duration: 0.22, ease: 'power2.out' }, 1.18)
      }

      // 节拍 3 (1.48s): 中切片压轴咬合吸附归位
      tl.to(slice2, { x: 0, duration: 0.22, ease: 'power4.out' }, 1.48)
      if (blade) {
        tl.to(blade, { opacity: 0.75, duration: 0.02 }, 1.48)
        tl.to(blade, { opacity: 0, duration: 0.12, ease: 'power2.out' }, 1.5)
      }
    }

    // 1.6s – 2.8s: 两条宽文字带相反方向斜向穿过（后方向左，前方反白向右）
    if (ribbonBack && trackBack) {
      tl.to(ribbonBack, { opacity: 0.82, duration: 0.24, ease: 'power2.out' }, 1.6)
      tl.fromTo(
        trackBack,
        { x: '18%' },
        { x: '-24%', duration: 1.18, ease: 'power2.inOut' },
        1.6,
      )
    }

    if (ribbonFront && trackFront) {
      tl.to(ribbonFront, { opacity: 1.0, duration: 0.2, ease: 'power2.out' }, 1.72)
      tl.fromTo(
        trackFront,
        { x: '-26%' },
        { x: '16%', duration: 1.06, ease: 'power2.inOut' },
        1.72,
      )
    }

    // 2.8s – 4.0s: 前景文字带扫过，顺势切成三个区域错拍运动，再同时吸附成完整 EDIT
    if (ribbonFront) {
      tl.to(ribbonFront, { x: '14%', opacity: 0, duration: 0.36, ease: 'power2.in' }, 2.8)
    }
    if (ribbonBack) {
      tl.to(ribbonBack, { x: '-14%', opacity: 0, duration: 0.36, ease: 'power2.in' }, 2.8)
    }

    if (slice1 && slice2 && slice3) {
      tl.to(slice1, { x: 34, y: -8, duration: 0.32, ease: 'power2.out' }, 2.88)
      tl.to(slice2, { x: -40, y: 3, duration: 0.3, ease: 'power2.out' }, 2.88)
      tl.to(slice3, { x: 22, y: 7, duration: 0.34, ease: 'power2.out' }, 2.88)

      // 3.20s - 3.42s: 错拍运动
      tl.to(slice1, { x: 20, y: -4, duration: 0.24, ease: 'sine.inOut' }, 3.2)
      tl.to(slice2, { x: -24, y: 2, duration: 0.22, ease: 'sine.inOut' }, 3.22)
      tl.to(slice3, { x: 12, y: 4, duration: 0.26, ease: 'sine.inOut' }, 3.2)

      // 3.48s: 刀光闪烁，三区域【同时吸附】拼合成完整 EDIT
      if (cutline1 && cutline2) {
        tl.fromTo(
          [cutline1, cutline2],
          { opacity: 0, scaleX: 0 },
          { opacity: 0.95, scaleX: 1, duration: 0.08, ease: 'power1.out' },
          3.46,
        )
        tl.to([cutline1, cutline2], { opacity: 0, duration: 0.16, ease: 'power2.in' }, 3.54)
      }
      tl.to(
        [slice1, slice2, slice3],
        { x: 0, y: 0, duration: 0.28, ease: 'power4.out' },
        3.48,
      )
    }

    // 4.0s – 6.0s: 保留有张力的标题排版，停顿后由一条切片带走画面，完成循环
    if (exitCut) {
      tl.fromTo(
        exitCut,
        { scaleX: 0, opacity: 0, x: '-100%' },
        { scaleX: 1.3, opacity: 0.9, x: '100%', duration: 0.72, ease: 'power2.inOut' },
        5.2,
      )
      tl.to(exitCut, { opacity: 0, duration: 0.06 }, 5.92)
      tl.set(exitCut, { scaleX: 0, opacity: 0, x: '-100%' }, 5.99)
    }

    if (slice1 && slice2 && slice3) {
      tl.to(slice1, { x: 10, opacity: 0.35, duration: 0.35, ease: 'power2.in' }, 5.47)
      tl.to(slice2, { x: -14, opacity: 0.35, duration: 0.35, ease: 'power2.in' }, 5.47)
      tl.to(slice3, { x: 8, opacity: 0.35, duration: 0.35, ease: 'power2.in' }, 5.47)

      // 5.84s - 5.98s: 切片平滑对齐 0s 的 from 态 (scaleX 0.16, opacity 0.28)
      tl.to(
        [slice1, slice2, slice3],
        { x: 0, y: 0, scaleX: 0.16, opacity: 0.28, duration: 0.14, ease: 'power2.out' },
        5.84,
      )
    }

    if (playhead) {
      tl.to(playhead, { x: -90, opacity: 0.25, duration: 0.14, ease: 'power2.in' }, 5.85)
    }
    if (timecode) {
      tl.to(timecode, { opacity: 0.1, x: -10, duration: 0.14, ease: 'power2.in' }, 5.85)
    }

    if (ribbonFront) {
      tl.to(ribbonFront, { x: '0%', opacity: 0, duration: 0.01 }, 5.95)
    }
    if (ribbonBack) {
      tl.to(ribbonBack, { x: '0%', opacity: 0, duration: 0.01 }, 5.95)
    }
    tl.to({}, { duration: 0.01 }, 5.99)
  }

  mount(host: HTMLElement): void {
    super.mount(host)
    this.layers = []
    for (const l of EditAnimation.LAYERS) {
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

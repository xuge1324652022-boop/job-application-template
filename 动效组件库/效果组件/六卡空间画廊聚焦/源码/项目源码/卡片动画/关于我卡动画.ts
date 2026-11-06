import gsap from 'gsap'
import { BaseAnimation, type CardTimeline } from './卡片动画基础'

/**
 * 01 / ABOUT —— “身份构建” (Identity Construction) MG 动画。
 *
 * 主视觉：由几何结构组成的 Q，以及真实配置中的姓名（全翔宇 / Quan Xiangyu）。
 *
 * 分镜动作编排（6.0s 严格有限时长主循环）：
 *   0.0s – 0.5s:
 *     实心圆（.q-disc）迅速自上方进场，接触落点时发生物理挤压（squash: scaleX 1.28, scaleY 0.76）
 *     与弹性回弹（rebound），展现沉实而有张力的质量感。
 *
 *   0.5s – 1.4s:
 *     实心圆内部镂空化为圆环（.q-ring），右下方对角切线短线（.q-tail）从内部沿惯性旋转轨迹切出，
 *     在 135° 切口处带阻尼对位卡扣咬合，精准拼合成大写字母 "Q"。
 *
 *   1.4s – 2.6s:
 *     Q 结构顺滑放大（scale 1.16），圆形内部成为取景遮罩窗口（.q-window）。
 *     真实姓名的每个字（.about-exp__char）从窗口后方带不同初始偏角（-14°, 12°, -8°...）
 *     依次穿透而出，出窗后受磁吸拉正，整齐落位于排版位置。
 *
 *   2.6s – 4.0s:
 *     后景巨型 ABOUT 标题字从深空向前推进，Q 带着优雅阻尼微缩滑移至侧翼，
 *     窗口内透出人像剪影辅助层（.q-portrait），姓名、Q 与 ABOUT 形成清晰稳固的三层空间层级。
 *
 *   4.0s – 5.3s:
 *     完整身份构图静止停留，供观众审阅品味。
 *
 *   5.3s – 6.0s:
 *     Q 的圆弧带动外围线条顺时针收束入圆心，平滑衔接下一轮实心圆进场。
 */
export class AboutAnimation extends BaseAnimation {
  readonly name = 'about'

  /** 4.0–5.3s 是完整身份构图停留，取中段作为减少动态时的定格帧。 */
  protected holdTime(): number {
    return 4.6
  }

  private active = true

  /**
   * 6.0s 环境主循环：一轨到底，消除与 intro 时间线的双轨竞争。
   */
  protected build(tl: CardTimeline, host: HTMLElement): void {
    if (!host || typeof host.querySelector !== 'function') return
    const disc = host.querySelector<SVGElement>('.q-disc')
    const ring = host.querySelector<SVGElement>('.q-ring')
    const tail = host.querySelector<SVGElement>('.q-tail')
    const bar = host.querySelectorAll<SVGElement>('.q-bar')
    const logo = host.querySelector<HTMLElement>('.about-exp__logo-inner') ?? host.querySelector<HTMLElement>('.about-exp__logo')
    const chars = host.querySelectorAll<HTMLElement>('.about-exp__char')
    const nameEn = host.querySelector<HTMLElement>('.about-exp__name-en')
    const type = host.querySelector<HTMLElement>('.about-exp__type-inner') ?? host.querySelector<HTMLElement>('.about-exp__type')
    const portrait = host.querySelector<SVGElement>('.q-portrait')
    const rule = host.querySelector<HTMLElement>('.about-exp__rule')
    const roles = host.querySelectorAll<HTMLElement>('.about-exp__role')
    const meta = host.querySelector<HTMLElement>('.about-exp__meta')

    // 0.0s – 0.5s: 实心圆急速进场与物理压缩回弹
    if (disc) {
      tl.fromTo(
        disc,
        { y: -160, scaleX: 0.8, scaleY: 1.25, opacity: 0 },
        { y: 0, scaleX: 1, scaleY: 1, opacity: 0.95, duration: 0.38, ease: 'power3.in' },
        0,
      )
      tl.to(disc, { scaleX: 1.28, scaleY: 0.74, duration: 0.06, ease: 'power1.out' }, 0.38)
      tl.to(disc, { scaleX: 0.92, scaleY: 1.08, duration: 0.05, ease: 'power1.inOut' }, 0.44)
      tl.to(disc, { scaleX: 1.0, scaleY: 1.0, duration: 0.04, ease: 'power2.out' }, 0.49)
    }

    // 0.5s – 1.4s: 分解与旋转拼合成 Q
    if (disc && ring) {
      tl.to(disc, { opacity: 0.04, duration: 0.45, ease: 'power2.inOut' }, 0.52)
      tl.fromTo(
        ring,
        { opacity: 0, scale: 0.92, strokeWidth: 1 },
        { opacity: 1, scale: 1, strokeWidth: 2.4, duration: 0.55, ease: 'power2.out' },
        0.52,
      )
    }
    if (tail) {
      tl.fromTo(
        tail,
        { x: -32, y: -32, rotation: -120, opacity: 0, scale: 0.4 },
        { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, duration: 0.78, ease: 'power3.out' },
        0.55,
      )
    }
    if (bar.length) {
      tl.fromTo(
        bar,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 0.6, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
        0.7,
      )
    }

    // 1.4s – 2.6s: Q 放大为遮罩窗口，姓名字母穿出落位
    if (logo) {
      tl.to(logo, { scale: 1.16, duration: 0.65, ease: 'power2.out' }, 1.4)
    }
    if (chars.length) {
      const angles = [-14, 12, -8, 10, -6]
      tl.fromTo(
        chars,
        {
          opacity: 0,
          scale: 0.45,
          y: 40,
          rotation: (i: number) => angles[i % angles.length] ?? 0,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotation: 0,
          duration: 0.85,
          stagger: 0.09,
          ease: 'power3.out',
        },
        1.55,
      )
    }
    if (nameEn) {
      tl.fromTo(
        nameEn,
        { opacity: 0, x: -16 },
        { opacity: 0.7, x: 0, duration: 0.65, ease: 'power2.out' },
        1.9,
      )
    }

    // 2.6s – 4.0s: ABOUT 巨字前推，Q 缩到侧翼，人像辅助层显影
    if (type) {
      tl.fromTo(
        type,
        { y: -26, scale: 0.92, opacity: 0.25 },
        { y: 0, scale: 1, opacity: 0.9, duration: 1.1, ease: 'power2.out' },
        2.6,
      )
    }
    if (logo) {
      tl.to(logo, { x: 28, y: -14, scale: 0.86, duration: 1.05, ease: 'power3.out' }, 2.6)
    }
    if (portrait) {
      tl.fromTo(
        portrait,
        { opacity: 0, scale: 0.88 },
        { opacity: 0.35, scale: 1.0, duration: 0.95, ease: 'power2.out' },
        2.75,
      )
    }
    if (rule) {
      tl.fromTo(
        rule,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.8, ease: 'power3.out' },
        2.7,
      )
    }
    if (roles.length) {
      tl.fromTo(
        roles,
        { opacity: 0.2, x: -8 },
        { opacity: 0.65, x: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
        2.9,
      )
    }
    if (meta) {
      tl.fromTo(
        meta,
        { opacity: 0.2 },
        { opacity: 0.8, duration: 0.6, ease: 'power1.out' },
        3.2,
      )
    }

    // 4.0s – 5.3s: 完整身份构图停留供品鉴

    // 5.3s – 6.0s: 首尾同构收束，元素回到 0s 的 from 态，衔接下一轮
    if (logo) {
      tl.to(logo, { x: 0, y: 0, scale: 1.0, duration: 0.55, ease: 'power2.inOut' }, 5.3)
    }
    if (portrait) {
      tl.to(portrait, { opacity: 0, scale: 0.88, duration: 0.45, ease: 'power2.in' }, 5.3)
    }
    if (rule) {
      tl.to(rule, { scaleX: 0, duration: 0.45, ease: 'power2.in' }, 5.3)
    }
    if (roles.length) {
      tl.to(roles, { opacity: 0.2, x: -8, duration: 0.45, ease: 'power2.in' }, 5.3)
    }
    if (meta) {
      tl.to(meta, { opacity: 0.2, duration: 0.45, ease: 'power2.in' }, 5.3)
    }
    if (type) {
      tl.to(type, { y: -26, scale: 0.92, opacity: 0.25, duration: 0.6, ease: 'power2.inOut' }, 5.35)
    }
    if (nameEn) {
      tl.to(nameEn, { opacity: 0, x: -16, duration: 0.5, ease: 'power2.in' }, 5.35)
    }
    if (chars.length) {
      tl.to(chars, { opacity: 0, y: 40, scale: 0.45, duration: 0.55, ease: 'power2.in' }, 5.35)
    }
    if (tail) {
      tl.to(
        tail,
        { x: -32, y: -32, rotation: -120, opacity: 0, scale: 0.4, duration: 0.55, ease: 'power2.in' },
        5.38,
      )
    }
    if (bar.length) {
      tl.to(bar, { scaleX: 0, opacity: 0, duration: 0.45, ease: 'power2.in' }, 5.4)
    }
    if (ring) {
      tl.to(ring, { opacity: 0, scale: 0.92, strokeWidth: 1, duration: 0.45, ease: 'power2.in' }, 5.45)
    }
    if (disc) {
      tl.fromTo(
        disc,
        { opacity: 0.04, y: 0, scaleX: 1, scaleY: 1 },
        { y: -160, scaleX: 0.8, scaleY: 1.25, opacity: 0, duration: 0.5, ease: 'power3.in' },
        5.48,
      )
      // 6.0s 严格对齐 0s 状态
      tl.to(disc, { y: -160, scaleX: 0.8, scaleY: 1.25, opacity: 0, duration: 0.02 }, 5.98)
    }
  }

  mount(host: HTMLElement): void {
    if (this.host) {
      gsap.killTweensOf(this.host)
      gsap.set(this.host, { clearProps: 'transform,opacity' })
    }
    super.mount(host)
  }

  /**
   * 聚焦入场。保留对 this.host 的原有补间以满足单元测试与生命周期契约。
   */
  restart(): void {
    if (this.host) {
      gsap.killTweensOf(this.host)
      if (this.reduced()) gsap.set(this.host, { clearProps: 'transform,opacity' })
      else gsap.fromTo(
        this.host,
        { scale: 0.94, y: 14, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.75, ease: 'power2.out' },
      )
    }
    super.restart()
  }

  setActive(active: boolean): void {
    if (this.active === active) return
    this.active = active
    if (!active) {
      this.pause()
    } else {
      this.play()
    }
  }

  destroy(): void {
    if (this.host) {
      gsap.killTweensOf(this.host)
      gsap.set(this.host, { clearProps: 'transform,opacity' })
    }
    super.destroy()
  }
}

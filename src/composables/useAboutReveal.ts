/**
 * 海报、摄影等页面共用的 data 属性揭示与数字入场。
 * CSS 保留可读终态；数字在卸载时还原 data-count-value。
 * 编辑对照由独立 matchMedia 管理，dispose 先撤 pin 再清理揭示。
 */

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { setupEditorialScroll } from './setupEditorialScroll'
import { requestMotionLayoutRefresh } from '../utils/motionLayout'
import { createViewportEntrance } from '../utils/viewportEntrance'

gsap.registerPlugin(ScrollTrigger)

/* ---------------- 通用揭示 ---------------- */
const REVEAL_Y = 26
const REVEAL_DUR = 1
const REVEAL_EASE = 'power3.out'
/** 单个元素：进视口 88% 就出现（元素比较矮，可以晚一点） */
const SINGLE_START = 'top 88%'
/** 成组：容器进视口 84% 整组开始错峰 */
const GROUP_START = 'top 84%'
const STAGGER = 0.08

/* ---------------- 揭示机制（按章节区分，2026-10-10 加） ----------------
 *
 * 验收记录点名：「摄影、海报和个人页大量内容都依赖同一个通用揭示（透明度 0→1、
 * 上移 26px、固定时长）……按章节安排不同的运动机制，不再给所有节点统一套淡入」。
 *
 * 于是把「怎么出现」抽成一个可选项，由**章节**（`data-motion`）决定，
 * 默认仍是 `rise`（老行为），所以没标 `data-motion` 的屏一行都不用改。
 *
 *   rise  — 上移 26px（默认，文字段落最稳）
 *   slide — 从左侧滑入（横向并列的内容：左图右说明、左右对照）
 *   wipe  — 沿 x 轴擦出（`clip-path` 横向展开；给标题、列表行这类"写上去"的内容）
 *   scale — 由 0.94 放大落位（画面型内容：画廊、大图舞台）
 *   fade  — 只改透明度（给已经有自己位移/裁切动画的容器让位）
 *
 * ⚠️ `wipe` 只写 `clip-path`、不写 `opacity`：擦出的过程本身就是「出现」，
 *    再叠一层淡入会显得糊。
 * ⚠️ `wipe` 的 `clip-path` 会**裁掉**溢出自身盒子的一切（拖动中的照片、
 *    焦点环、阴影）。所以它只给「不会把自己拖出盒子」的元素用；
 *    可拖动的照片槽位用 `scale`（transform 不裁切）。
 * ⚠️ `clip-path` 还会给绝对/固定定位的后代建包含块。标 `wipe` 的元素里
 *    不得放 `position: sticky` / `fixed` 的内容。
 * ⚠️ 三处字符串必须**结构一致**（都是 4 个数值），GSAP 是按位置对齐插值的。
 */
type RevealMotion = 'rise' | 'slide' | 'wipe' | 'scale' | 'fade'

const MOTIONS: Record<RevealMotion, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
  rise: { from: { opacity: 0, y: REVEAL_Y }, to: { opacity: 1, y: 0 } },
  slide: { from: { opacity: 0, x: -46 }, to: { opacity: 1, x: 0 } },
  wipe: {
    from: { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' },
    to: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' },
  },
  scale: { from: { opacity: 0, scale: 0.94 }, to: { opacity: 1, scale: 1 } },
  fade: { from: { opacity: 0 }, to: { opacity: 1 } },
}

/**
 * 取一个元素该用哪种机制：看它最近的 `[data-motion]` 祖先（`AboutSection` 的
 * `motion` prop 会把它写在 `<section>` 上）。没标 / 标了不认识的值 → `rise`。
 */
function motionOf(el: HTMLElement): RevealMotion {
  const key = el.closest('[data-motion]')?.getAttribute('data-motion') ?? ''
  return key in MOTIONS ? (key as RevealMotion) : 'rise'
}

interface AboutRevealOptions {
  /** 减少动态效果：不建任何 ScrollTrigger，由 CSS 把内容摆到位。 */
  reduceMotion?: boolean
  /** 页面主标题（第 02 屏上方那个）：进场时从下方浮起。 */
  title?: HTMLElement | null
  /** 可选阅读收尾位置（视口高度比例）；海报页使用中线，其它页面保持原入场节奏。 */
  finishAt?: number
}

/** 页面揭示资源的统一释放句柄。 */
export interface AboutRevealHandle {
  /** 卸载用：先还原被动画改写的文本，再清掉全部 tween / ScrollTrigger。 */
  dispose: () => void
}

/**
 * 建立当前页面标记元素的滚动揭示。
 *
 * ⚠️ 必须在遮罩撤掉、页面解除滚动锁**之后**调用，否则 ScrollTrigger 会在
 *    错误的文档高度上量出 `start` 位置（首屏还没落定，后面所有屏的触发点都偏）。
 */
export function setupAboutReveal(
  root: HTMLElement,
  opts: AboutRevealOptions = {},
): AboutRevealHandle {
  const reduce = opts.reduceMotion === true
  let cancelRefresh: (() => void) | undefined
  const refreshLayout = () => {
    cancelRefresh?.()
    cancelRefresh = requestMotionLayoutRefresh()
  }

  /**
   * 挂了数字滚动的元素。
   * ⚠️ `dispose()` 靠它们自己的 `data-count-value` 把文本还原回去 ——
   *    GSAP 的 `revert()` 管不到 `textContent`，而它拨回起点时会顺手写一个 `0`。
   */
  const countEls: HTMLElement[] = []

  /** 通用揭示 + 数字滚动。**建一次就够，永不随语言重建。** */
  const buildReveal = (): void => {
    if (reduce) return

    if (opts.title) {
      gsap.from(opts.title, { y: 80, opacity: 0, duration: 1.5, ease: 'power3.out' })
    }

    /* ---------- 1. 通用揭示（先收编成组的，剩下的单独触发） ---------- */

    /**
     * 建一条揭示补间。
     * ⚠️ 同一批元素必须**同机制**才能合成一条 tween —— GSAP 的 `fromTo` 对一批
     *    元素只接受一份起点。所以调用方按机制分好桶再进来（见下面的分桶）。
     */
    const revealTween = (
      els: HTMLElement[],
      motion: RevealMotion,
      cfg: { stagger: number; trigger: HTMLElement; start: string },
    ): void => {
      const m = MOTIONS[motion]
      const animation = gsap.fromTo(
        els,
        { ...m.from },
        {
          ...m.to,
          duration: REVEAL_DUR,
          stagger: cfg.stagger,
          ease: REVEAL_EASE,
          paused: opts.finishAt !== undefined,
          ...(opts.finishAt === undefined
            ? {
                scrollTrigger: {
                  trigger: cfg.trigger,
                  start: cfg.start,
                  toggleActions: 'play none none none',
                  once: true,
                },
              }
            : {}),
        },
      )
      if (opts.finishAt !== undefined)
        createViewportEntrance({
          trigger: cfg.trigger,
          finishAt: opts.finishAt,
          play: () => {
            animation.play()
          },
          complete: () => {
            animation.progress(1).pause()
          },
        })
    }

    /** 按机制分桶：一个容器里允许混用不同机制（例如标题擦出、导语上移）。 */
    const bucket = (els: HTMLElement[]): Map<RevealMotion, HTMLElement[]> => {
      const map = new Map<RevealMotion, HTMLElement[]>()
      for (const el of els) {
        const m = motionOf(el)
        const arr = map.get(m)
        if (arr) arr.push(el)
        else map.set(m, [el])
      }
      return map
    }

    const grouped = new Set<HTMLElement>()
    root.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((g) => {
      const items = Array.from(g.querySelectorAll<HTMLElement>('[data-reveal]'))
      if (!items.length) return
      items.forEach((el) => grouped.add(el))
      for (const [motion, els] of bucket(items)) {
        revealTween(els, motion, { stagger: STAGGER, trigger: g, start: GROUP_START })
      }
    })

    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      if (grouped.has(el)) return
      for (const [motion, els] of bucket([el])) {
        revealTween(els, motion, { stagger: 0, trigger: el, start: SINGLE_START })
      }
    })

    /* ---------- 2. 章节标题右侧那条细线：横向抽出来 ---------- */

    root.querySelectorAll<HTMLElement>('.ab-sec__rule').forEach((el) => {
      const animation = gsap.fromTo(
        el,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 0.9,
          ease: REVEAL_EASE,
          paused: opts.finishAt !== undefined,
          ...(opts.finishAt === undefined
            ? {
                scrollTrigger: {
                  trigger: el,
                  start: 'top 94%',
                  toggleActions: 'play none none none',
                  once: true,
                },
              }
            : {}),
        },
      )
      if (opts.finishAt !== undefined)
        createViewportEntrance({
          trigger: el,
          finishAt: opts.finishAt,
          play: () => {
            animation.play()
          },
          complete: () => {
            animation.progress(1).pause()
          },
        })
    })

    /* ---------- 3. 作品数据：数字滚动 ---------- */

    root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      /*
       * ⚠️ 目标值**每帧从 `data-count-value` 读**，绝不在创建时捕获进闭包。
       *
       *    切语言会换掉这批文本（`630万+` ↔ `6.3M+`）。如果创建时把 `target` /
       *    `suffix` 定死，切到英文后再滚回作品区，tween 会把**中文格式**写回来
       *    （`6.3M+` 变回 `630万+`）—— 一个比「0万+」更隐蔽的错误。
       *
       *    Vue 绑定的这个属性始终是当前语言的原值，所以补间只要 0 → 1，
       *    真正的数值与后缀每帧现取现用。
       */
      const parse = (): RegExpExecArray | null =>
        /^(\d+(?:\.\d+)?)(.*)$/.exec(el.dataset.countValue ?? '')
      // 不是「数值 + 后缀」就原样不动，绝不猜（平台名一类本来就不该滚动）
      if (!parse()) return
      countEls.push(el)
      const proxy = { v: 0 }
      gsap.to(proxy, {
        v: 1,
        duration: 1.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el.closest('.work') ?? el,
          start: 'top 84%',
          /*
           * ⚠️ 数字**只播一次，绝不倒回** —— 和上面通用揭示的
           *    `play reverse play reverse` 刻意不同。
           *
           *    `play reverse play reverse` 在向上滚出触发线时会把数字从
           *    `630万+` 一路写回 `0万+`。实测（探针 v4）：滚到作品区让数字演完
           *    → 回顶部切语言 → 停在顶部读 DOM，前 6 个数字正好是
           *    `0万+ / 0万+ / 0+ / 0+ / 0+ / 0%+`。
           *    那一帧常常还在视口底边（`start: top 84%` 时行首已可见），
           *    读起来只有一种意思：「数字坏了」。
           *
           *    数字是**数据**，倒着滚回去没有语义；透明度 / 位移的揭示照旧可逆，
           *    不受这条影响。
           */
          toggleActions: 'play none none none',
        },
        // 每帧把 proxy 的当前值格式化成文本。位数从**当前**文本现取，
        // 所以 `6.3M+` 与 `630万+` 各按自己的精度补间（切语言后仍然对）。
        onUpdate: () => {
          const m = parse()
          if (!m) return
          // 小数位数从**当前**文本里现取，所以 `6.3M+` 与 `630万+` 各按自己的精度补间
          const decimals = (m[1].split('.')[1] ?? '').length
          el.textContent = (proxy.v * Number(m[1])).toFixed(decimals) + m[2]
        },
      })
    })

    /* ---------- 4. 照片 → 版面：滚动驱动的转换 ----------
     *
     * ⚠️ 2026-10-10 第四轮**从这里搬走了**（见 `setupEditorialScroll.ts`）。
     *
     *    旧实现只按初始宽度建一次擦除时间轴，`start: 'top 78%'` / `end: 'bottom 62%'`，
     *    没有 pin —— 实测元素顶边从 414px 变 90px 再变 -378px，画面**跟着页面滚走**，
     *    而擦除还没完成。验收记录点名了这件事。
     *
     *    现在的做法是给这一屏一个**居中固定舞台**：`pin + pinSpacing` 提供真实滚动
     *    行程，`scrub` 直接绑滚动，擦满之后才释放。它由 `gsap.matchMedia` 管理，
     *    有自己的建立 / 撤销生命周期，所以**不放在这个 context 里** ——
     *    放进来就会和通用揭示共用一个 `revert()`，切语言或条件变化时互相牵连。
     *
     *    ⚠️ 两套绝不能同时写 `clipPath`：本文件已经**不再**创建任何 morph 补间。

    */

    // 字体 / 图片落位后再量一次，避免 start 位置算早了。
    refreshLayout()
  }

  const ctxReveal = gsap.context(buildReveal, root)
  // 独立管理媒体偏好；卸载时先撤销编辑对照的 pin。
  const editorial = setupEditorialScroll(root)

  return {
    /** 页面卸载时的总清理。顺序见函数内注释（先拆 pin，再拆 context）。 */
    dispose(): void {
      cancelRefresh?.()
      /*
       * ⚠️ 顺序：先拆 pin（它会改文档高度、并往 DOM 里插 pin-spacer），
       *    再拆揭示 context —— 反过来的话，pin 撤销后文档高度突变，
       *    剩下还没拆的 ScrollTrigger 会按错的高度再量一次。
       */
      editorial.dispose()
      ctxReveal.revert()
      /*
       * ⚠️ 顺序不能反：`ctxReveal.revert()` 会把数字 tween 拨回起点，
       *    顺手把 `0` 写进 `textContent`。必须**在它之后**再覆盖回原文。
       */
      for (const el of countEls) {
        const v = el.dataset.countValue
        if (v) el.textContent = v
      }
      countEls.length = 0
    },
  }
}

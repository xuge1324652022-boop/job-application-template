/**
 * 「减少动态效果」偏好的单一真相。
 *
 * 项目里 `prefers-reduced-motion` 这个字符串出现得很密，但绝大多数是
 * `gsap.matchMedia()` 的条件串（`mm.add('(prefers-reduced-motion: no-preference)', …)`），
 * 那类**必须内联**，不能收敛 —— 它们要的是「在某个条件下启停一套动画」，
 * 不是一个布尔查询。
 *
 * 真正需要收敛的是另一类：**每次调用都新建一个 MediaQueryList** 的写法。
 * 它们都落在高频路径上（卡片 pause/play、开场是否跳过、回顶滚动），
 * 每新建一次就是一个对象 + 一次样式系统查询。这里给一个惰性单例。
 *
 * ⚠️ 惰性初始化：模块求值阶段不碰 `window`。单测会把某些模块单独编译进
 *    `vm` 沙箱跑，那里没有真的 `window`；在 import 期就取 MQL 会直接抛错。
 */

let reducedQuery: MediaQueryList | null = null

function reducedMotionQuery(): MediaQueryList {
  reducedQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)')
  return reducedQuery
}

/** 当前是否要求「减少动态效果」。 */
export function prefersReduced(): boolean {
  return typeof window.matchMedia === 'function' && reducedMotionQuery().matches
}

/**
 * 程序化滚动（`window.scrollTo`）该用的 behavior。
 *
 * 显式给 `'instant'` 而不是 `'auto'`：`'auto'` 的语义是「去读 CSS 的
 * `scroll-behavior`」。将来谁给 `html` 加上 `scroll-behavior: smooth`，
 * 减少动态这一支就会静默失效 —— 而它恰恰是给最不能看动效的人用的。
 */
export function motionScrollBehavior(): ScrollBehavior {
  return prefersReduced() ? 'instant' : 'smooth'
}

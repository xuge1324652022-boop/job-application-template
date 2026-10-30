/**
 * 数值区间限制 —— 全项目唯一实现。
 *
 * 之前有 5 份同义副本（`galleryMotion.ts` 的 `clamp`、`useSmoothScroll.ts` 的私有
 * `clamp`、`PosterColourChapters.vue` 的私有 `clamp`、`internshipStackMotion.ts` 的
 * `clamp01`、`photoStory.ts` 的 `unit`），另有 5 处内联 `Math.max(0, Math.min(1, x))`。
 * 它们行为完全一致，但名字不同、默认值不同，读代码时要逐个确认「这个 clamp 是
 * 0..1 还是带边界」。
 *
 * ⚠️ 别把 CSS 的 `clamp()` 混起来：那是 `clamp(min, 首选值, max)` 的三参插值，
 *    这里是两参截断。同名不同义，所以只在本文件里解释一次。
 */

/** 把 `value` 截断到 `[min, max]`，默认 `[0, 1]`。 */
export const clamp = (value: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, value))

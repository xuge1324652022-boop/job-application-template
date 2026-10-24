<template>
  <!--
    方向词带（参照原站身份关键词段）：两行巨型词条交错，
    随滚动反向横移穿过视口；上行实心奶油、下行描边幽灵，中文巨字配英文小字。
  -->
  <section
    id="identity-words"
    ref="root"
    class="word-marquee"
    :aria-label="lang === 'zh' ? '工作方向关键词' : 'Practice keywords'"
  >
    <div ref="stage" class="word-marquee__stage">
      <div ref="rowA" class="word-marquee__row word-marquee__row--solid">
        <span v-for="(word, i) in words" :key="`a${i}`" class="word-marquee__item">
          <b>{{ word.zh }}</b><i lang="en">{{ word.en }}</i>
        </span>
      </div>
      <div ref="rowB" class="word-marquee__row word-marquee__row--ghost">
        <span v-for="(word, i) in words" :key="`b${i}`" class="word-marquee__item">
          <b>{{ word.zh }}</b><i lang="en">{{ word.en }}</i>
        </span>
      </div>
      <p class="word-marquee__caption">
        {{ lang === 'zh' ? '工作的关键词，也是这份模板的动效目录' : 'Practice keywords, and the motion index of this template' }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Lang } from '../../数据/人物资料'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'

/** 词条取自现有工作方向与技能标签，不引入原作者身份词。 */
const words = [
  { zh: '内容策划', en: 'CONTENT PLANNING' },
  { zh: '视频剪辑', en: 'EDITING' },
  { zh: '视觉表达', en: 'VISUAL' },
  { zh: 'AI 协作', en: 'AI COLLABORATION' },
  { zh: '交付记录', en: 'DELIVERY' },
] as const

defineProps<{ lang: Lang }>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const rowA = ref<HTMLElement | null>(null)
const rowB = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false
gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !rowA.value || !rowB.value) return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const stageElement = stage.value!
        const rowSolid = rowA.value!
        const rowGhost = rowB.value!
        // 每行的滑过距离：带宽减视口，再加两端 12% 视口余量，确保完全穿过。
        const travel = (row: HTMLElement) =>
          Math.max(0, row.scrollWidth - stageElement.clientWidth) + stageElement.clientWidth * 0.12
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              id: 'about-words-marquee',
              trigger: stageElement,
              refreshPriority: 32,
              start: 'top top',
              end: () => `+=${Math.round(innerHeight * 1.9)}`,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            [rowSolid, rowGhost],
            { autoAlpha: 0, yPercent: (i: number) => (i === 0 ? 12 : -12) },
            { autoAlpha: 1, yPercent: 0, duration: 0.24, ease: 'power2.out' },
            0,
          )
          .fromTo(
            rowSolid,
            { x: () => stageElement.clientWidth * 0.1 },
            { x: () => -travel(rowSolid), duration: 1.75 },
            0,
          )
          .fromTo(
            rowGhost,
            { x: () => -travel(rowGhost) * 0.55 },
            { x: () => stageElement.clientWidth * 0.08, duration: 1.75 },
            0,
          )
          .to({}, { duration: 0.2 })
      },
      root.value,
    )
    cancelRefresh = requestMotionLayoutRefresh()
    void document.fonts.ready.then(() => {
      if (!dead) {
        cancelRefresh?.()
        cancelRefresh = requestMotionLayoutRefresh()
      }
    })
  })
})
onBeforeUnmount(() => {
  dead = true
  cancelPreparation?.()
  cancelRefresh?.()
  media?.revert()
})
</script>

<style scoped>
.word-marquee {
  position: relative;
  background: var(--ab-bg);
}
.word-marquee__stage {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow: clip;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(20px, 4vh, 44px);
  padding: clamp(70px, 10vh, 120px) 0;
}
.word-marquee__row {
  width: max-content;
  display: flex;
  align-items: baseline;
  gap: clamp(28px, 3.4vw, 64px);
  white-space: nowrap;
  will-change: transform;
}
.word-marquee__row--solid {
  margin-left: clamp(72px, 6vw, 110px);
}
.word-marquee__row--ghost {
  margin-left: clamp(24px, 3vw, 60px);
}
.word-marquee__row--solid b {
  color: var(--ab-ink);
}
.word-marquee__row--ghost b {
  color: transparent;
  -webkit-text-stroke: 2px var(--ab-dim);
}
.word-marquee__item b {
  font-family: 'Arial Black', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: min(10.5vw, 19svh);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.04em;
}
.word-marquee__item i {
  margin-left: 14px;
  font-style: normal;
  font-size: clamp(11px, 1vw, 15px);
  font-weight: 600;
  letter-spacing: 0.26em;
  color: var(--ab-soft);
  vertical-align: super;
}
.word-marquee__caption {
  margin: clamp(30px, 6vh, 60px) clamp(22px, 6vw, 110px) 0;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--ab-soft);
}
@media (max-width: 760px), (max-height: 619px), (prefers-reduced-motion: reduce) {
  .word-marquee__stage {
    min-height: 0;
    gap: 28px;
    padding: 84px 0 64px;
  }
  .word-marquee__row--solid,
  .word-marquee__row--ghost {
    margin-left: 22px;
  }
  .word-marquee__item b {
    font-size: 13.5vw;
  }
  .word-marquee__caption {
    margin: 34px 22px 0;
  }
}
</style>

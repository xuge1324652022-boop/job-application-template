<template>
  <section id="voice" ref="root" class="quote-scene" aria-labelledby="quote-title">
    <div ref="stage" class="quote-scene__stage">
      <!-- 暗色人物衬底贯穿：引言段压得更暗，巨字段稍亮，同一张合成图连续。 -->
      <div class="quote-scene__backdrop" aria-hidden="true">
        <img
          :src="PORTRAIT.src"
          :srcset="visualImageSources(PORTRAIT)"
          sizes="100vw"
          :width="PORTRAIT.width"
          :height="PORTRAIT.height"
          alt=""
          decoding="async"
          loading="lazy"
          @load="refreshLayout"
        />
      </div>
      <div ref="content" class="quote-scene__content">
        <p class="quote-scene__kicker">
          {{ lang === 'zh' ? '我的主张' : 'MY MISSION' }}<span>{{
            lang === 'zh' ? 'MY MISSION' : '我的主张'
          }}</span>
        </p>
        <h2 id="quote-title" ref="statement" class="quote-scene__statement">
          <span v-for="(line, index) in lines" :key="index" class="quote-scene__line">{{
            line
          }}</span>
        </h2>
        <p class="quote-scene__translation" lang="en">{{ PROFILE_LINES[0].en }}</p>
      </div>
      <!-- 巨字横带：红色 WHO I AM 两行，随滚动自右向左滑出视口（aria 隐藏，语义在上文）。 -->
      <div ref="giant" class="quote-scene__giant" aria-hidden="true">
        <span class="quote-scene__giant-row" lang="en">WHO I AM</span>
        <span class="quote-scene__giant-row quote-scene__giant-row--ghost" lang="en">WHO I AM</span>
      </div>
      <span class="quote-scene__cue" aria-hidden="true">↓</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROFILE_LINES, type Lang } from '../../data/aboutProfile'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'
import { aboutPortrait } from '../../data/personalPortfolio'

/**
 * 主张段（参照原站 mission + WHO I AM 巨字）：
 * 人物主张以大字逐行由暗点亮（滚动波浪，先点亮者先退暗），
 * 随后红色 WHO I AM 巨字带自右向左滑出屏幕，交棒方向词跑马灯。
 */
defineProps<{ lang: Lang }>()
const PORTRAIT = aboutPortrait
const lines = PROFILE_LINES[0].zh.match(/[^，。！？;；]+[，。！？;；]?/gu) ?? [PROFILE_LINES[0].zh]

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const statement = ref<HTMLElement | null>(null)
const giant = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false
gsap.registerPlugin(ScrollTrigger)

function refreshLayout() {
  if (dead) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !content.value || !statement.value || !giant.value)
      return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const rows = statement.value!.querySelectorAll('.quote-scene__line')
        const stageElement = stage.value!
        const giantElement = giant.value!
        // 巨字横移量：字带宽超出视口的部分，再加两端各留 20% 视口的入出场余量。
        const giantTravel = () =>
          Math.max(0, giantElement.scrollWidth - stageElement.clientWidth) + innerWidth * 0.4
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              id: 'about-quote-mission',
              trigger: stageElement,
              refreshPriority: 35,
              start: 'top top',
              end: () => `+=${Math.round(innerHeight * 3.6)}`,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          // ① 主张逐行点亮：行点亮后随进度轻微上移并退暗，形成滚动波浪。
          .fromTo(
            rows,
            { color: '#574e42', y: 0 },
            { color: 'var(--ab-ink)', y: -14, stagger: 0.34, duration: 1 },
            0,
          )
          .to(
            rows,
            { color: '#574e42', stagger: 0.22, duration: 0.7 },
            0.9,
          )
          // ② 主张整体上移离场，为巨字让屏。
          .to(
            content.value!,
            {
              y: () => -(content.value!.offsetHeight + stageElement.clientHeight * 0.18),
              autoAlpha: 0,
              duration: 0.8,
              ease: 'power2.in',
            },
            2.05,
          )
          // ③ WHO I AM 红色巨字带自右向左滑过并出屏，第二行描边幽灵作层次。
          .fromTo(
            giantElement,
            { x: () => innerWidth * 0.22, autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.3 },
            2.2,
          )
          .to(giantElement, { x: () => -giantTravel(), duration: 2.1 }, 2.35)
          .to({}, { duration: 0.25 })
      },
      root.value,
    )
    cancelRefresh = requestMotionLayoutRefresh()
    void document.fonts.ready.then(() => {
      if (dead) return
      refreshLayout()
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
.quote-scene {
  position: relative;
  background: var(--ab-bg);
}
.quote-scene__stage {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow: clip;
  display: grid;
  align-items: center;
}
.quote-scene__backdrop {
  position: absolute;
  inset: 0;
}
.quote-scene__backdrop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.18;
  filter: saturate(0.7);
}
.quote-scene__backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgb(5 5 5 / 0.55), rgb(5 5 5 / 0.85));
}
.quote-scene__content {
  position: relative;
  width: min(1180px, 88%);
  margin: 0 auto;
  padding: clamp(90px, 14vh, 170px) 0;
}
.quote-scene__kicker {
  margin: 0 0 clamp(28px, 5vh, 56px);
  font-size: 11px;
  letter-spacing: 0.24em;
  color: var(--ab-soft);
  text-transform: uppercase;
}
.quote-scene__kicker span {
  display: inline-block;
  margin-left: 12px;
  color: var(--ab-dim);
}
.quote-scene__statement {
  margin: 0;
  font-size: clamp(30px, 5vw, 84px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.06;
  color: var(--ab-ink);
}
.quote-scene__line {
  display: block;
}
.quote-scene__translation {
  max-width: 54em;
  margin: clamp(26px, 4vh, 44px) 0 0;
  font-size: clamp(13px, 1.2vw, 17px);
  line-height: 1.7;
  color: var(--ab-soft);
}
.quote-scene__giant {
  position: absolute;
  left: 0;
  top: 50%;
  width: max-content;
  transform: translateY(-50%);
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: min(19vw, 30svh);
  font-weight: 900;
  line-height: 0.8;
  letter-spacing: -0.04em;
  white-space: nowrap;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
}
.quote-scene__giant-row {
  display: block;
  color: var(--ab-accent);
}
.quote-scene__giant-row--ghost {
  color: transparent;
  -webkit-text-stroke: 2px rgb(239 75 64 / 0.4);
}
.quote-scene__cue {
  position: absolute;
  left: 50%;
  bottom: 26px;
  color: var(--ab-soft);
  font-size: 22px;
}
@media (max-width: 760px), (max-height: 619px), (prefers-reduced-motion: reduce) {
  .quote-scene__stage {
    min-height: 0;
    padding: 96px 22px 80px;
  }
  .quote-scene__statement {
    font-size: clamp(24px, 6.4vw, 40px);
  }
  .quote-scene__giant {
    position: relative;
    left: auto;
    top: auto;
    margin-top: 70px;
    transform: none;
    font-size: 16.5vw;
    visibility: visible;
    opacity: 1;
  }
  .quote-scene__cue {
    display: none;
  }
}
</style>

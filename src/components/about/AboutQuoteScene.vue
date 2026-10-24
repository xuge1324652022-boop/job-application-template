<template>
  <section id="voice" ref="root" class="quote-scene" aria-labelledby="quote-title">
    <div ref="stage" class="quote-scene__stage">
      <div ref="backdropMask" class="quote-scene__backdrop" aria-hidden="true">
        <img
          :src="PORTRAIT.src"
          :srcset="visualImageSources(PORTRAIT)"
          sizes="100vw"
          width="1448"
          height="1086"
          alt=""
          decoding="async"
          loading="lazy"
          @load="refreshLayout"
        />
      </div>
      <div ref="content" class="quote-scene__content">
        <p ref="kicker" class="quote-scene__kicker">
          A little about me<span>关于我，与我的创作</span>
        </p>
        <h2 id="quote-title" ref="name" class="quote-scene__name">
          {{ IDENTITY.nameZh }}<span lang="en">{{ IDENTITY.nameEn }}</span>
        </h2>
        <div ref="linesWrap" class="quote-scene__lines">
          <p v-for="(line, index) in lines" :key="index" class="quote-scene__line">{{ line }}</p>
          <p class="quote-scene__translation" lang="en">{{ statement.en }}</p>
        </div>
      </div>
      <span class="quote-scene__cue" aria-hidden="true">↓</span>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 暗色人物引言：整屏人物照片压暗作衬底，巨型姓名进入后自述行逐条由暗变亮并上移退出；
 * 全程随滚动可逆。字形放大由下一段独立场景负责；文案取自现有资料（TAGLINE）。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IDENTITY, TAGLINE, type Lang } from '../../data/aboutProfile'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'
import { aboutPortrait } from '../../data/personalPortfolio'

defineProps<{ lang: Lang }>()
const PORTRAIT = aboutPortrait
// 以现有个人主张作为引言，完整履历留给下方资料区，避免三段连续重复简介。
const statement = TAGLINE
const lines = statement.zh.match(/[^，。！？]+[，。！？]?/gu) ?? [statement.zh]

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const backdropMask = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const name = ref<HTMLElement | null>(null)
const linesWrap = ref<HTMLElement | null>(null)
const kicker = ref<HTMLElement | null>(null)
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
    if (
      dead ||
      !root.value ||
      !stage.value ||
      !backdropMask.value ||
      !name.value ||
      !linesWrap.value ||
      !content.value ||
      !kicker.value
    )
      return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const rows = linesWrap.value!.querySelectorAll('.quote-scene__line')
        const stageElement = stage.value!
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              id: 'about-quote-portrait',
              trigger: stageElement,
              refreshPriority: 35,
              start: 'top top',
              end: () => `+=${Math.round(innerHeight * 1.65)}`,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          // ① 人物衬底由内缩遮罩展开，巨型姓名自下进入，引言行逐条由暗变亮。
          .fromTo(
            backdropMask.value!,
            { clipPath: 'inset(18% 22% 18% 22%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.24, ease: 'power2.inOut' },
            0,
          )
          .fromTo(
            name.value!,
            { yPercent: 46, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.18, ease: 'power3.out' },
            0.06,
          )
          .fromTo(kicker.value!, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.14)
          .fromTo(
            rows,
            { color: '#655c52' },
            { color: '#ffe8ce', duration: 0.24, stagger: 0.12 },
            0.25,
          )
          .addLabel('reading')
          .to({}, { duration: 0.32 })
          // 引言完整读完后退出，下一段独立负责字形放大。
          .to(
            content.value!,
            {
              y: () =>
                -(
                  content.value!.offsetTop +
                  content.value!.offsetHeight +
                  stageElement.clientHeight * 0.08
                ),
              duration: 0.65,
            },
            'reading+=.32',
          )
      },
      root.value,
    )
    cancelRefresh = requestMotionLayoutRefresh()
    void document.fonts.ready.then(() => {
      if (dead) return
      cancelRefresh?.()
      cancelRefresh = requestMotionLayoutRefresh()
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
  opacity: 0.24;
}
.quote-scene__backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgb(5 5 5 / 0.38), rgb(5 5 5 / 0.78));
}
.quote-scene__content {
  position: relative;
  width: min(980px, 86%);
  margin: 0 auto;
  padding: clamp(90px, 16vh, 180px) 0;
}
.quote-scene__kicker {
  margin: 0 0 26px;
  font-size: 11px;
  letter-spacing: 0.22em;
  color: var(--ab-soft);
}
.quote-scene__kicker span {
  display: block;
  margin-top: 5px;
  letter-spacing: 0.12em;
  font-size: 10px;
}
.quote-scene__name {
  margin: 0;
  font-size: clamp(52px, 8.2vw, 150px);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.04;
  color: var(--ab-ink);
}
.quote-scene__name span {
  display: block;
  margin-top: 14px;
  font-size: clamp(15px, 1.5vw, 24px);
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--ab-soft);
}
.quote-scene__lines {
  margin-top: clamp(36px, 6vh, 72px);
}
.quote-scene__line {
  margin: 0;
  font-size: clamp(22px, 2.5vw, 38px);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.5;
  color: var(--ab-ink);
}
.quote-scene__line + .quote-scene__line {
  margin-top: 14px;
}
.quote-scene__line--sub {
  font-size: clamp(14px, 1.3vw, 19px);
  font-weight: 400;
  color: var(--ab-soft);
}
.quote-scene__line span {
  display: block;
  margin-top: 6px;
  font-size: 0.78em;
  color: var(--ab-soft);
}
.quote-scene__translation {
  max-width: 52em;
  margin: 24px 0 0;
  font-size: clamp(13px, 1.25vw, 18px);
  line-height: 1.7;
  color: var(--ab-soft);
}
.quote-scene__cue {
  position: absolute;
  left: 50%;
  bottom: 26px;
  color: var(--ab-soft);
  font-size: 22px;
}
</style>

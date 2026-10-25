<template>
  <section id="voice" ref="root" class="quote-scene" aria-labelledby="quote-title">
    <div ref="stage" class="quote-scene__stage">
      <div class="about-dark-portrait" aria-hidden="true">
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
        <h2 id="quote-title" ref="statement" class="quote-scene__statement">
          <span v-for="(line, index) in lines" :key="index" class="quote-scene__line">{{
            line
          }}</span>
        </h2>
      </div>
      <span class="quote-scene__cue" aria-hidden="true">↓</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TAGLINE, type Lang } from '../../data/aboutProfile'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'
import { aboutQuotePortrait } from '../../data/personalPortfolio'
import '../../styles/aboutPortrait.css'

/**
 * 主张从画面下方向上经过，每行先点亮再离场。
 * 人像保持固定构图，交给下一幕的橙色身份巨字继续放大。
 */
const props = defineProps<{ lang: Lang }>()
const PORTRAIT = aboutQuotePortrait
const lines = computed(() => {
  const text = TAGLINE[props.lang]
  return props.lang === 'zh'
    ? (text.match(/[^，。！？;；]+[，。！？;；]?/gu) ?? [text])
    : (text
        .match(/[^.!?]+[.!?]?/gu)
        ?.map((line) => line.trim())
        .filter(Boolean) ?? [text])
})

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const statement = ref<HTMLElement | null>(null)
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
    if (dead || !root.value || !stage.value || !content.value || !statement.value) return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const rows = statement.value!.querySelectorAll('.quote-scene__line')
        const stageElement = stage.value!
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              id: 'about-quote-mission',
              trigger: stageElement,
              refreshPriority: 45,
              start: 'top top',
              end: () => `+=${Math.round(innerHeight * 2.8)}`,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
              scrub: 0.35,
              invalidateOnRefresh: true,
            },
          })
          // 只给每行一段亮色 tween，避免上一段尚未完成就被退暗覆盖。
          .fromTo(
            rows,
            { color: '#4b4b49' },
            { color: '#ffe8ce', stagger: 0.48, duration: 0.45 },
            0.12,
          )
          .fromTo(
            content.value!,
            { y: () => stageElement.clientHeight * 0.32 },
            { y: () => -stageElement.clientHeight * 0.18, duration: 1.8 },
            0,
          )
          .to({}, { duration: 0.4 })
          .to(
            content.value!,
            {
              y: () => -(content.value!.offsetTop + content.value!.offsetHeight + 40),
              duration: 0.9,
            },
            2.2,
          )
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
watch(
  () => props.lang,
  async () => {
    await nextTick()
    // 同一组语句保持节点数量，刷新读数以适应语言换行后的正文高度。
    refreshLayout()
  },
)
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
  background: #090909;
}
.quote-scene__stage {
  position: relative;
  height: 100svh;
  min-height: 620px;
  overflow: clip;
  display: grid;
  align-items: center;
}
.quote-scene__content {
  position: relative;
  width: calc(100% - clamp(104px, 11vw, 180px));
  margin-left: clamp(78px, 7vw, 112px);
  padding: 0;
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
  max-width: 15em;
  margin-inline: auto;
  text-align: center;
  font-size: clamp(48px, 5.625vw, 108px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.12;
  color: #ffe8ce;
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
.quote-scene__cue {
  position: absolute;
  left: 50%;
  bottom: 26px;
  color: var(--ab-soft);
  font-size: 22px;
}
@media (max-width: 760px), (max-height: 619px), (prefers-reduced-motion: reduce) {
  .quote-scene__stage {
    height: auto;
    min-height: 0;
    padding: 96px 22px 80px;
  }
  .quote-scene__content {
    width: 100%;
    margin: 0;
  }
  .quote-scene__statement {
    font-size: clamp(24px, 6.4vw, 40px);
  }
  .quote-scene__cue {
    display: none;
  }
}
</style>

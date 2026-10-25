<template>
  <section
    id="experience-reveal"
    ref="root"
    class="experience-reveal"
    :class="{ 'is-pinned': motionReady }"
    :aria-labelledby="headingId"
    :lang="lang"
  >
    <div ref="stage" class="experience-reveal__stage">
      <header ref="heading" class="experience-reveal__heading">
        <p>{{ labels.note }}</p>
        <h2 :id="headingId">{{ labels.heading }}</h2>
      </header>

      <div
        ref="upperBand"
        class="experience-reveal__band experience-reveal__band--upper"
        aria-hidden="true"
      >
        <div ref="upperTrack" class="experience-reveal__image-track">
          <figure v-for="(item, index) in ribbonImages" :key="`upper-${index}-${item.id}`">
            <img
              :src="item.src"
              :srcset="visualImageSources(item)"
              sizes="(max-width: 760px) 44vw, (max-width: 1440px) 23vw, 340px"
              :width="item.width"
              :height="item.height"
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
              @load="scheduleRefresh"
            />
          </figure>
        </div>
      </div>

      <div class="experience-reveal__reading">
        <ol class="experience-reveal__entries">
          <li
            v-for="(entry, index) in summaries"
            :key="entry.experience.id"
            class="experience-reveal__entry"
            :class="{ 'is-current': current === index }"
            :data-experience="entry.experience.id"
          >
            <p class="experience-reveal__period">{{ pick(entry.experience.period, lang) }}</p>
            <h3>{{ pick(entry.experience.company, lang) }}</h3>
            <p class="experience-reveal__role">{{ pick(entry.experience.role, lang) }}</p>
            <p class="experience-reveal__summary">{{ pick(entry.summary, lang) }}</p>
            <a :href="`#work-${entry.experience.workId}`">{{ labels.read }}</a>
          </li>
        </ol>
      </div>

      <div
        ref="lowerBand"
        class="experience-reveal__band experience-reveal__band--lower"
        aria-hidden="true"
      >
        <div ref="lowerTrack" class="experience-reveal__image-track">
          <figure v-for="(item, index) in lowerImages" :key="`lower-${index}-${item.id}`">
            <img
              :src="item.src"
              :srcset="visualImageSources(item)"
              sizes="(max-width: 760px) 44vw, (max-width: 1440px) 23vw, 340px"
              :width="item.width"
              :height="item.height"
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
              @load="scheduleRefresh"
            />
          </figure>
        </div>
      </div>
      <p class="experience-reveal__position" aria-hidden="true">
        {{ String(current + 1).padStart(2, '0') }} / {{ String(summaries.length).padStart(2, '0') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EXPERIENCE, WORKS, pick, type Lang } from '../../数据/人物资料'
import { personalPortfolio } from '../../数据/本机个人内容接口'
import { editorial, photography, posters } from '../../数据/视觉作品资料'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'
import { visualImageSources } from '../../工具/响应式图片'

const props = defineProps<{ lang: Lang }>()
const headingId = `experience-reveal-${useId()}`
const labels = computed(() =>
  props.lang === 'zh'
    ? { note: '作品背后的实践', heading: '实习与实践', read: '查看完整经历' }
    : {
        note: 'The practice behind the work',
        heading: 'Internships & practice',
        read: 'Read the full experience',
      },
)
const summaries = EXPERIENCE.map((experience) => ({
  experience,
  summary:
    experience.details[0]?.body ??
    WORKS.find((work) => work.id === experience.workId)?.summary ??
    experience.focus,
}))
const sourceImages = personalPortfolio?.selectedWorks.length
  ? personalPortfolio.selectedWorks
  : [...photography, ...posters.slice(0, 2), ...editorial.slice(0, 2)]
// 重复的是已有作品，而非新素材。两端留足图像长度，斜移时不会露出空轨道。
const ribbonImages = Array.from(
  { length: Math.max(12, sourceImages.length * 2) },
  (_, index) => sourceImages[index % sourceImages.length]!,
)
const lowerImages = [...ribbonImages].reverse()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const heading = ref<HTMLElement | null>(null)
const upperBand = ref<HTMLElement | null>(null)
const lowerBand = ref<HTMLElement | null>(null)
const upperTrack = ref<HTMLElement | null>(null)
const lowerTrack = ref<HTMLElement | null>(null)
const motionReady = ref(false)
const current = ref(0)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false

gsap.registerPlugin(ScrollTrigger)

function scheduleRefresh(): void {
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
      !heading.value ||
      !upperBand.value ||
      !lowerBand.value ||
      !upperTrack.value ||
      !lowerTrack.value
    )
      return
    const rootElement = root.value
    const stageElement = stage.value
    const headingElement = heading.value
    const bands = [upperBand.value, lowerBand.value]
    const tracks = [upperTrack.value, lowerTrack.value]
    const cards = [...rootElement.querySelectorAll<HTMLElement>('.experience-reveal__entry')]
    if (!cards.length) return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 981px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)',
      (context) => {
        motionReady.value = true
        rootElement.classList.add('is-pinned')
        const opening = 1.1
        const step = 1.65
        const total = opening + cards.length * step + 0.25
        const travel = (element: HTMLElement) =>
          Math.max(0, element.scrollWidth - element.parentElement!.clientWidth) * 0.55
        // 单一 matchMedia context 拥有全部动画；无额外滚动控制器或 resize 重建任务。
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate(this: gsap.core.Timeline) {
            current.value = Math.min(
              cards.length - 1,
              Math.max(0, Math.floor((this.time() - opening) / step)),
            )
          },
          scrollTrigger: {
            id: 'about-experience-reveal',
            trigger: rootElement,
            pin: stageElement,
            pinSpacing: true,
            start: 'top top',
            end: () => `+=${Math.round(stageElement.clientHeight * (1.05 + cards.length * 0.9))}`,
            refreshPriority: 25,
            scrub: 0.35,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        timeline
          .fromTo(
            bands,
            { y: 0 },
            {
              y: (index: number) => (index === 0 ? -1 : 1) * stageElement.clientHeight * 0.36,
              duration: 1.25,
              ease: 'power2.inOut',
            },
            0,
          )
          .fromTo(tracks[0]!, { x: 0 }, { x: () => -travel(tracks[0]!), duration: total }, 0)
          .fromTo(tracks[1]!, { x: () => -travel(tracks[1]!) }, { x: 0, duration: total }, 0)
          .fromTo(headingElement, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.65 }, 0.35)

        cards.forEach((card, index) => {
          const start = opening + index * step
          // 仅 opacity 隐藏视觉层，完整摘要保留在语义树；聚焦链接会定位到可读时段。
          timeline.fromTo(card, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.45 }, start)
          if (index < cards.length - 1)
            timeline.to(card, { opacity: 0, y: -36, duration: 0.4 }, start + 1.25)
        })

        const onFocus = (event: FocusEvent) => {
          const target = event.target
          if (!(target instanceof HTMLElement)) return
          const card = target.closest<HTMLElement>('.experience-reveal__entry')
          const index = card ? cards.indexOf(card) : -1
          const trigger = timeline.scrollTrigger
          if (index < 0 || !card || !trigger) return
          const bounds = target.getBoundingClientRect()
          if (
            current.value === index &&
            Number(gsap.getProperty(card, 'opacity')) > 0.9 &&
            bounds.top >= 0 &&
            bounds.bottom <= innerHeight
          )
            return
          const time = opening + index * step + 0.7
          window.scrollTo({
            top: trigger.start + ((trigger.end - trigger.start) * time) / timeline.duration(),
            behavior: 'auto',
          })
          ScrollTrigger.update()
          trigger.getTween()?.progress(1)
        }
        rootElement.addEventListener('focusin', onFocus)
        scheduleRefresh()
        return () => {
          rootElement.removeEventListener('focusin', onFocus)
          motionReady.value = false
          rootElement.classList.remove('is-pinned')
          current.value = 0
          // 清理本组件动画属性，不依赖 !important，也不清除图片尺寸等静态信息。
          context.ignore(() =>
            gsap.set([...bands, ...tracks, ...cards, headingElement], {
              clearProps: 'transform,translate,rotate,scale,opacity,visibility,transformOrigin',
            }),
          )
        }
      },
      rootElement,
    )
    scheduleRefresh()
    void document.fonts.ready.then(() => {
      if (!dead) scheduleRefresh()
    })
  })
})

watch(
  () => props.lang,
  async () => {
    await nextTick()
    scheduleRefresh()
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
.experience-reveal {
  position: relative;
  overflow-x: clip;
  background: #ffe8ce;
  color: #111;
}
.experience-reveal__stage {
  position: relative;
  padding: 88px 0;
  isolation: isolate;
}
.experience-reveal__heading {
  position: relative;
  z-index: 2;
  width: min(1200px, calc(100% - 144px));
  margin: 0 auto 60px;
}
.experience-reveal__heading > p {
  margin: 0 0 12px;
  color: #d64431;
  font-size: 12px;
  line-height: 1.5;
  letter-spacing: 0.04em;
}
.experience-reveal__heading h2 {
  margin: 0;
  font-size: clamp(32px, 4.8vw, 72px);
  font-weight: 750;
  line-height: 1.08;
  letter-spacing: -0.055em;
}
.experience-reveal__band {
  position: relative;
  z-index: 1;
  left: -80px;
  width: calc(100% + 160px);
  transform: rotate(-5deg);
}
.experience-reveal__band--upper {
  margin-bottom: 76px;
}
.experience-reveal__band--lower {
  margin-top: 76px;
}
.experience-reveal__image-track {
  display: flex;
  align-items: center;
  gap: 22px;
  width: max-content;
}
.experience-reveal__image-track figure {
  flex: none;
  width: clamp(180px, 23vw, 340px);
  height: clamp(140px, 21svh, 220px);
  margin: 0;
  overflow: hidden;
  background: #e7cbaa;
}
.experience-reveal__image-track img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.experience-reveal__reading {
  position: relative;
  z-index: 2;
  width: min(960px, calc(100% - 144px));
  margin: 0 auto;
}
.experience-reveal__entries {
  margin: 0;
  padding: 0;
  list-style: none;
}
.experience-reveal__entry {
  padding: 42px 0;
  border-bottom: 1px solid rgb(17 17 17 / 0.18);
}
.experience-reveal__entry:last-child {
  border-bottom: 0;
}
.experience-reveal__period {
  margin: 0 0 16px;
  color: #d64431;
  font-size: 13px;
  line-height: 1.5;
}
.experience-reveal__entry h3 {
  margin: 0;
  font-size: clamp(28px, 3.3vw, 52px);
  font-weight: 750;
  line-height: 1.1;
  letter-spacing: -0.045em;
  overflow-wrap: anywhere;
}
.experience-reveal__role {
  margin: 16px 0 0;
  font-size: clamp(16px, 1.35vw, 21px);
  font-weight: 600;
  line-height: 1.5;
}
.experience-reveal__summary {
  max-width: 44em;
  margin: 24px 0 0;
  font-size: clamp(16px, 1.35vw, 21px);
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.experience-reveal__entry a {
  display: inline-block;
  margin-top: 24px;
  padding: 6px 0;
  color: inherit;
  font-size: 13px;
  line-height: 1.5;
  text-decoration-thickness: 1px;
  text-underline-offset: 6px;
}
.experience-reveal__entry a:focus-visible {
  outline: 2px solid #d64431;
  outline-offset: 6px;
}
.experience-reveal__position {
  display: none;
}
.is-pinned .experience-reveal__stage {
  height: 100svh;
  min-height: 720px;
  padding: 0;
  overflow: clip;
}
.is-pinned .experience-reveal__heading {
  position: absolute;
  top: 38px;
  left: clamp(72px, 7vw, 120px);
  width: auto;
  right: 72px;
  margin: 0;
}
.is-pinned .experience-reveal__heading h2 {
  font-size: clamp(26px, 3vw, 42px);
}
.is-pinned .experience-reveal__band {
  position: absolute;
  margin: 0;
}
.is-pinned .experience-reveal__band--upper {
  top: 24%;
}
.is-pinned .experience-reveal__band--lower {
  top: 52%;
}
.is-pinned .experience-reveal__reading {
  position: absolute;
  inset: 21% clamp(72px, 10vw, 170px) 17%;
  display: grid;
  align-items: center;
  width: auto;
  margin: 0;
}
.is-pinned .experience-reveal__entries {
  display: grid;
}
.is-pinned .experience-reveal__entry {
  grid-area: 1/1;
  align-self: center;
  border: 0;
  padding: 0;
  opacity: 0;
  pointer-events: none;
}
.is-pinned .experience-reveal__entry.is-current {
  pointer-events: auto;
}
.is-pinned .experience-reveal__position {
  position: absolute;
  z-index: 2;
  right: clamp(32px, 5vw, 88px);
  top: 44px;
  display: block;
  margin: 0;
  color: #d64431;
  font-size: 12px;
  line-height: 1.5;
}
@media (max-width: 760px) {
  .experience-reveal__stage {
    padding: 68px 0;
  }
  .experience-reveal__heading,
  .experience-reveal__reading {
    width: calc(100% - 44px);
  }
  .experience-reveal__heading {
    margin-bottom: 42px;
  }
  .experience-reveal__heading h2 {
    font-size: 36px;
  }
  .experience-reveal__band {
    left: -24px;
    width: calc(100% + 48px);
  }
  .experience-reveal__band--upper {
    margin-bottom: 42px;
  }
  .experience-reveal__band--lower {
    margin-top: 42px;
  }
  .experience-reveal__image-track {
    gap: 14px;
  }
  .experience-reveal__image-track figure {
    width: 44vw;
    height: 34vw;
  }
  .experience-reveal__entry {
    padding: 34px 0;
  }
  .experience-reveal__entry h3 {
    font-size: 28px;
  }
  .experience-reveal__summary {
    margin-top: 20px;
  }
}
</style>

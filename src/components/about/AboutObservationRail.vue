<template>
  <section
    id="beyond-work"
    ref="section"
    class="observation-rail"
    aria-labelledby="observation-rail-title"
    @focusin="revealFocusedPanel"
  >
    <div ref="stage" class="observation-rail__stage">
      <header class="observation-rail__head">
        <h2 id="observation-rail-title">工作之外<span lang="en">Beyond work</span></h2>
        <p class="observation-rail__intro">
          留意光，也留意画面里的秩序
          <span lang="en">Looking for light, layers and a sense of order</span>
        </p>
        <p class="observation-rail__position" aria-hidden="true">
          <span>{{ String(current + 1).padStart(2, '0') }}</span
          ><span>/ 03</span>
        </p>
      </header>

      <div ref="viewport" class="observation-rail__viewport">
        <div ref="track" class="observation-rail__track">
          <article
            v-for="(entry, index) in entries"
            :key="entry.item.id"
            class="observation-rail__panel"
            :class="`observation-rail__panel--${index + 1}`"
            :data-panel="index"
            :aria-labelledby="`observation-title-${index}`"
          >
            <figure class="observation-rail__visual">
              <button
                class="observation-rail__image-button"
                type="button"
                :aria-label="openLabel(entry.item)"
                :data-cursor="lang === 'zh' ? '查看' : 'View'"
                data-cursor-action="view"
                @click="openImage(entry.item, $event)"
              >
                <span class="observation-rail__image-mask">
                  <img
                    :src="entry.item.src"
                    :srcset="visualImageSources(entry.item)"
                    sizes="(max-width: 980px) calc(100vw - 40px), 60vw"
                    :width="entry.item.width"
                    :height="entry.item.height"
                    :alt="pick(entry.item.alt, lang)"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    @load="scheduleRefresh"
                  />
                </span>
                <span class="observation-rail__view" aria-hidden="true">↗</span>
              </button>
              <figcaption>
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <span>{{ pick(entry.item.title, lang) }}</span>
                <span>合成图像示例<span lang="en">Synthetic image examples</span></span>
              </figcaption>
            </figure>
            <div class="observation-rail__observation">
              <p class="observation-rail__eyebrow" aria-hidden="true">
                Observation / 0{{ index + 1 }}
              </p>
              <h3 :id="`observation-title-${index}`">
                {{ entry.title.zh }}<span lang="en">{{ entry.title.en }}</span>
              </h3>
              <p class="observation-rail__copy" lang="zh">{{ entry.copy.zh }}</p>
              <p class="observation-rail__copy observation-rail__copy--en" lang="en">
                {{ entry.copy.en }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <footer class="observation-rail__foot">
        <p class="observation-rail__scroll" aria-hidden="true">
          向下滚动，继续观察<span lang="en">Scroll to observe</span><span>↓</span>
        </p>
        <nav
          class="observation-rail__links"
          :aria-label="lang === 'zh' ? '继续浏览' : 'Explore more'"
        >
          <RouterLink :to="destination('/photo')">
            <span>更多摄影<span lang="en">More photographs</span></span>
            <span aria-hidden="true">↗</span>
          </RouterLink>
          <RouterLink :to="destination('/poster')">
            <span>海报与设计<span lang="en">Posters & design</span></span>
            <span aria-hidden="true">↗</span>
          </RouterLink>
        </nav>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { pick, type Bi, type Lang } from '../../data/aboutProfile'
import { photography, type VisualAsset } from '../../data/visualPortfolio'
import { requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps<{ lang: Lang }>()
const emit = defineEmits<{ open: [item: VisualAsset, trigger: HTMLElement] }>()
const route = useRoute()
const destination = (path: string) => ({
  path,
  query: { from: route.query.from === 'cards' ? 'cards' : 'gallery' },
})

const observations: { title: Bi; copy: Bi }[] = [
  {
    title: { zh: '远近之间', en: 'Between the layers' },
    copy: {
      zh: '用矩形、圆形和网格演示前后层次；所有画面均由程序生成',
      en: 'Rectangles, circles and a grid demonstrate visual layers. Every image is generated programmatically',
    },
  },
  {
    title: { zh: '光与倒影', en: 'Light & reflection' },
    copy: {
      zh: '竖幅示例保留完整圆形与水平色块，用留白比较不同画幅的节奏',
      en: 'A portrait example retains the circle and level colour blocks, using space to compare image proportions',
    },
  },
  {
    title: { zh: '形状与层次', en: 'Shape and layers' },
    copy: {
      zh: '深浅色块与圆环构成通用版式，不对应真实拍摄地点、人物或作品',
      en: 'Light and dark blocks with a ring form a generic layout, without depicting real locations, people or work',
    },
  },
]
const entries = photography.map((item, index) => ({ item, ...observations[index]! }))
const section = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const current = ref(0)
let media: gsap.MatchMedia | undefined
let scrollScene: ScrollTrigger | null = null
let cancelRefresh: (() => void) | undefined
let mounted = false

function openLabel(item: VisualAsset) {
  return props.lang === 'zh'
    ? `查看完整示例：${pick(item.title, props.lang)}`
    : `View full sample: ${pick(item.title, props.lang)}`
}

function openImage(item: VisualAsset, event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) emit('open', item, event.currentTarget)
}

function scheduleRefresh() {
  if (!mounted) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}

/** Keep native tab order: keyboard focus seeks the vertical scroll that exposes its panel. */
function revealFocusedPanel(event: FocusEvent) {
  const target = event.target
  if (!scrollScene || !(target instanceof HTMLElement) || !target.matches(':focus-visible')) return
  const panel = target.closest<HTMLElement>('.observation-rail__panel')
  if (!panel || !track.value || !viewport.value) return
  const focusedBounds = target.getBoundingClientRect()
  const viewportBounds = viewport.value.getBoundingClientRect()
  // Viewer focus restoration must keep its saved scroll position when the trigger is visible.
  if (
    focusedBounds.right > viewportBounds.left + 12 &&
    focusedBounds.left < viewportBounds.right - 12 &&
    viewportBounds.bottom > 0 &&
    viewportBounds.top < window.innerHeight
  )
    return
  const distance = track.value.scrollWidth - viewport.value.clientWidth
  const progress = distance > 0 ? Math.min(1, Math.max(0, panel.offsetLeft / distance)) : 0
  viewport.value.scrollLeft = 0
  window.scrollTo({
    top: scrollScene.start + progress * (scrollScene.end - scrollScene.start),
    behavior: 'auto',
  })
  ScrollTrigger.update()
}

onMounted(async () => {
  mounted = true
  await nextTick()
  if (!mounted || !section.value || !stage.value || !track.value || !viewport.value) return
  const root = section.value
  const stageElement = stage.value
  const trackElement = track.value
  const viewportElement = viewport.value
  media = gsap.matchMedia()
  // matchMedia supplies a scoped GSAP context and reverts every tween/pin on breakpoint changes.
  media.add(
    '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
    () => {
      root.classList.add('is-pinned')
      const panels = Array.from(root.querySelectorAll<HTMLElement>('.observation-rail__panel'))
      const masks = Array.from(root.querySelectorAll<HTMLElement>('.observation-rail__image-mask'))
      const travel = () => Math.max(0, trackElement.scrollWidth - viewportElement.clientWidth)
      const horizontal = gsap.to(trackElement, {
        x: () => -travel(),
        ease: 'none',
        scrollTrigger: {
          id: 'about-observation-rail',
          refreshPriority: 10,
          trigger: stageElement,
          start: 'top top',
          end: () => `+=${travel()}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            current.value = Math.round(self.progress * (entries.length - 1))
          },
        },
      })
      scrollScene = horizontal.scrollTrigger ?? null

      // Panel 01 is already in view at pin start, so it must never inherit a pre-start mask.
      if (masks[0]) gsap.set(masks[0], { clipPath: 'inset(0% 0% 0% 0%)' })
      panels.slice(1).forEach((panel, index) => {
        const mask = masks[index + 1]
        if (!mask) return
        gsap.fromTo(
          mask,
          { clipPath: 'inset(9% 14% 9% 14%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: horizontal,
              start: 'left right',
              end: 'left 38%',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
      })
      scheduleRefresh()
      return () => {
        scrollScene = null
        root.classList.remove('is-pinned')
        current.value = 0
        viewportElement.scrollLeft = 0
      }
    },
    root,
  )
  void document.fonts.ready.then(scheduleRefresh)
  scheduleRefresh()
})

watch(
  () => props.lang,
  async () => {
    await nextTick()
    scheduleRefresh()
  },
)

onBeforeUnmount(() => {
  mounted = false
  cancelRefresh?.()
  media?.revert()
  scrollScene = null
})
</script>

<style scoped>
.observation-rail {
  position: relative;
  background: #0c0d0e;
  color: var(--ab-ink, #f7f7f5);
  scroll-margin-top: 72px;
}
.observation-rail__stage {
  padding: clamp(32px, 4.5vw, 64px) clamp(20px, 4.4vw, 64px);
}
.observation-rail__head {
  display: grid;
  grid-template-columns: 1fr 1.45fr auto;
  gap: 32px;
  align-items: start;
}
.observation-rail__head h2 {
  font-size: clamp(27px, 3vw, 42px);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.045em;
}
.observation-rail__head h2 span {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  letter-spacing: 0;
  color: var(--ab-soft, #979b9f);
}
.observation-rail__intro {
  font-size: clamp(18px, 2vw, 25px);
  line-height: 1.5;
  letter-spacing: -0.025em;
}
.observation-rail__intro > span {
  display: block;
  margin-top: 8px;
  color: var(--ab-soft, #979b9f);
  font-size: 12px;
  line-height: 1.6;
  letter-spacing: 0;
}
.observation-rail__position {
  display: none;
  gap: 10px;
  padding-top: 4px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.observation-rail__position > span:first-child {
  color: var(--ab-accent, #6a9cff);
}
.observation-rail__position > span:last-child {
  color: var(--ab-soft, #979b9f);
}
.observation-rail__viewport {
  margin-top: 48px;
}
.observation-rail__track {
  position: relative;
  display: grid;
  gap: clamp(72px, 12vw, 160px);
}
.observation-rail__panel {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: clamp(32px, 5vw, 72px);
  align-items: center;
  min-width: 0;
}
.observation-rail__visual {
  min-width: 0;
  margin: 0;
}
.observation-rail__image-button {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.observation-rail__image-mask {
  display: block;
  width: 100%;
  height: 100%;
}
.observation-rail__image-mask img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 65svh;
  object-fit: contain;
}
.observation-rail__view {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  background: #0c0d0e;
  font-size: 23px;
  color: #fff;
  transition: color 0.2s;
}
.observation-rail__image-button:hover .observation-rail__view {
  color: var(--ab-accent, #6a9cff);
}
.observation-rail__image-button:focus-visible,
.observation-rail__links a:focus-visible {
  outline: 2px solid var(--ab-accent, #6a9cff);
  outline-offset: 6px;
}
.observation-rail__visual figcaption {
  display: flex;
  gap: 14px;
  align-items: baseline;
  margin-top: 12px;
  color: var(--ab-soft, #979b9f);
  font-size: 10px;
  line-height: 1.5;
}
.observation-rail__visual figcaption > span:first-child {
  color: var(--ab-accent, #6a9cff);
  font-variant-numeric: tabular-nums;
}
.observation-rail__visual figcaption > span:last-child {
  margin-left: auto;
  text-align: right;
}
.observation-rail__visual figcaption span[lang='en'] {
  display: block;
  font-size: 9px;
}
.observation-rail__eyebrow {
  margin-bottom: 24px;
  font-size: 10px;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--ab-accent, #6a9cff);
}
.observation-rail__observation h3 {
  font-size: clamp(31px, 4vw, 57px);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.045em;
}
.observation-rail__observation h3 span {
  display: block;
  margin-top: 14px;
  font-size: clamp(17px, 2vw, 26px);
  letter-spacing: -0.025em;
  line-height: 1.25;
}
.observation-rail__copy {
  max-width: 32em;
  margin-top: 28px;
  font-size: 14px;
  line-height: 1.8;
}
.observation-rail__copy--en {
  margin-top: 12px;
  color: var(--ab-soft, #979b9f);
  font-size: 12px;
  line-height: 1.7;
}
.observation-rail__panel--2 {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
}
.observation-rail__panel--2 .observation-rail__visual {
  grid-column: 2;
  grid-row: 1;
  justify-self: center;
  width: 76%;
}
.observation-rail__panel--2 .observation-rail__observation {
  grid-column: 1;
  grid-row: 1;
  padding-left: 5%;
}
.observation-rail__panel--3 {
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  align-items: end;
}
.observation-rail__panel--3 .observation-rail__visual {
  align-self: start;
  padding-right: 7%;
}
.observation-rail__panel--3 .observation-rail__observation {
  padding-bottom: 5%;
}
.observation-rail__foot {
  display: flex;
  justify-content: flex-end;
  gap: 32px;
  margin-top: 52px;
  padding-top: 20px;
  border-top: 1px solid var(--ab-line, #303236);
}
.observation-rail__scroll {
  display: none;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: var(--ab-soft, #979b9f);
}
.observation-rail__scroll > span:last-child {
  color: var(--ab-accent, #6a9cff);
  font-size: 21px;
}
.observation-rail__links {
  display: flex;
  gap: clamp(28px, 5vw, 80px);
}
.observation-rail__links a {
  display: flex;
  align-items: center;
  gap: 26px;
  color: inherit;
  font-size: 13px;
  text-decoration: none;
}
.observation-rail__links span[lang='en'] {
  display: block;
  margin-top: 5px;
  font-size: 10px;
  color: var(--ab-soft, #979b9f);
}
.observation-rail__links a > span:last-child {
  font-size: 25px;
  color: var(--ab-accent, #6a9cff);
}
@media (min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference) {
  .is-pinned .observation-rail__head {
    padding-right: 88px;
  }
  .is-pinned .observation-rail__stage {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: 100svh;
    min-height: 650px;
    padding-block: clamp(28px, 4vh, 52px);
  }
  .is-pinned .observation-rail__position,
  .is-pinned .observation-rail__scroll {
    display: flex;
  }
  .is-pinned .observation-rail__viewport {
    min-height: 0;
    margin-top: clamp(26px, 4vh, 48px);
    overflow: clip;
  }
  .is-pinned .observation-rail__track {
    display: flex;
    gap: 0;
    height: 100%;
    will-change: transform;
  }
  .is-pinned .observation-rail__panel {
    flex: 0 0 100%;
    height: 100%;
    padding: 8px 8px 12px;
  }
  .is-pinned .observation-rail__visual {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    max-height: 100%;
    min-height: 0;
  }
  .is-pinned .observation-rail__image-button {
    min-height: 0;
    max-height: 49svh;
  }
  .is-pinned .observation-rail__image-mask img {
    max-height: 49svh;
  }
  .is-pinned .observation-rail__foot {
    justify-content: space-between;
    align-items: center;
    margin-top: clamp(18px, 3vh, 34px);
    padding-top: 16px;
  }
}
@media (max-width: 980px) {
  .observation-rail__head {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .observation-rail__panel,
  .observation-rail__panel--2,
  .observation-rail__panel--3 {
    grid-template-columns: 1fr;
    gap: 28px;
    align-items: start;
  }
  .observation-rail__panel--2 .observation-rail__visual {
    grid-column: auto;
    grid-row: auto;
    width: min(78%, 430px);
  }
  .observation-rail__panel--2 .observation-rail__observation {
    grid-column: auto;
    grid-row: auto;
    padding-left: 0;
  }
  .observation-rail__panel--3 .observation-rail__visual {
    padding-right: 0;
  }
  .observation-rail__panel--3 .observation-rail__observation {
    padding-bottom: 0;
  }
  .observation-rail__observation {
    max-width: 520px;
  }
  .observation-rail__eyebrow {
    margin-bottom: 16px;
  }
  .observation-rail__copy {
    margin-top: 20px;
  }
  .observation-rail__copy--en {
    margin-top: 10px;
  }
  .observation-rail__foot {
    justify-content: flex-start;
  }
}
@media (max-width: 520px) {
  .observation-rail__links {
    width: 100%;
    flex-direction: column;
    gap: 24px;
  }
  .observation-rail__links a {
    justify-content: space-between;
  }
  .observation-rail__visual figcaption {
    flex-wrap: wrap;
    row-gap: 4px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .observation-rail__view {
    transition: none;
  }
}
</style>

<template>
  <section
    id="experience"
    ref="root"
    class="internship-story"
    :aria-label="lang === 'zh' ? '实习与实践' : 'Internships and practice'"
    :data-night="darkActive"
  >
    <span
      v-for="experience in experiences"
      :id="animated ? `work-${experience.workId}` : undefined"
      :key="experience.id"
      class="internship-story__anchor"
      aria-hidden="true"
    ></span>
    <div ref="stage" class="internship-story__stage">
      <div id="stories" ref="ribbons" class="internship-story__ribbons">
        <div class="studio-ribbon studio-ribbon--first">
          <p class="studio-ribbon__label">{{ lang === 'zh' ? '精选作品' : 'Selected work' }}</p>
          <div ref="upperTrack" class="studio-ribbon__track">
            <button
              v-for="image in images"
              :key="image.id"
              type="button"
              @click="openImage(image, $event)"
            >
              <img
                :src="image.src"
                :srcset="visualImageSources(image)"
                sizes="(max-width: 760px) 65vw, 30vw"
                :width="image.width"
                :height="image.height"
                :alt="pick(image.alt, lang)"
                loading="lazy"
                @load="refresh"
              />
            </button>
          </div>
        </div>
        <div id="identity" class="internship-story__intro">
          <p>{{ pick(PROFILE_LINES[0]!, lang) }}</p>
          <aside>
            <p v-for="(line, i) in PROFILE_LINES.slice(1)" :key="i">{{ pick(line, lang) }}</p>
          </aside>
        </div>
        <div class="studio-ribbon studio-ribbon--second">
          <p class="studio-ribbon__label">
            {{ lang === 'zh' ? '实习经历 · 向下滚动展开' : 'Internships · Scroll to unfold' }}
          </p>
          <div ref="lowerTrack" class="studio-ribbon__track">
            <a
              v-for="(experience, index) in experiences"
              :key="experience.id"
              :href="`#work-${experience.workId}`"
              class="internship-story__thumbnail"
              :data-card="index"
            >
              <AboutInternshipCover :experience="experience" :index="index" :lang="lang" />
            </a>
          </div>
        </div>
      </div>
      <div ref="frame" class="internship-story__frame">
        <div ref="cover" class="internship-story__extracted" aria-hidden="true">
          <AboutInternshipCover
            v-if="experiences[0]"
            :experience="experiences[0]"
            :index="0"
            :lang="lang"
          />
        </div>
        <div ref="track" class="internship-story__track">
          <template v-for="(experience, index) in experiences" :key="experience.id">
            <section
              class="internship-story__panel internship-story__media"
              :data-slide="index * 2"
              :aria-label="pick(experience.company, lang)"
            >
              <button
                v-if="asset(experience)"
                class="internship-story__photo"
                type="button"
                :aria-label="`${lang === 'zh' ? '查看作品' : 'View work'} ${pick(asset(experience)!.title, lang)}`"
                @click="openImage(asset(experience)!, $event)"
              >
                <img
                  :src="asset(experience)!.src"
                  :srcset="visualImageSources(asset(experience)!)"
                  sizes="(max-width: 760px) 100vw, 90vw"
                  :width="asset(experience)!.width"
                  :height="asset(experience)!.height"
                  :alt="pick(asset(experience)!.alt, lang)"
                  loading="lazy"
                  @load="refresh"
                />
              </button>
              <div v-else class="internship-story__poster">
                <span class="internship-story__poster-number" aria-hidden="true">{{
                  String(index + 1).padStart(2, '0')
                }}</span>
                <p>{{ pick(experience.role, lang) }}</p>
                <ol>
                  <li v-for="step in experience.cardFlow" :key="step.en">{{ pick(step, lang) }}</li>
                </ol>
              </div>
              <div class="internship-story__media-footer">
                <p>{{ pick(experience.company, lang) }}</p>
                <div
                  v-if="assets(experience).length > 1"
                  class="internship-story__selector"
                  :aria-label="lang === 'zh' ? '选择产品图' : 'Select product image'"
                >
                  <button
                    v-for="image in assets(experience)"
                    :key="image.id"
                    type="button"
                    :aria-pressed="asset(experience)?.id === image.id"
                    @click="selected[experience.id] = image.id"
                  >
                    {{ image.title.en.split(' · ')[0] }}
                  </button>
                </div>
              </div>
            </section>
            <article
              :id="animated ? undefined : `work-${experience.workId}`"
              class="internship-story__panel internship-story__text"
              :data-slide="index * 2 + 1"
              :aria-labelledby="`internship-title-${experience.id}`"
            >
              <div class="internship-story__reading">
                <p class="internship-story__period">
                  {{ String(index + 1).padStart(2, '0') }} / {{ pick(experience.period, lang) }}
                </p>
                <h2 :id="`internship-title-${experience.id}`">
                  {{ pick(experience.company, lang) }}
                </h2>
                <p class="internship-story__role">{{ pick(experience.role, lang) }}</p>
                <p class="internship-story__focus">{{ pick(experience.focus, lang) }}</p>
                <dl class="internship-story__metrics">
                  <div v-for="metric in experience.cardMetrics" :key="metric.label.en">
                    <dd>{{ metric.value }}</dd>
                    <dt>{{ pick(metric.label, lang) }}</dt>
                  </div>
                </dl>
                <p v-if="experience.cardNote" class="internship-story__note">
                  {{ pick(experience.cardNote, lang) }}
                </p>
                <ul class="internship-story__tags">
                  <li v-for="tag in experience.cardTags" :key="tag.en">{{ pick(tag, lang) }}</li>
                </ul>
                <details @toggle="refresh">
                  <summary>{{ lang === 'zh' ? '展开完整经历' : 'Full experience' }}</summary>
                  <div class="internship-story__details">
                    <div v-for="(detail, i) in experience.details" :key="i">
                      <h3>{{ pick(detail.title, lang) }}</h3>
                      <p>{{ pick(detail.body, lang) }}</p>
                    </div>
                  </div>
                </details>
              </div>
            </article>
          </template>
        </div>
        <nav
          v-if="animated"
          class="internship-story__controls"
          :aria-label="lang === 'zh' ? '经历浏览' : 'Browse experience'"
        >
          <span
            >{{ lang === 'zh' ? '实习经历' : 'Internships' }} ·
            {{ String(Math.floor(current / 2) + 1).padStart(2, '0') }} /
            {{ String(experiences.length).padStart(2, '0') }}</span
          >
          <div>
            <button
              type="button"
              :disabled="current === 0"
              :aria-label="lang === 'zh' ? '上一页' : 'Previous'"
              @click="seek(current - 1)"
            >
              ←</button
            ><button
              type="button"
              :disabled="current === experiences.length * 2 - 1"
              :aria-label="lang === 'zh' ? '下一页' : 'Next'"
              @click="seek(current + 1)"
            >
              →
            </button>
          </div>
        </nav>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import AboutInternshipCover from './实习原创封面.vue'
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  EXPERIENCE,
  PROFILE_LINES,
  pick,
  type Experience,
  type Lang,
} from '../../数据/人物资料'
import { personalPortfolio } from '../../数据/本机个人内容接口'
import type { VisualAsset } from '../../数据/视觉作品资料'
import { visualImageSources } from '../../工具/响应式图片'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'
const props = defineProps<{ lang: Lang; images: VisualAsset[] }>()
const emit = defineEmits<{ open: [item: VisualAsset, trigger: HTMLElement]; refresh: [] }>()
const experiences = personalPortfolio?.profile.EXPERIENCE ?? EXPERIENCE
const library = personalPortfolio?.profile.aboutMedia?.internships ?? []
const selected = reactive<Record<string, string>>({})
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const ribbons = ref<HTMLElement | null>(null)
const upperTrack = ref<HTMLElement | null>(null)
const lowerTrack = ref<HTMLElement | null>(null)
const cover = ref<HTMLElement | null>(null)
const frame = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const animated = ref(false)
const current = ref(0)
const darkActive = ref(false)
let media: gsap.MatchMedia | undefined
let timeline: gsap.core.Timeline | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let disposed = false
const readingTimes: number[] = []
gsap.registerPlugin(ScrollTrigger)
function assets(experience: Experience) {
  return (experience.visualAssetIds ?? []).flatMap((id) => {
    const image = library.find((item) => item.id === id)
    return image ? [image] : []
  })
}
function asset(experience: Experience) {
  const images = assets(experience)
  return images.find((image) => image.id === selected[experience.id]) ?? images[0]
}
function openImage(image: VisualAsset, event: MouseEvent) {
  emit('open', image, event.currentTarget as HTMLElement)
}
function refresh() {
  if (disposed) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
  emit('refresh')
}
function seek(index: number) {
  const trigger = timeline?.scrollTrigger
  const time = readingTimes[index]
  if (!trigger || !timeline || time === undefined) return
  window.scrollTo({
    top: trigger.start + ((trigger.end - trigger.start) * time) / timeline.duration(),
    behavior: 'instant',
  })
  ScrollTrigger.update()
  trigger.getTween()?.progress(1)
}
onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (
      disposed ||
      !root.value ||
      !stage.value ||
      !frame.value ||
      !track.value ||
      !lowerTrack.value
    )
      return
    const host = root.value
    const scene = stage.value
    const surface = frame.value
    const strip = track.value
    const source = lowerTrack.value.querySelector<HTMLElement>('[data-card="0"]')
    if (!source) return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
      (context) => {
        host.classList.add('is-animated')
        animated.value = true
        const panels = [...strip.querySelectorAll<HTMLElement>('[data-slide]')]
        const markers = [...host.querySelectorAll<HTMLElement>('.internship-story__anchor')]
        const geometry = () => {
          // The source remains in its original ribbon. Measure unscaled layout, independent of scroll progress.
          const s = source.getBoundingClientRect()
          const ribbonY = Number(gsap.getProperty(ribbons.value!, 'y')) || 0
          const b = scene.getBoundingClientRect()
          const angle = (-3 * Math.PI) / 180
          return {
            x: s.left - b.left,
            // A rotated bounding box starts at the top-right corner; recover the actual top-left.
            y:
              s.top -
              b.top -
              Math.sin(angle) * source.offsetWidth -
              ribbonY -
              scene.clientHeight * 0.65,
            scaleX: source.offsetWidth / scene.clientWidth,
            scaleY: source.offsetHeight / scene.clientHeight,
          }
        }
        let box = geometry()
        const updateAnchors = () => {
          const trigger = timeline?.scrollTrigger
          if (!trigger || !timeline) return
          markers.forEach((marker, i) => {
            // Router subtracts 24px from hash targets; compensate so each deep link reaches its readable hold.
            marker.style.top = `${((trigger.end - trigger.start) * readingTimes[i * 2 + 1]!) / timeline!.duration() + 24}px`
          })
        }
        timeline = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate(this: gsap.core.Timeline) {
            darkActive.value = this.time() >= 3.4 && Boolean(this.scrollTrigger?.isActive)
            const x = Math.abs(Number(gsap.getProperty(strip, 'x')))
            current.value = Math.min(
              panels.length - 1,
              Math.max(0, Math.round(x / scene.clientWidth)),
            )
          },
          scrollTrigger: {
            id: 'about-internship-story',
            trigger: host,
            pin: scene,
            start: 'top top',
            end: () => `+=${Math.round(scene.clientHeight * (3 + experiences.length * 1.15))}`,
            scrub: 0.35,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 25,
            onRefreshInit: () => {
              box = geometry()
            },
            onRefresh: updateAnchors,
            onToggle: (self) => {
              darkActive.value = self.isActive && (timeline?.time() ?? 0) >= 3.4
            },
          },
        })
        timeline
          .set(surface, { autoAlpha: 0, transformOrigin: '0 0' }, 0)
          .fromTo(
            ribbons.value,
            { y: 0 },
            { y: () => -scene.clientHeight * 0.65, duration: 1.7 },
            0,
          )
          .fromTo(
            upperTrack.value,
            { x: 0 },
            { x: () => -scene.clientWidth * 0.18, duration: 1.7 },
            0,
          )
          .fromTo(
            surface,
            {
              x: () => box.x,
              y: () => box.y,
              scaleX: () => box.scaleX,
              scaleY: () => box.scaleY,
              rotation: -3,
            },
            {
              x: () => scene.clientWidth * 0.25,
              y: () => scene.clientHeight * 0.28,
              scaleX: 0.5,
              scaleY: 0.44,
              rotation: 0,
              duration: 0.7,
              ease: 'power1.inOut',
              immediateRender: true,
            },
            1.7,
          )
          .set(surface, { autoAlpha: 1 }, 1.7)
          .set(source, { opacity: 0 }, 1.7)
          .to(surface, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1, ease: 'power1.inOut' }, 2.4)
          .to(ribbons.value, { opacity: 0, duration: 0.7 }, 2.4)
          .fromTo(cover.value, { xPercent: 0 }, { xPercent: -100, duration: 0.35 }, 3.55)
        let cursor = 3.55
        readingTimes.length = 0
        readingTimes.push(cursor + 0.15)
        timeline.to({}, { duration: 0.35 }, cursor)
        cursor += 0.35
        for (let index = 1; index < panels.length; index++) {
          timeline.to(strip, { x: () => -scene.clientWidth * index, duration: 0.7 }, cursor)
          cursor += 0.7
          const hold = index % 2 ? 0.85 : 0.3
          readingTimes.push(cursor + hold / 2)
          timeline.to({}, { duration: hold }, cursor)
          cursor += hold
        }
        const focus = (event: FocusEvent) => {
          const target =
            event.target instanceof HTMLElement
              ? event.target.closest<HTMLElement>('[data-slide]')
              : null
          if (!target) return
          const index = Number(target.dataset.slide)
          if (current.value !== index || timeline!.time() < 3.55) seek(index)
        }
        strip.addEventListener('focusin', focus)
        refresh()
        return () => {
          strip.removeEventListener('focusin', focus)
          context.ignore(() =>
            gsap.set([surface, strip, source, cover.value, ribbons.value, upperTrack.value], {
              clearProps: 'transform,transformOrigin,opacity,visibility',
            }),
          )
          host.classList.remove('is-animated')
          markers.forEach((marker) => marker.style.removeProperty('top'))
          animated.value = false
          darkActive.value = false
          current.value = 0
          timeline = undefined
        }
      },
      host,
    )
    refresh()
  })
})
watch(
  () => props.lang,
  async () => {
    await nextTick()
    refresh()
  },
)
onBeforeUnmount(() => {
  disposed = true
  cancelPreparation?.()
  cancelRefresh?.()
  media?.revert()
})
</script>
<style scoped>
.internship-story {
  position: relative;
  background: var(--about-paper);
  color: var(--about-ink-on-paper);
}
.internship-story__anchor {
  position: absolute;
  left: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
.internship-story__stage {
  position: relative;
}
.internship-story__ribbons {
  padding: 36px 0 60px;
  overflow: hidden;
}
.studio-ribbon {
  padding: 20px 0 30px;
}
.studio-ribbon__label {
  margin: 0 5vw 22px;
  font-size: 13px;
}
.studio-ribbon__track {
  display: flex;
  width: max-content;
  gap: 24px;
  padding: 0 5vw;
}
.studio-ribbon--first .studio-ribbon__track {
  rotate: -3deg;
  transform-origin: left center;
}
.studio-ribbon--first button {
  display: block;
  width: 28vw;
  height: 20vw;
  min-width: 230px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
}
.studio-ribbon--first img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.internship-story__thumbnail {
  display: block;
  position: relative;
  width: 32vw;
  height: 23vw;
  min-width: 260px;
  overflow: hidden;
  background: var(--about-night);
  color: var(--about-on-night);
  text-decoration: none;
}
.internship-story__thumbnail > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.internship-story__caption {
  position: absolute;
  inset: auto 0 0;
  padding: 48px 22px 22px;
  background: linear-gradient(transparent, rgba(18, 20, 15, 0.96));
  display: grid;
  gap: 7px;
}
.internship-story__caption strong {
  font-size: clamp(18px, 1.8vw, 30px);
  line-height: 1.25;
}
.internship-story__caption > span {
  font-size: 12px;
}
.internship-story__graphic {
  display: flex;
  flex-direction: column;
  padding: 24px;
  color: var(--about-accent-on-night);
  height: 100%;
  gap: 8px;
}
.internship-story__graphic > span:first-child {
  font: 700 clamp(70px, 9vw, 150px)/1 var(--display-font);
  opacity: 0.8;
}
.internship-story__graphic > span:not(:first-child) {
  font-size: 16px;
}
.internship-story__extracted {
  display: none;
}
.is-animated .internship-story__extracted {
  display: block;
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.internship-story__intro {
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  align-items: start;
  gap: 6vw;
  padding: 7svh 9vw;
}
.internship-story__intro > p {
  margin: 0;
  font-size: clamp(24px, 3vw, 48px);
  font-weight: 700;
  line-height: 1.35;
}
.internship-story__intro aside {
  border-top: 2px solid var(--about-accent-on-paper);
  color: var(--about-accent-on-paper);
  font-size: clamp(14px, 1.2vw, 20px);
  line-height: 1.45;
}
.studio-ribbon--second .studio-ribbon__track {
  rotate: -3deg;
  transform-origin: left center;
}
.internship-story__frame {
  background: var(--about-night);
  color: var(--about-on-night);
}
.internship-story__panel {
  box-sizing: border-box;
  position: relative;
  min-width: 0;
}
.internship-story__media {
  padding: 6vw;
}
.internship-story__photo {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}
.internship-story__photo img {
  display: block;
  width: 100%;
  height: 65svh;
  object-fit: contain;
}
.internship-story__media-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 18px;
}
.internship-story__media-footer p {
  margin: 0;
  font-size: 14px;
}
.internship-story__selector {
  display: flex;
  gap: 8px;
}
.internship-story__selector button {
  border: 1px solid var(--about-line-on-night);
  color: var(--about-on-night);
  background: transparent;
  padding: 8px 12px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.internship-story__selector button[aria-pressed='true'] {
  background: var(--about-sand);
  color: var(--about-ink-on-paper);
}
.internship-story__poster {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 55svh;
  padding: 5vw;
  border: 1px solid var(--about-line-on-night);
  overflow: hidden;
}
.internship-story__poster-number {
  position: absolute;
  top: 0;
  right: 3%;
  font: 800 clamp(100px, 28vw, 450px)/1 var(--display-font);
  color: var(--about-accent-on-night);
  opacity: 0.12;
}
.internship-story__poster p {
  position: relative;
  font-size: clamp(24px, 4vw, 64px);
  line-height: 1.2;
  max-width: 18ch;
}
.internship-story__poster ol {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 0;
  list-style: none;
  position: relative;
  color: var(--about-accent-on-night);
}
.internship-story__poster li + li::before {
  content: '→';
  margin-right: 20px;
}
.internship-story__text {
  display: grid;
  place-items: center;
  padding: 6vw;
  scroll-margin-top: 24px;
}
.internship-story__reading {
  width: min(880px, 100%);
  text-align: center;
}
.internship-story__period {
  color: var(--about-soft-on-night);
  font-size: 13px;
  margin: 0 0 20px;
}
.internship-story__reading h2 {
  font-size: clamp(28px, 4vw, 64px);
  letter-spacing: -0.04em;
  line-height: 1.15;
  margin: 0 0 18px;
}
.internship-story__role {
  color: var(--about-accent-on-night);
  font-size: clamp(16px, 1.6vw, 23px);
  margin: 0 0 22px;
}
.internship-story__focus {
  font-size: clamp(16px, 1.9vw, 28px);
  line-height: 1.5;
  margin: 0 auto;
  max-width: 38em;
}
.internship-story__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 30px 0 18px;
}
.internship-story__metrics dd {
  font: 700 clamp(25px, 3.3vw, 52px)/1.1 var(--display-font);
  margin: 0 0 8px;
  letter-spacing: -0.04em;
  color: var(--about-accent-on-night);
}
.internship-story__metrics dt {
  color: var(--about-soft-on-night);
  font-size: 13px;
}
.internship-story__note {
  font-size: 12px;
  line-height: 1.6;
  color: var(--about-soft-on-night);
  margin: 0;
}
.internship-story__tags {
  list-style: none;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: 20px 0;
}
.internship-story__tags li {
  color: var(--about-soft-on-night);
  border-bottom: 1px solid var(--about-line-on-night);
  padding: 4px 8px;
  font-size: 12px;
}
.internship-story__reading summary {
  cursor: pointer;
  color: var(--about-accent-on-night);
  font-size: 13px;
}
.internship-story__details {
  text-align: left;
  max-height: 27svh;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 0 12px;
}
.internship-story__details h3 {
  font-size: 16px;
  margin: 20px 0 8px;
}
.internship-story__details p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--about-soft-on-night);
}
.internship-story__controls {
  position: absolute;
  z-index: 2;
  bottom: 24px;
  left: 4vw;
  right: 4vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--about-soft-on-night);
}
.internship-story__controls button {
  border: 1px solid var(--about-line-on-night);
  background: var(--about-night);
  color: var(--about-on-night);
  width: 44px;
  height: 44px;
  margin-left: 8px;
  cursor: pointer;
}
.internship-story__controls button:disabled {
  opacity: 0.4;
  cursor: default;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--about-accent-on-night);
  outline-offset: 4px;
}
.is-animated .internship-story__stage {
  height: 100svh;
  min-height: 650px;
  overflow: clip;
  isolation: isolate;
}
.is-animated .internship-story__ribbons {
  position: absolute;
  inset: 0 0 auto;
  padding: 10svh 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 3svh;
}
.is-animated .studio-ribbon {
  flex: 0 0 auto;
  padding: 0;
}
.is-animated .studio-ribbon--first button {
  height: 28svh;
}
.is-animated .internship-story__thumbnail {
  height: 30svh;
}
.is-animated .internship-story__frame {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: clip;
  visibility: hidden;
}
.is-animated .internship-story__track {
  display: flex;
  height: 100%;
}
.is-animated .internship-story__panel {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  padding: 5vw;
}
.is-animated .internship-story__media {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 84px;
}
.is-animated .internship-story__photo img {
  height: 70svh;
}
.is-animated .internship-story__reading {
  max-height: 100%;
  overflow-y: auto;
  padding: 12px;
  overscroll-behavior: contain;
}
.is-animated .internship-story__text {
  padding-bottom: 84px;
}
@media (max-width: 980px), (max-height: 649px), (prefers-reduced-motion: reduce) {
  .internship-story__intro {
    grid-template-columns: 1fr;
    padding: 36px 6vw;
    gap: 20px;
  }
  .studio-ribbon {
    overflow-x: auto;
    scroll-padding-inline: 5vw;
  }
  .studio-ribbon__track {
    rotate: none !important;
  }
  .internship-story__ribbons {
    padding: 24px 0;
  }
  .internship-story__media {
    padding: 32px 5vw 12px;
  }
  .internship-story__photo img {
    height: 26svh;
  }
  .internship-story__poster {
    min-height: 22svh;
    padding: 24px;
  }
  .internship-story__poster p {
    margin: 0 0 20px;
    font-size: 24px;
  }
  .internship-story__poster ol {
    font-size: 12px;
    gap: 10px;
  }
  .internship-story__poster li + li::before {
    margin-right: 10px;
  }
  .internship-story__media-footer {
    flex-wrap: wrap;
    padding-top: 12px;
    gap: 12px;
  }
  .internship-story__text {
    padding: 28px 6vw 44px;
    border-bottom: 1px solid var(--about-line-on-night);
  }
  .internship-story__reading h2 {
    font-size: 28px;
  }
  .internship-story__period {
    margin-bottom: 12px;
  }
  .internship-story__role {
    margin-bottom: 14px;
  }
  .internship-story__metrics {
    margin: 20px 0 14px;
  }
  .internship-story__tags {
    margin: 16px 0;
  }
  .internship-story__details {
    max-height: none;
    overflow: visible;
  }
}
@media (max-width: 760px) {
  .studio-ribbon--first button,
  .internship-story__thumbnail {
    width: 65vw;
    height: 42vw;
    min-width: 0;
  }
  .studio-ribbon__track {
    gap: 14px;
  }
  .internship-story__caption {
    padding: 35px 14px 14px;
  }
  .internship-story__caption strong {
    font-size: 18px;
  }
  .internship-story__caption > span {
    font-size: 10px;
  }
  .internship-story__graphic {
    padding: 14px;
    gap: 2px;
  }
  .internship-story__graphic > span:first-child {
    font-size: 62px;
  }
  .internship-story__graphic > span:not(:first-child) {
    font-size: 12px;
  }
}
</style>

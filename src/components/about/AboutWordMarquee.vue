<template>
  <section
    id="identity-words"
    ref="root"
    class="identity-words"
    :aria-label="lang === 'zh' ? '我是谁' : 'Who I am'"
  >
    <p class="identity-words__caption">
      {{ lang === 'zh' ? '不止一种身份' : 'A little more about me' }}
    </p>
    <div ref="list" class="identity-words__list">
      <h2 v-for="word in words.slice(0, -1)" :key="word.en" class="identity-words__word">
        {{ word[lang] }}
      </h2>
      <h2 ref="lastWord" class="identity-words__word identity-words__word--last">
        <span
          v-for="(char, i) in Array.from(words[words.length - 1]![lang])"
          :key="`${lang}-${i}`"
          class="identity-words__glyph"
          >{{ char }}</span
        >
      </h2>
      <p ref="zoomNote" class="identity-words__during-zoom" aria-hidden="true">
        {{ lang === 'zh' ? '从想法，到作品。' : 'From ideas to work.' }}
      </p>
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Lang } from '../../data/aboutProfile'
import { findSolidTextFocus } from './aboutTextFocus'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
const props = defineProps<{ lang: Lang }>()
const words = [
  { zh: '内容策划者', en: 'Content Planner' },
  { zh: '视觉创作者', en: 'Visual Creator' },
  { zh: '影像记录者', en: 'Visual Storyteller' },
  { zh: '剪辑爱好者', en: 'Editing Enthusiast' },
  { zh: 'AI 探索者', en: 'AI Explorer' },
  { zh: '细节观察者', en: 'Detail Observer' },
  { zh: '持续学习者', en: 'Lifelong Learner' },
  { zh: '团队协作者', en: 'Team Collaborator' },
]
const zoomNote = ref<HTMLElement | null>(null)
const root = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const lastWord = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancel: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let disposed = false
gsap.registerPlugin(ScrollTrigger)
function initialize() {
  media?.revert()
  if (disposed || !root.value || !list.value || !lastWord.value) return
  const rootNode = root.value,
    listNode = list.value,
    word = lastWord.value
  media = gsap.matchMedia()
  media.add(
    '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
    () => {
      const lines = gsap.utils.toArray<HTMLElement>('.identity-words__word', listNode)
      lines.forEach((line) =>
        gsap.fromTo(
          line,
          { '--reveal': '0%' },
          {
            '--reveal': '100%',
            ease: 'none',
            scrollTrigger: {
              trigger: line,
              start: 'top 62%',
              end: 'bottom 62%',
              scrub: true,
            },
          },
        ),
      )
      const geometry = { x: 0, y: 0, scale: 1 }
      const measure = () => {
        const style = getComputedStyle(word)
        const width = Math.ceil(word.offsetWidth),
          height = Math.ceil(word.offsetHeight)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return false
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        context.fillStyle = '#EFE9DC'
        const metrics = context.measureText('Hg国')
        const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent
        const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent
        const baseline = (height - ascent - descent) / 2 + ascent
        word.querySelectorAll<HTMLElement>('.identity-words__glyph').forEach((glyph) => {
          context.fillText(glyph.textContent ?? '', glyph.offsetLeft, baseline)
        })
        const focus = findSolidTextFocus(
          context.getImageData(0, 0, width, height).data,
          width,
          height,
        )
        if (!focus) return false
        word.style.transformOrigin = `${focus.x}px ${focus.y}px`
        geometry.x = width / 2 - focus.x
        geometry.y = height / 2 - focus.y
        // A square wholly INSIDE an opaque stroke must cover both viewport axes at the end.
        geometry.scale =
          (Math.max(rootNode.clientWidth, window.innerHeight) / Math.max(1, focus.size - 2)) * 1.12
        return true
      }
      if (measure()) {
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              id: 'about-identity-final-zoom',
              trigger: word,
              pin: listNode,
              start: 'center center',
              end: () => `+=${window.innerHeight * 1.5}`,
              scrub: 0.3,
              refreshPriority: 42,
              invalidateOnRefresh: true,
              onRefreshInit: measure,
            },
          })
          .set(
            word,
            {
              backgroundImage: 'none',
              color: getComputedStyle(root.value!).getPropertyValue('--about-paper').trim(),
              force3D: false,
            },
            0,
          )
          .to(
            word,
            { scale: () => geometry.scale, x: () => geometry.x, y: () => geometry.y, duration: 3 },
            0.2,
          )
          .to(lines.slice(0, -1), { y: () => -window.innerHeight, duration: 3 }, 0.2)
          .to(rootNode, { backgroundColor: 'var(--about-paper)', duration: 0.2 }, 3)
      }
      return () => {
        word.style.removeProperty('transform-origin')
      }
    },
    rootNode,
  )
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}
onMounted(() => {
  if (root.value) cancel = prepareMotionLayout(root.value, initialize)
})
watch(
  () => props.lang,
  async () => {
    await nextTick()
    initialize()
  },
)
onBeforeUnmount(() => {
  disposed = true
  cancel?.()
  cancelRefresh?.()
  media?.revert()
})
</script>
<style scoped>
.identity-words {
  position: relative;
  isolation: isolate;
  overflow: clip;
  padding: 8svh 20px 0;
  background: var(--about-night);
  text-align: center;
}
.identity-words__during-zoom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 2;
  margin: 0;
  color: var(--about-accent-on-night);
  font-size: clamp(28px, 4vw, 64px);
  font-weight: 700;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}
.identity-words__caption {
  margin-bottom: 50px;
  font-size: 14px;
}
.identity-words__list {
  position: relative;
}
.identity-words__word {
  margin: 0;
  font-size: clamp(42px, 9.4vw, 180px);
  font-weight: 700;
  letter-spacing: -0.065em;
  line-height: 1.07;
  color: var(--about-on-night);
  --reveal: 100%;
  background: linear-gradient(
    to bottom,
    var(--about-on-night) 0 var(--reveal),
    var(--about-soft-on-night) var(--reveal) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
@media (max-width: 760px) {
  .identity-words {
    padding: 90px 16px 120px;
  }
  .identity-words__word {
    font-size: clamp(30px, 8vw, 60px);
    line-height: 1.3;
  }
}
.identity-words__word--last {
  background-image: linear-gradient(
    to bottom,
    var(--about-accent-on-night) 0 var(--reveal),
    var(--about-soft-on-night) var(--reveal) 100%
  );
  position: relative;
  width: max-content;
  max-width: 100%;
  margin-inline: auto;
  transform-origin: center;
}
.identity-words__glyph {
  display: inline-block;
  white-space: pre;
}
@media (max-width: 980px), (max-height: 649px), (prefers-reduced-motion: reduce) {
  .identity-words {
    padding-bottom: 100px;
  }
}
</style>

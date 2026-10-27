<template>
  <section ref="root" class="word-zoom" :aria-labelledby="headingId">
    <div ref="stage" class="word-zoom__stage">
      <h2 :id="headingId" class="word-zoom__accessible">{{ displayWord }}</h2>
      <div ref="stack" class="word-zoom__stack" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="word-zoom__slice">
          <div class="word-zoom__text">{{ displayWord }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { pick, type Bi, type Lang } from '../../数据/人物资料'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'
import '../../样式/人物肖像衬底.css'
// The reference folds three orange title strips inward, then SHRINKS the remaining title.
// Its cream zoom belongs to the final identity-list item, not this heading.
const props = withDefaults(
  defineProps<{
    lang: Lang
    word: Bi
    label: Bi
    backgroundSrc?: string
    backgroundSrcset?: string
    focusIndex?: number
    refreshPriority?: number
  }>(),
  { refreshPriority: 44 },
)
const headingId = `word-fold-${useId()}`
const displayWord = computed(() => pick(props.word, props.lang))
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const stack = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let disposed = false
gsap.registerPlugin(ScrollTrigger)
function refresh() {
  if (disposed) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}
function initialize() {
  media?.revert()
  if (!root.value || !stage.value || !stack.value || disposed) return
  const rootNode = root.value,
    stageNode = stage.value,
    stackNode = stack.value
  media = gsap.matchMedia()
  media.add(
    '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
    () => {
      const slices = [...stackNode.querySelectorAll<HTMLElement>('.word-zoom__slice')]
      const texts = [...stackNode.querySelectorAll<HTMLElement>('.word-zoom__text')]
      rootNode.classList.add('is-animated')
      const measure = () => {
        rootNode.style.setProperty('--fold-size', '100px')
        const width = Math.max(1, texts[1]!.scrollWidth)
        const size = Math.min(
          ((stageNode.clientWidth * 0.98) / width) * 100,
          stageNode.clientHeight * 0.24,
        )
        rootNode.style.setProperty('--fold-size', `${size}px`)
      }
      measure()
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: headingId,
            trigger: rootNode,
            pin: stageNode,
            start: 'top top',
            end: () => `+=${stageNode.clientHeight * 1.2}`,
            scrub: 0.25,
            refreshPriority: props.refreshPriority,
            invalidateOnRefresh: true,
            onRefreshInit: measure,
          },
        })
        .fromTo(slices[0]!, { xPercent: 8 }, { xPercent: 0, duration: 0.8 }, 0)
        .fromTo(slices[1]!, { xPercent: 0 }, { xPercent: 0, duration: 0.8 }, 0)
        .fromTo(slices[2]!, { xPercent: 8 }, { xPercent: 0, duration: 0.8 }, 0)
        .to(texts[0]!, { yPercent: 110, duration: 0.65 }, 0.95)
        .to(texts[2]!, { yPercent: -110, duration: 0.65 }, 0.95)
        // Moving an inline glyph out of its line box alone can leave ink from the
        // baseline/descent visible. Hide the complete outer slices before the
        // middle title shrinks; the scrubbed tween restores them on reverse.
        .fromTo([slices[0]!, slices[2]!], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 }, 1.52)
        .to(slices[1]!, { scale: 0.42, duration: 0.9 }, 1.6)
        .to({}, { duration: 0.35 })
      return () => {
        rootNode.classList.remove('is-animated')
        rootNode.style.removeProperty('--fold-size')
      }
    },
    rootNode,
  )
  refresh()
}
onMounted(() => {
  if (root.value) cancelPreparation = prepareMotionLayout(root.value, initialize)
})
watch(
  () => [props.lang, props.word.zh, props.word.en],
  async () => {
    await nextTick()
    initialize()
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
.word-zoom {
  position: relative;
  background: var(--about-night);
  color: var(--about-accent-on-night);
}
.word-zoom__stage {
  position: relative;
  min-height: 50svh;
  display: grid;
  place-items: center;
  overflow: clip;
}
.word-zoom__accessible {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.word-zoom__stack {
  position: relative;
  width: 100%;
  text-align: center;
  font-family: 'Arial Black', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 900;
  font-size: clamp(40px, 12vw, 160px);
  line-height: 1;
  letter-spacing: -0.055em;
}
.word-zoom__slice {
  position: relative;
  width: 100%;
  height: 1em;
  overflow: hidden;
}
.word-zoom__slice:first-child,
.word-zoom__slice:last-child {
  display: none;
}
.word-zoom__text {
  display: block;
  width: max-content;
  height: 1em;
  margin-inline: auto;
  line-height: 1;
  white-space: nowrap;
}
.is-animated .word-zoom__stage {
  height: 100svh;
  min-height: 650px;
}
.is-animated .word-zoom__stack {
  font-size: var(--fold-size);
}
.is-animated .word-zoom__slice:first-child,
.is-animated .word-zoom__slice:last-child {
  display: block;
}
</style>

<template>
  <section ref="root" class="word-zoom" :aria-labelledby="headingId">
    <div ref="stage" class="word-zoom__stage">
      <div class="word-zoom__backdrop" aria-hidden="true">
        <img
          :src="backgroundSource"
          :srcset="backgroundSources"
          sizes="100vw"
          alt=""
          loading="lazy"
          decoding="async"
          @load="scheduleRefresh"
        />
      </div>
      <header ref="caption" class="word-zoom__caption">
        <p>
          {{ label.zh }}<span lang="en">{{ label.en }}</span>
        </p>
      </header>
      <h2 :id="headingId" class="word-zoom__accessible" :lang="lang">{{ displayWord }}</h2>
      <div class="word-zoom__window" aria-hidden="true">
        <div ref="wordElement" class="word-zoom__word">
          <span
            v-for="(character, index) in characters"
            :key="`${index}-${character}`"
            class="word-zoom__character"
            >{{ character }}</span
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * An independent word transition between the portrait introduction and folded title.
 * Only the word grows: the portrait and pinned stage retain their own coordinate system.
 * Offset dimensions measure the untransformed word on every refresh; no resize-created
 * context escapes matchMedia ownership. All content remains in natural flow otherwise.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { pick, type Bi, type Lang } from '../../data/aboutProfile'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'
import { aboutQuotePortrait } from '../../data/personalPortfolio'

const props = withDefaults(
  defineProps<{
    lang: Lang
    word: Bi
    label: Bi
    backgroundSrc?: string
    backgroundSrcset?: string
    /** Zero-based Unicode character index; omitted selects the glyph nearest the word centre. */
    focusIndex?: number
    refreshPriority?: number
  }>(),
  { refreshPriority: 35 },
)

gsap.registerPlugin(ScrollTrigger)

const portrait = aboutQuotePortrait
const headingId = `word-zoom-${useId()}`
const displayWord = computed(() => pick(props.word, props.lang).trim())
const characters = computed(() => Array.from(displayWord.value))
const backgroundSource = computed(() => props.backgroundSrc || portrait.src)
const backgroundSources = computed(
  () => props.backgroundSrcset || (!props.backgroundSrc ? visualImageSources(portrait) : undefined),
)
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const wordElement = ref<HTMLElement | null>(null)
const caption = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false
let mounted = false

function scheduleRefresh(): void {
  if (!mounted || dead) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}

onMounted(() => {
  mounted = true
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    cancelPreparation = undefined
    if (dead || !root.value || !stage.value || !wordElement.value || !caption.value) return
    const rootNode = root.value
    const stageNode = stage.value
    const wordNode = wordElement.value
    const captionNode = caption.value
    media = gsap.matchMedia()
    media.add(
      '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
      () => {
        rootNode.classList.add('is-animated')
        const originalOrigin = wordNode.style.transformOrigin
        const geometry = { x: 0, y: 0, scale: 1 }

        const measure = (): void => {
          const currentSize = parseFloat(getComputedStyle(wordNode).fontSize) || 1
          const widthPerPixel = Math.max(1, wordNode.offsetWidth) / currentSize
          const heightPerPixel = Math.max(1, wordNode.offsetHeight) / currentSize
          const fittedSize = Math.min(
            (stageNode.clientWidth * 0.84) / widthPerPixel,
            (stageNode.clientHeight * 0.28) / heightPerPixel,
          )
          rootNode.style.setProperty('--word-zoom-size', `${Math.max(1, fittedSize)}px`)

          const glyphs = Array.from(wordNode.querySelectorAll<HTMLElement>('.word-zoom__character'))
          const visibleGlyphs = glyphs.filter((glyph) => glyph.textContent?.trim())
          const wordWidth = Math.max(1, wordNode.offsetWidth)
          const wordHeight = Math.max(1, wordNode.offsetHeight)
          const requested = props.focusIndex === undefined ? undefined : glyphs[props.focusIndex]
          const centred = visibleGlyphs.reduce<HTMLElement | undefined>((nearest, glyph) => {
            const distance = Math.abs(glyph.offsetLeft + glyph.offsetWidth / 2 - wordWidth / 2)
            const previous = nearest
              ? Math.abs(nearest.offsetLeft + nearest.offsetWidth / 2 - wordWidth / 2)
              : Infinity
            return distance < previous ? glyph : nearest
          }, undefined)
          const focus = requested?.textContent?.trim() ? requested : centred
          const pivotX = focus ? focus.offsetLeft + focus.offsetWidth / 2 : wordWidth / 2
          const pivotY = focus ? focus.offsetTop + focus.offsetHeight / 2 : wordHeight / 2
          wordNode.style.transformOrigin = `${pivotX}px ${pivotY}px`
          geometry.x = wordWidth / 2 - pivotX
          geometry.y = wordHeight / 2 - pivotY
          // Scale the measured focus glyph beyond the stage, retaining its counters and gaps.
          // This enlarges real text; it does not turn a rectangular layer into a cream wipe.
          geometry.scale =
            Math.max(
              stageNode.clientWidth / Math.max(1, focus?.offsetWidth ?? wordWidth),
              stageNode.clientHeight / Math.max(1, focus?.offsetHeight ?? wordHeight),
            ) * 2.8
        }

        measure()
        // Keep large text in a 2D transform so the browser can rasterise at its current size.
        // A permanently promoted low-resolution text layer becomes blurred during this zoom.
        gsap.set(wordNode, { xPercent: -50, yPercent: -50, force3D: false })
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              id: headingId,
              trigger: rootNode,
              pin: stageNode,
              start: 'top top',
              end: () =>
                `+=${Math.round(stageNode.clientHeight * 2.2 + stageNode.clientWidth * 0.25)}`,
              refreshPriority: props.refreshPriority,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefreshInit: measure,
            },
          })
          .to({}, { duration: 0.2 })
          .fromTo(
            wordNode,
            { x: 0, y: 0, scale: 1, autoAlpha: 1 },
            {
              x: () => geometry.x,
              y: () => geometry.y,
              scale: () => geometry.scale,
              duration: 0.72,
            },
            0.2,
          )
          .to(captionNode, { autoAlpha: 0, duration: 0.12 }, 0.2)
          .to({}, { duration: 0.12 })
          .to(wordNode, { autoAlpha: 0, duration: 0.18 }, 1.04)
          .to({}, { duration: 0.12 })

        scheduleRefresh()
        return () => {
          rootNode.classList.remove('is-animated')
          rootNode.style.removeProperty('--word-zoom-size')
          wordNode.style.transformOrigin = originalOrigin
        }
      },
      rootNode,
    )
    scheduleRefresh()
    void document.fonts.ready.then(scheduleRefresh)
  })
})

watch(
  () => [
    props.lang,
    props.word.zh,
    props.word.en,
    props.focusIndex,
    props.backgroundSrc,
    props.backgroundSrcset,
  ],
  async () => {
    await nextTick()
    scheduleRefresh()
  },
)

onBeforeUnmount(() => {
  dead = true
  mounted = false
  cancelPreparation?.()
  cancelRefresh?.()
  media?.revert()
})
</script>

<style scoped>
.word-zoom {
  position: relative;
  background: var(--ab-bg, #050505);
  color: #ffe8ce;
  scroll-margin-top: 72px;
}
.word-zoom__stage {
  position: relative;
  padding: clamp(64px, 8vw, 112px) clamp(22px, 5vw, 88px);
}
.word-zoom__backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.word-zoom__backdrop img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.23;
}
.word-zoom__backdrop::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgb(5 5 5 / 0.35), rgb(5 5 5 / 0.78));
}
.word-zoom__caption {
  position: relative;
  z-index: 1;
  font-size: 14px;
  line-height: 1.6;
}
.word-zoom__caption p {
  margin: 0;
}
.word-zoom__caption span {
  display: block;
  margin-top: 6px;
  color: var(--ab-soft, #b9ab97);
  font-size: 12px;
}
.word-zoom__accessible {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.word-zoom__window {
  position: relative;
  padding: clamp(36px, 7vw, 80px) 0 10px;
  text-align: center;
}
.word-zoom__word {
  position: relative;
  display: inline-block;
  max-width: 100%;
  font-family: 'Arial Black', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
  font-size: clamp(40px, 12vw, 160px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.055em;
  overflow-wrap: anywhere;
}
.word-zoom__character {
  display: inline-block;
  white-space: pre;
}
.is-animated .word-zoom__stage {
  height: 100svh;
  min-height: 650px;
  padding: 0;
  overflow: clip;
}
.is-animated .word-zoom__caption {
  position: absolute;
  top: clamp(36px, 6svh, 76px);
  left: clamp(24px, 5vw, 88px);
  right: 140px;
}
.is-animated .word-zoom__window {
  position: absolute;
  inset: 0;
  padding: 0;
  overflow: clip;
}
.is-animated .word-zoom__word {
  position: absolute;
  top: 50%;
  left: 50%;
  width: max-content;
  max-width: none;
  font-size: var(--word-zoom-size, 100px);
  white-space: pre;
}
</style>

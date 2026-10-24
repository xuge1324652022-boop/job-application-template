<template>
  <header
    id="about-intro"
    ref="root"
    class="about-motion-hero"
    :class="{ 'is-active': active, 'is-motion': motionReady }"
    aria-labelledby="about-title"
  >
    <div class="about-motion-hero__top">
      <span
        >{{ IDENTITY.nameEn }}<span>{{ IDENTITY.nameZh }}</span></span
      >
      <a href="#contact">让我们聊聊 <span lang="en">Let’s talk ↗</span></a>
    </div>
    <div ref="stage" class="about-motion-hero__stage">
      <!-- 固定外壳不参与位移；只有内层窗口裁切完整的纵向字轨。 -->
      <div ref="clipWindow" class="about-motion-hero__window">
        <h1 id="about-title" ref="track" class="about-motion-hero__track">
          <span v-for="row in IDENTITY_ROWS" :key="row.en" class="about-motion-hero__row">
            <span class="about-motion-hero__word" lang="en">{{ row.en }}</span>
            <span class="about-motion-hero__zh" lang="zh">{{ row.zh }}</span>
          </span>
        </h1>
      </div>
      <figure ref="portrait" class="about-motion-hero__portrait">
        <div ref="portraitMask" class="about-motion-hero__portrait-mask">
          <img
            :src="PORTRAIT.src"
            :srcset="visualImageSources(PORTRAIT)"
            sizes="(max-width: 760px) calc(100vw - 44px), 30vw"
            :width="PORTRAIT.width"
            :height="PORTRAIT.height"
            :alt="pick(PORTRAIT.alt, lang)"
            decoding="async"
          />
        </div>
        <figcaption>
          {{ isPersonalPortfolio ? IDENTITY.nameZh : '合成图像示例'
          }}<span lang="en">{{
            isPersonalPortfolio ? IDENTITY.nameEn : 'Synthetic image example'
          }}</span>
        </figcaption>
      </figure>
    </div>
    <div class="about-motion-hero__bottom">
      <p>
        {{ pick(TAGLINE, 'zh') }}<span lang="en">{{ pick(TAGLINE, 'en') }}</span>
      </p>
      <a href="#stories" class="about-motion-hero__scroll"
        ><span>向下，认识我的工作<span lang="en">Scroll to explore my practice</span></span
        ><span aria-hidden="true">↓</span></a
      >
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IDENTITY, TAGLINE, pick, type Lang } from '../../data/aboutProfile'
import { aboutPortrait, isPersonalPortfolio } from '../../data/personalPortfolio'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'

/** 短词对应原有工作方向，中文说明与人物信息保持资料来源。 */
const IDENTITY_ROWS = [
  { en: 'PLANNING', zh: '内容策划' },
  { en: 'EDITING', zh: '视频剪辑' },
  { en: 'VISUALS', zh: '视觉表达' },
  { en: 'AI', zh: 'AI 协作' },
] as const
const PORTRAIT = aboutPortrait
const props = defineProps<{ active: boolean; lang: Lang }>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const clipWindow = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const portrait = ref<HTMLElement | null>(null)
const portraitMask = ref<HTMLElement | null>(null)
const motionReady = ref(false)
let media: gsap.MatchMedia | undefined
let scene: ScrollTrigger | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let resizeObserver: ResizeObserver | undefined
let measureFrame = 0
let stopResize: (() => void) | undefined
let dead = false

gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (
      dead ||
      !root.value ||
      !stage.value ||
      !clipWindow.value ||
      !track.value ||
      !portrait.value ||
      !portraitMask.value
    )
      return
    const rootElement = root.value
    const windowElement = clipWindow.value
    const trackElement = track.value
    const portraitElement = portrait.value
    const maskElement = portraitMask.value
    const words = [...trackElement.querySelectorAll<HTMLElement>('.about-motion-hero__word')]

    // 布局宽高不受轨道当前的 translate/scale 影响，倒滚与中途 resize 都能重测。
    const fitWords = () => {
      const currentSize = parseFloat(getComputedStyle(trackElement).fontSize)
      const widest = Math.max(1, ...words.map((word) => word.offsetWidth))
      const rootStyle = getComputedStyle(rootElement)
      const animated = rootElement.classList.contains('is-motion')
      const availableWidth = animated
        ? document.documentElement.clientWidth -
          parseFloat(rootStyle.paddingLeft) -
          parseFloat(rootStyle.paddingRight)
        : windowElement.clientWidth
      const desired = Math.min(
        innerWidth * (animated ? 0.145 : 0.155),
        animated ? innerHeight * 0.19 : 168,
      )
      let size = Math.max(1, Math.min(desired, ((availableWidth - 4) * currentSize) / widest))
      trackElement.style.setProperty('--hero-word-size', `${Math.floor(size * 10) / 10}px`)
      if (animated) {
        const wordHeight = words.reduce((total, word) => total + word.offsetHeight, 0)
        const fixedHeight = trackElement.offsetHeight - wordHeight
        const availableHeight = windowElement.clientHeight * 0.94 - fixedHeight
        if (wordHeight > availableHeight && availableHeight > 0)
          size *= availableHeight / wordHeight
        trackElement.style.setProperty('--hero-word-size', `${Math.floor(size * 10) / 10}px`)
      }
    }
    const requestRefresh = () => {
      cancelRefresh?.()
      cancelRefresh = requestMotionLayoutRefresh()
    }
    const scheduleMeasure = () => {
      if (dead || measureFrame) return
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0
        if (dead) return
        fitWords()
        requestRefresh()
      })
    }

    fitWords()
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
      () => {
        motionReady.value = true
        rootElement.classList.add('is-motion')
        fitWords()
        const geometry = () => {
          const width = windowElement.clientWidth
          const height = windowElement.clientHeight
          const textWidth = trackElement.offsetWidth
          const textHeight = trackElement.offsetHeight
          const gap = Math.min(72, Math.max(24, width * 0.045))
          const leftColumn = Math.max(1, width - portraitElement.offsetWidth - gap)
          const scale = Math.min(
            0.82,
            leftColumn / Math.max(1, textWidth),
            (height * 0.94) / Math.max(1, textHeight),
          )
          return {
            startY: height * 0.48,
            centerX: (width - textWidth) / 2,
            centerY: (height - textHeight) / 2,
            composeX: (leftColumn - textWidth * scale) / 2,
            composeY: (height - textHeight * scale) / 2,
            scale,
            exitY: (height - textHeight * scale) / 2 - height * 0.16,
          }
        }
        // 根容器完整固定并保留占位。裁切只在内层，不让底栏与后续场景穿过字轨。
        const timeline = gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              id: 'about-hero-rearrange',
              trigger: rootElement,
              refreshPriority: 45,
              start: 'top top',
              end: () => `+=${Math.round(innerHeight * 2.35)}`,
              pin: rootElement,
              pinSpacing: true,
              scrub: true,
              invalidateOnRefresh: true,
              anticipatePin: 1,
              onRefreshInit: fitWords,
            },
          })
          .fromTo(
            trackElement,
            {
              x: () => geometry().centerX,
              y: () => geometry().startY,
              scale: 1,
              transformOrigin: '0% 0%',
            },
            { x: () => geometry().centerX, y: () => geometry().centerY, duration: 1.6 },
            0,
          )
          .to({}, { duration: 0.28 })
          .to(
            trackElement,
            {
              x: () => geometry().composeX,
              y: () => geometry().composeY,
              scale: () => geometry().scale,
              duration: 0.75,
              ease: 'power1.inOut',
            },
            1.88,
          )
          .fromTo(
            portraitElement,
            { autoAlpha: 0, x: () => innerWidth * 0.06 },
            { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power1.out' },
            2.03,
          )
          .fromTo(
            maskElement,
            { clipPath: 'inset(14% 20% 14% 20%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65, ease: 'power1.inOut' },
            2.03,
          )
          .to({}, { duration: 0.62 }, 2.68)
          // 留住文字尾部与人物构图，再由原生滚动整体带出，下一段能连续接入。
          .to(trackElement, { y: () => geometry().exitY, duration: 0.6 }, 3.3)
          .to(portraitElement, { y: () => -innerHeight * 0.08, duration: 0.6 }, 3.3)
        scene = timeline.scrollTrigger
        requestRefresh()
        return () => {
          scene = undefined
          motionReady.value = false
          rootElement.classList.remove('is-motion')
          scheduleMeasure()
        }
      },
      rootElement,
    )

    resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(windowElement)
    window.addEventListener('resize', scheduleMeasure, { passive: true })
    stopResize = () => window.removeEventListener('resize', scheduleMeasure)
    void document.fonts.ready.then(() => {
      if (!dead) scheduleMeasure()
    })
  })
})

// 布局可在幕布下准备；呈现闸门由父页 active 控制，揭幕时同步当前滚动位置。
watch(
  () => props.active,
  (active) => {
    if (active) scene?.update()
  },
)
onBeforeUnmount(() => {
  dead = true
  if (measureFrame) cancelAnimationFrame(measureFrame)
  resizeObserver?.disconnect()
  stopResize?.()
  cancelPreparation?.()
  cancelRefresh?.()
  media?.revert()
})
</script>

<style scoped>
.about-motion-hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 44px;
  padding: 38px clamp(22px, 5vw, 88px) 44px;
  background: var(--ab-bg, #050505);
  color: var(--ab-ink, #ffe8ce);
}
.about-motion-hero__top {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: start;
  padding-right: 100px;
  font-size: 14px;
  line-height: 1.5;
}
.about-motion-hero__top > span > span {
  display: block;
  font-size: 11px;
  color: var(--ab-soft, #b9ab97);
}
.about-motion-hero__top a {
  color: inherit;
  text-decoration: none;
}
.about-motion-hero__top a span {
  display: block;
  color: var(--ab-soft, #b9ab97);
  font-size: 11px;
}
.about-motion-hero__stage {
  position: relative;
  min-height: 0;
}
.about-motion-hero__window {
  position: relative;
}
.about-motion-hero__track {
  position: relative;
  width: max-content;
  max-width: 100%;
  margin: 0;
  padding: 0.04em 0 0.06em;
  color: var(--ab-accent, #ef4b40);
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--hero-word-size, clamp(40px, 14vw, 190px));
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: -0.055em;
}
.about-motion-hero__row {
  display: block;
  width: max-content;
  max-width: 100%;
}
.about-motion-hero__row + .about-motion-hero__row {
  margin-top: 0.09em;
}
.about-motion-hero__word {
  display: inline-block;
  white-space: nowrap;
  line-height: 0.84;
}
.about-motion-hero__zh {
  display: block;
  margin-top: 10px;
  padding-left: 0.12em;
  color: var(--ab-soft, #b9ab97);
  font-family: inherit;
  font-size: clamp(11px, 0.85vw, 13px);
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.22em;
}
.about-motion-hero__portrait {
  width: min(420px, 100%);
  margin: 40px 0 0;
}
.about-motion-hero__portrait-mask {
  aspect-ratio: 4/3;
  overflow: hidden;
  background: #221c15;
}
.about-motion-hero__portrait-mask img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.about-motion-hero__portrait figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 12px;
  color: var(--ab-soft, #b9ab97);
  font-size: 11px;
  line-height: 1.5;
}
.about-motion-hero__portrait figcaption span {
  font-size: 10px;
}
.about-motion-hero__bottom {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 32px;
  align-items: end;
}
.about-motion-hero__bottom > p {
  max-width: 36em;
  margin: 0;
  font-size: clamp(18px, 1.9vw, 26px);
  line-height: 1.5;
  letter-spacing: -0.02em;
}
.about-motion-hero__bottom > p > span {
  display: block;
  margin-top: 12px;
  color: var(--ab-soft, #b9ab97);
  font-size: 12px;
  line-height: 1.55;
  letter-spacing: 0;
}
.about-motion-hero__scroll {
  display: flex;
  gap: 28px;
  align-items: center;
  color: inherit;
  text-decoration: none;
  font-size: 12px;
}
.about-motion-hero__scroll span[lang='en'] {
  display: block;
  margin-top: 6px;
  color: var(--ab-soft, #b9ab97);
  font-size: 10px;
}
.about-motion-hero__scroll > span:last-child {
  font-size: 32px;
}
.is-motion {
  height: 100vh;
  height: 100svh;
  min-height: 650px;
  gap: clamp(26px, 4.5svh, 48px);
}
.is-motion .about-motion-hero__window {
  position: absolute;
  inset: 0;
  overflow: clip;
}
.is-motion .about-motion-hero__track {
  position: absolute;
  left: 0;
  top: 0;
  width: max-content;
  max-width: none;
  will-change: transform;
}
.is-motion .about-motion-hero__portrait {
  position: absolute;
  right: 0;
  top: 50%;
  width: min(30vw, 400px);
  margin: 0;
  transform: translateY(-50%);
}
.is-motion:not(.is-active) .about-motion-hero__stage {
  opacity: 0;
  pointer-events: none;
}
a:focus-visible {
  outline: 2px solid var(--ab-accent, #ef4b40);
  outline-offset: 8px;
}
@media (max-width: 760px) {
  .about-motion-hero {
    gap: 40px;
    padding: 35px 22px 64px;
  }
  .about-motion-hero__top {
    padding-right: 62px;
    font-size: 12px;
  }
  .about-motion-hero__top a {
    display: none;
  }
  .about-motion-hero__track {
    letter-spacing: -0.045em;
  }
  .about-motion-hero__zh {
    margin-top: 8px;
    font-size: 11px;
  }
  .about-motion-hero__portrait {
    width: 100%;
    margin-top: 40px;
  }
  .about-motion-hero__bottom {
    flex-direction: column;
    align-items: start;
    gap: 32px;
  }
  .about-motion-hero__bottom > p {
    font-size: 19px;
  }
  .about-motion-hero__bottom > p > span {
    font-size: 11px;
  }
}
@media (min-width: 761px) and (prefers-reduced-motion: reduce),
  (min-width: 761px) and (max-height: 649px) {
  .about-motion-hero__stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 0.65fr);
    gap: 48px;
    align-items: center;
  }
  .about-motion-hero__portrait {
    width: 100%;
    margin: 0;
  }
}
</style>

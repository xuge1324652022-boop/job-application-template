<template>
  <header
    id="about-intro"
    ref="root"
    class="about-hero"
    :class="{ 'is-active': active, 'has-scene-portrait': hasScenePortrait }"
    aria-labelledby="about-title"
  >
    <!-- 右侧全出血人物图铺底，姓名巨字压在照片上，参照原站开场的图文重叠。 -->
    <figure class="about-hero__photo">
      <div ref="photoMask" class="about-hero__photo-mask">
        <img
          ref="photo"
          :src="PORTRAIT.src"
          :srcset="visualImageSources(PORTRAIT)"
          :sizes="'100vw'"
          :width="PORTRAIT.width"
          :height="PORTRAIT.height"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
      </div>
      <figcaption>
        {{
          isPersonalPortfolio
            ? lang === 'zh'
              ? hasScenePortrait
                ? 'AI 辅助人物插画 · 非纪实照片'
                : '个人形象照片'
              : hasScenePortrait
                ? 'AI-assisted illustration · not a photograph'
                : 'Personal portrait'
            : lang === 'zh'
              ? '合成图像示例'
              : 'Synthetic image example'
        }}
      </figcaption>
    </figure>
    <div class="about-hero__stage">
      <!-- 英文姓名巨字铺满可用宽度。 -->
      <h1 id="about-title" ref="title" class="about-hero__title">
        <span ref="sceneName" class="about-hero__line" lang="en">{{
          IDENTITY.nameEn.toUpperCase()
        }}</span>
        <span class="about-hero__signature" lang="en" aria-hidden="true">{{
          IDENTITY.nameEn
        }}</span>
        <span class="about-hero__screen-reader">{{ IDENTITY.nameZh }} · {{ IDENTITY.nameEn }}</span>
      </h1>
      <div ref="meta" class="about-hero__meta">
        <p class="about-hero__tagline">
          <span v-for="line in taglineLines" :key="line" class="about-hero__tagline-line">{{
            line
          }}</span>
        </p>
      </div>
      <a href="#voice" class="about-hero__scroll">
        <span>{{ lang === 'zh' ? '滚动认识我' : 'SCROLL TO DISCOVER' }}</span>
        <span class="about-hero__scroll-arrow" aria-hidden="true">↓</span>
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IDENTITY, TAGLINE, type Lang } from '../../数据/人物资料'
import {
  aboutHeroPortrait,
  isPersonalPortfolio,
  personalPortfolio,
} from '../../数据/本机个人内容接口'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'
import { visualImageSources } from '../../工具/响应式图片'
import { useFitText } from '../../组合函数/标题字号拟合'

/**
 * 开场（参照 wonjyou.studio/about 的 hero）：右侧全出血人物图，
 * 英文姓名大写巨字压图；左下方向与主张小字。
 * 入场一次性播放；滚动段不固定，巨字与照片以不同速度视差离场。
 */
const props = defineProps<{ active: boolean; lang: Lang }>()
const taglineLines = computed(
  () =>
    TAGLINE[props.lang]
      .match(/[^，。.!?]+[，。.!?]?/g)
      ?.map((line) => line.trim())
      .filter(Boolean) ?? [],
)
const PORTRAIT = aboutHeroPortrait
const hasScenePortrait = Boolean(personalPortfolio?.portraits?.hero)
const root = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const sceneName = ref<HTMLElement | null>(null)
const nameFit = useFitText(sceneName, { min: 1, max: 440 })
const meta = ref<HTMLElement | null>(null)
const photo = ref<HTMLElement | null>(null)
const photoMask = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let entrance: gsap.core.Timeline | undefined
let parallax: ScrollTrigger | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let played = false
let dead = false
gsap.registerPlugin(ScrollTrigger)

function play(): void {
  if (!props.active || !entrance || played) return
  played = true
  entrance.play()
}

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !title.value || !meta.value || !photo.value || !photoMask.value)
      return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const lines = title.value!.querySelectorAll('.about-hero__line')
        // 入场只播一次；断点分支重建时清掉旧状态，避免元素停在隐藏起点。
        if (played) {
          gsap.set([lines, meta.value!], {
            clearProps: 'transform,opacity,visibility',
          })
          gsap.set(photoMask.value!, { clearProps: 'clipPath' })
        } else {
          entrance = gsap
            .timeline({
              paused: true,
              onComplete: () => {
                nameFit.fit()
                cancelRefresh?.()
                cancelRefresh = requestMotionLayoutRefresh()
              },
            })
            .fromTo(
              photoMask.value!,
              { clipPath: 'inset(100% 0% 0% 0%)' },
              { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' },
            )
            .fromTo(
              lines,
              { yPercent: 116, autoAlpha: 0 },
              {
                yPercent: 0,
                autoAlpha: 1,
                duration: 1.05,
                stagger: 0.09,
                ease: 'expo.out',
                clearProps: 'transform,opacity,visibility',
              },
              0.2,
            )
            .fromTo(
              meta.value!,
              { autoAlpha: 0, y: 26 },
              { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' },
              1.05,
            )
          play()
        }
        // 视差离场：巨字向上走得比页面快，照片慢半拍，纵深感交给原生滚动。
        const timeline = gsap
          .timeline({
            scrollTrigger: {
              id: 'about-hero-parallax',
              trigger: root.value!,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .to(title.value!, { y: () => innerHeight * 0.3, ease: 'none' }, 0)
          .fromTo(
            photo.value!,
            { scale: 1.12, y: 0, transformOrigin: 'center top' },
            { scale: 1.12, y: () => -root.value!.clientHeight * 0.08, ease: 'none' },
            0,
          )
          .to(meta.value!, { y: () => innerHeight * 0.12, ease: 'none' }, 0)
        parallax = timeline.scrollTrigger
        return () => {
          entrance = undefined
          parallax = undefined
        }
      },
      root.value,
    )
    cancelRefresh = requestMotionLayoutRefresh()
  })
})
// 布局可在幕布下准备；呈现闸门由父页 active 控制，揭幕时同步当前滚动位置。
watch(
  () => props.active,
  (active) => {
    if (active) {
      play()
      parallax?.update()
    }
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
.about-hero {
  position: relative;
  height: 100svh;
  min-height: 540px;
  overflow: clip;
  background: var(--about-night);
  color: var(--ab-ink);
}
.about-hero__photo,
.about-hero__photo-mask {
  position: absolute;
  inset: 0;
  margin: 0;
  overflow: clip;
}
.about-hero__photo-mask img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 66% center;
  filter: grayscale(1);
}
.about-hero__photo-mask::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--about-accent-on-paper);
  mix-blend-mode: color;
  opacity: 0.45;
  pointer-events: none;
}
.about-hero__photo::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: clamp(110px, 20svh, 200px);
  background: linear-gradient(transparent, var(--about-night));
  pointer-events: none;
}
.about-hero__photo figcaption {
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 1;
  max-width: calc(100% - 190px);
  background: var(--about-night);
  font-size: 10px;
  color: var(--about-paper);
  line-height: 1.5;
}
.about-hero__stage {
  position: relative;
  height: 100%;
  padding: 8px 14px 0;
}
.about-hero__title {
  position: relative;
  margin: 0;
  font-family: var(--display-font);
  font-weight: 700;
  line-height: 0.91;
  padding: 10px 0 4vw;
  width: 100%;
  min-width: 0;
  color: var(--about-ink-on-paper);
  isolation: isolate;
  letter-spacing: -0.065em;
}
.about-hero__title::before {
  content: '';
  position: absolute;
  inset: 0 -14px -8px;
  z-index: -1;
  background: linear-gradient(var(--about-paper) 70%, rgb(239 233 220 / 0.93) 85%, transparent);
}
.about-hero__line {
  color: var(--about-ink-on-paper);
  -webkit-text-fill-color: var(--about-ink-on-paper);
  -webkit-text-stroke: 0.4px var(--about-paper);
  text-align: left;
  font-size: 12vw;
  paint-order: stroke fill;
  display: block;
  width: 100%;
  white-space: nowrap;
  transform: none;
  transform-origin: center top;
}
.about-hero__signature {
  position: absolute;
  right: 7%;
  bottom: -0.12em;
  color: var(--about-ink-on-paper);
  text-shadow:
    0 0 2px var(--about-paper),
    0 0 4px var(--about-paper);
  padding: 0 0.15em 0.3em;
  font-family: 'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive;
  font-size: clamp(28px, 3vw, 48px);
  font-weight: 400;
  font-style: italic;
  line-height: 1.4;
  letter-spacing: -0.055em;
  white-space: nowrap;
  transform: rotate(-7deg);
}
.about-hero__signature::after {
  content: '';
  position: absolute;
  left: 8%;
  right: -3%;
  bottom: 0.1em;
  height: 0.18em;
  border-bottom: 1px solid currentColor;
  border-radius: 50%;
  transform: rotate(-3deg);
}
.about-hero__screen-reader {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.about-hero__meta {
  width: min(48%, 540px);
  margin-top: 3px;
  color: var(--about-ink-on-paper);
}
.about-hero__tagline {
  font-size: clamp(20px, 2.3vw, 38px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.04em;
  text-wrap: pretty;
}
.about-hero__tagline-line {
  display: block;
  white-space: nowrap;
}
.about-hero__scroll {
  position: absolute;
  bottom: 14px;
  right: 24px;
  min-height: 44px;
  align-items: center;
  display: flex;
  gap: 9px;
  color: var(--about-paper);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}
.about-hero__scroll-arrow {
  display: inline;
}
a:focus-visible {
  outline: 2px solid var(--ab-accent);
  outline-offset: 5px;
}
@media (max-width: 760px) {
  .about-hero {
    min-height: 560px;
  }
  .about-hero__stage {
    padding: 76px 16px 0;
    width: 100%;
    min-width: 0;
  }
  .about-hero__photo-mask img {
    object-position: 62% center;
  }
  .about-hero__meta {
    position: absolute;
    inset: auto 16px 100px;
    width: auto;
    margin: 0;
  }
  .about-hero__tagline {
    color: var(--about-ink-on-paper);
    background: var(--about-paper);
    text-shadow: none;
    width: fit-content;
    font-size: 23px;
  }
  .about-hero__photo::after {
    height: 44svh;
    background: linear-gradient(transparent, rgb(18 20 15 / 0.8) 55%, var(--about-night));
  }
  .about-hero__title {
    padding-bottom: 36px;
  }
  .about-hero__line {
    transform: none;
  }
  .about-hero__signature {
    font-size: 22px;
    bottom: -0.65em;
  }
  .about-hero__tagline-line {
    display: block;
    white-space: nowrap;
  }
  .about-hero__scroll {
    right: 18px;
    bottom: 24px;
  }
}
</style>

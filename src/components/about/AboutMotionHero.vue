<template>
  <header
    id="about-intro"
    ref="root"
    class="about-hero"
    :class="{ 'is-active': active, 'has-scene-portrait': hasScenePortrait }"
    aria-labelledby="about-title"
  >
    <!-- 右侧全出血人物图铺底，姓名巨字压在照片上，参照原站开场的图文重叠。 -->
    <figure class="about-hero__photo" aria-hidden="true">
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
                ? 'AI 创作形象'
                : '个人形象照片'
              : hasScenePortrait
                ? 'AI-created portrait'
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
        <span class="about-hero__signature" aria-hidden="true">{{ IDENTITY.nameZh }}</span>
        <span class="about-hero__screen-reader">{{ IDENTITY.nameZh }} · {{ IDENTITY.nameEn }}</span>
      </h1>
      <div ref="meta" class="about-hero__meta">
        <p class="about-hero__tagline">{{ pick(TAGLINE, lang) }}</p>
      </div>
      <a href="#voice" class="about-hero__scroll">
        <span>{{ lang === 'zh' ? '滚动认识我' : 'SCROLL TO DISCOVER' }}</span>
        <span class="about-hero__scroll-arrow" aria-hidden="true">↓</span>
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IDENTITY, TAGLINE, pick, type Lang } from '../../data/aboutProfile'
import {
  aboutHeroPortrait,
  isPersonalPortfolio,
  personalPortfolio,
} from '../../data/personalPortfolio'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'
import { useFitText } from '../../composables/useFitText'

/**
 * 开场（参照 wonjyou.studio/about 的 hero）：右侧全出血人物图，
 * 英文姓名大写巨字压图；左下方向与主张小字。
 * 入场一次性播放；滚动段不固定，巨字与照片以不同速度视差离场。
 */
const props = defineProps<{ active: boolean; lang: Lang }>()
const PORTRAIT = aboutHeroPortrait
const hasScenePortrait = Boolean(personalPortfolio?.portraits?.hero)
const root = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const sceneName = ref<HTMLElement | null>(null)
useFitText(sceneName, { min: 20, max: 440 })
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
            .timeline({ paused: true })
            .fromTo(
              photoMask.value!,
              { clipPath: 'inset(100% 0% 0% 0%)' },
              { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' },
            )
            .fromTo(
              lines,
              { yPercent: 116, rotation: 3, autoAlpha: 0 },
              {
                yPercent: 0,
                rotation: 0,
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
          .to(photoMask.value!, { y: () => -innerHeight * 0.14, ease: 'none' }, 0)
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
  background: #bfc0bd;
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
}
.about-hero__photo figcaption {
  position: absolute;
  bottom: 14px;
  left: 18px;
  font-size: 10px;
  color: #222;
  background: #fee9cebb;
  padding: 2px 6px;
}
.about-hero__stage {
  position: relative;
  height: 100%;
  padding: 8px 14px 0;
}
.about-hero__title {
  position: relative;
  margin: 0;
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 900;
  line-height: 0.91;
  padding-bottom: 5vw;
  letter-spacing: -0.065em;
}
.about-hero__line {
  display: block;
  width: 100%;
  white-space: nowrap;
  transform: scaleY(1.55);
  transform-origin: center top;
}
.about-hero__signature {
  position: absolute;
  right: 7%;
  bottom: -0.12em;
  color: var(--ab-accent);
  font: italic 28px/1.1 cursive;
  transform: rotate(-13deg);
  letter-spacing: -0.08em;
}
.about-hero__screen-reader {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.about-hero__meta {
  width: min(31%, 440px);
  margin-top: 3px;
  color: #0a0a0a;
}
.about-hero__tagline {
  font-size: clamp(23px, 2.3vw, 44px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.04em;
  text-wrap: pretty;
}
.about-hero__scroll {
  position: absolute;
  bottom: 17px;
  right: 32px;
  display: flex;
  gap: 9px;
  color: #0a0a0a;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}
.about-hero__scroll-arrow {
  display: none;
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
    padding: 72px 16px 0;
  }
  .about-hero__photo-mask img {
    object-position: 62% center;
  }
  .about-hero__meta {
    width: 63%;
    margin-top: 18px;
  }
  .about-hero__tagline {
    font-size: 23px;
  }
  .about-hero__signature {
    font-size: 22px;
    bottom: -0.65em;
  }
  .about-hero__scroll {
    right: 18px;
    bottom: 24px;
  }
}
</style>

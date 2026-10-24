<template>
  <header
    id="about-intro"
    ref="root"
    class="about-hero"
    :class="{ 'is-active': active }"
    aria-labelledby="about-title"
  >
    <!-- 右侧全出血人物图铺底，姓名巨字压在照片上，参照原站开场的图文重叠。 -->
    <figure class="about-hero__photo" aria-hidden="true">
      <div ref="photoMask" class="about-hero__photo-mask">
        <img
          ref="photo"
          :src="PORTRAIT.src"
          :srcset="visualImageSources(PORTRAIT)"
          sizes="(max-width: 760px) 100vw, 48vw"
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
              ? '个人形象照片'
              : 'Personal portrait'
            : lang === 'zh'
              ? '合成图像示例'
              : 'Synthetic image example'
        }}
      </figcaption>
    </figure>
    <div class="about-hero__stage">
      <!-- 姓名巨字：英文大写逐行铺满宽度，中文姓名以红色斜签叠在字角。 -->
      <h1 id="about-title" ref="title" class="about-hero__title">
        <span v-for="word in nameWords" :key="word" class="about-hero__line" lang="en">{{
          word
        }}</span>
        <span ref="sign" class="about-hero__sign" aria-hidden="true">{{ IDENTITY.nameZh }}</span>
        <span class="about-hero__screen-reader">{{ IDENTITY.nameZh }} · {{ IDENTITY.nameEn }}</span>
      </h1>
      <div ref="meta" class="about-hero__meta">
        <p class="about-hero__role">
          <span v-for="(part, i) in roleParts" :key="i">{{ part }}</span>
        </p>
        <p class="about-hero__tagline">
          {{ pick(TAGLINE, 'zh') }}<span lang="en">{{ pick(TAGLINE, 'en') }}</span>
        </p>
      </div>
      <a href="#stories" class="about-hero__scroll">
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
import { IDENTITY, ROLE_LINE, TAGLINE, pick, type Lang } from '../../数据/人物资料'
import { aboutPortrait, isPersonalPortfolio } from '../../数据/本机个人内容接口'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'
import { visualImageSources } from '../../工具/响应式图片'

/**
 * 开场（参照 wonjyou.studio/about 的 hero）：右侧全出血人物图，
 * 英文姓名大写巨字压图，中文姓名作红色斜签；左下方向与主张小字。
 * 入场一次性播放；滚动段不固定，巨字与照片以不同速度视差离场。
 */
const props = defineProps<{ active: boolean; lang: Lang }>()
const PORTRAIT = aboutPortrait
const nameWords = IDENTITY.nameEn.toUpperCase().split(/\s+/u)
const roleParts = ROLE_LINE.zh
  .split('·')
  .map(part => part.trim())
  .filter(Boolean)

const root = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const sign = ref<HTMLElement | null>(null)
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
    if (
      dead ||
      !root.value ||
      !title.value ||
      !sign.value ||
      !meta.value ||
      !photo.value ||
      !photoMask.value
    )
      return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const lines = title.value!.querySelectorAll('.about-hero__line')
        // 入场只播一次；断点分支重建时清掉旧状态，避免元素停在隐藏起点。
        if (played) {
          gsap.set([lines, sign.value!, meta.value!], { clearProps: 'transform,opacity,visibility' })
          gsap.set(photoMask.value!, { clearProps: 'clipPath' })
        } else {
          entrance = gsap
            .timeline({ paused: true })
            .fromTo(
              photoMask.value!,
              { clipPath: 'inset(0% 0% 0% 100%)' },
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
              sign.value!,
              { autoAlpha: 0, scale: 0.72 },
              { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)' },
              0.95,
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
  active => {
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
  min-height: 100vh;
  min-height: 100svh;
  overflow: clip;
  background: var(--ab-bg, #050505);
  color: var(--ab-ink, #ffe8ce);
}
.about-hero__photo {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  bottom: 0;
  width: 48vw;
  margin: 0;
}
.about-hero__photo-mask {
  position: absolute;
  inset: 0;
  overflow: clip;
  background: #221c15;
}
.about-hero__photo-mask img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 24%;
}
.about-hero__photo figcaption {
  position: absolute;
  right: 18px;
  bottom: 16px;
  z-index: 2;
  padding: 6px 12px;
  background: rgb(5 5 5 / 0.62);
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ab-soft, #b9ab97);
}
.about-hero__stage {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(76px, 13svh, 150px) clamp(24px, 5vw, 96px) clamp(44px, 7svh, 88px)
    clamp(88px, 7vw, 128px);
}
.about-hero__title {
  position: relative;
  margin: 0;
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: min(16vw, 25svh);
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}
.about-hero__line {
  display: block;
  white-space: nowrap;
}
.about-hero__sign {
  position: absolute;
  right: clamp(8px, 2vw, 44px);
  bottom: -0.14em;
  z-index: 3;
  font-family: Georgia, 'Times New Roman', 'Kaiti SC', serif;
  font-style: italic;
  font-size: clamp(26px, 3vw, 54px);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--ab-accent, #ef4b40);
  transform: rotate(-7deg);
  text-shadow: 0 2px 18px rgb(5 5 5 / 0.5);
  white-space: nowrap;
}
.about-hero__screen-reader {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.about-hero__meta {
  max-width: 480px;
}
.about-hero__role {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0 0 18px;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--ab-soft, #b9ab97);
}
.about-hero__role span + span::before {
  content: '·';
  margin-right: 14px;
  color: var(--ab-dim, #8a7d6c);
}
.about-hero__tagline {
  margin: 0;
  font-size: clamp(20px, 2.1vw, 30px);
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.02em;
}
.about-hero__tagline span {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--ab-soft, #b9ab97);
}
.about-hero__scroll {
  position: absolute;
  left: clamp(88px, 7vw, 128px);
  bottom: clamp(44px, 7svh, 88px);
  display: inline-flex;
  align-items: center;
  gap: 14px;
  color: var(--ab-soft, #b9ab97);
  font-size: 11px;
  letter-spacing: 0.3em;
  text-decoration: none;
  text-transform: uppercase;
}
.about-hero__scroll:hover {
  color: var(--ab-ink, #ffe8ce);
}
.about-hero__scroll-arrow {
  font-size: 16px;
  animation: about-hero-dip 1.8s ease-in-out infinite;
}
@keyframes about-hero-dip {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(6px);
  }
}
a:focus-visible {
  outline: 2px solid var(--ab-accent, #ef4b40);
  outline-offset: 8px;
}
@media (max-width: 760px), (max-height: 619px), (prefers-reduced-motion: reduce) {
  .about-hero__photo {
    position: relative;
    width: auto;
    height: 44svh;
  }
  .about-hero__stage {
    min-height: 0;
    justify-content: flex-start;
    padding: 26px 22px 44px;
  }
  .about-hero__title {
    font-size: 14.5vw;
  }
  .about-hero__sign {
    right: 10px;
    bottom: -0.2em;
    font-size: 22px;
  }
  .about-hero__meta {
    max-width: none;
    margin-top: 34px;
  }
  .about-hero__role {
    font-size: 13px;
  }
  .about-hero__tagline {
    font-size: 19px;
  }
  .about-hero__scroll {
    position: static;
    margin-top: 30px;
  }
  .about-hero__scroll-arrow {
    animation: none;
  }
}
</style>

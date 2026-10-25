<template>
  <!--
    /morph：粒子变形演示页，按用户提供的参考视频整页复刻——
    ① 深底巨字 hero「TRANSFORMING IDEAS INTO DIGITAL REALITIES」；
    ② 固定段落：散布粒子随滚动汇聚成大字母（模板用 E，不借用原作者首字母）；
    ③ 双列圆角图片网格。文案保留视频原句作为效果演示，图片全部为仓库合成素材。
  -->
  <div ref="root" class="morph-page">
    <section class="morph-hero" aria-labelledby="morph-title">
      <p class="morph-hero__kicker">Interactive Demo</p>
      <h1 id="morph-title" ref="heroTitle" class="morph-hero__title">
        <span class="morph-hero__line">Transforming</span>
        <span class="morph-hero__line">Ideas into</span>
        <span class="morph-hero__line">Digital Realities</span>
      </h1>
      <a href="#morph-field" class="morph-hero__scroll" aria-label="向下滚动查看粒子变形">
        <span>Scroll to discover</span><span aria-hidden="true">↓</span>
      </a>
    </section>

    <section id="morph-field" ref="stage" class="morph-stage" aria-labelledby="morph-heading">
      <div class="morph-stage__inner">
        <h2 id="morph-heading" ref="heading" class="morph-stage__heading">
          We take samples and morph it into the type of shape we want.
        </h2>
        <div ref="fieldBox" class="morph-stage__box">
          <MorphParticleField ref="field" :letter="initial" />
        </div>
        <p class="morph-stage__note">
          {{ initial }} · {{ particlesNote }}
        </p>
      </div>
    </section>

    <section class="morph-grid" aria-labelledby="morph-grid-title">
      <h2 id="morph-grid-title" ref="gridTitle" class="morph-grid__title">Selected Works</h2>
      <div ref="grid" class="morph-grid__cells">
        <figure v-for="item in gridItems" :key="item.src" class="morph-grid__cell">
          <img
            :src="item.src"
            :alt="item.alt"
            width="592"
            height="420"
            loading="lazy"
            decoding="async"
          />
          <figcaption>{{ item.caption }}</figcaption>
        </figure>
      </div>
      <footer class="morph-grid__foot">
        <p>演示页 · 图像均为合成模板素材，不含任何真实人物或项目。</p>
        <RouterLink to="/">返回首页 <span aria-hidden="true">↗</span></RouterLink>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MorphParticleField from '../components/morph/MorphParticleField.vue'
import { IDENTITY, WORKS } from '../data/aboutProfile'
import { aboutPortrait } from '../data/personalPortfolio'
import { routeCurtainBlocked } from '../composables/usePageCurtain'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../utils/motionLayout'

gsap.registerPlugin(ScrollTrigger)

/** 汇聚字母取示例求职者姓名首字母；不使用参考视频原作者的首字母。 */
const initial = IDENTITY.initials.charAt(0).toUpperCase() || 'E'
const particlesNote = '散布的粒子随滚动汇聚 · 倒滚沿原路散开'

const heroTitle = ref<HTMLElement | null>(null)
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const fieldBox = ref<HTMLElement | null>(null)
const field = ref<InstanceType<typeof MorphParticleField> | null>(null)
const grid = ref<HTMLElement | null>(null)

// 网格素材：四个作品封面 + 人物图 + 调色预览，全部为仓库合成图。
const gridItems = computed(() => [
  ...WORKS.map(work => ({
    src: work.cover,
    alt: work.title.zh,
    caption: work.title.zh,
  })),
  {
    src: aboutPortrait.src,
    alt: '合成人物占位图',
    caption: '合成人物示例',
  },
  { src: '/color-previews/clip-1.jpg', alt: '合成调色预览图', caption: '合成调色预览' },
])

let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false

onMounted(() => {
  if (!root.value || !stage.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !heroTitle.value || !grid.value) return
    media = gsap.matchMedia()

    // 桌面：hero 巨字错峰入场；粒子段固定并随滚动可逆汇聚；网格逐张浮现。
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const lines = heroTitle.value!.querySelectorAll('.morph-hero__line')
        // 入场等幕布揭开再播；直接进入或刷新时幕布未拦截则立即播放。
        const intro = gsap
          .timeline({ paused: true })
          .fromTo(
            lines,
            { yPercent: 118, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 1.05,
              stagger: 0.09,
              ease: 'expo.out',
            },
            0.1,
          )
          .fromTo(
            root.value!.querySelectorAll('.morph-hero__kicker, .morph-hero__scroll'),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.5, ease: 'none' },
            0.7,
          )
        let stopCurtainWatch: (() => void) | undefined
        if (routeCurtainBlocked.value) {
          stopCurtainWatch = watch(routeCurtainBlocked, blocked => {
            if (blocked) return
            stopCurtainWatch?.()
            stopCurtainWatch = undefined
            intro.play()
          })
        } else {
          intro.play()
        }

        ScrollTrigger.create({
          id: 'morph-field-converge',
          trigger: stage.value!,
          start: 'top top',
          end: () => `+=${Math.round(innerHeight * 2.6)}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: true,
          invalidateOnRefresh: true,
          refreshPriority: 15,
          onUpdate: self => field.value?.setProgress(self.progress),
        })
        field.value?.setProgress(0)

        gsap.fromTo(
          grid.value!.querySelectorAll('.morph-grid__cell'),
          { y: 46, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: { trigger: grid.value!, start: 'top 78%' },
          },
        )
        return () => {
          stopCurtainWatch?.()
          field.value?.setProgress(0)
        }
      },
      root.value,
    )

    // 窄屏 / 减弱动效：粒子进入视口时一次性汇聚，其余为自然阅读布局。
    media.add(
      '(max-width: 760px), (max-height: 619px), (prefers-reduced-motion: reduce)',
      () => {
        field.value?.setProgress(1)
        return undefined
      },
      root.value,
    )

    cancelRefresh = requestMotionLayoutRefresh()
  })
})

onBeforeUnmount(() => {
  dead = true
  cancelPreparation?.()
  cancelRefresh?.()
  media?.revert()
})
</script>

<style scoped>
.morph-page {
  --mp-bg: #050505;
  --mp-ink: #ffe8ce;
  --mp-soft: #b9ab97;
  --mp-dim: #8a7d6c;
  --mp-line: #2e2a24;
  --mp-accent: #ef4b40;
  position: relative;
  min-height: 100vh;
  background: var(--mp-bg);
  color: var(--mp-ink);
  overflow-x: clip;
}

.morph-hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(20px, 4vh, 44px);
  padding: 64px clamp(22px, 7vw, 120px);
}
.morph-hero__kicker {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--mp-soft);
}
.morph-hero__title {
  margin: 0;
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: min(12.5vw, 11svh);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  overflow: clip;
}
.morph-hero__line {
  display: block;
}
.morph-hero__title .morph-hero__line:nth-child(3) {
  color: var(--mp-accent);
}
.morph-hero__scroll {
  position: absolute;
  left: clamp(22px, 7vw, 120px);
  bottom: clamp(36px, 7svh, 72px);
  display: inline-flex;
  align-items: center;
  gap: 14px;
  color: var(--mp-soft);
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  text-decoration: none;
}
.morph-hero__scroll:hover {
  color: var(--mp-ink);
}

.morph-stage {
  position: relative;
  background: var(--mp-bg);
}
.morph-stage__inner {
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(18px, 3.4vh, 36px);
  padding: clamp(64px, 9vh, 110px) clamp(22px, 7vw, 120px);
}
.morph-stage__heading {
  margin: 0;
  max-width: 15em;
  font-size: clamp(19px, 2.6vw, 34px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.morph-stage__box {
  position: relative;
  height: clamp(300px, 62svh, 640px);
  border: 1px solid var(--mp-line);
  border-radius: 16px;
  overflow: hidden;
  background: #070707;
}
.morph-stage__note {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--mp-dim);
}

.morph-grid {
  padding: clamp(70px, 12vh, 150px) clamp(22px, 7vw, 120px) 56px;
  background: var(--mp-bg);
}
.morph-grid__title {
  margin: 0 0 clamp(26px, 5vh, 48px);
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: clamp(30px, 5vw, 64px);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 0.95;
  text-transform: uppercase;
}
.morph-grid__cells {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1.6vw, 16px);
}
.morph-grid__cell {
  margin: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #141210;
}
.morph-grid__cell img {
  display: block;
  width: 100%;
  aspect-ratio: 592 / 420;
  object-fit: cover;
  transition: transform 0.45s ease;
}
.morph-grid__cell:hover img {
  transform: scale(1.04);
}
.morph-grid__cell figcaption {
  padding: 12px 14px;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--mp-soft);
}
.morph-grid__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  margin-top: clamp(40px, 7vh, 80px);
  padding-top: 26px;
  border-top: 1px solid var(--mp-line);
  font-size: 12px;
  color: var(--mp-dim);
}
.morph-grid__foot a {
  color: var(--mp-ink);
  text-decoration: none;
}
.morph-grid__foot a:hover {
  color: var(--mp-accent);
}
</style>

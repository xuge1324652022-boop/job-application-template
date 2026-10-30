<template>
  <!--
    /morph：按参考视频完整复刻的独立演示页（纯黑底、纯白字版本）。
    ① hero：三行白色巨字从下升起，右下角小 logo「R.」；
    ② 固定粒子段：句子式小标题在上，全宽画布内白色微尘随滚动汇聚成大字母 R；
    ③ SELECTED WORKS：双列圆角网格，卡片为 CSS 合成的亮色网页截图
      （落地页/登录卡/定价卡等八种版式），无图注。
    全部界面元素由 CSS/SVG 合成，不含任何真实项目截图。
  -->
  <div ref="root" class="morph-page">
    <section class="morph-hero" aria-labelledby="morph-title">
      <h1 id="morph-title" ref="heroTitle" class="morph-hero__title">
        <span class="morph-hero__line">Transforming</span>
        <span class="morph-hero__line">Ideas into</span>
        <span class="morph-hero__line">Digital Realities</span>
      </h1>
      <span class="morph-hero__logo" lang="en">R.</span>
    </section>

    <section id="morph-field" ref="stage" class="morph-stage" aria-labelledby="morph-heading">
      <div class="morph-stage__inner">
        <h2 id="morph-heading" ref="heading" class="morph-stage__heading">
          We take samples and morph it into the type of shape we want
        </h2>
        <div ref="fieldBox" class="morph-stage__box">
          <MorphParticleField ref="field" :letter="initial" />
        </div>
      </div>
    </section>

    <section class="morph-grid" aria-labelledby="morph-grid-title">
      <p class="morph-grid__label">Selected Works</p>
      <h2 id="morph-grid-title" ref="gridTitle" class="morph-grid__sr-title">Selected Works</h2>
      <div ref="grid" class="morph-grid__cells">
        <div
          v-for="(card, index) in gridItems"
          :key="index"
          class="morph-grid__cell"
          :style="{ '--ui-accent': card.accent, aspectRatio: card.ratio }"
        >
          <div class="shot" :class="`shot--${card.type}`">
            <!-- 通用顶部导航条 -->
            <div class="shot__nav">
              <b class="shot__brand"></b>
              <span class="shot__links"><i v-for="n in 3" :key="n"></i></span>
              <b class="shot__cta" :style="{ background: card.accent }"></b>
            </div>
            <template v-if="card.type === 'landing'">
              <div class="shot__landing">
                <b class="shot__h1" :style="{ width: '72%' }"></b>
                <b class="shot__h1 shot__h1--dim" :style="{ width: '52%' }"></b>
                <span class="shot__p"><i v-for="n in 2" :key="n"></i></span>
                <div class="shot__btns">
                  <b :style="{ background: card.accent }"></b>
                  <b class="shot__btn-ghost"></b>
                </div>
                <div class="shot__media" :style="{ background: card.accent + '22' }"></div>
              </div>
            </template>
            <template v-else-if="card.type === 'login'">
              <div class="shot__center">
                <div class="shot__card">
                  <b class="shot__h1" style="width: 46%"></b>
                  <span class="shot__input"></span>
                  <span class="shot__input"></span>
                  <b class="shot__full-btn" :style="{ background: card.accent }"></b>
                  <span class="shot__p"><i style="width: 60%"></i></span>
                </div>
              </div>
            </template>
            <template v-else-if="card.type === 'pricing'">
              <div class="shot__pricing">
                <div v-for="n in 3" :key="n" class="shot__price">
                  <b class="shot__h1" style="width: 60%"></b>
                  <b class="shot__big" :style="{ width: '40%', background: n === 2 ? card.accent : '#1f2937' }"></b>
                  <span class="shot__p"><i v-for="m in 2" :key="m"></i></span>
                  <b class="shot__full-btn" :style="n === 2 ? { background: card.accent } : {}"></b>
                </div>
              </div>
            </template>
            <template v-else-if="card.type === 'article'">
              <div class="shot__article">
                <b class="shot__h1" style="width: 64%"></b>
                <span class="shot__p"><i v-for="n in 4" :key="n"></i></span>
                <div class="shot__media" :style="{ height: '34%', background: card.accent + '26' }"></div>
                <span class="shot__p"><i v-for="n in 2" :key="n"></i></span>
              </div>
            </template>
            <template v-else-if="card.type === 'stats'">
              <div class="shot__stats">
                <div class="shot__stat">
                  <b class="shot__big" :style="{ color: card.accent, background: 'none' }">48%</b>
                  <span class="shot__p"><i style="width: 80%"></i></span>
                </div>
                <div class="shot__bars">
                  <i v-for="(h, i) in card.values" :key="i" :style="{ height: h + '%', background: i === 3 ? card.accent : '#d7dbe2' }"></i>
                </div>
              </div>
            </template>
            <template v-else-if="card.type === 'gallery'">
              <div class="shot__gallery">
                <div class="shot__tile" :style="{ background: card.accent + '33' }"></div>
                <div class="shot__tile" style="background: #e3e7ee"></div>
                <div class="shot__tile" style="background: #eef1f6"></div>
                <div class="shot__tile" :style="{ background: card.accent + '1f' }"></div>
              </div>
            </template>
            <template v-else-if="card.type === 'profile'">
              <div class="shot__profile">
                <span class="shot__avatar" :style="{ background: card.accent + '44', border: card.accent }"></span>
                <b class="shot__h1" style="width: 54%"></b>
                <span class="shot__p"><i v-for="n in 2" :key="n"></i></span>
                <div class="shot__btns">
                  <b :style="{ background: card.accent }"></b>
                  <b class="shot__btn-ghost"></b>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="shot__form">
                <b class="shot__h1" style="width: 44%"></b>
                <span class="shot__input" v-for="n in 3" :key="n"></span>
                <b class="shot__full-btn" :style="{ background: card.accent }"></b>
              </div>
            </template>
          </div>
        </div>
      </div>
      <footer class="morph-grid__foot">
        <p>演示复刻页 · 界面卡片均由 CSS 合成，不含任何真实项目或个人信息。</p>
        <RouterLink to="/">返回首页 <span aria-hidden="true">↗</span></RouterLink>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MorphParticleField from '../components/morph/MorphParticleField.vue'
import { routeCurtainBlocked } from '../composables/usePageCurtain'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../utils/motionLayout'

gsap.registerPlugin(ScrollTrigger)

/** 复刻演示的汇聚字母（与参考视频一致，页面明示为演示复刻）。 */
const initial = 'R'

type ShotType = 'landing' | 'login' | 'pricing' | 'article' | 'stats' | 'gallery' | 'profile' | 'form'
interface ShotCard {
  type: ShotType
  accent: string
  ratio: string
  values?: number[]
}

/** 网格里的“网页截图”全部由 CSS 合成：亮底白卡、少量单色强调。 */
const gridItems: ShotCard[] = [
  { type: 'landing', accent: '#3b82f6', ratio: '3 / 4', },
  { type: 'stats', accent: '#111827', ratio: '1 / 1', values: [38, 62, 46, 84, 55, 70] },
  { type: 'login', accent: '#111827', ratio: '1 / 1' },
  { type: 'article', accent: '#0ea5e9', ratio: '4 / 5' },
  { type: 'pricing', accent: '#3b82f6', ratio: '1 / 1' },
  { type: 'gallery', accent: '#8b5cf6', ratio: '3 / 4' },
  { type: 'profile', accent: '#10b981', ratio: '1 / 1' },
  { type: 'form', accent: '#f43f5e', ratio: '4 / 5' },
]

const heroTitle = ref<HTMLElement | null>(null)
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const fieldBox = ref<HTMLElement | null>(null)
const field = ref<InstanceType<typeof MorphParticleField> | null>(null)
const grid = ref<HTMLElement | null>(null)

let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false

onMounted(() => {
  if (!root.value || !stage.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !heroTitle.value || !grid.value) return
    media = gsap.matchMedia()

    // 桌面：hero 巨字从下升起；粒子段固定并随滚动可逆汇聚；网格逐张浮现。
    media.add(
      '(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)',
      () => {
        const lines = heroTitle.value!.querySelectorAll('.morph-hero__line')
        // 入场等幕布揭开再播；直接进入或刷新时幕布未拦截则立即播放。
        const intro = gsap
          .timeline({ paused: true })
          .fromTo(
            lines,
            { yPercent: 112, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 1.05,
              stagger: 0.11,
              ease: 'expo.out',
            },
            0.08,
          )
          .fromTo(
            root.value!.querySelectorAll('.morph-hero__logo'),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.5, ease: 'none' },
            0.5,
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
          end: () => `+=${Math.round(innerHeight * 2.8)}`,
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
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: { trigger: grid.value!, start: 'top 80%' },
          },
        )
        return () => {
          stopCurtainWatch?.()
          field.value?.setProgress(0)
        }
      },
      root.value,
    )

    // 窄屏 / 减弱动效：粒子直接成形，其余为自然阅读布局。
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
  --mp-bg: #000000;
  --mp-ink: #ffffff;
  --mp-soft: #9a9a9a;
  --mp-dim: #6e6e6e;
  --mp-line: #202020;
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
  align-items: center;
  padding: 64px clamp(22px, 7vw, 120px) clamp(96px, 14svh, 160px);
}
.morph-hero__logo {
  position: absolute;
  right: clamp(22px, 7vw, 120px);
  bottom: clamp(28px, 5svh, 56px);
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: 20px;
  font-weight: 900;
}
.morph-hero__title {
  margin: 0;
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  /* 最长行 DIGITAL REALITIES（≈9.76em）约占视口可用宽 95%，与视频一致。 */
  font-size: min(10.2vw, 15svh);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.045em;
  text-transform: uppercase;
  overflow: clip;
}
.morph-hero__line {
  display: block;
}
@media (max-width: 760px) {
  .morph-hero__title {
    font-size: min(8.6vw, 11svh);
  }
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
  justify-content: flex-end;
  padding: clamp(56px, 8vh, 96px) 0 0;
}
.morph-stage__heading {
  margin: 0 0 clamp(20px, 4vh, 40px);
  padding: 0 clamp(22px, 7vw, 120px);
  max-width: 26em;
  font-size: clamp(15px, 1.7vw, 22px);
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: 0.01em;
}
.morph-stage__box {
  position: relative;
  height: clamp(280px, 58svh, 660px);
  background: var(--mp-bg);
}

.morph-grid {
  padding: clamp(70px, 12vh, 150px) clamp(22px, 7vw, 120px) 56px;
  background: var(--mp-bg);
}
.morph-grid__label {
  margin: 0 0 clamp(20px, 4vh, 40px);
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--mp-soft);
}
.morph-grid__sr-title {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.morph-grid__cells {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1.6vw, 14px);
}
.morph-grid__cell {
  overflow: hidden;
  border-radius: 12px;
  background: #f4f5f7;
}

/* —— CSS 合成的亮色网页“截图” —— */
.shot {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f4f5f7;
  transition: transform 0.45s ease;
}
.morph-grid__cell:hover .shot {
  transform: scale(1.03);
}
.shot__nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #fff;
  border-bottom: 1px solid #e5e8ee;
}
.shot__brand {
  width: 34px;
  height: 10px;
  border-radius: 5px;
  background: #1f2937;
}
.shot__links {
  display: flex;
  flex: 1;
  gap: 8px;
  justify-content: flex-end;
}
.shot__links i {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: #d3d8e0;
}
.shot__cta {
  width: 40px;
  height: 14px;
  border-radius: 7px;
}
.shot__h1 {
  display: block;
  height: 14px;
  border-radius: 7px;
  background: #1f2937;
}
.shot__h1--dim {
  background: #9aa3b2;
}
.shot__p {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.shot__p i {
  display: block;
  height: 7px;
  border-radius: 4px;
  background: #ccd2dc;
}
.shot__p i:last-child {
  width: 64%;
}
.shot__btns {
  display: flex;
  gap: 8px;
}
.shot__btns b {
  width: 34%;
  height: 18px;
  border-radius: 9px;
}
.shot__btn-ghost {
  background: #fff;
  border: 1.5px solid #d3d8e0;
}
.shot__full-btn {
  display: block;
  width: 100%;
  height: 20px;
  border-radius: 10px;
}
.shot__input {
  display: block;
  height: 18px;
  border: 1.5px solid #d9dee6;
  border-radius: 9px;
  background: #fff;
}
.shot__media {
  border-radius: 10px;
}
.shot__big {
  display: block;
  height: 26px;
  border-radius: 6px;
  background: #1f2937;
  font-size: 22px;
  font-weight: 800;
  line-height: 26px;
}
.shot__center {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 8%;
}
.shot__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 9%;
  background: #fff;
  border: 1px solid #e5e8ee;
  border-radius: 12px;
  box-shadow: 0 10px 26px rgb(15 23 42 / 0.08);
}
.shot__landing,
.shot__article,
.shot__form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8%;
}
.shot__landing .shot__media,
.shot__article .shot__media {
  flex: 1;
  min-height: 30%;
}
.shot__pricing {
  flex: 1;
  display: flex;
  gap: 8px;
  padding: 8%;
  align-items: stretch;
}
.shot__price {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #fff;
  border: 1px solid #e5e8ee;
  border-radius: 10px;
}
.shot__price .shot__full-btn {
  height: 14px;
  margin-top: auto;
  background: #1f2937;
}
.shot__price:nth-child(2) {
  border-color: var(--ui-accent);
}
.shot__stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8%;
}
.shot__stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shot__bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-height: 40%;
}
.shot__bars i {
  flex: 1;
  border-radius: 4px 4px 0 0;
}
.shot__gallery {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8%;
}
.shot__tile {
  border-radius: 8px;
}
.shot__profile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 9%;
  text-align: center;
}
.shot__avatar {
  width: 26%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid;
}
.shot__profile .shot__h1 {
  margin-inline: auto;
}
.shot__profile .shot__p {
  width: 100%;
}
.shot__profile .shot__p i {
  margin-inline: auto;
  width: 72% !important;
}
.shot__profile .shot__btns {
  width: 100%;
  justify-content: center;
}

.morph-grid__foot {
  display: flex;
  flex-wrap: wrap;
  /* 链接抬到 44px 命中高之后，两列改按垂直居中对齐，避免文字基线错位 */
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: clamp(40px, 7vh, 80px);
  padding-top: 26px;
  border-top: 1px solid var(--mp-line);
  font-size: 12px;
  color: var(--mp-dim);
}
/*
 * 「返回首页」原本是 12px 行内文本，命中高只有 39px —— 手机上和左侧说明文字
 * 挤在同一行，手指容易点偏。改成 inline-flex + 44px 最小高度：文字位置不变，
 * 命中区抬到 44；左右各给 4px 再用负边距收回，观感与原来一致。
 */
.morph-grid__foot a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: 4px;
  margin-inline: -4px;
  color: var(--mp-ink);
  text-decoration: none;
}
.morph-grid__foot a:hover {
  color: var(--mp-soft);
}
</style>

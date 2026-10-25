<template>
  <!--
    /morph：按用户提供的参考视频完整复刻的独立演示页。
    版块与视频一一对应：① 深底巨字 hero（右上角小 logo，三行奶白标题从下升起）
    ② 固定的粒子段（标题上半，下半全宽粒子画布：散布 → 汇聚成大字母 R，随滚动可逆）
    ③ SELECTED WORKS 双列圆角网格（深色仪表盘风格界面卡，方/竖比例混合，无图注）。
    仪表盘界面全部由 CSS 合成，不含任何真实项目截图。
  -->
  <div ref="root" class="morph-page">
    <section class="morph-hero" aria-labelledby="morph-title">
      <span class="morph-hero__logo" lang="en">R.</span>
      <h1 id="morph-title" ref="heroTitle" class="morph-hero__title">
        <span class="morph-hero__line">Transforming</span>
        <span class="morph-hero__line">Ideas into</span>
        <span class="morph-hero__line">Digital Realities</span>
      </h1>
    </section>

    <section id="morph-field" ref="stage" class="morph-stage" aria-labelledby="morph-heading">
      <div class="morph-stage__inner">
        <h2 id="morph-heading" ref="heading" class="morph-stage__heading">
          <span>We Take Samples</span>
          <span>And Morph It Into The Type</span>
          <span>Of Shape We Want</span>
        </h2>
        <div ref="fieldBox" class="morph-stage__box">
          <MorphParticleField ref="field" :letter="initial" />
        </div>
      </div>
    </section>

    <section class="morph-grid" aria-labelledby="morph-grid-title">
      <p class="morph-grid__label">Selected Works</p>
      <h2 id="morph-grid-title" ref="gridTitle" class="morph-grid__title">Selected Works</h2>
      <div ref="grid" class="morph-grid__cells">
        <div
          v-for="(card, index) in gridItems"
          :key="index"
          class="morph-grid__cell"
          :style="{ '--ui-accent': card.accent, aspectRatio: card.ratio }"
        >
          <div class="fake-ui">
            <div class="fake-ui__chrome">
              <i></i><i></i><i></i>
              <span class="fake-ui__crumb" :style="{ width: card.crumb + '%' }"></span>
            </div>
            <div class="fake-ui__body">
              <div class="fake-ui__side">
                <b v-for="n in 5" :key="n" :style="{ width: n === 1 ? '80%' : '55%' }"></b>
              </div>
              <div class="fake-ui__main">
                <template v-if="card.type === 'bars'">
                  <div class="fake-bars">
                    <i
                      v-for="(h, i) in card.values"
                      :key="i"
                      :style="{ height: h + '%' }"
                    ></i>
                  </div>
                </template>
                <template v-else-if="card.type === 'line'">
                  <svg class="fake-line" viewBox="0 0 100 48" preserveAspectRatio="none">
                    <polyline :points="card.points" fill="none" stroke-width="2.4" />
                  </svg>
                </template>
                <template v-else-if="card.type === 'donut'">
                  <div class="fake-donut">
                    <span class="fake-donut__ring"></span>
                    <span class="fake-donut__num">{{ card.value }}</span>
                  </div>
                  <div class="fake-legend">
                    <b v-for="n in 3" :key="n"></b>
                  </div>
                </template>
                <template v-else-if="card.type === 'rows'">
                  <div class="fake-rows">
                    <b v-for="n in 4" :key="n" :style="{ width: 72 + ((n * 7) % 24) + '%' }"></b>
                  </div>
                </template>
                <template v-else-if="card.type === 'chat'">
                  <div class="fake-chat">
                    <span v-for="n in 3" :key="n" :class="{ 'is-me': n === 2 }"></span>
                  </div>
                </template>
                <template v-else>
                  <div class="fake-kanban">
                    <div v-for="col in 3" :key="col">
                      <b v-for="n in col" :key="n"></b>
                    </div>
                  </div>
                </template>
              </div>
            </div>
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

interface DashCard {
  type: 'bars' | 'line' | 'donut' | 'rows' | 'chat' | 'kanban'
  accent: string
  ratio: string
  crumb: number
  values?: number[]
  points?: string
  value?: string
}

/** 网格里的“仪表盘截图”全部由 CSS/SVG 合成：深色界面 + 蓝紫青琥珀强调。 */
const gridItems: DashCard[] = [
  { type: 'bars', accent: '#4f8cff', ratio: '3 / 4', crumb: 34, values: [42, 68, 30, 86, 54, 72] },
  { type: 'line', accent: '#22d3ee', ratio: '1 / 1', crumb: 52, points: '2,40 18,30 34,36 50,18 66,26 82,10 98,16' },
  { type: 'donut', accent: '#8b5cf6', ratio: '1 / 1', crumb: 40, value: '74%' },
  { type: 'rows', accent: '#4f8cff', ratio: '4 / 5', crumb: 62 },
  { type: 'chat', accent: '#22d3ee', ratio: '3 / 4', crumb: 30 },
  { type: 'kanban', accent: '#f59e0b', ratio: '1 / 1', crumb: 48 },
  { type: 'line', accent: '#8b5cf6', ratio: '1 / 1', crumb: 36, points: '2,30 20,38 36,22 52,30 68,14 84,22 98,8' },
  { type: 'bars', accent: '#f59e0b', ratio: '4 / 5', crumb: 58, values: [60, 34, 78, 44, 66, 50] },
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
            { autoAlpha: 0, y: -12 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' },
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
  align-items: center;
  padding: 64px clamp(22px, 7vw, 120px);
}
.morph-hero__logo {
  position: absolute;
  top: clamp(20px, 4svh, 40px);
  right: clamp(22px, 7vw, 120px);
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.02em;
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
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: clamp(22px, 3.4vw, 44px);
  font-weight: 900;
  line-height: 1.06;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}
.morph-stage__heading span {
  display: block;
}
.morph-stage__box {
  position: relative;
  height: clamp(280px, 56svh, 620px);
  background: #070707;
}

.morph-grid {
  padding: clamp(70px, 12vh, 150px) clamp(22px, 7vw, 120px) 56px;
  background: var(--mp-bg);
}
.morph-grid__label {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--mp-soft);
}
.morph-grid__title {
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
  background: #0e1420;
}
.morph-grid__cell:hover .fake-ui {
  transform: scale(1.03);
}

/* —— CSS 合成的深色仪表盘“截图” —— */
.fake-ui {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(120% 90% at 20% 0%, rgb(79 140 255 / 0.08), transparent 60%),
    #0b101b;
  transition: transform 0.45s ease;
}
.fake-ui__chrome {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid rgb(148 163 184 / 0.12);
}
.fake-ui__chrome i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(148 163 184 / 0.35);
}
.fake-ui__crumb {
  height: 6px;
  margin-left: 8px;
  border-radius: 4px;
  background: rgb(148 163 184 / 0.18);
}
.fake-ui__body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.fake-ui__side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 20%;
  padding: 10px 8px;
  border-right: 1px solid rgb(148 163 184 / 0.1);
}
.fake-ui__side b {
  height: 6px;
  border-radius: 3px;
  background: rgb(148 163 184 / 0.22);
}
.fake-ui__side b:first-child {
  background: var(--ui-accent);
}
.fake-ui__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  min-width: 0;
}
.fake-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.fake-bars i {
  flex: 1;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(to top, var(--ui-accent), rgb(255 255 255 / 0.25));
  opacity: 0.85;
}
.fake-line {
  width: 100%;
  height: auto;
  flex: 1;
}
.fake-line polyline {
  stroke: var(--ui-accent);
}
.fake-donut {
  position: relative;
  width: 56%;
  margin: 0 auto;
  aspect-ratio: 1;
}
.fake-donut__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(var(--ui-accent) 0 74%, rgb(148 163 184 / 0.15) 74% 100%);
  -webkit-mask: radial-gradient(circle, transparent 52%, #000 54%);
  mask: radial-gradient(circle, transparent 52%, #000 54%);
}
.fake-donut__num {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}
.fake-legend {
  display: flex;
  gap: 6px;
  justify-content: center;
}
.fake-legend b {
  width: 26%;
  height: 6px;
  border-radius: 3px;
  background: rgb(148 163 184 / 0.2);
}
.fake-rows {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.fake-rows b {
  height: 10px;
  border-radius: 5px;
  background: rgb(148 163 184 / 0.18);
}
.fake-rows b:nth-child(2n) {
  background: rgb(148 163 184 / 0.28);
}
.fake-chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fake-chat span {
  width: 70%;
  height: 16px;
  border-radius: 9px 9px 9px 3px;
  background: rgb(148 163 184 / 0.2);
}
.fake-chat span.is-me {
  align-self: flex-end;
  width: 55%;
  border-radius: 9px 9px 3px 9px;
  background: var(--ui-accent);
  opacity: 0.75;
}
.fake-kanban {
  display: flex;
  gap: 8px;
}
.fake-kanban > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.fake-kanban b {
  height: 16%;
  min-height: 12px;
  border-radius: 6px;
  background: rgb(148 163 184 / 0.18);
}
.fake-kanban > div:nth-child(2) b:first-child {
  background: var(--ui-accent);
  opacity: 0.7;
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

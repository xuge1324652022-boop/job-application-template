<template>
  <!-- 正式作品迁入前的主题基础页；这里的时间线与取景框是交互排版研究。 -->
  <main ref="root" class="foundation" :class="`foundation--${kind}`">
    <section class="foundation__hero foundation__container foundation__band" :aria-label="page.title.zh">
      <p class="foundation__chapter">{{ page.id }} / {{ page.title.zh }} <span lang="en">{{ page.title.en }}</span></p>
      <h1 ref="heading" class="foundation__heading">{{ page.heading }}</h1>
      <ReferenceIntroduction class="foundation__introduction" :label="page.title" :text="page.introduction" :active="ready" />
      <dl v-if="kind === 'edit'" class="foundation__hero-meta">
        <div><dt>段落长度</dt><dd>12 <span>s</span></dd></div>
        <div><dt>主题</dt><dd>03</dd></div>
        <div><dt>轨道</dt><dd>Image · Sound</dd></div>
      </dl>
    </section>

    <section class="foundation__study foundation__container foundation__band" :aria-label="page.studyLabel.zh">
      <div class="foundation__study-top">
        <p><span>{{ page.studyLabel.zh }}</span><span lang="en">{{ page.studyLabel.en }}</span></p>
        <span>{{ kind === 'edit' ? '移动时间线，试试不同的停顿' : '选择主题，改变观察的角度' }}<small lang="en">{{ kind === 'edit' ? 'Move the playhead to explore the pace' : 'Choose a different point of view' }}</small></span>
      </div>
      <!-- 剪辑页：页签改为吸底胶囊导航，占位块保留原有纵向节奏 -->
      <div v-if="kind === 'edit'" class="foundation__dock-spacer" aria-hidden="true" />
      <div class="foundation__tabs" role="tablist" :aria-label="page.studyLabel.zh">
        <button v-for="(theme, index) in page.themes" :id="`${kind}-tab-${theme.key}`" :key="theme.key" role="tab" type="button"
          data-cursor="Explore" data-cursor-zh="切换" data-cursor-en="Explore" data-cursor-action="explore"
          :aria-selected="selected === index" :tabindex="selected === index ? 0 : -1" :aria-controls="`${kind}-study-panel`"
          @click="selectTheme(index)" @keydown="onTabKeydown($event, index)">
          <span class="foundation__tab-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span>{{ theme.title.zh }}</span><span lang="en">{{ theme.title.en }}</span>
        </button>
      </div>
      <div :id="`${kind}-study-panel`" class="foundation__panel" role="tabpanel" tabindex="0" :aria-labelledby="`${kind}-tab-${activeTheme.key}`" :style="{ '--playhead': playhead / 100, '--word-size': `${110 / Math.max(1, activeTheme.words[visibleWord]!.length)}vw` }">
        <div class="foundation__screen">
          <div v-if="kind === 'news'" class="foundation__frame" aria-hidden="true"><i /><i /><i /><i /></div>
          <Transition name="foundation-type" mode="out-in">
            <div :key="activeTheme.key" class="foundation__screen-copy">
              <p class="foundation__screen-note">{{ activeTheme.title.zh }} <span lang="en">{{ activeTheme.title.en }}</span></p>
              <p class="foundation__screen-word" lang="en">{{ activeTheme.words[visibleWord] }}</p>
              <p class="foundation__screen-subtitle">{{ activeTheme.description.zh }}<span lang="en">{{ activeTheme.description.en }}</span></p>
            </div>
          </Transition>
          <span class="foundation__screen-register" aria-hidden="true">{{ kind === 'edit' ? 'Picture / Sound / Time' : 'People / Place / Context' }}</span>
        </div>
        <div v-if="kind === 'edit'" class="foundation__timeline">
          <div class="foundation__tracks" aria-hidden="true">
            <div class="foundation__picture-track"><span>Image</span><i /><i /><i /><i /></div>
            <div class="foundation__sound-track"><span>Sound</span><i v-for="n in 48" :key="n" :style="{ '--level': `${24 + ((n * 17) % 65)}%` }" /></div>
            <div class="foundation__playhead" />
          </div>
          <div class="foundation__transport">
            <button type="button" :data-cursor="playing ? 'Pause' : 'Play'" data-cursor-zh="暂停" :data-cursor-en="playing ? 'Pause' : 'Play'" data-cursor-action="playback" :aria-label="playing ? '暂停节奏演示 / Pause study' : '播放节奏演示 / Play study'" :aria-pressed="playing" @click="togglePlayback"><span aria-hidden="true">{{ playing ? 'Ⅱ' : '▷' }}</span><span>{{ playing ? '暂停' : '播放' }}</span><span lang="en">{{ playing ? 'Pause' : 'Play' }}</span></button>
            <input :value="playhead" type="range" min="0" max="100" step="0.1" aria-label="节奏时间线 / Rhythm timeline" @input="seek" />
            <output>{{ String(Math.round(playhead / 100 * 12)).padStart(2, '0') }} / 12s</output>
          </div>
        </div>
        <div v-else class="foundation__news-links" aria-hidden="true"><span>Who / 谁</span><span>Where / 哪里</span><span>Why / 为什么</span></div>
      </div>
      <p class="foundation__study-caption"><span>动态排版与主题研究</span><span lang="en">Motion type & theme studies</span></p>
    </section>

    <!-- 剪辑页专属：三栏数据（对应 Mellem 的 6,500 / 25% / 244 数字段） -->
    <section v-if="kind === 'edit'" class="foundation__numbers foundation__container foundation__band" aria-label="节奏实验数据">
      <ul class="foundation__stats">
        <li>
          <p class="foundation__stat-value">12<span>s</span></p>
          <p class="foundation__stat-label">单段循环长度<small lang="en">Loop length</small></p>
        </li>
        <li>
          <p class="foundation__stat-value">03</p>
          <p class="foundation__stat-label">可切换主题<small lang="en">Themes in study</small></p>
        </li>
        <li>
          <p class="foundation__stat-value">02</p>
          <p class="foundation__stat-label">画面与声音轨<small lang="en">Picture & sound</small></p>
        </li>
      </ul>
    </section>

    <section v-if="kind === 'edit'" class="foundation__notes foundation__container foundation__band" aria-label="剪辑主题">
      <article v-for="(theme, index) in page.themes" :id="`${kind}-${theme.key}`" :key="theme.key" class="foundation__note" :class="{ 'is-open': openNote === index }">
        <h2 class="foundation__note-title">
          <button type="button" class="foundation__note-toggle" :aria-expanded="openNote === index" :aria-controls="`${kind}-note-${theme.key}`" @click="toggleNote(index)">
            <span class="foundation__note-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="foundation__note-name">{{ theme.title.zh }}</span>
            <span class="foundation__note-en" lang="en">{{ theme.title.en }}</span>
            <span class="foundation__note-plus" aria-hidden="true" />
          </button>
        </h2>
        <div :id="`${kind}-note-${theme.key}`" class="foundation__note-body">
          <div class="foundation__note-inner">
            <p class="foundation__note-lede">{{ theme.description.zh }}<span lang="en">{{ theme.description.en }}</span></p>
            <div class="foundation__detail"><p>{{ theme.detail.zh }}</p><p lang="en">{{ theme.detail.en }}</p></div>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="foundation__notes foundation__container" :aria-label="'新闻影像主题'">
      <article v-for="theme in page.themes" :id="`${kind}-${theme.key}`" :key="theme.key" class="foundation__note">
        <h2><span>{{ theme.title.zh }}</span><span lang="en">{{ theme.title.en }}</span></h2>
        <div class="foundation__note-copy"><p>{{ theme.description.zh }}</p><p lang="en">{{ theme.description.en }}</p><div class="foundation__detail"><p>{{ theme.detail.zh }}</p><p lang="en">{{ theme.detail.en }}</p></div></div>
      </article>
    </section>

    <section class="foundation__closing foundation__container foundation__band"><ReferenceIntroduction :label="{ zh: '继续创作', en: 'An ongoing practice' }" :text="page.closing" variant="section" /></section>
    <WorkContinuation :next="kind === 'edit' ? 'color' : 'poster'" />
  </main>
</template>

<script setup lang="ts">
/**
 * /edit 与 /news 共用的页面骨架，差异由 kind 和 FOUNDATION_PAGES 驱动。
 * 不虚构项目案例：主题切换、12 秒文字时间线仅演示节奏与信息组织。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ReferenceIntroduction from '../组件/引导文字揭示.vue'
import { referenceIntroductionGate } from '../组件/引导文字状态'
import WorkContinuation from '../组件/作品续读导航.vue'
import { FOUNDATION_PAGES, type FoundationKind } from '../数据/基础作品页资料'
import { isTransitioning, jumpTarget, markSubpageVisit } from '../组合函数/应用转场状态'
import { routeCurtainBlocked } from '../组合函数/页面幕布控制'
import { useFitText } from '../组合函数/标题字号拟合'
import { requestMotionLayoutRefresh } from '../工具/动效布局调度'

gsap.registerPlugin(ScrollTrigger)
const props = defineProps<{ kind: FoundationKind }>()
const page = computed(() => FOUNDATION_PAGES[props.kind])
const root = ref<HTMLElement | null>(null)
const heading = ref<HTMLElement | null>(null)
const selected = ref(0)
const activeTheme = computed(() => page.value.themes[selected.value]!)
const introDone = ref(false)
// 全局遮罩管路由时序，本页标题结束后才放行共享段落，避免两套入场同时争用文字。
const covered = computed(() => routeCurtainBlocked.value || !!jumpTarget.value || isTransitioning.value)
const ready = computed(() => introDone.value && !covered.value)
provide(referenceIntroductionGate, ready)
/*
 * 剪辑页走 Mellem 式的克制标题（84px @1600 ≈ 5.3vw），不再撑满整行；
 * 新闻页保持原有满幅拟合。useFitText 按容器宽度算，不能用 vw 直接乘视口。
 */
useFitText(heading, { min: 42, max: props.kind === 'edit' ? 150 : 240 })
markSubpageVisit(page.value.id)

/** 剪辑页的笔记默认展开第一条，其余折叠。 */
const openNote = ref<number | null>(0)
function toggleNote(index: number): void {
  openNote.value = openNote.value === index ? null : index
}

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
let context: gsap.Context | undefined
let intro: gsap.core.Timeline | undefined
let reveal: gsap.core.Tween | undefined
let started = false
let disposed = false
let cancelRefresh: (() => void) | undefined
const playhead = ref(0)
const playing = ref(false)
const visibleWord = computed(() => props.kind === 'edit' ? Math.min(2, Math.floor(playhead.value / 100 * 3)) : selected.value)
let frame = 0
let previousTime = 0

function selectTheme(index: number): void {
  selected.value = index
  pausePlayback()
  playhead.value = 0
}
/** roving tabindex：左右键循环选项，Home / End 到首尾，选中后同步焦点与面板。 */
function onTabKeydown(event: KeyboardEvent, index: number): void {
  let target: number
  if (event.key === 'ArrowRight') target = (index + 1) % page.value.themes.length
  else if (event.key === 'ArrowLeft') target = (index + page.value.themes.length - 1) % page.value.themes.length
  else if (event.key === 'Home') target = 0
  else if (event.key === 'End') target = page.value.themes.length - 1
  else return
  event.preventDefault()
  selectTheme(target)
  root.value?.querySelector<HTMLButtonElement>(`#${props.kind}-tab-${page.value.themes[target]!.key}`)?.focus()
}
/** 使用 RAF 时间差推进 0–100 进度，120ms 对应 1%，因此整段为 12 秒。 */
function tick(time: number): void {
  if (!playing.value) return
  if (previousTime) playhead.value = Math.min(100, playhead.value + (time - previousTime) / 120)
  previousTime = time
  if (playhead.value >= 100) { pausePlayback(); return }
  frame = requestAnimationFrame(tick)
}
function pausePlayback(): void {
  playing.value = false
  cancelAnimationFrame(frame)
  frame = 0
  previousTime = 0
}
function togglePlayback(): void {
  if (playing.value) { pausePlayback(); return }
  if (playhead.value >= 100) playhead.value = 0
  playing.value = true
  frame = requestAnimationFrame(tick)
}
function seek(event: Event): void {
  pausePlayback()
  playhead.value = Number((event.target as HTMLInputElement).value)
}
function onVisibilityChange(): void { if (document.hidden) pausePlayback() }
/** 正文仅揭示一次；刷新请求交给全站队列，避免多个组件同时强制布局。 */
function revealStudy(): void {
  if (disposed || !root.value || motionQuery.matches || reveal) return
  context?.add(() => {
    reveal = gsap.fromTo(root.value!.querySelector('.foundation__study'), { opacity: 0, y: 54 }, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: root.value!.querySelector('.foundation__study'), start: 'top 85%', once: true },
    })
  })
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}
function playIntro(): void {
  if (started || disposed || !root.value) return
  started = true
  if (motionQuery.matches) { introDone.value = true; return }
  context?.add(() => {
    intro = gsap.timeline({ onComplete: () => { introDone.value = true; revealStudy() } })
      .fromTo(heading.value, { opacity: 0, yPercent: 30 }, { opacity: 1, yPercent: 0, duration: .8, ease: 'power3.out' }, 0)
  })
}
function onMotionChange(): void {
  if (!motionQuery.matches) return
  pausePlayback()
  intro?.kill()
  introDone.value = true
  reveal?.scrollTrigger?.kill()
  reveal?.kill()
  if (root.value) gsap.set([heading.value, root.value.querySelector('.foundation__study')], { clearProps: 'transform,opacity' })
}
watch(covered, value => { if (!value) playIntro() })
onMounted(async () => {
  context = gsap.context(() => {}, root.value!)
  await nextTick()
  if (disposed) return
  if (!covered.value) playIntro()
  motionQuery.addEventListener('change', onMotionChange)
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onBeforeUnmount(() => {
  // 同时取消计时、刷新与 GSAP context；异步 nextTick 通过 disposed 拒绝晚到的初始化。
  disposed = true
  cancelRefresh?.()
  pausePlayback()
  context?.revert()
  motionQuery.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
/* 页面根节点覆盖共享纸色变量，使通用组件继承当前主题而不污染其他路由。 */
.foundation { --ab-bg:#f6f1e7; --ab-ink:#2b241c; --ab-soft:#6a5c4c; --ab-line:#d9d2c5; min-height:100vh; min-height:100svh; background:var(--ab-bg); color:var(--ab-ink); overflow-x:clip; }
.foundation--news { --ab-bg:#f7f7f5; --ab-ink:#252525; --ab-soft:#626262; --ab-line:#d7d7d3; }
.foundation__container { width:100%; max-width:1400px; margin-inline:auto; padding-inline:clamp(20px,4.4vw,64px); }
.foundation__hero { padding-top:clamp(96px,13vh,160px); padding-bottom:clamp(80px,12vh,150px); }
.foundation__chapter { display:flex; flex-wrap:wrap; gap:14px; font-size:11px; line-height:1.4; }
.foundation__chapter [lang=en] { opacity:.6; }
.foundation__heading { margin-top:clamp(22px,4vh,44px); font-size:clamp(42px,18vw,240px); line-height:.85; letter-spacing:-.055em; font-weight:400; }
.foundation__introduction { margin-top:clamp(72px,14vh,160px); }
.foundation__study { padding-bottom:clamp(100px,15vh,190px); }
.foundation__study-top { display:flex; justify-content:space-between; align-items:end; gap:30px; margin-bottom:36px; font-size:13px; line-height:1.4; }
.foundation__study-top p,.foundation__study-top>span { display:flex; flex-direction:column; gap:6px; }
.foundation__study-top p [lang=en],.foundation__study-top small { font-size:11px; color:var(--ab-soft); }
.foundation__tabs { display:flex; border-top:1px solid var(--ab-line); }
.foundation__tabs button { display:flex; align-items:baseline; gap:12px; flex:1; min-height:70px; padding:16px 0; border:0; background:transparent; color:var(--ab-ink); font:inherit; font-size:20px; text-align:left; cursor:pointer; opacity:.45; transition:opacity .3s; }
.foundation__tabs button[aria-selected=true],.foundation__tabs button:hover { opacity:1; }
.foundation__tabs button [lang=en] { font-size:12px; }
.foundation__panel { background:#161616; color:#f7f7f5; }
.foundation__screen { position:relative; display:flex; align-items:center; min-height:560px; padding:clamp(28px,6vw,84px); overflow:clip; }
.foundation__screen-copy { width:100%; }
.foundation__screen-note { display:flex; align-items:baseline; gap:14px; font-size:15px; }
.foundation__screen-note [lang=en] { font-size:12px; opacity:.6; }
.foundation__screen-word { margin:24px 0 28px; font-size:clamp(52px,8.4vw,126px); font-weight:400; letter-spacing:-.065em; line-height:1; overflow-wrap:anywhere; }
.foundation__screen-subtitle { font-size:clamp(15px,1.7vw,24px); line-height:1.4; }
.foundation__screen-subtitle [lang=en] { display:block; margin-top:9px; font-size:clamp(12px,1.2vw,17px); opacity:.6; }
.foundation__screen-register { position:absolute; right:clamp(28px,6vw,84px); bottom:28px; font-size:10px; opacity:.35; }
.foundation__timeline { padding:0 clamp(24px,4vw,56px) 28px; }
.foundation__tracks { position:relative; padding-top:18px; border-top:1px solid #666; overflow:clip; }
.foundation__picture-track { display:flex; gap:5px; height:48px; }
.foundation__picture-track>span,.foundation__sound-track>span { width:55px; flex:none; font-size:9px; line-height:12px; color:#999; }
.foundation__picture-track i { background:#d6d0c4; flex:1; }
.foundation__picture-track i:nth-of-type(2) { flex:2.2; background:#968b7a; }
.foundation__picture-track i:nth-of-type(3) { flex:.7; background:#eee9df; }
.foundation__picture-track i:nth-of-type(4) { flex:1.5; background:#6e726a; }
.foundation__sound-track { display:flex; align-items:center; gap:3px; height:46px; margin-top:8px; }
.foundation__sound-track i { height:var(--level); flex:1; background:#747b70; }
.foundation__playhead { position:absolute; width:1px; top:12px; bottom:0; left:calc(60px + (100% - 60px) * var(--playhead)); background:#fff; }
.foundation__transport { display:flex; align-items:center; gap:22px; margin-top:26px; }
.foundation__transport button { display:flex; align-items:center; gap:9px; border:0; color:inherit; background:none; font:inherit; font-size:12px; min-height:40px; cursor:pointer; }
.foundation__transport button>span:first-child { font-size:24px; width:22px; }
.foundation__transport button [lang=en] { opacity:.55; font-size:10px; }
.foundation__transport input { flex:1; min-width:20px; accent-color:#e6e1d7; }
.foundation__transport output { min-width:54px; text-align:right; font-size:11px; }
.foundation__study-caption { display:flex; justify-content:space-between; gap:20px; margin-top:18px; font-size:11px; color:var(--ab-soft); }
.foundation--news .foundation__screen { min-height:650px; }
.foundation--news .foundation__screen-word { margin-block:42px; font-size:clamp(30px,var(--word-size),156px); overflow-wrap:normal; }
.foundation__frame { position:absolute; inset:28px; pointer-events:none; }
.foundation__frame i { position:absolute; width:32px; height:32px; border-color:#6d6d6d; border-style:solid; }
.foundation__frame i:nth-child(1) { left:0; top:0; border-width:1px 0 0 1px; }
.foundation__frame i:nth-child(2) { right:0; top:0; border-width:1px 1px 0 0; }
.foundation__frame i:nth-child(3) { left:0; bottom:0; border-width:0 0 1px 1px; }
.foundation__frame i:nth-child(4) { right:0; bottom:0; border-width:0 1px 1px 0; }
.foundation__news-links { display:flex; justify-content:space-between; gap:20px; margin-inline:clamp(28px,6vw,84px); padding:22px 0; border-top:1px solid #515151; font-size:12px; }
.foundation__note { display:grid; grid-template-columns:1fr 2fr; gap:clamp(24px,5vw,72px); padding:clamp(40px,7vh,84px) 0; border-top:1px solid var(--ab-line); }
.foundation__note h2 { display:flex; flex-direction:column; gap:12px; font-size:clamp(30px,3.5vw,48px); line-height:1.15; letter-spacing:-.04em; font-weight:400; }
.foundation__note h2 [lang=en] { font-size:16px; letter-spacing:0; color:var(--ab-soft); }
.foundation__note-copy>p { max-width:760px; font-size:clamp(23px,2.5vw,36px); line-height:1.3; letter-spacing:-.025em; }
.foundation__note-copy>p[lang=en] { margin-top:14px; color:var(--ab-soft); font-size:clamp(18px,1.8vw,26px); }
.foundation__detail { margin-top:36px; max-width:640px; font-size:14px; line-height:1.9; }
.foundation__detail [lang=en] { margin-top:16px; font-size:13px; line-height:1.65; color:var(--ab-soft); }
.foundation__closing { padding-top:clamp(80px,14vh,170px); padding-bottom:32px; }
.foundation-type-enter-active,.foundation-type-leave-active { transition:opacity .35s,transform .6s cubic-bezier(.215,.61,.355,1); }
.foundation-type-enter-from { opacity:0; transform:translateY(32px); }
.foundation-type-leave-to { opacity:0; transform:translateY(-20px); }
.foundation button:focus-visible,.foundation input:focus-visible { outline:2px solid currentColor; outline-offset:5px; }
.foundation__panel:focus-visible { outline:2px solid var(--ab-ink); outline-offset:6px; }
@media(max-width:700px) {
  .foundation__hero { padding-top:110px; }
  .foundation__study-top { display:block; }
  .foundation__study-top>span { margin-top:24px; }
  .foundation__tabs button { flex-direction:column; gap:4px; min-height:76px; font-size:18px; }
  .foundation__tabs button [lang=en] { font-size:10px; }
  .foundation__screen,.foundation--news .foundation__screen { min-height:430px; padding:38px 24px 64px; }
  .foundation__screen-word { font-size:clamp(43px,11.3vw,78px); }
  .foundation__screen-register { left:24px; right:auto; bottom:20px; }
  .foundation__frame { inset:14px; }
  .foundation__frame i { width:20px; height:20px; }
  .foundation__transport { gap:12px; }
  .foundation__transport button [lang=en] { display:none; }
  .foundation__note { grid-template-columns:1fr; gap:30px; }
  .foundation__note h2 { flex-direction:row; align-items:baseline; gap:16px; }
  .foundation__detail { margin-top:24px; }
  .foundation__news-links { margin-inline:24px; gap:10px; font-size:10px; }
}
@media(prefers-reduced-motion:reduce) {
  .foundation-type-enter-active,.foundation-type-leave-active,.foundation__tabs button { transition:none; }
  .foundation-type-enter-from,.foundation-type-leave-to { transform:none; }
}

/* ==========================================================================
   剪辑页皮肤（Mellem 风格）：仅在 .foundation--edit 下生效，/news 输出不变。
   色板与节奏来自实测：侧边 2.083vw、段间距 8.333vw、胶囊圆角 100px。
   ========================================================================== */
.foundation--edit {
  --m-beige:#F2ECDC; --m-green:#394B33; --m-ink:#1A2218; --m-chart:#C8CF21;
  --m-line:rgba(57,75,51,.18);
  --ab-bg:#F2ECDC; --ab-ink:#394B33; --ab-soft:#6E7566; --ab-line:#CFC8B6;
  background:var(--ab-bg); color:var(--ab-ink);
  /* 给吸底胶囊导航留出安全区 */
  padding-bottom:clamp(84px,7vw,128px);
  font-weight:400;
}
/* 满幅色带：100vw 伪元素铺底，body 的 overflow-x:clip 负责裁掉溢出 */
.foundation--edit .foundation__band { position:relative; z-index:0; }
.foundation--edit .foundation__band::before {
  content:""; position:absolute; z-index:-1; top:0; bottom:0; left:50%;
  width:100vw; transform:translateX(-50%); background:var(--band,var(--ab-bg));
}
.foundation--edit .foundation__container { max-width:1520px; padding-inline:clamp(20px,2.0833vw,40px); }

/* —— 深色首屏 —— */
.foundation--edit .foundation__hero {
  --band:var(--m-ink); --ab-ink:var(--m-beige); --ab-soft:#A7AE9C; --ab-line:rgba(242,236,220,.16);
  color:var(--m-beige);
  padding-top:clamp(104px,9.2vw,150px); padding-bottom:clamp(56px,5vw,84px);
}
.foundation--edit .foundation__chapter {
  gap:10px; font-size:clamp(11px,.86vw,14px); letter-spacing:.02em; color:#A7AE9C;
}
.foundation--edit .foundation__chapter [lang=en] { opacity:.7; }
.foundation--edit .foundation__heading {
  margin-top:clamp(18px,2.2vw,34px);
  font-weight:500; letter-spacing:-.045em; line-height:.9;
}
.foundation--edit .foundation__introduction { margin-top:clamp(40px,4.4vw,72px); max-width:min(100%,58rem); }
.foundation--edit :deep(.reference-introduction__copy) {
  font-size:clamp(17px,1.667vw,28px); line-height:1.26; letter-spacing:-.018em; font-weight:400;
}
.foundation--edit :deep(.reference-introduction__copy + .reference-introduction__copy) { margin-top:.7em; }
.foundation--edit :deep(.reference-introduction__copy[lang=en]) { color:#C3C9B8; }
/*
 * Mellem 的小标签在段落**上方**，不是悬挂在左侧。
 * 该组件默认把标签绝对定位 + 给首行 text-indent，这里改成静态并清零缩进宽度
 * （自定义属性声明在组件根上，父级同名选择器特异性更高才能覆盖）。
 */
.foundation--edit .foundation__introduction,
.foundation--edit :deep(.reference-introduction) { --reference-label-width:0px; }
.foundation--edit :deep(.reference-introduction__label) {
  position:static; display:flex; flex-direction:row; flex-wrap:wrap; gap:10px;
  max-width:none; margin-bottom:clamp(14px,1.3vw,20px);
  font-size:clamp(11px,.86vw,13px); color:#A7AE9C; letter-spacing:.03em;
}

/* 首屏下方三栏元信息（对应 Mellem 的 Occupation / Address 栏） */
.foundation--edit .foundation__hero-meta {
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:clamp(16px,2vw,32px);
  margin:clamp(36px,4.2vw,64px) 0 0; padding-top:clamp(18px,1.8vw,26px);
  border-top:1px solid rgba(242,236,220,.16);
}
.foundation--edit .foundation__hero-meta dt {
  font-size:clamp(10px,.78vw,13px); letter-spacing:.04em; color:#A7AE9C; margin-bottom:6px;
}
.foundation--edit .foundation__hero-meta dd {
  margin:0; font-size:clamp(14px,1.11vw,19px); letter-spacing:-.01em;
}
.foundation--edit .foundation__hero-meta dd span { font-size:.72em; opacity:.6; margin-left:2px; }

/* —— 节奏实验：深绿带 —— */
.foundation--edit .foundation__study {
  --band:var(--m-green); --ab-ink:var(--m-beige); --ab-soft:#B3BAA6; --ab-line:rgba(242,236,220,.18);
  color:var(--m-beige);
  padding-top:clamp(56px,5.4vw,96px); padding-bottom:clamp(64px,6vw,104px);
  /*
   * 吸底导航是 fixed，但会被 .foundation__band 的 z-index:0 关进本节层叠上下文，
   * 于是被后面的色带整块盖住。抬到 20 让它浮在后续区块之上（各区带本身不重叠）。
   */
  z-index:20;
}
.foundation--edit .foundation__study-top {
  align-items:start; margin-bottom:clamp(22px,2.2vw,34px);
  font-size:clamp(11px,.86vw,14px); color:#B3BAA6;
}
.foundation--edit .foundation__study-top p { color:var(--m-beige); }
.foundation--edit .foundation__study-top p [lang=en] { color:#B3BAA6; }
.foundation--edit .foundation__study-top small { font-size:clamp(10px,.78vw,12px); color:#9AA491; }
.foundation--edit .foundation__dock-spacer { height:clamp(46px,3.4vw,58px); }

/* 页签 → 吸底胶囊导航 */
.foundation--edit .foundation__tabs {
  position:fixed; left:50%; bottom:clamp(14px,1.5vw,24px); transform:translateX(-50%);
  z-index:40; width:auto; max-width:calc(100vw - 28px);
  display:flex; gap:2px; padding:6px;
  border:1px solid rgba(242,236,220,.16); border-radius:100px;
  background:rgba(26,34,24,.9);
  -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);
  box-shadow:0 18px 44px rgba(10,14,9,.32);
}
.foundation--edit .foundation__tabs button {
  flex:0 0 auto; min-height:44px; padding:0 clamp(13px,1.2vw,20px);
  display:flex; align-items:center; gap:8px; white-space:nowrap;
  border:0; border-radius:100px; background:transparent; color:var(--m-beige);
  font:inherit; font-size:clamp(12px,.95vw,15px); text-align:left;
  opacity:.62; transition:opacity .25s, background-color .25s, color .25s;
}
.foundation--edit .foundation__tabs button [lang=en] { font-size:.78em; opacity:.7; }
.foundation--edit .foundation__tabs button[aria-selected="true"] {
  background:var(--m-chart); color:var(--m-ink); opacity:1;
}
.foundation--edit .foundation__tabs button[aria-selected="true"] [lang=en] { opacity:.65; }
.foundation--edit .foundation__tabs button:hover { opacity:1; }
.foundation--edit .foundation__tab-index {
  font-size:.72em; letter-spacing:.04em; opacity:.5;
}
.foundation--edit .foundation__tabs button[aria-selected="true"] .foundation__tab-index { opacity:.55; }

/* 面板：不再自带黑底，改为绿带上的排版区 */
.foundation--edit .foundation__panel { background:transparent; color:var(--m-beige); }
.foundation--edit .foundation__screen {
  min-height:clamp(360px,42vh,560px);
  padding:clamp(20px,2.4vw,40px) 0 clamp(28px,3vw,48px);
  align-items:flex-start;
}
.foundation--edit .foundation__screen-note {
  font-size:clamp(11px,.86vw,14px); color:#B3BAA6; letter-spacing:.02em;
}
.foundation--edit .foundation__screen-word {
  margin:clamp(16px,1.8vw,28px) 0 clamp(18px,2vw,30px);
  font-size:clamp(56px,7.4vw,132px); font-weight:500; letter-spacing:-.05em; line-height:.94;
  color:var(--m-beige);
}
.foundation--edit .foundation__screen-subtitle {
  font-size:clamp(16px,1.45vw,24px); line-height:1.3; letter-spacing:-.015em; max-width:36ch;
}
.foundation--edit .foundation__screen-subtitle [lang=en] { color:#B3BAA6; margin-top:8px; }
/* 底边小字：.35 的透明度落在深绿上基本看不见，抬到 .55 并与轨道拉开一点距离 */
.foundation--edit .foundation__screen-register {
  right:0; bottom:clamp(6px,1vw,12px);
  font-size:clamp(9px,.7vw,11px); letter-spacing:.06em; color:#B3BAA6; opacity:.55;
}

/* 时间线：Mellem 的色块语言 */
.foundation--edit .foundation__timeline { padding:0; }
.foundation--edit .foundation__tracks { border-top:1px solid rgba(242,236,220,.2); padding-top:16px; }
.foundation--edit .foundation__picture-track>span,
.foundation--edit .foundation__sound-track>span {
  width:clamp(44px,3.4vw,58px); font-size:clamp(9px,.66vw,10px); letter-spacing:.08em; color:#9AA491;
}
.foundation--edit .foundation__picture-track { height:clamp(38px,3.2vw,52px); gap:3px; }
.foundation--edit .foundation__picture-track i { background:rgba(242,236,220,.22); }
.foundation--edit .foundation__picture-track i:nth-of-type(2) { background:rgba(242,236,220,.42); }
.foundation--edit .foundation__picture-track i:nth-of-type(3) { background:var(--m-chart); }
.foundation--edit .foundation__picture-track i:nth-of-type(4) { background:rgba(242,236,220,.7); }
.foundation--edit .foundation__sound-track { height:clamp(34px,2.8vw,44px); gap:2px; margin-top:6px; }
.foundation--edit .foundation__sound-track i { background:rgba(200,207,33,.55); }
.foundation--edit .foundation__playhead { background:var(--m-chart); width:1px; }

/* 播放条：胶囊按钮 + 细轨 */
.foundation--edit .foundation__transport { gap:clamp(12px,1.4vw,22px); margin-top:clamp(18px,1.8vw,26px); }
.foundation--edit .foundation__transport button {
  min-height:44px; padding:0 clamp(14px,1.2vw,20px); gap:8px;
  border:2px solid rgba(242,236,220,.34); border-radius:100px;
  font-size:clamp(11px,.9vw,14px); letter-spacing:.02em;
  transition:border-color .25s, background-color .25s, color .25s;
}
.foundation--edit .foundation__transport button:hover {
  border-color:var(--m-chart); background:var(--m-chart); color:var(--m-ink);
}
.foundation--edit .foundation__transport button>span:first-child { font-size:13px; width:auto; }
/*
 * 滑块：视觉轨道只有 2px，但输入框本身要给 32px 的触控热区，
 * 否则手机上几乎点不中（原先 input 高度＝2px，热区就是那 2px）。
 */
.foundation--edit .foundation__transport input {
  flex:1; min-width:20px; height:32px; margin:0;
  background:transparent; border-radius:0; appearance:none; -webkit-appearance:none;
  cursor:pointer;
}
.foundation--edit .foundation__transport input::-webkit-slider-runnable-track {
  height:2px; border-radius:2px; background:rgba(242,236,220,.26);
}
.foundation--edit .foundation__transport input::-webkit-slider-thumb {
  -webkit-appearance:none; width:12px; height:12px; border-radius:50%;
  background:var(--m-chart); border:0; cursor:pointer;
}
.foundation--edit .foundation__transport input::-moz-range-thumb {
  width:12px; height:12px; border:0; border-radius:50%; background:var(--m-chart); cursor:pointer;
}
.foundation--edit .foundation__transport output {
  min-width:58px; font-size:clamp(10px,.78vw,12px); letter-spacing:.04em; color:#B3BAA6;
}
.foundation--edit .foundation__study-caption {
  margin-top:clamp(20px,2vw,30px); padding-top:14px;
  border-top:1px solid rgba(242,236,220,.14);
  font-size:clamp(10px,.78vw,12px); color:#9AA491;
}

/* —— 数字段 —— */
.foundation--edit .foundation__numbers {
  --band:var(--m-beige);
  padding-top:clamp(48px,4.6vw,80px); padding-bottom:clamp(48px,4.6vw,80px);
}
.foundation--edit .foundation__stats {
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(20px,3vw,56px); margin:0; padding:0; list-style:none;
  border-top:1px solid var(--m-line); padding-top:clamp(24px,2.4vw,40px);
}
.foundation--edit .foundation__stat-value {
  font-size:clamp(46px,5.2vw,92px); line-height:.92; letter-spacing:-.05em; font-weight:500;
}
.foundation--edit .foundation__stat-value span { font-size:.44em; letter-spacing:0; margin-left:2px; }
.foundation--edit .foundation__stat-label {
  margin-top:clamp(12px,1.1vw,18px); font-size:clamp(11px,.86vw,14px);
  line-height:1.4; color:var(--m-soft, #6E7566);
  display:flex; flex-direction:column; gap:4px;
}
.foundation--edit .foundation__stat-label small { font-size:.86em; color:#8C9384; }

/* —— 笔记：手风琴 —— */
.foundation--edit .foundation__notes { --band:var(--m-beige); padding-bottom:clamp(40px,4vw,72px); }
.foundation--edit .foundation__note {
  display:block; padding:0; border-top:1px solid var(--m-line);
}
.foundation--edit .foundation__note:last-child { border-bottom:1px solid var(--m-line); }
.foundation--edit .foundation__note-title { margin:0; font-size:inherit; font-weight:400; }
.foundation--edit .foundation__note-toggle {
  width:100%; display:grid; grid-template-columns:clamp(36px,3vw,54px) 1fr auto auto;
  align-items:center; gap:clamp(10px,1.4vw,24px);
  padding:clamp(20px,2.2vw,34px) 0; border:0; background:transparent;
  color:inherit; font:inherit; text-align:left; cursor:pointer;
  transition:padding .3s;
}
.foundation--edit .foundation__note-index {
  font-size:clamp(10px,.78vw,12px); letter-spacing:.06em; color:#8C9384;
}
.foundation--edit .foundation__note-name {
  font-size:clamp(22px,2.4vw,40px); line-height:1.1; letter-spacing:-.035em; font-weight:500;
}
.foundation--edit .foundation__note-en {
  font-size:clamp(11px,.9vw,14px); color:#8C9384; letter-spacing:.01em;
}
/* 加号：两条线旋转成减号 */
.foundation--edit .foundation__note-plus {
  position:relative; width:14px; height:14px; flex:none;
}
.foundation--edit .foundation__note-plus::before,
.foundation--edit .foundation__note-plus::after {
  content:""; position:absolute; left:50%; top:50%; background:currentColor;
  transform:translate(-50%,-50%); transition:transform .35s cubic-bezier(.215,.61,.355,1), opacity .35s;
}
.foundation--edit .foundation__note-plus::before { width:14px; height:1.5px; }
.foundation--edit .foundation__note-plus::after { width:1.5px; height:14px; }
.foundation--edit .foundation__note.is-open .foundation__note-plus::after { transform:translate(-50%,-50%) rotate(90deg); opacity:0; }

.foundation--edit .foundation__note-body {
  display:grid; grid-template-rows:0fr;
  transition:grid-template-rows .42s cubic-bezier(.215,.61,.355,1);
}
.foundation--edit .foundation__note.is-open .foundation__note-body { grid-template-rows:1fr; }
.foundation--edit .foundation__note-inner { overflow:hidden; }
.foundation--edit .foundation__note:not(.is-open) .foundation__note-inner {
  visibility:hidden; transition:visibility 0s .42s;
}
.foundation--edit .foundation__note-lede {
  max-width:44ch; padding-bottom:clamp(16px,1.6vw,24px);
  font-size:clamp(18px,1.667vw,27px); line-height:1.3; letter-spacing:-.02em;
}
.foundation--edit .foundation__note-lede [lang=en] {
  display:block; margin-top:.5em; color:#7B8274; font-size:.84em;
}
.foundation--edit .foundation__note .foundation__detail {
  max-width:62ch; margin:0 0 clamp(24px,2.4vw,40px);
  padding-top:clamp(14px,1.4vw,20px); border-top:1px solid var(--m-line);
  font-size:clamp(13px,1vw,16px); line-height:1.75; color:#5C6354;
}
.foundation--edit .foundation__detail [lang=en] { margin-top:10px; font-size:.94em; line-height:1.7; color:#7B8274; }

/* —— 收尾：荧光黄绿带 —— */
.foundation--edit .foundation__closing {
  --band:var(--m-chart); --ab-ink:#394B33; --ab-soft:#4C5A42; --ab-line:rgba(26,34,24,.2);
  color:var(--m-ink);
  padding-top:clamp(64px,6vw,104px); padding-bottom:clamp(64px,6vw,104px);
}
.foundation--edit .foundation__closing :deep(.reference-introduction__copy) {
  font-size:clamp(24px,3vw,52px); line-height:1.12; letter-spacing:-.04em; font-weight:500;
  max-width:min(100%,22em); text-wrap:balance;
}
/*
 * 中文收尾句不能交给 text-wrap:balance：它按字数均分，会把「两个」这种词从中间劈开
 * （实测「藏在两 / 个画面相遇的地方」）。改回贪心填行，断在「…相遇的 / 地方」这类语义边界。
 * 英文仍用 balance —— 英文按词断行，均分是好事。
 */
.foundation--edit .foundation__closing :deep(.reference-introduction__copy[lang="zh"]) {
  text-wrap:wrap;
}
/* 荧光黄底上不能再用深底那套浅灰，否则对比度掉到不可读 */
.foundation--edit .foundation__closing :deep(.reference-introduction__copy[lang=en]) {
  color:#46523C; font-size:clamp(18px,2.1vw,34px); max-width:min(100%,26em);
}
.foundation--edit .foundation__closing :deep(.reference-introduction__label) {
  color:#4C5A42; font-size:clamp(11px,.86vw,13px); letter-spacing:.04em;
  margin-bottom:clamp(16px,1.5vw,24px);
}

@media(max-width:760px) {
  .foundation--edit .foundation__hero-meta { grid-template-columns:1fr; gap:14px; }
  .foundation--edit .foundation__stats { grid-template-columns:1fr; gap:26px; }
  .foundation--edit .foundation__note-toggle {
    grid-template-columns:1fr auto; gap:6px 12px; padding:22px 0;
  }
  .foundation--edit .foundation__note-index { display:none; }
  .foundation--edit .foundation__note-en { grid-column:1; }
  .foundation--edit .foundation__note-plus { grid-row:1 / span 2; grid-column:2; }
  .foundation--edit .foundation__tabs { width:calc(100vw - 24px); }
  .foundation--edit .foundation__tabs button { flex:1 1 0; justify-content:center; padding:0 10px; }
  .foundation--edit .foundation__tabs button [lang=en] { display:none; }
  .foundation--edit .foundation__tabs button .foundation__tab-index { display:none; }
  /* 保持绝对定位，否则会退回 flex 行被正文挤成两行 */
  .foundation--edit .foundation__screen { min-height:clamp(258px,30vh,360px); }
  /* 手机上底边小字与轨道只差 0px，右对齐（left:auto 才能取消基类的 left:24px） */
  .foundation--edit .foundation__screen-register { left:auto; right:0; bottom:6px; }
  /* 吸底导航高约 72px，底部留白不足时永远压住「动态排版与主题研究」这行 */
  .foundation--edit .foundation__study { padding-bottom:88px; }
}
@media(prefers-reduced-motion:reduce) {
  .foundation--edit .foundation__note-body,
  .foundation--edit .foundation__note-plus::before,
  .foundation--edit .foundation__note-plus::after { transition:none; }
}
</style>

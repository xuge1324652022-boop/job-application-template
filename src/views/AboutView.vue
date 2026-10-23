<template>
  <!-- 滚动叙事与完整履历共用原有资料；各场景独立清理动画。首屏以下区块延迟挂载。 -->
  <div class="about-page" @click="onAnchorClick">
    <AboutMotionHero :active="heroActive" />
    <AboutScrollChapter name="identity" heading="WHO I AM" :label="{ zh: '关于我', en: 'A little about me' }"
      :lines="{ zh: ['把想法做成影像', '让内容被看见'], en: ['From ideas to images.', 'Making content seen.'] }" />
    <main class="about-body">
      <AboutIdentityScene v-model:active-tool="activeTool" :lang="lang" :active="heroActive" />
      <div class="about-reading">
        <p class="about-section-word" lang="en">IN PRACTICE.</p>
        <LazySection min-height="190vh" :eager="eagerAll"><ExperienceTimeline :lang="lang" /></LazySection>
      </div>
      <AboutScrollChapter name="process" heading="HOW I WORK" size="12.2vw" :label="ABOUT_DIVIDERS.process.label"
        :lines="{ zh: ['工具参与过程', '判断留在自己手里'], en: ['Tools support the process.', 'Judgment stays with me.'] }" />
      <div class="about-reading about-process"><LazySection min-height="150vh" :eager="eagerAll"><AiWorkflow v-model:active-tool="activeTool" :lang="lang" /></LazySection></div>
      <LazySection min-height="110vh" :eager="eagerAll"><AboutObservationRail :lang="lang" @open="onOpenVisual" /></LazySection>
      <LazySection min-height="95vh" :eager="eagerAll"><ContactEnd :lang="lang" /></LazySection>
    </main>
    <VisualViewer v-if="viewerItem" :item="viewerItem" :lang="lang" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
/**
 * /about 人物专题入口：事实内容来自 data，版式与动效分别封装在 about 子组件中。
 * 本页只协调转场放行、头像与工作流共享的 AI 工具选择，以及统一图片查看器。
 * 首屏以下的重区块经 LazySection 提前一屏加载：锚点跳转（含刷新带 hash 进入）
 * 会立即转急载并在挂载后定位，正常浏览仍按需加载。
 */
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { referenceIntroductionGate } from '../components/ReferenceIntroduction'
import AboutMotionHero from '../components/about/AboutMotionHero.vue'
import AboutScrollChapter from '../components/about/AboutScrollChapter.vue'
import AboutIdentityScene from '../components/about/AboutIdentityScene.vue'
import LazySection from '../components/LazySection.vue'
// 首屏以下重区块拆成独立 chunk，随 LazySection 按需加载；查看器打开时才加载。
const ExperienceTimeline = defineAsyncComponent(() => import('../components/about/ExperienceTimeline.vue'))
const AiWorkflow = defineAsyncComponent(() => import('../components/about/AiWorkflow.vue'))
const AboutObservationRail = defineAsyncComponent(() => import('../components/about/AboutObservationRail.vue'))
const ContactEnd = defineAsyncComponent(() => import('../components/about/ContactEnd.vue'))
const VisualViewer = defineAsyncComponent(() => import('../components/about/VisualViewer.vue'))
import { WORKS, assertParity } from '../data/aboutProfile'
import { ABOUT_DIVIDERS } from '../data/aboutDividers'
import { assertVisuals, type VisualAsset } from '../data/visualPortfolio'
import { subpageLanguage as lang } from '../composables/useSubpageLanguage'
import { useVisualViewer } from '../composables/useVisualViewer'
import { ABOUT_PAGE_ID, isTransitioning, jumpTarget, markSubpageVisit, overlayActive } from '../composables/useTransition'
import { routeCurtainBlocked } from '../composables/usePageCurtain'

if (import.meta.env.DEV) {
  assertParity()
  assertVisuals(WORKS.map(work => work.id))
}
// 查看器保存触发元素以便关闭后恢复焦点；路由卸载必须同步 reset，避免回滚新页面位置。
const { active: viewerItem, open: openViewer, close: closeViewer, reset: resetViewer } = useVisualViewer()
function onOpenVisual(item: VisualAsset, trigger: HTMLElement): void { openViewer(item, trigger) }
onBeforeUnmount(resetViewer)
markSubpageVisit(ABOUT_PAGE_ID)
// blocked 在全局幕布开始揭开时解除；不等幕布彻底离场，首屏文字才能接上转场节奏。
const heroActive = computed(() => !routeCurtainBlocked.value && !jumpTarget.value && !overlayActive.value && !isTransitioning.value)
provide(referenceIntroductionGate, heroActive)
const activeTool = ref('kimi')

// 首屏以下区块默认按需加载；点页内锚点或带 hash 进入时全部转急载，再定位到目标。
const eagerAll = ref(false)
async function scrollToAnchorWhenReady(id: string): Promise<void> {
  // 急载区块和它们内部的固定舞台（pin-spacer）会陆续改变文档高度，
  // 一次 scrollIntoView 会落偏；逐帧校准直到目标位置连续多帧稳定为止。
  let lastTop = Number.NaN
  let stableFrames = 0
  for (let attempt = 0; attempt < 300 && stableFrames < 6; attempt++) {
    const element = document.getElementById(id)
    if (element) {
      const top = element.getBoundingClientRect().top
      stableFrames = Math.abs(top - lastTop) < 1 ? stableFrames + 1 : 0
      lastTop = top
      element.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
    }
    await new Promise(requestAnimationFrame)
  }
}
function onAnchorClick(event: MouseEvent): void {
  const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]')
  const id = anchor?.getAttribute('href')?.slice(1)
  if (!id) return
  event.preventDefault()
  eagerAll.value = true
  void scrollToAnchorWhenReady(id)
}
onMounted(() => {
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (!id) return
  eagerAll.value = true
  const stop = watch(heroActive, active => {
    if (!active) return
    stop()
    void scrollToAnchorWhenReady(id)
  }, { immediate: true })
})
</script>

<style scoped>
.about-page { --ab-bg:#0c0d0f; --ab-ink:#f2f1ec; --ab-soft:#a4a6ad; --ab-dim:#6d717b; --ab-line:#32353b; --ab-accent:#8397ff; position:relative; min-height:100vh; background:var(--ab-bg); color:var(--ab-ink); font-family:inherit; overflow-x:clip; }
.about-body { width:100%; }
.about-page :deep(.identity-scene) { width:min(1312px,90%); margin-inline:auto; }
.about-reading { width:min(1312px,90%); margin:0 auto; padding:90px 0 140px; }
.about-section-word { margin:0 0 80px; font-family:'Arial Black','Helvetica Neue',Arial,sans-serif; font-size:clamp(48px,9.7vw,150px); font-weight:900; line-height:.9; letter-spacing:-.075em; color:var(--ab-accent); }
.about-process { padding-top:10px; padding-bottom:160px; }
.about-page :deep(.exp-section__head),.about-page :deep(.aiw__header) { border-top:1px solid var(--ab-line); padding-top:32px; }
.about-page :deep(.exp-node__company) { font-weight:600; }
.about-page :deep(.aiw__workspace) { background:#17191e; }
.about-page :deep(.aiw__tools .is-light-logo) { filter:none; }
.about-page :deep(.end) { margin-top:0; }
@media(max-width:760px) { .about-reading { width:calc(100% - 44px); padding:64px 0 80px; }.about-page :deep(.identity-scene) { width:calc(100% - 44px); }.about-section-word { margin-bottom:48px; font-size:10.5vw; }.about-process { padding-top:10px; } }
</style>

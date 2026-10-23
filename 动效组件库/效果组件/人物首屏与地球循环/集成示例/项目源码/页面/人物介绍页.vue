<template>
  <!-- 滚动叙事与完整履历共用原有资料；各场景独立清理动画。 -->
  <div class="about-page">
    <AboutMotionHero :active="heroActive" />
    <AboutScrollChapter name="identity" heading="WHO I AM" :label="{ zh: '关于我', en: 'A little about me' }"
      :lines="{ zh: ['把想法做成影像', '让内容被看见'], en: ['From ideas to images.', 'Making content seen.'] }" />
    <main class="about-body">
      <AboutIdentityScene v-model:active-tool="activeTool" :lang="lang" :active="heroActive" />
      <div class="about-reading">
        <p class="about-section-word" lang="en">IN PRACTICE.</p>
        <ExperienceTimeline :lang="lang" />
      </div>
      <AboutScrollChapter name="process" heading="HOW I WORK" size="12.2vw" :label="ABOUT_DIVIDERS.process.label"
        :lines="{ zh: ['工具参与过程', '判断留在自己手里'], en: ['Tools support the process.', 'Judgment stays with me.'] }" />
      <div class="about-reading about-process"><AiWorkflow v-model:active-tool="activeTool" :lang="lang" /></div>
      <AboutObservationRail :lang="lang" @open="onOpenVisual" />
      <ContactEnd :lang="lang" />
    </main>
    <VisualViewer v-if="viewerItem" :item="viewerItem" :lang="lang" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
/**
 * /about 人物专题入口：事实内容来自 data，版式与动效分别封装在 about 子组件中。
 * 本页只协调转场放行、头像与工作流共享的 AI 工具选择，以及统一图片查看器。
 */
import { computed, onBeforeUnmount, provide, ref } from 'vue'
import { referenceIntroductionGate } from '../组件/引导文字状态'
import AboutMotionHero from '../组件/人物与作品/人物动态首屏.vue'
import AboutScrollChapter from '../组件/人物与作品/人物滚动章节.vue'
import AboutIdentityScene from '../组件/人物与作品/人物身份场景.vue'
import AboutObservationRail from '../组件/人物与作品/人物观察轨道.vue'
import ExperienceTimeline from '../组件/人物与作品/经历时间线.vue'
import AiWorkflow from '../组件/人物与作品/智能创作流程.vue'
import ContactEnd from '../组件/人物与作品/结尾联系球.vue'
import VisualViewer from '../组件/人物与作品/完整作品查看器.vue'
import { WORKS, assertParity } from '../数据/人物资料'
import { ABOUT_DIVIDERS } from '../数据/人物页分隔资料'
import { assertVisuals, type VisualAsset } from '../数据/视觉作品资料'
import { subpageLanguage as lang } from '../组合函数/子页语言状态'
import { useVisualViewer } from '../组合函数/作品查看器控制'
import { ABOUT_PAGE_ID, isTransitioning, jumpTarget, markSubpageVisit, overlayActive } from '../组合函数/应用转场状态'
import { routeCurtainBlocked } from '../组合函数/页面幕布控制'

if (import.meta.env.DEV) {
  assertParity()
  assertVisuals(WORKS.map(work => work.id))
}
// 查看器保存触发元素以便关闭后恢复焦点；路由卸载必须同步 reset，避免回滚新页面位置。
const { active: viewerItem, open: openViewer, close: closeViewer, reset: resetViewer } = useVisualViewer()
function onOpenVisual(item: VisualAsset, trigger: HTMLElement) { openViewer(item, trigger) }
onBeforeUnmount(resetViewer)
markSubpageVisit(ABOUT_PAGE_ID)
// blocked 在全局幕布开始揭开时解除；不等幕布彻底离场，首屏文字才能接上转场节奏。
const heroActive = computed(() => !routeCurtainBlocked.value && !jumpTarget.value && !overlayActive.value && !isTransitioning.value)
provide(referenceIntroductionGate, heroActive)
const activeTool = ref('kimi')
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

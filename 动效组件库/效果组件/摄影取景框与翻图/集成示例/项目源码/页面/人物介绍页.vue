<template>
  <div class="about-page" @click="onAnchorClick">
    <AboutSideRail :lang="lang" />
    <AboutMotionHero :active="heroActive" :lang="lang" />
    <main>
      <AboutQuoteScene :lang="lang" />
      <AboutWordZoom
        id="identity-zoom"
        :lang="lang"
        :word="{ zh: '我是谁', en: 'WHO I AM' }"
        :label="{ zh: '', en: '' }"
        :focus-index="lang === 'zh' ? 1 : 6"
        :refresh-priority="44"
      />
      <AboutWordMarquee :lang="lang" />
      <AboutStudioStory :lang="lang" @open="onOpenVisual" />
      <AboutIndustries :lang="lang" />
      <LazySection ref="contactSection" min-height="100vh" :eager="eagerAll"
        ><StudioContact :lang="lang"
      /></LazySection>
    </main>
    <VisualViewer v-if="viewerItem" :item="viewerItem" :lang="lang" @close="closeViewer" />
  </div>
</template>

<script setup lang="ts">
/**
 * /about 人物专题入口：事实内容来自 data，版式与动效分别封装在 about 子组件中。
 * 本页协调转场放行、章节锚点、横向履历定位与统一图片查看器。
 * 首屏以下的重区块经 LazySection 提前一屏加载：锚点跳转（含刷新带 hash 进入）
 * 会立即转急载并在挂载后定位，正常浏览仍按需加载。
 */
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  provide,
  ref,
} from 'vue'
import { useAboutScrollPreparation } from '../组合函数/人物页滚动准备'
import { referenceIntroductionGate } from '../组件/引导文字状态'
import AboutMotionHero from '../组件/人物与作品/人物动态首屏.vue'
import AboutIndustries from '../组件/人物与作品/实践场景.vue'
import AboutStudioStory from '../组件/人物与作品/工作室故事.vue'
import AboutSideRail from '../组件/人物与作品/竖排章节导航.vue'
import AboutQuoteScene from '../组件/人物与作品/人物引言场景.vue'
import AboutWordMarquee from '../组件/人物与作品/方向词双向跑马灯.vue'
import AboutWordZoom from '../组件/人物与作品/字形越界放大.vue'
import LazySection from '../组件/延迟挂载区块.vue'
// 首屏以下重区块拆成独立 chunk，随 LazySection 按需加载；查看器打开时才加载。
const StudioContact = defineAsyncComponent(() => import('../组件/人物与作品/工作室联系.vue'))
const VisualViewer = defineAsyncComponent(() => import('../组件/人物与作品/完整作品查看器.vue'))
import { WORKS, assertParity } from '../数据/人物资料'
import { assertVisuals, type VisualAsset } from '../数据/视觉作品资料'
import { subpageLanguage as lang } from '../组合函数/子页语言状态'
import { useVisualViewer } from '../组合函数/作品查看器控制'
import {
  ABOUT_PAGE_ID,
  isTransitioning,
  jumpTarget,
  markSubpageVisit,
} from '../组合函数/应用转场状态'
import { routeCurtainBlocked } from '../组合函数/页面幕布控制'

if (import.meta.env.DEV) {
  assertParity()
  assertVisuals(WORKS.map((work) => work.id))
}
// 查看器保存触发元素以便关闭后恢复焦点；路由卸载必须同步 reset，避免回滚新页面位置。
const {
  active: viewerItem,
  open: openViewer,
  close: closeViewer,
  reset: resetViewer,
} = useVisualViewer()
function onOpenVisual(item: VisualAsset, trigger: HTMLElement): void {
  openViewer(item, trigger)
}
onBeforeUnmount(resetViewer)
markSubpageVisit(ABOUT_PAGE_ID)
// blocked 在全局幕布开始揭开时解除；不等幕布彻底离场，首屏文字才能接上转场节奏。
const heroActive = computed(
  () => !routeCurtainBlocked.value && !jumpTarget.value && !isTransitioning.value,
)
provide(referenceIntroductionGate, heroActive)
const contactSection = ref<InstanceType<typeof LazySection> | null>(null)
const { eagerAll, onAnchorClick } = useAboutScrollPreparation([contactSection])

</script>

<style scoped>
@font-face {
  font-family: 'About Archivo';
  src: url('/fonts/about/archivo-latin-variable.woff2') format('woff2');
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
.about-page {
  --display-font: 'About Archivo', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --about-night: #12140f;
  --about-paper: #efe9dc;
  --about-on-night: #efe9dc;
  --about-ink-on-paper: #1b1c18;
  --about-soft-on-paper: #6b665a;
  --about-soft-on-night: #b7b0a0;
  --about-line-on-paper: #1b1c1822;
  --about-line-on-night: #efe9dc22;
  --about-accent-on-paper: #4e5d3a;
  --about-accent-on-night: #c6d2ae;
  --about-sand: #c9b79c;
  --ab-bg: var(--about-night);
  --ab-ink: var(--about-on-night);
  --ab-paper: var(--about-paper);
  --ab-soft: var(--about-soft-on-night);
  --ab-dim: var(--about-soft-on-night);
  --ab-line: var(--about-line-on-night);
  --ab-accent: var(--about-accent-on-night);
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  background: var(--ab-bg);
  color: var(--ab-ink);
  font-family: 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
@media (min-width: 981px) and (min-height: 620px) {
  .about-page {
    padding-left: 48px;
  }
}
.about-page :deep(.quote-scene__content) {
  width: min(84%, 1200px);
  margin-inline: auto;
}
.about-page :deep(.word-zoom__caption) {
  display: none;
}
</style>

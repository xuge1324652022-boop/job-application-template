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
import { useAboutScrollPreparation } from '../composables/useAboutScrollPreparation'
import { referenceIntroductionGate } from '../components/ReferenceIntroduction'
import AboutMotionHero from '../components/about/AboutMotionHero.vue'
import AboutIndustries from '../components/about/AboutIndustries.vue'
import AboutStudioStory from '../components/about/AboutStudioStory.vue'
import AboutSideRail from '../components/about/AboutSideRail.vue'
import AboutQuoteScene from '../components/about/AboutQuoteScene.vue'
import AboutWordMarquee from '../components/about/AboutWordMarquee.vue'
import AboutWordZoom from '../components/about/AboutWordZoom.vue'
import LazySection from '../components/LazySection.vue'
// 首屏以下重区块拆成独立 chunk，随 LazySection 按需加载；查看器打开时才加载。
const StudioContact = defineAsyncComponent(() => import('../components/about/AboutStudioContact.vue'))
const VisualViewer = defineAsyncComponent(() => import('../components/about/VisualViewer.vue'))
import { WORKS, assertParity } from '../data/aboutProfile'
import { assertVisuals, type VisualAsset } from '../data/visualPortfolio'
import { subpageLanguage as lang } from '../composables/useSubpageLanguage'
import { useVisualViewer } from '../composables/useVisualViewer'
import {
  ABOUT_PAGE_ID,
  isTransitioning,
  jumpTarget,
  markSubpageVisit,
} from '../composables/useTransition'
import { routeCurtainBlocked } from '../composables/usePageCurtain'

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

<template>
  <!-- 滚动叙事与完整履历共用原有资料；各场景独立清理动画。首屏以下区块延迟挂载。 -->
  <div class="about-page" @click="onAnchorClick">
    <AboutSideRail :lang="lang" />
    <AboutMotionHero :active="heroActive" :lang="lang" />
    <!-- 开场连续叙事：人物主张大字 + WHO I AM 巨字出屏 → 方向词双向跑马灯 → 拼贴横向叙事。 -->
    <AboutQuoteScene :lang="lang" />
    <AboutWordMarquee :lang="lang" />
    <AboutCollageStage :lang="lang" @open="onOpenVisual" />
    <AboutWordZoom
      :lang="lang"
      :word="{ zh: '表达', en: 'CREATE' }"
      :label="{ zh: '把想法变成看得见的表达', en: 'Turning ideas into something you can see' }"
      :background-src="aboutQuotePortrait.src"
      :background-srcset="visualImageSources(aboutQuotePortrait)"
    />
    <AboutScrollChapter
      name="identity"
      heading="WHO I AM"
      paper
      :lang="lang"
      :label="{ zh: '关于我', en: 'A little about me' }"
      :lines="{
        zh: [
          '把想法整理成清晰的表达',
          '在版面与色彩之间做取舍',
          '让工具参与过程，判断留在自己手里',
        ],
        en: [
          'Shape ideas into clear communication.',
          'Weigh layout against colour.',
          'Let tools support the process and keep judgment with me.',
        ],
      }"
    />
    <main class="about-body">
      <AboutIdentityScene v-model:active-tool="activeTool" :lang="lang" :active="heroActive" />
      <div class="about-reading">
        <p class="about-section-word" lang="en">IN PRACTICE.</p>
        <LazySection ref="experienceSection" min-height="190vh" :eager="eagerAll"
          ><ExperienceTimeline :lang="lang"
        /></LazySection>
      </div>
      <AboutScrollChapter
        name="process"
        heading="HOW I WORK"
        size="12.2vw"
        bleed
        :lang="lang"
        :marquee="processTags"
        :label="ABOUT_DIVIDERS.process.label"
        :lead="{
          zh: ['工具参与过程', '判断留在自己手里'],
          en: ['Tools support the process.', 'Judgment stays with me.'],
        }"
        :lines="{
          zh: ['从需求与脚本', '到分镜、画面与交付'],
          en: ['From brief and script', 'to storyboard, image and delivery.'],
        }"
      />
      <div class="about-reading about-process">
        <LazySection ref="workflowSection" min-height="150vh" :eager="eagerAll"
          ><AiWorkflow v-model:active-tool="activeTool" :lang="lang"
        /></LazySection>
      </div>
      <LazySection ref="observationSection" min-height="110vh" :eager="eagerAll"
        ><AboutObservationRail :lang="lang" @open="onOpenVisual"
      /></LazySection>
      <LazySection ref="contactSection" min-height="95vh" :eager="eagerAll"
        ><ContactEnd :lang="lang"
      /></LazySection>
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
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
} from 'vue'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onBeforeRouteLeave, useRouter, type RouterScrollBehavior } from 'vue-router'
import { registerRouteScrollPreparation } from '../工具/路由滚动准备'
import { referenceIntroductionGate } from '../组件/引导文字状态'
import AboutMotionHero from '../组件/人物与作品/人物动态首屏.vue'
import AboutSideRail from '../组件/人物与作品/竖排章节导航.vue'
import AboutCollageStage from '../组件/人物与作品/简介拼贴场景.vue'
import AboutQuoteScene from '../组件/人物与作品/人物引言场景.vue'
import AboutWordMarquee from '../组件/人物与作品/方向词双向跑马灯.vue'
import AboutWordZoom from '../组件/人物与作品/字形越界放大.vue'
import { aboutQuotePortrait } from '../数据/本机个人内容接口'
import { visualImageSources } from '../工具/响应式图片'
import AboutScrollChapter from '../组件/人物与作品/人物滚动章节.vue'
import AboutIdentityScene from '../组件/人物与作品/人物身份场景.vue'
import LazySection from '../组件/延迟挂载区块.vue'
// 首屏以下重区块拆成独立 chunk，随 LazySection 按需加载；查看器打开时才加载。
const ExperienceTimeline = defineAsyncComponent(
  () => import('../组件/人物与作品/经历时间线.vue'),
)
const AiWorkflow = defineAsyncComponent(() => import('../组件/人物与作品/智能创作流程.vue'))
const AboutObservationRail = defineAsyncComponent(
  () => import('../组件/人物与作品/人物观察轨道.vue'),
)
const ContactEnd = defineAsyncComponent(() => import('../组件/人物与作品/结尾联系球.vue'))
const VisualViewer = defineAsyncComponent(() => import('../组件/人物与作品/完整作品查看器.vue'))
import { RESUME_SKILLS, WORKS, assertParity, type Bi } from '../数据/人物资料'
import { ABOUT_DIVIDERS } from '../数据/人物页分隔资料'
import { assertVisuals, type VisualAsset } from '../数据/视觉作品资料'
import { subpageLanguage as lang } from '../组合函数/子页语言状态'
import { useVisualViewer } from '../组合函数/作品查看器控制'
import {
  ABOUT_PAGE_ID,
  isTransitioning,
  jumpTarget,
  markSubpageVisit,
  overlayActive,
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
  () =>
    !routeCurtainBlocked.value &&
    !jumpTarget.value &&
    !overlayActive.value &&
    !isTransitioning.value,
)
provide(referenceIntroductionGate, heroActive)
const activeTool = ref('kimi')
// 过程章标签跑马灯词条：技能组标题加作品标签去重，全部来自现有示例资料。
const seenTags = new Set<string>()
const processTags: Bi[] = [...RESUME_SKILLS.map(skill => skill.title)]
for (const work of WORKS) {
  for (const tag of work.tags) {
    if (seenTags.has(tag.zh)) continue
    seenTags.add(tag.zh)
    processTags.push(tag)
  }
}
const aboutRouter = useRouter()

// 正常阅读继续按需加载。锚点和历史恢复等待真实组件、字体及固定舞台落位，
// 再把坐标交还原有 scrollBehavior；每次等待都有唯一所有者与取消信号。
const eagerAll = ref(false)
const experienceSection = ref<InstanceType<typeof LazySection> | null>(null)
const workflowSection = ref<InstanceType<typeof LazySection> | null>(null)
const observationSection = ref<InstanceType<typeof LazySection> | null>(null)
const contactSection = ref<InstanceType<typeof LazySection> | null>(null)
let scrollRequest: AbortController | undefined
let disposed = false

function cancelScrollRequest(): void {
  scrollRequest?.abort()
  scrollRequest = undefined
}

function abortable<T>(work: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Scroll request cancelled', 'AbortError'))
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
    Promise.resolve(work).then(
      (value) => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
  })
}

function nextFrame(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Scroll request cancelled', 'AbortError'))
      return
    }
    const frame = requestAnimationFrame(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    })
    const abort = () => {
      cancelAnimationFrame(frame)
      reject(new DOMException('Scroll request cancelled', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

function waitForCurtain(signal: AbortSignal): Promise<void> {
  // Seek while the curtain is revealing, before the page accepts input.
  // Waiting for its full exit exposes the old coordinate for a visible frame.
  if (!routeCurtainBlocked.value) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const stop = watch(routeCurtainBlocked, (active) => {
      if (active) return
      stop()
      signal.removeEventListener('abort', abort)
      resolve()
    })
    const abort = () => {
      stop()
      reject(new DOMException('Scroll request cancelled', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
}

async function prepareScroll(
  hash: string,
  saved: Parameters<RouterScrollBehavior>[2],
): Promise<boolean> {
  cancelScrollRequest()
  let validHash = false
  try {
    validHash = !!decodeURIComponent(hash.slice(1))
  } catch {
    /* The router safely handles malformed hashes. */
  }
  if (!saved && !validHash) return true
  const request = new AbortController()
  scrollRequest = request
  const { signal } = request
  try {
    eagerAll.value = true
    await nextTick()
    await abortable(
      Promise.all(
        [experienceSection, workflowSection, observationSection, contactSection].map((section) =>
          section.value?.ensureReady(),
        ),
      ),
      signal,
    )
    await abortable(document.fonts.ready, signal)
    await waitForCurtain(signal)
    // Mounted children schedule their motion work in the shared layout queue.
    // Two paint boundaries let that work commit; one final refresh measures all
    // upstream pins before the router applies the requested coordinate once.
    await nextFrame(signal)
    await nextFrame(signal)
    if (disposed || signal.aborted) return false
    ScrollTrigger.refresh()
    return true
  } catch (error) {
    if (signal.aborted || disposed) return false
    throw error
  } finally {
    if (scrollRequest === request) scrollRequest = undefined
  }
}
const unregisterScrollPreparation = registerRouteScrollPreparation('/about', prepareScroll)
onBeforeRouteLeave(cancelScrollRequest)

function onAnchorClick(event: MouseEvent): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  const anchor =
    event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
  if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self'))
    return
  const hash = anchor.getAttribute('href')
  if (!hash || hash === '#') return
  event.preventDefault()
  const route = aboutRouter.currentRoute.value
  void aboutRouter.push({ path: route.path, query: route.query, hash })
}

function onManualKey(event: KeyboardEvent): void {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key))
    cancelScrollRequest()
}
onMounted(() => {
  window.addEventListener('wheel', cancelScrollRequest, { passive: true })
  window.addEventListener('touchstart', cancelScrollRequest, { passive: true })
  window.addEventListener('pointerdown', cancelScrollRequest, { passive: true })
  window.addEventListener('keydown', onManualKey)
})
onBeforeUnmount(() => {
  disposed = true
  cancelScrollRequest()
  unregisterScrollPreparation()
  window.removeEventListener('wheel', cancelScrollRequest)
  window.removeEventListener('touchstart', cancelScrollRequest)
  window.removeEventListener('pointerdown', cancelScrollRequest)
  window.removeEventListener('keydown', onManualKey)
})
</script>

<style scoped>
.about-page {
  --ab-bg: #050505;
  --ab-ink: #ffe8ce;
  --ab-paper: #ffe8ce;
  --ab-soft: #b9ab97;
  --ab-dim: #8a7d6c;
  --ab-line: #2e2a24;
  --ab-accent: #ef4b40;
  position: relative;
  min-height: 100vh;
  background: var(--ab-bg);
  color: var(--ab-ink);
  font-family: inherit;
  overflow-x: clip;
}
.about-body {
  width: 100%;
}
.about-page :deep(.identity-scene) {
  width: min(1312px, 90%);
  margin-inline: auto;
}
.about-reading {
  width: min(1312px, 90%);
  margin: 0 auto;
  padding: 90px 0 140px;
}
.about-section-word {
  margin: 0 0 80px;
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: clamp(48px, 9.7vw, 150px);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.075em;
  color: var(--ab-accent);
}
.about-process {
  padding-top: 10px;
  padding-bottom: 160px;
}
.about-page :deep(.exp-section__head),
.about-page :deep(.aiw__header) {
  border-top: 1px solid var(--ab-line);
  padding-top: 32px;
}
.about-page :deep(.exp-node__company) {
  font-weight: 600;
}
.about-page :deep(.aiw__workspace) {
  background: #17191e;
}
.about-page :deep(.aiw__tools .is-light-logo) {
  filter: none;
}
.about-page :deep(.end) {
  margin-top: 0;
}
@media (max-width: 760px) {
  .about-reading {
    width: calc(100% - 44px);
    padding: 64px 0 80px;
  }
  .about-page :deep(.identity-scene) {
    width: calc(100% - 44px);
  }
  .about-section-word {
    margin-bottom: 48px;
    font-size: 10.5vw;
  }
  .about-process {
    padding-top: 10px;
  }
}
</style>

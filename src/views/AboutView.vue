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
        :background-src="aboutQuotePortrait.src"
        :background-srcset="visualImageSources(aboutQuotePortrait)"
      />
      <AboutWordMarquee :lang="lang" />
      <AboutStudioStory :lang="lang" @open="onOpenVisual" />
      <LazySection ref="contactSection" min-height="100vh" :eager="eagerAll"
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
import { registerRouteScrollPreparation } from '../utils/routeScrollPreparation'
import { referenceIntroductionGate } from '../components/ReferenceIntroduction'
import AboutMotionHero from '../components/about/AboutMotionHero.vue'
import AboutStudioStory from '../components/about/AboutStudioStory.vue'
import AboutSideRail from '../components/about/AboutSideRail.vue'
import AboutQuoteScene from '../components/about/AboutQuoteScene.vue'
import AboutWordMarquee from '../components/about/AboutWordMarquee.vue'
import AboutWordZoom from '../components/about/AboutWordZoom.vue'
import { aboutQuotePortrait } from '../data/personalPortfolio'
import { visualImageSources } from '../utils/responsiveImage'
import LazySection from '../components/LazySection.vue'
// 首屏以下重区块拆成独立 chunk，随 LazySection 按需加载；查看器打开时才加载。
const ContactEnd = defineAsyncComponent(() => import('../components/about/ContactEnd.vue'))
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
  overlayActive,
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
  () =>
    !routeCurtainBlocked.value &&
    !jumpTarget.value &&
    !overlayActive.value &&
    !isTransitioning.value,
)
provide(referenceIntroductionGate, heroActive)
const aboutRouter = useRouter()

// 正常阅读继续按需加载。锚点和历史恢复等待真实组件、字体及固定舞台落位，
// 再把坐标交还原有 scrollBehavior；每次等待都有唯一所有者与取消信号。
const eagerAll = ref(false)
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
      Promise.all([contactSection].map((section) => section.value?.ensureReady())),
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
  --ab-bg: #0a0a0a;
  --ab-ink: #fee9ce;
  --ab-paper: #fee9ce;
  --ab-soft: #c2b29f;
  --ab-dim: #766d60;
  --ab-line: #fee9ce22;
  --ab-accent: #ef5143;
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
.about-page :deep(.end) {
  width: 100%;
  margin: 0;
  background: #0a0a0a;
  --ab-ink: #fee9ce;
  --ab-soft: #c2b29f;
  --ab-line: #fee9ce33;
}
.about-page :deep(.end__curve) {
  display: none;
}
.about-page :deep(.end__inner) {
  padding: 10vw 6vw 32px;
}
.about-page :deep(.end__head h2) {
  font-size: clamp(56px, 10vw, 180px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.055em;
}
.about-page :deep(.end__title-line) {
  color: #fee9ce;
}
.about-page :deep(.end__title-line img) {
  display: none;
}
.about-page :deep(.end__orb) {
  background: #ffb15f;
  color: #0a0a0a;
}
.about-page :deep(.end__orb-fill) {
  background: #ef5143;
}
.about-page :deep(.end__head small) {
  color: #fee9ce;
}
@media (max-width: 760px) {
  .about-page :deep(.end__inner) {
    padding-top: 100px;
  }
}
</style>

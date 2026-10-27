<template>
  <!--
    桌面端左侧竖排章节导航（参照原站 wonjyou.studio/about 的常驻侧栏）：
    罗马数字索引随滚动高亮当前章节，底部奶油色块直达联系区。
    窄屏与矮视口隐藏，减弱动效偏好下保留纯导航；锚点跳转沿用页面级处理。
  -->
  <nav
    ref="rail"
    class="about-rail"
    :class="{ 'is-paper': activeIndex >= 2 && chapters[activeIndex]?.id !== 'contact' }"
    :aria-label="lang === 'zh' ? '关于页章节导航' : 'About sections'"
  >
    <RouterLink
      to="/"
      class="about-rail__home"
      :aria-label="lang === 'zh' ? '返回首页' : 'Back to home'"
      ><span class="about-rail__mark" aria-hidden="true">Q</span></RouterLink
    >
    <ol class="about-rail__chapters">
      <li v-for="(chapter, index) in chapters" :key="chapter.id">
        <a
          :href="`#${chapter.id}`"
          :aria-label="`${chapter.numeral} ${lang === 'zh' ? chapter.zh : chapter.en}`"
          class="about-rail__chapter"
          :class="{ 'is-active': index === activeIndex }"
          :aria-current="index === activeIndex ? 'true' : undefined"
        >
          <span class="about-rail__progress" aria-hidden="true"></span>
          <span class="about-rail__numeral" lang="en">{{ chapter.numeral }}</span>
          <span class="about-rail__word">{{ lang === 'zh' ? chapter.zh : chapter.en }}</span>
        </a>
      </li>
    </ol>
    <a class="about-rail__connect" href="#contact">
      <span class="about-rail__connect-text">{{
        lang === 'zh' ? '保持联络' : "LET'S CONNECT"
      }}</span>
      <span class="about-rail__connect-arrow" aria-hidden="true">↗</span>
    </a>
  </nav>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { INDUSTRIES, type Lang } from '../../数据/人物资料'
import { requestMotionLayoutRefresh } from '../../工具/动效布局调度'

/**
 * 章节锚点与页面场景一一对应：开场巨字、人物主张、方向词带、
 * 拼贴叙事、实践履历、工作方式与联系区。锚点元素由各场景自带 id 提供。
 */
const chapters = [
  { numeral: 'I.', id: 'about-intro', zh: '开场', en: 'INTRO' },
  { numeral: 'II.', id: 'voice', zh: '关于我', en: 'ABOUT' },
  { numeral: 'III.', id: 'experience-reveal', zh: '经历', en: 'WORK' },
  { numeral: 'IV.', id: 'achievements', zh: '作品成果', en: 'PROJECTS' },
  { numeral: 'V.', id: 'process', zh: '创作方向', en: 'PRACTICE' },
  { numeral: 'VI.', id: 'recognition', zh: '个人背景', en: 'PROFILE' },
  ...(INDUSTRIES.length
    ? [{ numeral: 'VII.', id: 'industries', zh: '实践场景', en: 'FIELDS' }]
    : []),
  { numeral: INDUSTRIES.length ? 'VIII.' : 'VII.', id: 'contact', zh: '联系', en: 'CONTACT' },
] as const

defineProps<{ lang: Lang }>()
const rail = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
type ChapterId = (typeof chapters)[number]['id']
const triggers = new Map<ChapterId, { target: HTMLElement; trigger: ScrollTrigger }>()
const chapterSelector = chapters.map((chapter) => `#${chapter.id}`).join(',')
let observer: MutationObserver | undefined
let reconcileFrame = 0
let cancelRefresh: (() => void) | undefined
let disposed = false
gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  const page = rail.value?.closest<HTMLElement>('.about-page')
  if (!page) return
  // 延迟挂载的联系区稍后才有真实节点；按锚点与元素身份补建，已有章节不重建。
  const reconcile = () => {
    reconcileFrame = 0
    if (disposed) return
    let changed = false
    chapters.forEach((chapter, index) => {
      const target = page.querySelector<HTMLElement>(`#${chapter.id}`)
      const previous = triggers.get(chapter.id)
      if (previous?.target === target) return
      if (previous) {
        previous.trigger.kill()
        triggers.delete(chapter.id)
        changed = true
      }
      if (!target) return
      const trigger = ScrollTrigger.create({
        id: `about-rail-${chapter.id}`,
        trigger: target,
        start: 'top 55%',
        // 章节高亮覆盖直到下一章节，包含两段锚点之间的图带和完整履历。
        end: () => {
          const nextId = chapters[index + 1]?.id
          const next = nextId ? page.querySelector<HTMLElement>(`#${nextId}`) : null
          return next
            ? window.scrollY + next.getBoundingClientRect().top - innerHeight * 0.55
            : ScrollTrigger.maxScroll(window)
        },
        onUpdate: (self) => {
          rail.value
            ?.querySelectorAll<HTMLElement>('.about-rail__chapter')
            [index]?.style.setProperty('--rail-progress', String(self.progress))
          if (self.isActive) activeIndex.value = index
        },
        onToggle: (self) => {
          if (self.isActive) activeIndex.value = index
        },
        onRefresh: (self) => {
          rail.value
            ?.querySelectorAll<HTMLElement>('.about-rail__chapter')
            [index]?.style.setProperty('--rail-progress', String(self.progress))
          if (self.isActive) activeIndex.value = index
        },
      })
      triggers.set(chapter.id, { target, trigger })
      changed = true
    })
    if (changed) {
      cancelRefresh?.()
      cancelRefresh = requestMotionLayoutRefresh()
    }
  }
  reconcile()
  observer = new MutationObserver((records) => {
    if (disposed || reconcileFrame) return
    const chapterChanged = records.some((record) =>
      [...record.addedNodes, ...record.removedNodes].some(
        (node) =>
          node instanceof Element &&
          (node.matches(chapterSelector) || node.querySelector(chapterSelector)),
      ),
    )
    if (chapterChanged) reconcileFrame = requestAnimationFrame(reconcile)
  })
  observer.observe(page, { childList: true, subtree: true })
})

onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  if (reconcileFrame) cancelAnimationFrame(reconcileFrame)
  cancelRefresh?.()
  triggers.forEach(({ trigger }) => trigger.kill())
  triggers.clear()
})
</script>

<style scoped>
.about-rail {
  position: fixed;
  z-index: 40;
  inset: 0 auto 0 0;
  display: none;
  width: 48px;
  --rail-ink: var(--about-on-night);
  --rail-accent: var(--about-accent-on-night);
  --rail-line: var(--about-line-on-night);
  background: var(--about-night);
  color: var(--rail-ink);
  border-right: 1px solid var(--rail-line);
  flex-direction: column;
}
@media (min-width: 981px) and (min-height: 620px) {
  .about-rail {
    display: flex;
  }
}
.about-rail__home {
  height: 48px;
  flex: none;
  display: grid;
  place-items: center;
  border-bottom: 1px solid var(--rail-line);
  color: inherit;
}
.about-rail__home {
  text-decoration: none;
}
.about-rail__mark {
  font:
    700 18px/1 'Helvetica Neue',
    Arial,
    sans-serif;
  letter-spacing: -0.08em;
}
.about-rail__chapters {
  list-style: none;
  padding: 0;
  margin: 48px 0 0;
}
.about-rail__chapter {
  position: relative;
  width: 48px;
  min-height: 55px;
  height: 55px;
  flex-direction: column;
  box-sizing: border-box;
  padding: 4px 0;
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rail-ink);
  opacity: 0.7;
  border-bottom: 1px solid var(--rail-line);
  text-decoration: none;
  font-size: 10px;
  font-weight: 700;
  writing-mode: vertical-rl;
  transition: color 0.3s;
}
.about-rail__numeral {
  font-size: 10px;
}
.about-rail__word {
  display: block;
  font-size: 9px;
}
.about-rail__chapter.is-active,
.about-rail__chapter:hover {
  color: var(--rail-ink);
  opacity: 1;
  background: color-mix(in srgb, var(--rail-ink) 12%, transparent);
}
.about-rail__progress {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--rail-accent);
  transform: scaleY(var(--rail-progress, 0));
  transform-origin: top;
}
.about-rail__chapter.is-active .about-rail__word {
  display: inline;
}

.about-rail__connect {
  margin-top: auto;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: var(--about-sand);
  color: var(--about-ink-on-paper);
  text-decoration: none;
  writing-mode: vertical-rl;
  font-size: 10px;
  font-weight: 700;
}
.about-rail__connect:hover {
  background: var(--about-on-night);
}
a:focus-visible {
  outline: 2px solid var(--rail-accent);
  outline-offset: -3px;
}
@media (prefers-reduced-motion: reduce) {
  .about-rail__chapter {
    transition: none;
  }
}
.about-rail.is-paper {
  --rail-ink: var(--about-ink-on-paper);
  --rail-accent: var(--about-accent-on-paper);
  --rail-line: var(--about-line-on-paper);
  background: var(--about-on-night);
}
/* Match the extracted full-screen internship stage, including reverse scroll. */
:global(.about-page:has(.internship-story[data-night='true']) .about-rail.is-paper) {
  --rail-ink: var(--about-on-night);
  --rail-accent: var(--about-accent-on-night);
  --rail-line: var(--about-line-on-night);
  background: var(--about-night);
}
</style>

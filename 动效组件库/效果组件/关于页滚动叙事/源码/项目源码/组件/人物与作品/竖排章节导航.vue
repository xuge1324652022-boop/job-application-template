<template>
  <!--
    桌面端左侧竖排章节导航（参照原站 wonjyou.studio/about 的常驻侧栏）：
    罗马数字索引随滚动高亮当前章节，底部奶油色块直达联系区。
    窄屏与矮视口隐藏，减弱动效偏好下保留纯导航；锚点跳转沿用页面级处理。
  -->
  <nav
    ref="rail"
    class="about-rail"
    :aria-label="lang === 'zh' ? '关于页章节导航' : 'About sections'"
  >
    <a
      class="about-rail__home"
      href="#about-intro"
      :aria-label="lang === 'zh' ? '回到开场' : 'Back to intro'"
    >
      <span class="about-rail__burger" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="about-rail__initials" lang="en">{{ IDENTITY.initials }}</span>
    </a>
    <ol class="about-rail__chapters">
      <li v-for="(chapter, index) in chapters" :key="chapter.id">
        <a
          :href="`#${chapter.id}`"
          class="about-rail__chapter"
          :class="{ 'is-active': index === activeIndex }"
          :aria-current="index === activeIndex ? 'true' : undefined"
        >
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
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IDENTITY, type Lang } from '../../数据/人物资料'
import { requestMotionLayoutRefresh } from '../../工具/动效布局调度'

/**
 * 章节锚点与页面场景一一对应：开场巨字、人物主张、方向词带、
 * 拼贴叙事、实践履历、工作方式与联系区。锚点元素由各场景自带 id 提供。
 */
const chapters = [
  { numeral: 'I.', id: 'about-intro', zh: '开场', en: 'INTRO' },
  { numeral: 'II.', id: 'voice', zh: '主张', en: 'VOICE' },
  { numeral: 'III.', id: 'identity-words', zh: '方向', en: 'WORDS' },
  { numeral: 'IV.', id: 'stories', zh: '叙事', en: 'STORIES' },
  { numeral: 'V.', id: 'identity', zh: '实践', en: 'IN PRACTICE' },
  { numeral: 'VI.', id: 'process', zh: '方式', en: 'PROCESS' },
  { numeral: 'VII.', id: 'contact', zh: '联系', en: 'CONTACT' },
] as const

defineProps<{ lang: Lang }>()
const rail = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)
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
        end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) activeIndex.value = index
        },
        onRefresh: (self) => {
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
/* 仅在足够宽的桌面视口显示；与动效无关，减弱动效偏好下仍可用作纯导航。 */
.about-rail {
  position: fixed;
  z-index: 40;
  left: 0;
  top: 0;
  bottom: 0;
  display: none;
  width: 56px;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  background: var(--ab-bg);
  border-right: 1px solid var(--ab-line);
}
@media (min-width: 981px) and (min-height: 620px) {
  .about-rail {
    display: flex;
  }
}
.about-rail__home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 18px 0 14px;
  color: var(--ab-ink);
  text-decoration: none;
}
.about-rail__burger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 18px;
}
.about-rail__burger i {
  height: 2px;
  background: currentcolor;
}
.about-rail__initials {
  writing-mode: vertical-rl;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
}
.about-rail__chapters {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 10px 0;
  padding: 0;
  list-style: none;
}
.about-rail__chapter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 0;
  color: var(--ab-dim);
  text-decoration: none;
  transition: color 0.25s ease;
}
.about-rail__chapter:hover,
.about-rail__chapter.is-active {
  color: var(--ab-accent);
}
.about-rail__numeral {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.about-rail__word {
  writing-mode: vertical-rl;
  font-size: 9px;
  letter-spacing: 0.22em;
}
.about-rail__chapter.is-active .about-rail__word {
  padding: 6px 2px;
  background: var(--ab-accent);
  color: var(--ab-bg);
  border-radius: 999px;
}
.about-rail__connect {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 14px;
  padding: 16px 0;
  background: var(--ab-ink);
  color: var(--ab-bg);
  text-decoration: none;
  border-radius: 999px;
}
.about-rail__connect:hover {
  background: var(--ab-accent);
  color: var(--ab-ink);
}
.about-rail__connect-text {
  writing-mode: vertical-rl;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.26em;
}
.about-rail__connect-arrow {
  font-size: 12px;
}
</style>

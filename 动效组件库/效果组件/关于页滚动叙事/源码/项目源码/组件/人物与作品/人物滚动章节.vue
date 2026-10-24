<template>
  <section ref="root" class="scroll-chapter" :aria-labelledby="`${name}-chapter-title`">
    <div ref="stage" class="scroll-chapter__stage">
      <!-- 人物衬底（可选）：与暗色引言共用同一张人物图，让背景贯穿引言与折叠阅读。 -->
      <div v-if="backdrop" class="scroll-chapter__backdrop" aria-hidden="true">
        <img
          :src="aboutPortrait.src"
          :srcset="visualImageSources(aboutPortrait)"
          sizes="100vw"
          alt=""
          :width="aboutPortrait.width"
          :height="aboutPortrait.height"
          decoding="async"
          loading="lazy"
        />
      </div>
      <p class="scroll-chapter__caption">
        {{ label.zh }}<span lang="en">{{ label.en }}</span>
      </p>
      <div v-if="lead" class="scroll-chapter__lead-anchor">
        <div ref="leadCopy" class="scroll-chapter__lead">
          <p class="scroll-chapter__copy" lang="zh">
            <span v-for="(line, i) in lead.zh" :key="i" class="scroll-chapter__line">{{
              line
            }}</span>
          </p>
          <p class="scroll-chapter__translation" lang="en">
            <span v-for="(line, i) in lead.en" :key="i" class="scroll-chapter__line">{{
              line
            }}</span>
          </p>
        </div>
      </div>
      <div class="scroll-chapter__anchor">
        <div
          ref="title"
          class="scroll-chapter__title"
          :style="{ '--chapter-size': size ?? '14.6vw' }"
        >
          <h2 :id="`${name}-chapter-title`" class="scroll-chapter__accessible">{{ heading }}</h2>
          <span v-for="i in 3" :key="i" class="scroll-chapter__row" aria-hidden="true" lang="en">{{
            heading
          }}</span>
        </div>
      </div>
      <div ref="body" class="scroll-chapter__body">
        <p class="scroll-chapter__copy" lang="zh">
          <span v-for="(line, i) in lines.zh" :key="i" class="scroll-chapter__line">{{
            line
          }}</span>
        </p>
        <p class="scroll-chapter__translation" lang="en">
          <span v-for="(line, i) in lines.en" :key="i" class="scroll-chapter__line">{{
            line
          }}</span>
        </p>
      </div>
      <!-- 章节收尾的小人物卡：最后一行正文上移退出时从下方进入中央；倒滚退回。 -->
      <figure v-if="card" ref="cardEl" class="scroll-chapter__card" aria-hidden="true">
        <img
          :src="aboutPortrait.thumb"
          alt=""
          :width="aboutPortrait.width"
          :height="aboutPortrait.height"
          decoding="async"
          loading="lazy"
        />
      </figure>
      <span class="scroll-chapter__cue" aria-hidden="true">↓</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Bi } from '../../数据/人物资料'
import { aboutPortrait } from '../../数据/本机个人内容接口'
import { visualImageSources } from '../../工具/响应式图片'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'

interface ChapterCopy {
  zh: readonly string[]
  en: readonly string[]
}
const props = defineProps<{
  name: string
  heading: string
  label: Bi
  lead?: ChapterCopy
  lines: ChapterCopy
  size?: string
  card?: boolean
  backdrop?: boolean
}>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const leadCopy = ref<HTMLElement | null>(null)
const cardEl = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false
gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !title.value || !body.value) return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
      () => {
        const rows = gsap.utils.toArray<HTMLElement>('.scroll-chapter__row', title.value!)
        const chinese = body.value!.querySelectorAll('.scroll-chapter__copy .scroll-chapter__line')
        const english = body.value!.querySelectorAll(
          '.scroll-chapter__translation .scroll-chapter__line',
        )
        const range = document.createRange()
        range.selectNodeContents(rows[0]!)
        const widthPerPixel =
          range.getBoundingClientRect().width / parseFloat(getComputedStyle(title.value!).fontSize)
        // 正文退出距离：正文顶端在舞台中的布局位置 + 自身高度，末行出屏后再留 10% 视口余量。
        const bodyExit = () => {
          let top = 0
          let node: HTMLElement | null = body.value as HTMLElement
          while (node && node !== stage.value) {
            top += node.offsetTop
            node = node.offsetParent as HTMLElement | null
          }
          return top + body.value!.offsetHeight + innerHeight * 0.1
        }
        // Measure the untransformed text once. Later refreshes only use viewport
        // dimensions, so resizing mid-fold cannot measure a scaled-down title.
        const fitTitle = () =>
          root.value?.style.setProperty(
            '--chapter-fit',
            `${Math.floor(Math.min((innerWidth * 0.92) / widthPerPixel, innerHeight * 0.32))}px`,
          )
        fitTitle()
        // Each duplicate becomes one third of the final word. Moving the clips and
        // rows together produces a continuous fold instead of overlapping glyphs.
        const timeline = gsap.timeline({
          scrollTrigger: {
            id: `about-chapter-${props.name}`,
            trigger: root.value!,
            pin: stage.value!,
            start: 'top top',
            refreshPriority: props.name === 'identity' ? 30 : 20,
            end: () => `+=${Math.round(innerHeight * (props.lead ? 5 : 4.1))}`,
            scrub: 0.35,
            invalidateOnRefresh: true,
            onRefreshInit: fitTitle,
          },
        })
        const entry = props.lead ? 2.4 : 0
        if (leadCopy.value) {
          const leadChinese = leadCopy.value.querySelectorAll(
            '.scroll-chapter__copy .scroll-chapter__line',
          )
          const leadEnglish = leadCopy.value.querySelectorAll(
            '.scroll-chapter__translation .scroll-chapter__line',
          )
          timeline
            .fromTo(
              leadChinese,
              { color: '#6a5c4c' },
              { color: 'var(--ab-ink)', stagger: 0.3, duration: 1, ease: 'none' },
              0,
            )
            .fromTo(
              leadEnglish,
              { color: '#6a5c4c' },
              { color: '#cfc4b4', stagger: 0.3, duration: 1, ease: 'none' },
              0,
            )
            .fromTo(
              leadCopy.value,
              { y: 0, autoAlpha: 1 },
              { y: () => -innerHeight * 0.8, autoAlpha: 0, duration: 1.6, ease: 'none' },
              1.6,
            )
        }
        timeline
          .fromTo(
            rows,
            {
              x: (i) => innerWidth * [0.26, -0.28, 0.24][i]!,
              y: (i) => innerHeight * (1.05 + i * 0.18),
              yPercent: (i) => (i - 1) * 104,
              clipPath: 'inset(0% 0% 0% 0%)',
            },
            { x: 0, y: 0, duration: 1.8, stagger: 0.15, ease: 'power2.out' },
            entry,
          )
          .to(
            rows,
            {
              yPercent: 0,
              clipPath: (i) =>
                `inset(${Math.max(0, (i * 100) / 3 - 0.35)}% 0% ${Math.max(0, ((2 - i) * 100) / 3 - 0.35)}% 0%)`,
              duration: 1.4,
              ease: 'power2.inOut',
            },
            entry + 2.8,
          )
          .to(title.value!, { scale: 0.065, duration: 1.15, ease: 'power2.inOut' }, entry + 4.7)
          .to(
            title.value!,
            { y: () => -innerHeight * 0.34, duration: 1.3, ease: 'power1.inOut' },
            entry + 5.5,
          )
          .fromTo(
            body.value!,
            { y: () => innerHeight * 0.55, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 1.3, ease: 'power1.out' },
            entry + 5.65,
          )
          .fromTo(
            chinese,
            { color: '#6a5c4c' },
            { color: 'var(--ab-ink)', duration: 0.65, stagger: 0.2, ease: 'none' },
            entry + 6,
          )
          .fromTo(
            english,
            { color: '#6a5c4c' },
            { color: '#cfc4b4', duration: 0.65, stagger: 0.2, ease: 'none' },
            entry + 6,
          )
          // 正文点亮后继续上移离场：标题按固定视口倍数，正文按自身实际高度计算，
          // 确保末行完全退出后再交给小人物卡；小人物卡随最后一行退出升至中央。
          .to(
            [title.value!, body.value!],
            {
              y: (index: number) => (index === 0 ? -innerHeight * 1.06 : -bodyExit()),
              duration: 0.85,
              ease: 'power2.inOut',
            },
            entry + 6.95,
          )
        if (cardEl.value) {
          timeline.fromTo(
            cardEl.value,
            { yPercent: 128, xPercent: -50 },
            { yPercent: -50, autoAlpha: 1, duration: 0.6, ease: 'power2.out' },
            entry + 7.15,
          )
        }
        timeline.to({}, { duration: 0.3 })
        return () => root.value?.style.removeProperty('--chapter-fit')
      },
      root.value,
    )
    void document.fonts.ready.then(() => {
      if (!dead) cancelRefresh = requestMotionLayoutRefresh()
    })
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
.scroll-chapter {
  position: relative;
  background: var(--ab-bg);
}
.scroll-chapter__stage {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow: clip;
}
.scroll-chapter__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.scroll-chapter__backdrop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.12;
}
.scroll-chapter__backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgb(12 13 15 / 0.2), rgb(12 13 15 / 0.82));
}
.scroll-chapter__caption {
  position: absolute;
  z-index: 1;
  top: 38px;
  left: clamp(24px, 5vw, 88px);
  font-size: 12px;
  line-height: 1.5;
}
.scroll-chapter__caption span {
  display: block;
  margin-top: 4px;
  color: var(--ab-soft);
  font-size: 10px;
}
.scroll-chapter__anchor {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.scroll-chapter__title {
  position: relative;
  width: 100%;
  height: 0.86em;
  text-align: center;
  color: var(--ab-accent);
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--chapter-fit, var(--chapter-size));
  font-weight: 900;
  line-height: 0.86;
  letter-spacing: -0.075em;
  transform-origin: center;
}
.scroll-chapter__accessible {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.scroll-chapter__row {
  position: absolute;
  inset: 0;
  display: block;
  white-space: nowrap;
}
.scroll-chapter__lead-anchor {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.scroll-chapter__lead {
  width: min(780px, 68%);
}
.scroll-chapter__body {
  position: relative;
  width: min(900px, 76%);
  margin: 0 auto;
  padding: 34vh 0 12vh;
  padding-top: 34svh;
}
.scroll-chapter__copy,
.scroll-chapter__translation {
  margin: 0;
  text-align: center;
}
.scroll-chapter__copy {
  font-size: clamp(26px, 3.2vw, 48px);
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: -0.04em;
}
.scroll-chapter__translation {
  max-width: 36em;
  margin: 28px auto 0;
  color: var(--ab-soft);
  font-size: clamp(14px, 1.4vw, 20px);
  line-height: 1.65;
}
.scroll-chapter__line {
  display: block;
}
.scroll-chapter__card {
  position: absolute;
  left: 50%;
  top: 46%;
  width: clamp(140px, 13vw, 190px);
  margin: 0;
  aspect-ratio: 3/4;
  overflow: hidden;
  background: #221c15;
  visibility: hidden;
  opacity: 0;
}
.scroll-chapter__card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.scroll-chapter__cue {
  position: absolute;
  left: 50%;
  bottom: 28px;
  color: var(--ab-soft);
  font-size: 24px;
}
/* The unanimated layout is the complete, readable fallback. */
@media (max-width: 760px), (max-height: 649px), (prefers-reduced-motion: reduce) {
  .scroll-chapter__stage {
    min-height: 0;
    padding: 90px clamp(22px, 5vw, 80px) 70px;
  }
  .scroll-chapter__caption {
    position: static;
    margin: 0 0 44px;
  }
  .scroll-chapter__anchor {
    position: relative;
    display: block;
  }
  .scroll-chapter__lead-anchor {
    position: relative;
    display: block;
    margin-bottom: 70px;
  }
  .scroll-chapter__lead {
    width: min(780px, 100%);
    margin: auto;
  }
  .scroll-chapter__title {
    height: auto;
    min-height: 1em;
    font-size: clamp(36px, var(--chapter-size), 150px);
  }
  .scroll-chapter__row {
    position: relative;
    inset: auto;
  }
  .scroll-chapter__row ~ .scroll-chapter__row {
    display: none;
  }
  .scroll-chapter__body {
    width: min(780px, 100%);
    padding: 44px 0 0;
  }
  .scroll-chapter__copy {
    font-size: clamp(23px, 4vw, 38px);
  }
  .scroll-chapter__translation {
    font-size: 14px;
    margin-top: 22px;
  }
  .scroll-chapter__card {
    display: none;
  }
  .scroll-chapter__cue {
    display: none;
  }
}
</style>

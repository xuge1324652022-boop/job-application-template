<template>
  <section id="stories" ref="root" class="collage" aria-label="简介拼贴与横向图文叙事">
    <div ref="stage" class="collage__stage">
      <div ref="paper" class="collage__paper" aria-hidden="true"></div>

      <div ref="intro" class="collage__intro">
        <p class="collage__kicker">SELECTED WORK<span>作品速览</span></p>
        <h2>让想法，成为画面<span>Ideas, made visible.</span></h2>
        <p class="collage__lead">
          {{ PROFILE_LINES[0]?.zh }}<span lang="en">{{ PROFILE_LINES[0]?.en }}</span>
        </p>
      </div>

      <!-- 固定斜带只展示部分作品；键盘选择区保留全部作品，聚焦时显示在舞台内。 -->
      <nav
        class="collage__keyboard-index"
        :aria-label="lang === 'zh' ? '浏览全部作品' : 'Browse all works'"
      >
        <p>全部作品 <span lang="en">All works</span></p>
        <button
          v-for="entry in bandEntries"
          :key="entry.key"
          type="button"
          :data-work-id="entry.item.id"
          :aria-label="openLabel(entry.item)"
          @click="openImage(entry.item, $event)"
        >
          {{ pick(entry.item.title, lang) }}
        </button>
      </nav>

      <!-- 整条倾斜图片带：窗口裁切，滚轮驱动整带横移；带内保留主图占位。 -->
      <div class="collage__band-window">
        <div ref="band" class="collage__band">
          <button
            v-for="entry in bandEntries"
            :key="entry.key"
            type="button"
            class="collage__band-figure"
            :class="{ 'collage__band-figure--slot': entry.featured }"
            :data-work-id="entry.item.id"
            :style="{
              '--image-width': entry.width,
              aspectRatio: `${entry.item!.width} / ${entry.item!.height}`,
            }"
            :aria-label="entry.featured ? undefined : openLabel(entry.item)"
            :tabindex="entry.featured || desktopPinned ? -1 : 0"
            @click="entry.featured ? undefined : openImage(entry.item!, $event)"
          >
            <img
              v-if="!entry.featured"
              :src="entry.item!.src"
              :srcset="visualImageSources(entry.item!)"
              sizes="(max-width: 980px) 46vw, 24vw"
              :width="entry.item!.width"
              :height="entry.item!.height"
              :alt="pick(entry.item!.alt, lang)"
              loading="lazy"
              decoding="async"
              draggable="false"
              @load="scheduleRefresh"
            />
          </button>
        </div>
      </div>

      <!-- 独立浮动主图：与图片带、故事轨道同层舞台下，脱离后不再受带坐标限制。 -->
      <button
        ref="featured"
        type="button"
        class="collage__featured"
        :data-work-id="featuredItem.id"
        :aria-label="openLabel(featuredItem)"
        @click="openImage(featuredItem, $event)"
      >
        <img
          :src="featuredItem.src"
          :srcset="visualImageSources(featuredItem)"
          :sizes="featuredImageSizes"
          :width="featuredItem.width"
          :height="featuredItem.height"
          :alt="pick(featuredItem.alt, lang)"
          decoding="async"
          draggable="false"
          @load="scheduleRefresh"
        />
      </button>

      <!-- 横向图文轨道：主图飞入第一格后整轨左移。 -->
      <div ref="track" class="collage__track">
        <article v-for="panel in panels" :key="panel.key" class="collage__panel">
          <div
            v-if="panel.slot"
            class="collage__slot"
            :style="{
              aspectRatio: `${featuredItem.width} / ${featuredItem.height}`,
              '--featured-ratio': featuredItem.width / featuredItem.height,
            }"
            aria-hidden="true"
          ></div>
          <button
            v-else
            type="button"
            class="collage__panel-image"
            :aria-label="openLabel(panel.item!)"
            @click="openImage(panel.item!, $event)"
          >
            <img
              :src="panel.item!.src"
              :srcset="visualImageSources(panel.item!)"
              sizes="(max-width: 980px) 92vw, 44vw"
              :width="panel.item!.width"
              :height="panel.item!.height"
              :alt="pick(panel.item!.alt, lang)"
              loading="lazy"
              decoding="async"
              draggable="false"
              @load="scheduleRefresh"
            />
          </button>
          <div class="collage__note">
            <p class="collage__note-label">
              {{ panel.label }}<span>{{ panel.labelZh }}</span>
            </p>
            <h3>
              {{ panel.title }}<span lang="en">{{ panel.titleEn }}</span>
            </h3>
            <p class="collage__note-copy">
              {{ panel.copy }}<span lang="en">{{ panel.copyEn }}</span>
            </p>
            <a v-if="panel.href" class="collage__read" :href="panel.href"
              >{{ panel.href === '#beyond-work' ? '继续看个人摄影' : '阅读相关经历' }}
              <span lang="en">{{
                panel.href === '#beyond-work' ? 'Explore my photography ↗' : 'Read the experience ↗'
              }}</span></a
            >
          </div>
        </article>
      </div>

      <p ref="counter" class="collage__counter" aria-hidden="true">
        <span>{{ String(current + 1).padStart(2, '0') }}</span> /
        {{ String(panels.length).padStart(2, '0') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 简介拼贴 → 整带倾斜滑动 → 选图放大 → 横向图文叙事的连续固定场景。
 * 四层分离：奶油底纸(z0) → 倾斜图片带(z1，滚轮驱动整带横移) → 横向故事(z2) →
 * 独立浮动主图(z3)。主图初始按带内占位的旋转视觉位置摆放，滑动段与带同步位移，
 * 脱离时归正并等比覆盖视口（舞台裁切），再缩入故事第一格随轨左移；倒滚沿原路恢复。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROFILE_LINES, pick, type Lang } from '../../data/aboutProfile'
import { personalPortfolio } from '../../data/personalPortfolio'
import { editorial, photography, posters, type VisualAsset } from '../../data/visualPortfolio'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'

interface Panel {
  key: string
  slot?: boolean
  item?: VisualAsset
  label: string
  labelZh: string
  title: string
  titleEn: string
  copy: string
  copyEn: string
  href?: string
}

const props = defineProps<{ lang: Lang }>()
const emit = defineEmits<{ open: [item: VisualAsset, trigger: HTMLElement] }>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const paper = ref<HTMLElement | null>(null)
const intro = ref<HTMLElement | null>(null)
const band = ref<HTMLElement | null>(null)
const featured = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const counter = ref<HTMLElement | null>(null)
const current = ref(0)
const desktopPinned = ref(false)

const selectedWorks = personalPortfolio?.selectedWorks ?? []
const featuredItem =
  selectedWorks.find((item) => item.id === personalPortfolio?.storyPanels[0]?.assetId) ??
  photography[0]!
// sizes 使用 CSS 像素，浏览器自行乘 DPR；等比 cover 也可能比视口更宽。
const featuredImageSizes = computed(() =>
  desktopPinned.value
    ? `max(102vw, ${((102 * featuredItem.width) / featuredItem.height).toFixed(2)}vh)`
    : 'calc(100vw - 44px)',
)
const personalBand = [...selectedWorks.filter((item) => item.id !== featuredItem.id)]
personalBand.splice(Math.min(2, personalBand.length), 0, featuredItem)
const bandEntries = selectedWorks.length
  ? personalBand.map((item) => ({
      key: item.id,
      item,
      width: item.id === featuredItem.id ? '30vw' : item.height > item.width ? '16vw' : '24vw',
      featured: item.id === featuredItem.id,
    }))
  : [
      { key: 'b1', item: photography[2]!, width: '22vw', featured: false },
      { key: 'b2', item: photography[1]!, width: '15vw', featured: false },
      { key: 'b3', item: featuredItem, width: '30vw', featured: true },
      { key: 'b4', item: posters[1]!, width: '13vw', featured: false },
      { key: 'b5', item: editorial[0]!, width: '19vw', featured: false },
    ]
const panels: Panel[] = personalPortfolio?.storyPanels.map((panel, index) => ({
  key: panel.key,
  slot: index === 0,
  item: selectedWorks.find((item) => item.id === panel.assetId) ?? featuredItem,
  label: panel.label.en,
  labelZh: panel.label.zh,
  title: panel.title.zh,
  titleEn: panel.title.en,
  copy: panel.copy.zh,
  copyEn: panel.copy.en,
  href: panel.href,
})) ?? [
  {
    key: 'story-1',
    slot: true,
    label: 'DIRECTION',
    labelZh: '方向',
    title: '内容策划与视觉表达',
    titleEn: 'Content planning & visual communication',
    copy: '模板示例 · 内容策划 · 视觉表达：先把想法整理成清晰的表达，再决定画面与版面的取舍。',
    copyEn:
      'Template example · content planning and visual communication: ideas are shaped into clear communication before framing and layout.',
  },
  {
    key: 'story-2',
    item: photography[1]!,
    label: 'METHOD',
    labelZh: '方法',
    title: '从需求到交付',
    titleEn: 'From brief to delivery',
    copy: '从需求与脚本出发，经分镜与画面打磨，到最终交付。',
    copyEn: 'From brief and script, through storyboard and image, to final delivery.',
  },
  {
    key: 'story-3',
    item: posters[0]!,
    label: 'COLLABORATION',
    labelZh: '协作',
    title: '工具参与过程',
    titleEn: 'Tools support the process',
    copy: 'AI 与制作工具参与过程，判断留在自己手里。',
    copyEn: 'AI and production tools support the process; judgment stays with me.',
  },
  {
    key: 'story-4',
    item: photography[2]!,
    label: 'WORK',
    labelZh: '作品',
    title: '系列版面与摄影观察',
    titleEn: 'Series layouts & observation',
    copy: '同一组几何元素构成系列海报与版面；摄影记录光与画面的秩序。',
    copyEn: 'A shared geometric set builds the poster series; photography notes light and order.',
  },
]

function openLabel(item: VisualAsset): string {
  return props.lang === 'zh'
    ? `查看完整作品：${pick(item.title, props.lang)}`
    : `View artwork: ${pick(item.title, props.lang)}`
}
function openImage(item: VisualAsset, event: MouseEvent): void {
  if (event.currentTarget instanceof HTMLElement) emit('open', item, event.currentTarget)
}

let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false
gsap.registerPlugin(ScrollTrigger)

function scheduleRefresh(): void {
  if (dead) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !band.value || !featured.value || !track.value)
      return
    const rootElement = root.value
    const stageElement = stage.value
    const trackElement = track.value
    media = gsap.matchMedia()
    // 桌面：固定舞台连续场景；其余尺寸走自然纵向阅读（默认样式即完整内容）。
    media.add(
      '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
      (mediaContext) => {
        desktopPinned.value = true
        rootElement.classList.add('is-pinned')
        let scene: ScrollTrigger | null = null
        let animation: gsap.core.Timeline | undefined
        let storyDuration = 1
        let travelDistance = () => 0
        let context: gsap.Context | undefined
        const clearAnimationStyles = () => {
          const targets = rootElement.querySelectorAll<HTMLElement>(
            '.collage__stage, .collage__band, .collage__featured, .collage__intro, .collage__paper, .collage__track, .collage__panel-image, .collage__note, .collage__counter',
          )
          // 仅移除本场景拥有的动画属性；保留 --image-width、aspect-ratio 等模板静态样式。
          // clearProps 同时使 GSAP transform cache 失效，重新进入断点时不会读到旧坐标。
          mediaContext.ignore(() => {
            gsap.set(targets, {
              clearProps: 'transform,translate,rotate,scale,opacity,visibility,transformOrigin',
            })
          })
        }
        const disposeScene = () => {
          const previous = context
          context = undefined
          previous?.revert()
          animation = undefined
          scene = null
          clearAnimationStyles()
        }
        // matchMedia 只拥有显式清理函数，当前场景只归这一个独立 context 管理。
        // 避免父 context 先递归恢复 tween、再恢复子 context，重放旧的 fromTo 内联起点。
        const buildScene = (): void => {
          disposeScene()
          mediaContext.ignore(() => {
            context = gsap.context(() => {
              const bandElement = band.value!
              const featuredElement = featured.value!
              const slotInBand = rootElement.querySelector<HTMLElement>(
                '.collage__band-figure--slot',
              )
              const slotInTrack = rootElement.querySelector<HTMLElement>('.collage__slot')
              if (!slotInBand || !slotInTrack) return
              const BAND_ROTATION = -6
              /** 沿 offsetParent 链把布局坐标（不受 transform 影响）换算到舞台坐标系。 */
              const offsetWithinStage = (element: HTMLElement) => {
                let left = 0
                let top = 0
                let node: HTMLElement | null = element
                while (node && node !== stageElement) {
                  left += node.offsetLeft
                  top += node.offsetTop
                  node = node.offsetParent as HTMLElement | null
                }
                return { left, top }
              }
              /** 把整带旋转带来的位移修正到主图初始位置：交接按旋转后的视觉位置对齐。 */
              const featuredHome = () => {
                const home = offsetWithinStage(slotInBand!)
                const bandBase = offsetWithinStage(bandElement)
                const radians = (BAND_ROTATION * Math.PI) / 180
                const cx = bandBase.left + bandElement.offsetWidth / 2
                const cy = bandBase.top + bandElement.offsetHeight / 2
                const px = home.left + slotInBand!.offsetWidth / 2 - cx
                const py = home.top + slotInBand!.offsetHeight / 2 - cy
                const rotatedX = px * Math.cos(radians) - py * Math.sin(radians)
                const rotatedY = px * Math.sin(radians) + py * Math.cos(radians)
                return {
                  left: cx + rotatedX - slotInBand!.offsetWidth / 2,
                  top: cy + rotatedY - slotInBand!.offsetHeight / 2,
                }
              }
              // 图片带在主图仍位于眼前时停下，让该图连续接管，而非滑出屏幕后再飞回。
              travelDistance = () =>
                Math.max(
                  0,
                  featuredHome().left +
                    featuredElement.offsetWidth / 2 -
                    stageElement.clientWidth * 0.45,
                )
              const fillShift = () => {
                const width = featuredElement.offsetWidth
                const height = featuredElement.offsetHeight
                // 等比覆盖视口：舞台 overflow:clip 裁切超出部分，完整图片由查看器承载。
                const fillScale =
                  Math.max(stageElement.clientWidth / width, stageElement.clientHeight / height) *
                  1.02
                return {
                  x: (stageElement.clientWidth - width) / 2,
                  y: (stageElement.clientHeight - height) / 2,
                  scale: fillScale,
                }
              }
              const slotShift = () => {
                const slotBase = offsetWithinStage(slotInTrack!)
                return {
                  x: slotBase.left + slotInTrack!.offsetWidth / 2 - featuredElement.offsetWidth / 2,
                  y:
                    slotBase.top + slotInTrack!.offsetHeight / 2 - featuredElement.offsetHeight / 2,
                  scale: slotInTrack!.offsetWidth / featuredElement.offsetWidth,
                }
              }
              // 主图初始摆在带内占位经旋转换算后的视觉位置，随后与带同步滑动。
              const start = featuredHome()
              gsap.set(featuredElement, {
                x: start.left,
                y: start.top + stageElement.clientHeight * 0.08,
                rotation: BAND_ROTATION,
                transformOrigin: 'center center',
              })
              storyDuration = Math.max(
                1,
                (trackElement.scrollWidth - stageElement.clientWidth) / stageElement.clientHeight,
              )
              const timeline = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                  id: 'about-collage-story',
                  trigger: stageElement,
                  refreshPriority: 40,
                  start: 'top top',
                  end: () =>
                    `+=${Math.round(stageElement.clientHeight * (2.85 + storyDuration + 0.2))}`,
                  pin: true,
                  pinSpacing: true,
                  anticipatePin: 1,
                  scrub: true,
                  invalidateOnRefresh: true,
                  onUpdate: () => {
                    const x = Math.abs(Number(gsap.getProperty(trackElement, 'x')) || 0)
                    let selected = 0
                    Array.from(
                      trackElement.querySelectorAll<HTMLElement>('.collage__panel'),
                    ).forEach((panel, index) => {
                      if (panel.offsetLeft < x + stageElement.clientWidth * 0.42) selected = index
                    })
                    current.value = selected
                  },
                },
              })
              const notes = trackElement.querySelectorAll('.collage__note')
              const panelImages = trackElement.querySelectorAll('.collage__panel-image')
              timeline
                // ① 简介停留后，整条倾斜图片带连续横移（含少量纵向位移）。
                .addLabel('ribbon', 0)
                .to({}, { duration: 0.25 })
                .fromTo(
                  bandElement,
                  {
                    x: () => stageElement.clientWidth * 0.1,
                    y: () => stageElement.clientHeight * 0.08,
                    rotation: BAND_ROTATION,
                  },
                  {
                    x: () => -travelDistance(),
                    y: () => -stageElement.clientHeight * 0.04,
                    rotation: BAND_ROTATION,
                    duration: 1.4,
                  },
                  0.25,
                )
                // 主图浮层与带同步滑动（同位移增量），保持同一视觉位置。
                .fromTo(
                  featuredElement,
                  {
                    x: () => featuredHome().left + stageElement.clientWidth * 0.1,
                    y: () => featuredHome().top + stageElement.clientHeight * 0.08,
                    rotation: BAND_ROTATION,
                  },
                  {
                    x: () => featuredHome().left - travelDistance(),
                    y: () => featuredHome().top - stageElement.clientHeight * 0.04,
                    rotation: BAND_ROTATION,
                    duration: 1.4,
                  },
                  0.25,
                )
                .to(intro.value!, { autoAlpha: 0, y: -60, duration: 0.5, ease: 'power1.in' }, 1.65)
                .addLabel('takeover', 1.65)
                // ② 主图脱离：归正（旋转回零）并等比放大覆盖视口；带滑出淡出、底纸转深。
                .to(
                  featuredElement,
                  {
                    x: () => fillShift().x,
                    y: () => fillShift().y,
                    scale: () => fillShift().scale,
                    rotation: 0,
                    duration: 0.55,
                    ease: 'power2.inOut',
                  },
                  'takeover',
                )
                .to(
                  bandElement,
                  {
                    x: () => -travelDistance() - stageElement.clientWidth * 0.6,
                    autoAlpha: 0,
                    duration: 0.5,
                    ease: 'power1.in',
                  },
                  'takeover',
                )
                .to(paper.value!, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 'takeover+=.25')
                .addLabel('cover', 'takeover+=.55')
                // ③ 覆盖停留呼吸。
                .to(
                  featuredElement,
                  { scale: () => fillShift().scale * 0.985, duration: 0.12, ease: 'power1.inOut' },
                  'takeover+=.62',
                )
                // ④ 主图缩入故事第一格；轨道、面板与文字进入。
                .to(
                  featuredElement,
                  {
                    x: () => slotShift().x,
                    y: () => slotShift().y,
                    scale: () => slotShift().scale,
                    duration: 0.42,
                    ease: 'power2.inOut',
                  },
                  'takeover+=.76',
                )
                .fromTo(
                  trackElement,
                  { autoAlpha: 0 },
                  { autoAlpha: 1, duration: 0.2, ease: 'none' },
                  'takeover+=.82',
                )
                .fromTo(
                  panelImages,
                  { autoAlpha: 0, x: 46 },
                  { autoAlpha: 1, x: 0, duration: 0.28, stagger: 0.08, ease: 'power2.out' },
                  'takeover+=.86',
                )
                .fromTo(
                  notes,
                  { autoAlpha: 0, y: 34 },
                  { autoAlpha: 1, y: 0, duration: 0.26, stagger: 0.1, ease: 'power2.out' },
                  'takeover+=.9',
                )
                .fromTo(
                  counter.value!,
                  { autoAlpha: 0 },
                  { autoAlpha: 1, duration: 0.12, ease: 'none' },
                  'takeover+=.96',
                )
                // ⑤ 轨道与主图同步左移，完成图片与文字交错的横向叙事。
                .addLabel('story', 'takeover+=1.2')
                .to(
                  trackElement,
                  {
                    x: () => -(trackElement.scrollWidth - stageElement.clientWidth),
                    duration: storyDuration,
                  },
                  'story',
                )
                .to(
                  featuredElement,
                  {
                    x: () => slotShift().x - (trackElement.scrollWidth - stageElement.clientWidth),
                    duration: storyDuration,
                  },
                  'story',
                )
                .to({}, { duration: 0.2 })
              animation = timeline
              scene = timeline.scrollTrigger ?? null
            }, rootElement)
          })
        }
        buildScene()
        let resizeTimer = 0
        const onResize = () => {
          window.clearTimeout(resizeTimer)
          resizeTimer = window.setTimeout(() => {
            if (dead || !rootElement.classList.contains('is-pinned')) return
            buildScene()
            scheduleRefresh()
          }, 250)
        }
        window.addEventListener('resize', onResize)
        /** 键盘焦点进入离屏面板时，把对应画面滚入视口（与观察轨道同约定）。 */
        rootElement.addEventListener('focusin', onPanelFocus)
        function onPanelFocus(event: FocusEvent): void {
          const target = event.target
          if (!scene || !(target instanceof HTMLElement) || !target.matches(':focus-visible'))
            return
          const control = target.closest<HTMLElement>(
            '.collage__panel-image, .collage__read, .collage__featured, .collage__keyboard-index button',
          )
          if (!control || !track.value || !stage.value || !animation) return
          const bounds = control.getBoundingClientRect()
          const visible = control.matches('.collage__read')
            ? bounds.left >= 12 &&
              bounds.right <= innerWidth - 12 &&
              bounds.top >= 0 &&
              bounds.bottom <= innerHeight
            : bounds.right > 12 &&
              bounds.left < innerWidth - 12 &&
              bounds.bottom > 0 &&
              bounds.top < innerHeight
          if (visible) return
          const storyTravel = track.value.scrollWidth - stage.value.clientWidth
          const panel = control.closest<HTMLElement>('.collage__panel')
          const time = panel
            ? animation.labels.story! +
              Math.min(1, panel.offsetLeft / Math.max(1, storyTravel)) * storyDuration
            : control.classList.contains('collage__featured') &&
                animation.time() >= animation.labels.story!
              ? animation.labels.story!
              : 0.15
          window.scrollTo({
            top: scene.start + ((scene.end - scene.start) * time) / animation.duration(),
            behavior: 'auto',
          })
          ScrollTrigger.update()
        }
        return () => {
          const focused = document.activeElement
          const restoreWork =
            focused instanceof HTMLElement && focused.closest('.collage__keyboard-index')
              ? focused.dataset.workId
              : undefined
          window.removeEventListener('resize', onResize)
          rootElement.removeEventListener('focusin', onPanelFocus)
          window.clearTimeout(resizeTimer)
          disposeScene()
          desktopPinned.value = false
          rootElement.classList.remove('is-pinned')
          current.value = 0
          // 退出桌面布局时，不能把焦点留在已隐藏的选择区；恢复到自然网格的同一作品。
          if (restoreWork)
            void nextTick(() => {
              if (dead || desktopPinned.value) return
              const controls = rootElement.querySelectorAll<HTMLElement>(
                '.collage__band-figure:not(.collage__band-figure--slot), .collage__featured',
              )
              Array.from(controls)
                .find((control) => control.dataset.workId === restoreWork)
                ?.focus()
            })
        }
      },
      root.value,
    )
    cancelRefresh = requestMotionLayoutRefresh()
    void document.fonts.ready.then(scheduleRefresh)
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
/* 自然阅读（手机/短视口/减少动态）：奶油区块 + 直接排列的图片与文字。 */
.collage {
  position: relative;
  background: var(--ab-paper, #ffe8ce);
}
.collage__stage {
  position: relative;
  padding: clamp(72px, 9vw, 140px) clamp(22px, 5vw, 88px) clamp(88px, 10vw, 160px);
  padding-left: clamp(72px, 5vw, 96px);
  color: #241d16;
  isolation: isolate;
}
.collage__paper {
  display: none;
}
.collage__intro {
  max-width: 640px;
}
.collage__keyboard-index {
  display: none;
}
.collage__kicker {
  margin: 0 0 18px;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: #6a5c4c;
}
.collage__kicker span {
  display: block;
  margin-top: 4px;
  letter-spacing: 0.3em;
  font-size: 10px;
  color: #8a7a66;
}
.collage__intro h2 {
  margin: 0;
  font-size: clamp(30px, 3.6vw, 54px);
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 1.12;
}
.collage__intro h2 span {
  display: block;
  margin-top: 8px;
  font-size: clamp(14px, 1.3vw, 19px);
  font-weight: 400;
  letter-spacing: 0;
  color: #6a5c4c;
}
.collage__lead {
  margin: 22px 0 0;
  max-width: 34em;
  font-size: clamp(15px, 1.25vw, 18px);
  line-height: 1.7;
}
.collage__lead span {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #8a7a66;
}
.collage__band-window {
  position: relative;
  margin-top: 56px;
}
.collage__band {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.collage__band-figure {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.collage__band-figure img {
  display: block;
  width: 100%;
  height: auto;
}
.collage__band-figure--slot {
  display: none;
}
.collage__band-figure:focus-visible {
  outline: 2px solid #241d16;
  outline-offset: 6px;
}
.collage__featured {
  display: block;
  width: 100%;
  margin-top: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.collage__track {
  display: block;
  margin-top: 72px;
}
.collage__panel {
  position: relative;
  display: block;
}
.collage__panel + .collage__panel {
  margin-top: 72px;
}
.collage__panel-image {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.collage__panel-image img {
  display: block;
  width: 100%;
  height: auto;
}
.collage__panel-image:focus-visible {
  outline: 2px solid #241d16;
  outline-offset: 6px;
}
.collage__slot {
  display: none;
}
.collage__note {
  max-width: 34em;
  margin-top: 24px;
}
.collage__note-label {
  margin: 0 0 20px;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #6a5c4c;
}
.collage__note-label span {
  margin-left: 12px;
  letter-spacing: 0.08em;
  color: #8a7a66;
}
.collage__note h3 {
  margin: 0;
  font-size: clamp(26px, 2.6vw, 42px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.18;
  text-wrap: balance;
}
.collage__note h3 span {
  display: block;
  margin-top: 10px;
  font-size: clamp(15px, 1.4vw, 21px);
  font-weight: 400;
  letter-spacing: -0.01em;
  color: #6a5c4c;
}
.collage__note-copy {
  margin: 22px 0 0;
  font-size: clamp(14px, 1.2vw, 17px);
  line-height: 1.8;
}
.collage__note-copy span {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.7;
  color: #8a7a66;
}
.collage__read {
  display: inline-block;
  margin-top: 24px;
  color: inherit;
  font-size: 12px;
  text-underline-offset: 5px;
}
.collage__read span {
  margin-left: 14px;
  opacity: 0.65;
}
.collage__counter {
  display: none;
  margin: 0;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.collage__counter span {
  color: var(--ab-accent);
}
/* 桌面固定舞台：底纸 z0 → 带窗口 z1 → 故事轨道 z2 → 独立主图 z3。 */
@media (min-width: 981px) and (min-height: 650px) {
  .is-pinned.collage {
    background: var(--ab-bg);
  }
  .is-pinned .collage__stage {
    height: 100svh;
    min-height: 650px;
    padding: 0;
    overflow: clip;
    color: var(--ab-ink);
  }
  .is-pinned .collage__paper {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 0;
    background: var(--ab-paper, #ffe8ce);
  }
  .is-pinned .collage__intro {
    position: absolute;
    z-index: 2;
    left: clamp(72px, 5vw, 88px);
    top: clamp(56px, 9vh, 120px);
    max-width: 780px;
    color: #241d16;
  }
  .is-pinned .collage__lead {
    max-width: 30em;
    font-size: clamp(20px, 2.05vw, 29px);
    font-weight: 650;
    line-height: 1.45;
  }
  .is-pinned .collage__lead span {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.6;
  }
  .is-pinned .collage__keyboard-index {
    position: absolute;
    z-index: 5;
    left: clamp(72px, 5vw, 88px);
    bottom: 28px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    width: min(760px, calc(100% - 48px));
    max-height: 40svh;
    overflow: auto;
    padding: 16px;
    background: var(--ab-paper, #ffe8ce);
    color: #241d16;
    opacity: 0;
    pointer-events: none;
  }
  .is-pinned .collage__keyboard-index:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
  .is-pinned .collage__keyboard-index p {
    grid-column: 1/-1;
    margin: 0 0 6px;
    font-size: 13px;
  }
  .is-pinned .collage__keyboard-index p span {
    margin-left: 12px;
    font-size: 11px;
  }
  .is-pinned .collage__keyboard-index button {
    padding: 10px;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 12px;
    line-height: 1.45;
    text-align: left;
    cursor: pointer;
  }
  .is-pinned .collage__keyboard-index button:focus-visible {
    outline: 3px solid var(--ab-accent);
    outline-offset: 1px;
  }
  .is-pinned .collage__band-window {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: clip;
    margin-top: 0;
  }
  .is-pinned .collage__band {
    position: absolute;
    top: 48%;
    left: 0;
    display: flex;
    align-items: center;
    gap: 24px;
    width: max-content;
    transform-origin: center;
  }
  .is-pinned .collage__band-figure {
    position: relative;
    flex: none;
    width: var(--image-width, 24vw);
    cursor: pointer;
  }
  .is-pinned .collage__band-figure img {
    display: block;
    width: 100%;
    height: 30svh;
    object-fit: cover;
  }
  .is-pinned .collage__band-figure--slot {
    display: block;
    cursor: default;
    visibility: hidden;
  }
  .is-pinned .collage__band-figure:focus-visible {
    outline-color: var(--ab-accent);
  }
  .is-pinned .collage__featured {
    display: block;
    position: absolute;
    z-index: 3;
    left: 0;
    top: 0;
    width: 30vw;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    will-change: transform;
  }
  .is-pinned .collage__featured img {
    display: block;
    width: 100%;
    height: auto;
  }
  .is-pinned .collage__featured:focus-visible {
    outline: 2px solid var(--ab-accent);
    outline-offset: 6px;
  }
  .is-pinned .collage__track {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    height: 100%;
    visibility: hidden;
    will-change: transform;
  }
  .is-pinned .collage__panel {
    flex: 0 0 100%;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: clamp(32px, 5vw, 90px);
    align-items: center;
    padding: clamp(64px, 10vh, 120px) clamp(24px, 5vw, 88px) clamp(48px, 8vh, 100px);
  }
  .is-pinned .collage__panel + .collage__panel {
    margin-top: 0;
  }
  .is-pinned .collage__slot {
    display: block;
    width: min(44vw, 660px, calc(62svh * var(--featured-ratio)));
  }
  .is-pinned .collage__panel-image {
    width: min(44vw, 660px);
  }
  .is-pinned .collage__panel-image img {
    max-height: 62svh;
    object-fit: contain;
  }
  .is-pinned .collage__panel-image:focus-visible {
    outline-color: var(--ab-accent);
  }
  .is-pinned .collage__note {
    margin-top: 0;
    max-width: 30em;
  }
  .is-pinned .collage__note-label {
    color: var(--ab-accent);
  }
  .is-pinned .collage__note-label span {
    color: var(--ab-soft);
  }
  .is-pinned .collage__note h3 span {
    color: var(--ab-soft);
  }
  .is-pinned .collage__note-copy span {
    color: var(--ab-soft);
  }
  .is-pinned .collage__counter {
    display: block;
    position: absolute;
    z-index: 4;
    right: clamp(24px, 5vw, 88px);
    top: clamp(96px, 14vh, 132px);
    color: var(--ab-soft);
    opacity: 0;
  }
}
</style>

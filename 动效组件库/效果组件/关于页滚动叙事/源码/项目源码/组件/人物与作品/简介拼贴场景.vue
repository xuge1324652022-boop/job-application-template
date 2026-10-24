<template>
  <section id="stories" ref="root" class="collage" aria-label="简介拼贴与横向图文叙事">
    <div ref="stage" class="collage__stage">
      <div ref="wash" class="collage__wash" aria-hidden="true"></div>

      <div ref="intro" class="collage__intro">
        <p class="collage__kicker">SELECTED WORK<span>作品速览</span></p>
        <h2>从想法到画面<span>From ideas to frames</span></h2>
        <p class="collage__lead">作品速览：视频剪辑、影像调色、新闻影像、海报设计与摄影<span lang="en">A quick look: film editing, colour grading, news, poster design and photography</span></p>
      </div>

      <!-- 倾斜图片带：脱离放大的主角图自始至终是同一 DOM 元素。 -->
      <div ref="strip" class="collage__strip">
        <button v-for="entry in stripEntries" :key="entry.key" type="button"
          class="collage__card" :class="{ 'collage__card--featured': entry.featured }"
          :style="{ '--tilt': entry.tilt, '--card-w': entry.width }"
          :aria-label="openLabel(entry.item)"
          @click="openImage(entry.item, $event)">
          <span class="collage__fly"><img :src="entry.item.src" :srcset="visualImageSources(entry.item)"
            :sizes="`(max-width: 980px) 46vw, ${entry.width}`"
            :width="entry.item.width" :height="entry.item.height" :alt="pick(entry.item.alt, lang)"
            :loading="entry.featured ? 'eager' : 'lazy'" decoding="async" draggable="false" @load="scheduleRefresh" /></span>
        </button>
      </div>

      <!-- 横向图文轨道：主角图飞入第一格后整轨左移。 -->
      <div ref="track" class="collage__track">
        <article v-for="panel in panels" :key="panel.key" class="collage__panel">
          <div v-if="panel.slot" class="collage__slot" aria-hidden="true"></div>
          <button v-else type="button" class="collage__panel-image" :aria-label="openLabel(panel.item!)"
            @click="openImage(panel.item!, $event)">
            <img :src="panel.item!.src" :srcset="visualImageSources(panel.item!)"
              sizes="(max-width: 980px) 92vw, 46vw" :width="panel.item!.width" :height="panel.item!.height"
              :alt="pick(panel.item!.alt, lang)" loading="lazy" decoding="async" draggable="false" @load="scheduleRefresh" />
          </button>
          <div class="collage__note">
            <p class="collage__note-label">{{ panel.label }}<span>{{ panel.labelZh }}</span></p>
            <h3>{{ panel.title }}<span lang="en">{{ panel.titleEn }}</span></h3>
            <p class="collage__note-copy">{{ panel.copy }}<span lang="en">{{ panel.copyEn }}</span></p>
          </div>
        </article>
      </div>

      <p ref="counter" class="collage__counter" aria-hidden="true"><span>{{ String(current + 1).padStart(2, '0') }}</span> / {{ String(panels.length).padStart(2, '0') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 简介拼贴 → 选图放大 → 横向图文叙事的连续固定场景。
 * 主角图（拼贴带中标记 featured 的那一张）自始至终是同一 DOM 元素：
 * 从拼贴位置等比放大接近铺满视口，再缩入横向轨道第一格，随后与整轨一起左移；
 * 反向滚动沿原路恢复。浅色底纸在放大阶段淡出，场景由浅入深衔接暗色人物引言。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { pick, type Lang } from '../../数据/人物资料'
import { editorial, photography, posters, type VisualAsset } from '../../数据/视觉作品资料'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'
import { visualImageSources } from '../../工具/响应式图片'

interface Panel { key: string; slot?: boolean; item?: VisualAsset; label: string; labelZh: string; title: string; titleEn: string; copy: string; copyEn: string }

const props = defineProps<{ lang: Lang }>()
const emit = defineEmits<{ open: [item: VisualAsset, trigger: HTMLElement] }>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const wash = ref<HTMLElement | null>(null)
const intro = ref<HTMLElement | null>(null)
const strip = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const counter = ref<HTMLElement | null>(null)
const current = ref(0)

const featured = photography[0]!
const stripEntries = [
  { key: 's1', item: photography[2]!, tilt: '2.6deg', width: '19vw', featured: false },
  { key: 's2', item: featured, tilt: '0deg', width: '29vw', featured: true },
  { key: 's3', item: photography[1]!, tilt: '-3.2deg', width: '15vw', featured: false },
  { key: 's4', item: posters[1]!, tilt: '4.1deg', width: '12vw', featured: false },
  { key: 's5', item: editorial[0]!, tilt: '-2deg', width: '17vw', featured: false },
]
const panels: Panel[] = [
  {
    key: 'story-1', slot: true, label: 'DIRECTION', labelZh: '方向',
    title: '内容策划与视觉表达', titleEn: 'Content planning & visual communication',
    copy: '模板示例 · 内容策划 · 视觉表达：先把想法整理成清晰的表达，再决定画面与版面的取舍。',
    copyEn: 'Template example · content planning and visual communication: ideas are shaped into clear communication before framing and layout.',
  },
  {
    key: 'story-2', item: photography[1]!, label: 'METHOD', labelZh: '方法',
    title: '从需求到交付', titleEn: 'From brief to delivery',
    copy: '从需求与脚本出发，经分镜与画面打磨，到最终交付。',
    copyEn: 'From brief and script, through storyboard and image, to final delivery.',
  },
  {
    key: 'story-3', item: posters[0]!, label: 'COLLABORATION', labelZh: '协作',
    title: '工具参与过程', titleEn: 'Tools support the process',
    copy: 'AI 与制作工具参与过程，判断留在自己手里。',
    copyEn: 'AI and production tools support the process; judgment stays with me.',
  },
  {
    key: 'story-4', item: photography[2]!, label: 'WORK', labelZh: '作品',
    title: '系列版面与摄影观察', titleEn: 'Series layouts & observation',
    copy: '同一组几何元素构成系列海报与版面；摄影记录光与画面的秩序。',
    copyEn: 'A shared geometric set builds the poster series; photography notes light and order.',
  },
]

function openLabel(item: VisualAsset): string {
  return props.lang === 'zh' ? `查看完整示例：${pick(item.title, props.lang)}` : `View full sample: ${pick(item.title, props.lang)}`
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
    if (dead || !root.value || !stage.value || !strip.value || !track.value) return
    const rootElement = root.value
    const stageElement = stage.value
    const trackElement = track.value
    media = gsap.matchMedia()
    // 桌面：固定舞台连续场景；其余尺寸走自然纵向阅读（默认样式即完整内容）。
    media.add('(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)', () => {
      rootElement.classList.add('is-pinned')
      // 主角卡与第一格槽位直接按类名查询：模板 ref 数组在挂载时序上不可靠，
      // 曾导致主角图坐标读到空值、飞入第一格后消失。
      const featuredCard = rootElement.querySelector<HTMLElement>('.collage__card--featured')
      const fly = featuredCard?.querySelector<HTMLElement>('.collage__fly') ?? null
      const slotElement = rootElement.querySelector<HTMLElement>('.collage__slot')
      const siblings = [...rootElement.querySelectorAll<HTMLElement>('.collage__card')].filter(card => card !== featuredCard)
      if (!featuredCard || !fly || !slotElement) return
      const travel = () => Math.max(0, trackElement.scrollWidth - stageElement.clientWidth)
      // 时长取创建时的常数并归一到常规量级（总时长 10）：与观察轨道一致的做法，
      // 端点仍用函数值，resize 后由断点分支重建与 end 重算兜底。
      const trackDuration = Math.max(1, travel())
      const durationScale = 10 / (950 + trackDuration + 60)
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
      const fillShift = () => {
        const width = featuredCard!.offsetWidth
        const height = featuredCard!.offsetHeight
        const base = offsetWithinStage(featuredCard!)
        const centerX = base.left + width / 2
        const centerY = base.top + height / 2
        const fillScale = Math.min(stageElement.clientWidth * .94 / width, stageElement.clientHeight * .86 / height)
        return { x: stageElement.clientWidth / 2 - centerX, y: stageElement.clientHeight * .46 - centerY, scale: fillScale }
      }
      const slotShift = () => {
        const base = offsetWithinStage(featuredCard!)
        const centerX = base.left + featuredCard!.offsetWidth / 2
        const centerY = base.top + featuredCard!.offsetHeight / 2
        const slotBase = offsetWithinStage(slotElement!)
        return {
          x: slotBase.left + slotElement!.offsetWidth / 2 - centerX,
          y: slotBase.top + slotElement!.offsetHeight / 2 - centerY,
          scale: slotElement!.offsetWidth / featuredCard!.offsetWidth,
        }
      }
      const scrollLength = () => 950 + travel() + 60
      // 阶段比例与滚动行程对应：放大段 950px、轨道位移段、尾部 60px。
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: 'about-collage-story', trigger: stageElement, refreshPriority: 40,
          start: 'top top', end: () => `+=${Math.round(scrollLength())}`,
          pin: true, anticipatePin: 1, scrub: true, invalidateOnRefresh: true,
          onUpdate: self => {
            const trackPortion = Math.max(0, Math.min(1, (self.progress * scrollLength() - 950) / Math.max(1, travel())))
            current.value = Math.round(trackPortion * (panels.length - 1))
          },
        },
      })
      const notes = trackElement.querySelectorAll('.collage__note')
      const panelImages = trackElement.querySelectorAll('.collage__panel-image')
      timeline
        // ① 主角图脱离拼贴，等比放大接近铺满视口；其余卡片散开淡出，简介上移淡出。
        .to(fly, { x: () => fillShift().x, y: () => fillShift().y, scale: () => fillShift().scale, duration: 430 * durationScale, ease: 'power2.inOut' }, 0)
        .to(siblings, { autoAlpha: 0, x: index => (index % 2 ? 1 : -1) * 90, rotation: index => (index % 2 ? 7 : -9), duration: 300 * durationScale, stagger: 40 * durationScale, ease: 'power2.in' }, 40 * durationScale)
        .to(intro.value!, { autoAlpha: 0, y: -70, duration: 320 * durationScale, ease: 'power2.in' }, 0)
        // ② 铺满呼吸：浅色底纸淡出，场景过渡到深色。
        .to(wash.value!, { autoAlpha: 0, duration: 150 * durationScale, ease: 'none' }, 420 * durationScale)
        .to(fly, { scale: () => fillShift().scale * .985, duration: 130 * durationScale, ease: 'power1.inOut' }, 430 * durationScale)
        // ③ 主角图缩入轨道第一格；轨道、面板与文字进入。
        .to(fly, { x: () => slotShift().x, y: () => slotShift().y, scale: () => slotShift().scale, duration: 390 * durationScale, ease: 'power2.inOut' }, 560 * durationScale)
        .fromTo(trackElement, { autoAlpha: 0 }, { autoAlpha: 1, duration: 200 * durationScale, ease: 'none' }, 620 * durationScale)
        .fromTo(panelImages, { autoAlpha: 0, x: 46 }, { autoAlpha: 1, x: 0, duration: 260 * durationScale, stagger: 70 * durationScale, ease: 'power2.out' }, 660 * durationScale)
        .fromTo(notes, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 240 * durationScale, stagger: 90 * durationScale, ease: 'power2.out' }, 700 * durationScale)
        .fromTo(counter.value!, { autoAlpha: 0 }, { autoAlpha: 1, duration: 120 * durationScale, ease: 'none' }, 760 * durationScale)
        // ④ 轨道与主角图同步左移，完成图片与文字交错的横向叙事。
        .to(trackElement, { x: () => -travel(), duration: trackDuration * durationScale, ease: 'none' }, 950 * durationScale)
        .to(fly, { x: () => slotShift().x - travel(), duration: trackDuration * durationScale, ease: 'none' }, 950 * durationScale)
        .to({}, { duration: 60 * durationScale })
      return () => {
        rootElement.classList.remove('is-pinned')
        current.value = 0
      }
    }, root.value)
    cancelRefresh = requestMotionLayoutRefresh()
    void document.fonts.ready.then(scheduleRefresh)
  })
})
onBeforeUnmount(() => { dead = true; cancelPreparation?.(); cancelRefresh?.(); media?.revert() })
</script>

<style scoped>
/* 自然阅读（手机/短视口/减少动态）：浅色区块 + 直接排列的图片与文字。 */
.collage { position:relative; background:#e9e7e0; }
.collage__stage { position:relative; padding:clamp(72px,9vw,140px) clamp(22px,5vw,88px) clamp(88px,10vw,160px); color:#17181b; }
.collage__wash { display:none; }
.collage__intro { max-width:640px; }
.collage__kicker { margin:0 0 18px; font-size:12px; letter-spacing:.18em; color:#6f675a; }
.collage__kicker span { display:block; margin-top:4px; letter-spacing:.3em; font-size:10px; color:#8d867a; }
.collage__intro h2 { margin:0; font-size:clamp(30px,3.6vw,54px); font-weight:600; letter-spacing:-.04em; line-height:1.15; }
.collage__intro h2 span { display:block; margin-top:8px; font-size:clamp(14px,1.3vw,19px); font-weight:400; letter-spacing:0; color:#6f675a; }
.collage__lead { margin:22px 0 0; max-width:34em; font-size:clamp(15px,1.25vw,18px); line-height:1.7; }
.collage__lead span { display:block; margin-top:8px; font-size:12px; color:#8d867a; }
.collage__strip { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin-top:52px; }
.collage__card { display:block; width:100%; padding:0; border:0; background:transparent; cursor:pointer; }
.collage__card:focus-visible { outline:2px solid #17181b; outline-offset:6px; }
.collage__fly { display:block; }
.collage__fly img, .collage__panel-image img { display:block; width:100%; height:auto; }
.collage__slot { display:none; }
.collage__track { display:block; margin-top:72px; }
.collage__panel { position:relative; display:block; }
.collage__panel + .collage__panel { margin-top:72px; }
.collage__panel-image { display:block; padding:0; border:0; background:transparent; cursor:pointer; }
.collage__panel-image:focus-visible { outline:2px solid #17181b; outline-offset:6px; }
.collage__note { max-width:34em; margin-top:24px; }
.collage__note-label { margin:0 0 20px; font-size:11px; letter-spacing:.16em; color:#6f675a; }
.collage__note-label span { margin-left:12px; letter-spacing:.08em; color:#8d867a; }
.collage__note h3 { margin:0; font-size:clamp(26px,2.6vw,42px); font-weight:600; letter-spacing:-.035em; line-height:1.2; }
.collage__note h3 span { display:block; margin-top:10px; font-size:clamp(15px,1.4vw,21px); font-weight:400; letter-spacing:-.01em; color:#6f675a; }
.collage__note-copy { margin:22px 0 0; font-size:clamp(14px,1.2vw,17px); line-height:1.8; }
.collage__note-copy span { display:block; margin-top:10px; font-size:12px; line-height:1.7; color:#8d867a; }
.collage__counter { display:none; margin:0; font-size:13px; font-variant-numeric:tabular-nums; }
.collage__counter span { color:var(--ab-accent); }
/* 桌面固定舞台：浅底纸 → 主角放大 → 横向轨道，全部层叠在 100svh 舞台内。 */
@media(min-width:981px) and (min-height:650px) {
  .collage.is-pinned { background:var(--ab-bg); }
  .is-pinned .collage__stage { height:100svh; min-height:650px; padding:0; overflow:clip; color:var(--ab-ink); }
  .is-pinned .collage__wash { display:block; position:absolute; inset:0; z-index:1; background:#e9e7e0; }
  .is-pinned .collage__intro { position:absolute; z-index:2; left:clamp(24px,5vw,88px); top:clamp(56px,9vh,120px); max-width:640px; color:#17181b; }
  .is-pinned .collage__strip { position:absolute; left:0; right:0; bottom:clamp(48px,9vh,110px); z-index:auto; display:flex; justify-content:center; align-items:flex-end; gap:clamp(18px,2.6vw,44px); margin-top:0; }
  .is-pinned .collage__card { position:relative; width:var(--card-w); transform:rotate(var(--tilt)); }
  .is-pinned .collage__card--featured { z-index:4; }
  .is-pinned .collage__fly { position:relative; will-change:transform; }
  .is-pinned .collage__track { position:absolute; inset:0; z-index:3; display:flex; height:100%; visibility:hidden; will-change:transform; }
  .is-pinned .collage__panel { flex:0 0 100%; height:100%; display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:clamp(32px,5vw,90px); align-items:center; padding:clamp(64px,10vh,120px) clamp(24px,5vw,88px) clamp(48px,8vh,100px); }
  .is-pinned .collage__panel + .collage__panel { margin-top:0; }
  .is-pinned .collage__slot { display:block; width:min(46vw,680px); aspect-ratio:5568/3712; }
  .is-pinned .collage__panel-image { width:min(46vw,680px); }
  .is-pinned .collage__panel-image img { max-height:64svh; object-fit:contain; }
  .is-pinned .collage__panel-image:focus-visible { outline-color:var(--ab-accent); }
  .is-pinned .collage__note { margin-top:0; max-width:30em; }
  .is-pinned .collage__note-label { color:var(--ab-accent); }
  .is-pinned .collage__note-label span { color:var(--ab-soft); }
  .is-pinned .collage__note h3 span { color:var(--ab-soft); }
  .is-pinned .collage__note-copy span { color:var(--ab-soft); }
  .is-pinned .collage__counter { display:block; position:absolute; z-index:5; right:clamp(24px,5vw,88px); top:clamp(30px,5vh,56px); color:var(--ab-soft); opacity:0; }
}
</style>

<template>
  <section id="voice" ref="root" class="quote-scene" aria-labelledby="quote-title">
    <div ref="stage" class="quote-scene__stage">
      <div ref="backdropMask" class="quote-scene__backdrop" aria-hidden="true">
        <img :src="PORTRAIT.src" :srcset="visualImageSources(PORTRAIT)" sizes="100vw" width="1448" height="1086"
          alt="" decoding="async" loading="lazy" />
      </div>
      <div ref="content" class="quote-scene__content">
        <p ref="kicker" class="quote-scene__kicker">A NOTE FROM THE TEMPLATE<span>模板示例 · 引言</span></p>
        <h2 id="quote-title" ref="name" class="quote-scene__name">{{ IDENTITY.nameZh }}<span lang="en">{{ IDENTITY.nameEn }}</span></h2>
        <div ref="linesWrap" class="quote-scene__lines">
          <p v-for="(line, index) in lines" :key="index" class="quote-scene__line" :class="{ 'quote-scene__line--sub': index > 0 }">{{ line.text }}<span v-if="line.sub" lang="en">{{ line.sub }}</span></p>
        </div>
      </div>
      <span class="quote-scene__cue" aria-hidden="true">↓</span>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 暗色人物引言：整屏人物照片压暗作衬底，巨型姓名进入后引言行逐条由暗变亮，
 * 尾段整体上移交给折叠章节。文案全部取自现有资料（TAGLINE / ROLE_LINE），
 * 不新增事实。与首屏共用同一张合成人物占位图，仅用法不同。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IDENTITY, PROFILE_LINES, type Lang } from '../../数据/人物资料'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'
import { visualImageSources } from '../../工具/响应式图片'

defineProps<{ lang: Lang }>()
const PORTRAIT = { thumb: '/about/portrait-400.webp', src: '/about/portrait-900.webp', large: '/about/portrait-1448.webp' }
// 引言即现有资料中的自述（PROFILE_LINES）；方向行与首屏四行巨字呼应，不另写新文案。
const statement = PROFILE_LINES[0]!
const lines = [
  { text: statement.zh, sub: '' },
  { text: statement.en, sub: '' },
  { text: '内容策划 · 视频剪辑 · 视觉表达 · AI 协作', sub: 'Content planning · Video editing · Visual communication · AI collaboration' },
]

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const backdropMask = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const name = ref<HTMLElement | null>(null)
const linesWrap = ref<HTMLElement | null>(null)
const kicker = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false
gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !backdropMask.value || !name.value || !linesWrap.value || !content.value || !kicker.value) return
    media = gsap.matchMedia()
    media.add('(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)', () => {
      const rows = linesWrap.value!.querySelectorAll('.quote-scene__line')
      gsap.timeline({
        scrollTrigger: {
          id: 'about-quote-portrait', trigger: stage.value!, refreshPriority: 35,
          start: 'top top', end: () => `+=${Math.round(Math.max(480, innerHeight * 1.5))}`,
          pin: true, anticipatePin: 1, scrub: .55, invalidateOnRefresh: true,
        },
      })
        // 人物衬底由内缩遮罩展开，巨型姓名自下进入。
        .fromTo(backdropMask.value!, { clipPath: 'inset(18% 22% 18% 22%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .5, ease: 'power2.inOut' }, 0)
        .fromTo(name.value!, { yPercent: 46, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .4, ease: 'power3.out' }, .12)
        .fromTo(kicker.value!, { autoAlpha: 0 }, { autoAlpha: 1, duration: .25, ease: 'none' }, .3)
        // 引言行逐条由暗变亮，随后整块内容上移，交还滚动给折叠章节。
        .fromTo(rows, { color: '#585b63' }, { color: '#f2f1ec', duration: .34, stagger: .17, ease: 'none' }, .42)
        .to(content.value!, { y: () => -innerHeight * .3, duration: .3, ease: 'power2.in' }, .82)
    }, root.value)
    cancelRefresh = requestMotionLayoutRefresh()
    void document.fonts.ready.then(() => {
      if (dead) return
      cancelRefresh?.()
      cancelRefresh = requestMotionLayoutRefresh()
    })
  })
})
onBeforeUnmount(() => { dead = true; cancelPreparation?.(); cancelRefresh?.(); media?.revert() })
</script>

<style scoped>
.quote-scene { position:relative; background:var(--ab-bg); }
.quote-scene__stage { position:relative; min-height:100vh; min-height:100svh; overflow:clip; display:grid; align-items:center; }
.quote-scene__backdrop { position:absolute; inset:0; }
.quote-scene__backdrop img { width:100%; height:100%; object-fit:cover; opacity:.24; }
.quote-scene__backdrop::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom, rgb(12 13 15 / .38), rgb(12 13 15 / .78)); }
.quote-scene__content { position:relative; width:min(980px,86%); margin:0 auto; padding:clamp(90px,16vh,180px) 0; }
.quote-scene__kicker { margin:0 0 26px; font-size:11px; letter-spacing:.22em; color:var(--ab-soft); }
.quote-scene__kicker span { display:block; margin-top:5px; letter-spacing:.12em; font-size:10px; }
.quote-scene__name { margin:0; font-size:clamp(52px,8.2vw,150px); font-weight:600; letter-spacing:-.05em; line-height:1.04; color:var(--ab-ink); }
.quote-scene__name span { display:block; margin-top:14px; font-size:clamp(15px,1.5vw,24px); font-weight:400; letter-spacing:.02em; color:var(--ab-soft); }
.quote-scene__lines { margin-top:clamp(36px,6vh,72px); }
.quote-scene__line { margin:0; font-size:clamp(22px,2.5vw,38px); font-weight:500; letter-spacing:-.03em; line-height:1.5; color:#f2f1ec; }
.quote-scene__line + .quote-scene__line { margin-top:14px; }
.quote-scene__line--sub { font-size:clamp(14px,1.3vw,19px); font-weight:400; color:var(--ab-soft); }
.quote-scene__line span { display:block; margin-top:6px; font-size:.78em; color:var(--ab-soft); }
.quote-scene__cue { position:absolute; left:50%; bottom:26px; color:var(--ab-soft); font-size:22px; }
</style>

<template>
  <header id="about-intro" ref="root" class="about-motion-hero">
    <div class="about-motion-hero__top">
      <span>{{ IDENTITY.nameEn }}<span>{{ IDENTITY.nameZh }}</span></span>
      <a href="#contact">让我们聊聊 <span lang="en">Let’s talk ↗</span></a>
    </div>
    <div ref="stage" class="about-motion-hero__stage">
      <!-- 四行身份巨字构成页面主标题：入场时居中堆叠，滚动后重排到左侧，右侧人物图显现。 -->
      <h1 id="about-title" ref="rows" class="about-motion-hero__rows">
        <span v-for="row in IDENTITY_ROWS" :key="row.en" class="about-motion-hero__row"
          :style="{ '--word-fit': `${92 / (row.en.length * 0.62)}vw` }">
          <span class="about-motion-hero__word" lang="en">{{ row.en }}</span><span class="about-motion-hero__zh">{{ row.zh }}</span>
        </span>
      </h1>
      <figure ref="portrait" class="about-motion-hero__portrait">
        <div ref="portraitMask" class="about-motion-hero__portrait-mask">
          <img :src="PORTRAIT.src" :srcset="visualImageSources(PORTRAIT)" sizes="(max-width: 760px) calc(100vw - 44px), 34vw"
            width="1448" height="1086" :alt="lang === 'zh' ? '用于个人简介版式演示的合成几何占位图' : 'Synthetic geometric placeholder for the profile layout'"
            decoding="async" />
        </div>
        <figcaption>合成图像示例<span lang="en">Synthetic image example</span></figcaption>
      </figure>
    </div>
    <div class="about-motion-hero__bottom">
      <p>{{ pick(TAGLINE, 'zh') }}<span lang="en">{{ pick(TAGLINE, 'en') }}</span></p>
      <a href="#stories" class="about-motion-hero__scroll"><span>向下，认识我的工作<span lang="en">Scroll to explore my practice</span></span><span aria-hidden="true">↓</span></a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IDENTITY, TAGLINE, pick, type Lang } from '../../data/aboutProfile'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'

/** 四行身份取自现有资料的方向词；不引入原作者职业身份。 */
const IDENTITY_ROWS = [
  { en: 'CONTENT PLANNING', zh: '内容策划' },
  { en: 'VIDEO EDITING', zh: '视频剪辑' },
  { en: 'VISUAL EXPRESSION', zh: '视觉表达' },
  { en: 'AI COLLABORATION', zh: 'AI 协作' },
] as const
const PORTRAIT = { thumb: '/about/portrait-400.webp', src: '/about/portrait-900.webp', large: '/about/portrait-1448.webp' }
const props = defineProps<{ active: boolean; lang: Lang }>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const rows = ref<HTMLElement | null>(null)
const portrait = ref<HTMLElement | null>(null)
const portraitMask = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let entrance: gsap.core.Timeline | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let played = false
let dead = false
gsap.registerPlugin(ScrollTrigger)

function play(): void {
  if (!props.active || !entrance || played) return
  played = true
  entrance.play()
}
/** 行组居中摆放时 offsetLeft 即其与舞台左缘的差值；对齐左缘需要向左移动这么多。 */
function rowsShift(): number {
  if (!rows.value || !stage.value) return 0
  const padding = parseFloat(getComputedStyle(stage.value).paddingLeft) || 0
  return padding - rows.value.offsetLeft
}
onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !stage.value || !rows.value || !portrait.value || !portraitMask.value) return
    media = gsap.matchMedia()
    media.add('(min-width: 761px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)', () => {
      const lines = rows.value!.querySelectorAll('.about-motion-hero__row')
      const zh = rows.value!.querySelectorAll('.about-motion-hero__zh')
      // 入场：四行巨字居中堆叠、自下而上错峰进入，只播一次。
      // 断点分支重建时（如窗口跨过 761px）不再重建入场：若已播过而重建 fromTo，
      // 行会停在隐藏起点且 played 门闩拒绝重播，文字将一直不可见。
      if (played) {
        gsap.set(lines, { clearProps: 'transform,opacity,visibility' })
      } else {
        entrance = gsap.timeline({ paused: true })
          .fromTo(lines, { yPercent: 118, rotation: 4, autoAlpha: 0 },
            { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.05, stagger: .085, ease: 'expo.out', clearProps: 'transform,opacity,visibility' })
        play()
      }
      // 滚动重排：舞台短暂固定，行组自居中位置左移缩小，右侧人物图遮罩展开、
      // 中文小字渐显，完整停留片刻后再随页面退场；行组缩至 .74 避开右侧人物图。
      gsap.timeline({
        scrollTrigger: {
          id: 'about-hero-rearrange', trigger: stage.value!, refreshPriority: 45,
          start: 'top top', end: () => `+=${Math.round(innerHeight * .55)}`,
          pin: true, anticipatePin: 1, scrub: .5, invalidateOnRefresh: true,
        },
      })
        .fromTo(rows.value!, { x: 0, scale: 1 }, { x: rowsShift, scale: .74, transformOrigin: 'left center', duration: .6, ease: 'power2.inOut' }, 0)
        .fromTo(portrait.value!, { autoAlpha: 0, x: '7vw' }, { autoAlpha: 1, x: 0, duration: .45, ease: 'power2.out' }, .22)
        .fromTo(portraitMask.value!, { clipPath: 'inset(14% 20% 14% 20%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .55, ease: 'power2.inOut' }, .3)
        .fromTo(zh, { autoAlpha: 0 }, { autoAlpha: 1, stagger: .06, duration: .3, ease: 'none' }, .42)
        .to({}, { duration: .25 })
      return () => { entrance = undefined }
    }, root.value)
    cancelRefresh = requestMotionLayoutRefresh()
  })
})
watch(() => props.active, play)
onBeforeUnmount(() => { dead = true; cancelPreparation?.(); cancelRefresh?.(); media?.revert() })
</script>

<style scoped>
.about-motion-hero { position:relative; min-height:100vh; min-height:100svh; display:flex; flex-direction:column; justify-content:space-between; padding:44px clamp(24px,5vw,88px) 54px; overflow:clip; background:var(--ab-bg); }
.about-motion-hero__top { display:flex; justify-content:space-between; gap:28px; align-items:start; padding-right:100px; font-size:14px; line-height:1.5; }
.about-motion-hero__top > span > span { display:block; font-size:11px; color:var(--ab-soft); }
.about-motion-hero__top a { color:inherit; text-decoration:none; }
.about-motion-hero__top a span { display:block; color:var(--ab-soft); font-size:11px; }
.about-motion-hero__stage { position:relative; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; margin-top:clamp(28px,6vh,84px); }
.about-motion-hero__rows { position:relative; margin:0; text-align:center; }
.about-motion-hero__row { display:block; margin:0; line-height:1.02; }
.about-motion-hero__word { display:block; color:var(--ab-accent); font-family:'Arial Black','Helvetica Neue',Arial,sans-serif; font-size:min(clamp(46px,8.6vw,136px), var(--word-fit, 136px)); font-weight:900; letter-spacing:-.05em; white-space:nowrap; }
.about-motion-hero__zh { display:block; margin-top:2px; color:var(--ab-soft); font-size:clamp(12px,1.05vw,15px); letter-spacing:.32em; text-indent:.32em; }
.about-motion-hero__portrait { position:absolute; right:0; top:50%; width:min(34vw,430px); margin:0; transform:translateY(-50%); pointer-events:none; }
.about-motion-hero__portrait-mask { aspect-ratio:4/3; overflow:hidden; background:#171a20; }
.about-motion-hero__portrait-mask img { display:block; width:100%; height:100%; object-fit:cover; }
.about-motion-hero__portrait figcaption { display:flex; flex-wrap:wrap; gap:4px 12px; margin-top:12px; color:var(--ab-soft); font-size:11px; line-height:1.5; }
.about-motion-hero__portrait figcaption span { font-size:10px; }
.about-motion-hero__bottom { display:flex; justify-content:space-between; gap:32px; align-items:end; margin-top:clamp(24px,5vh,64px); }
.about-motion-hero__bottom > p { margin:0; font-size:clamp(18px,1.9vw,26px); line-height:1.5; letter-spacing:-.02em; }
.about-motion-hero__bottom > p > span { display:block; margin-top:12px; color:var(--ab-soft); font-size:12px; line-height:1.55; letter-spacing:0; }
.about-motion-hero__scroll { display:flex; gap:28px; align-items:center; color:inherit; text-decoration:none; font-size:12px; }
.about-motion-hero__scroll span[lang=en] { display:block; margin-top:6px; color:var(--ab-soft); font-size:10px; }
.about-motion-hero__scroll > span:last-child { font-size:32px; }
a:focus-visible { outline:2px solid var(--ab-accent); outline-offset:8px; }
@media(max-width:760px) {
  .about-motion-hero { padding:35px 22px 64px; min-height:100svh; }
  .about-motion-hero__top { padding-right:62px; font-size:12px; }
  .about-motion-hero__top a { display:none; }
  .about-motion-hero__stage { flex-direction:column; align-items:flex-start; justify-content:flex-start; margin-top:64px; gap:52px; }
  .about-motion-hero__rows { text-align:left; }
  .about-motion-hero__word { font-size:min(11.4vw, var(--word-fit, 11.4vw)); }
  .about-motion-hero__zh { letter-spacing:.2em; text-indent:.2em; }
  .about-motion-hero__portrait { position:relative; top:auto; transform:none; width:100%; pointer-events:auto; }
  .about-motion-hero__bottom { align-items:start; flex-direction:column; gap:36px; margin-top:40px; }
  .about-motion-hero__bottom > p { font-size:19px; }
  .about-motion-hero__bottom > p > span { font-size:11px; }
}
@media(max-height:600px) and (min-width:761px) { .about-motion-hero { padding-top:26px; padding-bottom:36px; }.about-motion-hero__stage { margin-top:24px; }.about-motion-hero__word { font-size:7.4vw; } }
</style>

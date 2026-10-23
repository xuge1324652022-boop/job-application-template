<template>
  <header id="about-intro" ref="root" class="about-motion-hero">
    <div class="about-motion-hero__top">
      <span>{{ IDENTITY.nameEn }}<span>{{ IDENTITY.nameZh }}</span></span>
      <a href="#contact">让我们聊聊 <span lang="en">Let’s talk ↗</span></a>
    </div>
    <div class="about-motion-hero__main">
      <p class="about-motion-hero__role">内容策划与视觉表达 <span lang="en">Content planning & visual communication</span></p>
      <h1 id="about-title" ref="title" lang="en"><span>IDEAS TO</span><span>IMAGES.</span></h1>
      <div class="about-motion-hero__bottom">
        <p>把想法做成影像<br />让内容被看见<span lang="en">From ideas to images.<br />Making content seen.</span></p>
        <a href="#profile" class="about-motion-hero__scroll"><span>向下，认识我的工作<span lang="en">Scroll to explore my practice</span></span><span aria-hidden="true">↓</span></a>
      </div>
    </div>
    <span class="about-motion-hero__edge" aria-hidden="true">About / {{ IDENTITY.initials }}</span>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { IDENTITY } from '../../数据/人物资料'
import { prepareMotionLayout } from '../../工具/动效布局调度'

const props = defineProps<{ active: boolean }>()
const root = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let entrance: gsap.core.Timeline | undefined
let cancelPreparation: (() => void) | undefined
let played = false
let dead = false
function play() {
  if (!props.active || !entrance || played) return
  played = true
  entrance.play()
}
onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (dead || !root.value || !title.value) return
    media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (played) return
      entrance = gsap.timeline({ paused: true })
        .fromTo(title.value!.children, { yPercent: 120, rotation: 5, autoAlpha: 0 },
          { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.15, stagger: .09, ease: 'expo.out', clearProps: 'transform,opacity,visibility' })
      play()
      return () => { entrance = undefined }
    }, root.value)
  })
})
watch(() => props.active, play)
onBeforeUnmount(() => { dead = true; cancelPreparation?.(); media?.revert() })
</script>

<style scoped>
.about-motion-hero { position:relative; min-height:100vh; min-height:100svh; display:flex; flex-direction:column; justify-content:space-between; padding:44px clamp(24px,5vw,88px) 54px; overflow:clip; background:var(--ab-bg); }
.about-motion-hero__top { display:flex; justify-content:space-between; gap:28px; align-items:start; padding-right:100px; font-size:14px; line-height:1.5; }
.about-motion-hero__top > span > span { display:block; font-size:11px; color:var(--ab-soft); }
.about-motion-hero__top a { color:inherit; text-decoration:none; }
.about-motion-hero__top a span { display:block; color:var(--ab-soft); font-size:11px; }
.about-motion-hero__main { width:100%; margin-top:clamp(96px,14vh,180px); }
.about-motion-hero__role { margin:0 0 36px 6px; font-size:13px; }
.about-motion-hero__role span { margin-left:20px; color:var(--ab-soft); font-size:11px; }
h1 { margin:0 0 0 -.065em; width:max-content; max-width:100%; color:var(--ab-accent); font-family:'Arial Black','Helvetica Neue',Arial,sans-serif; font-size:clamp(80px,15.65vw,260px); font-weight:900; letter-spacing:-.085em; line-height:.83; }
h1 > span { display:block; transform-origin:left bottom; }
.about-motion-hero__bottom { display:flex; justify-content:space-between; gap:32px; align-items:end; margin-top:clamp(40px,6vh,80px); }
.about-motion-hero__bottom > p { margin:0; font-size:clamp(19px,2vw,28px); line-height:1.5; letter-spacing:-.025em; }
.about-motion-hero__bottom > p > span { display:block; margin-top:14px; color:var(--ab-soft); font-size:12px; line-height:1.55; letter-spacing:0; }
.about-motion-hero__scroll { display:flex; gap:28px; align-items:center; color:inherit; text-decoration:none; font-size:12px; }
.about-motion-hero__scroll span[lang=en] { display:block; margin-top:6px; color:var(--ab-soft); font-size:10px; }
.about-motion-hero__scroll > span:last-child { font-size:32px; }
.about-motion-hero__edge { position:absolute; right:26px; top:50%; writing-mode:vertical-rl; font-size:11px; color:var(--ab-soft); }
a:focus-visible { outline:2px solid var(--ab-accent); outline-offset:8px; }
@media(min-width:1800px) { .about-motion-hero__main { max-width:1660px; margin-inline:auto; } }
@media(max-width:760px) { .about-motion-hero { padding:35px 22px 64px; min-height:95svh; }.about-motion-hero__top { padding-right:62px; font-size:12px; }.about-motion-hero__top a { display:none; }.about-motion-hero__main { margin-top:110px; }.about-motion-hero__role { margin:0 0 28px; font-size:12px; }.about-motion-hero__role span { display:block; margin:6px 0 0; font-size:10px; }h1 { font-size:16.2vw; }.about-motion-hero__bottom { align-items:start; flex-direction:column; gap:36px; margin-top:40px; }.about-motion-hero__bottom > p { font-size:20px; }.about-motion-hero__bottom > p > span { font-size:11px; }.about-motion-hero__edge { right:12px; top:48%; } }
@media(max-height:600px) and (min-width:761px) { .about-motion-hero { padding-top:26px; padding-bottom:36px; }.about-motion-hero__main { margin-top:70px; }h1 { font-size:13vw; } }
</style>

<template>
  <section ref="root" class="scroll-chapter" :aria-labelledby="`${name}-chapter-title`">
    <div ref="stage" class="scroll-chapter__stage">
      <p class="scroll-chapter__caption">{{ label.zh }}<span lang="en">{{ label.en }}</span></p>
      <div class="scroll-chapter__anchor">
        <div ref="title" class="scroll-chapter__title" :style="{ '--chapter-size': size ?? '14.6vw' }">
          <h2 :id="`${name}-chapter-title`" class="scroll-chapter__accessible">{{ heading }}</h2>
          <span v-for="i in 3" :key="i" class="scroll-chapter__row" aria-hidden="true" lang="en">{{ heading }}</span>
        </div>
      </div>
      <div ref="body" class="scroll-chapter__body">
        <p class="scroll-chapter__copy" lang="zh"><span v-for="(line, i) in lines.zh" :key="i" class="scroll-chapter__line">{{ line }}</span></p>
        <p class="scroll-chapter__translation" lang="en"><span v-for="(line, i) in lines.en" :key="i" class="scroll-chapter__line">{{ line }}</span></p>
      </div>
      <span class="scroll-chapter__cue" aria-hidden="true">↓</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Bi } from '../../data/aboutProfile'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'

const props = defineProps<{ name: string; heading: string; label: Bi; lines: { zh: readonly string[]; en: readonly string[] }; size?: string }>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
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
    media.add('(min-width: 761px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)', () => {
      const rows = gsap.utils.toArray<HTMLElement>('.scroll-chapter__row', title.value!)
      const chinese = body.value!.querySelectorAll('.scroll-chapter__copy .scroll-chapter__line')
      const english = body.value!.querySelectorAll('.scroll-chapter__translation .scroll-chapter__line')
      // Each duplicate becomes one third of the final word. Moving the clips and
      // rows together produces a continuous fold instead of overlapping glyphs.
      const timeline = gsap.timeline({ scrollTrigger: {
        id: `about-chapter-${props.name}`, trigger: root.value!, pin: stage.value!, start: 'top top',
        refreshPriority: props.name === 'identity' ? 30 : 20,
        end: () => `+=${Math.round(innerHeight * 2.6)}`, scrub: .65, invalidateOnRefresh: true,
      } })
      timeline.fromTo(rows, {
        x: i => innerWidth * [.19, -.21, .17][i]!,
        yPercent: i => (i - 1) * 104,
        clipPath: 'inset(0% 0% 0% 0%)',
      }, { x: 0, duration: .9, ease: 'power2.out' }, 0)
        .to(rows, { yPercent: 0, clipPath: i => `inset(${Math.max(0, i * 100 / 3 - .35)}% 0% ${Math.max(0, (2 - i) * 100 / 3 - .35)}% 0%)`, duration: .85, ease: 'power2.inOut' }, .95)
        .to(title.value!, { scale: .25, y: () => -innerHeight * .29, duration: .85, ease: 'power2.inOut' }, 1.95)
        .fromTo(body.value!, { y: 55, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: 'none' }, 2.2)
        .fromTo(chinese, { color: '#595b62' }, { color: '#f2f1ec', duration: .6, stagger: .26, ease: 'none' }, 2.4)
        .fromTo(english, { color: '#595b62' }, { color: '#c3c5cc', duration: .6, stagger: .26, ease: 'none' }, 2.4)
        .to({}, { duration: .4 })
    }, root.value)
    void document.fonts.ready.then(() => {
      if (!dead) cancelRefresh = requestMotionLayoutRefresh()
    })
  })
})
onBeforeUnmount(() => { dead = true; cancelPreparation?.(); cancelRefresh?.(); media?.revert() })
</script>

<style scoped>
.scroll-chapter { position:relative; background:var(--ab-bg); }
.scroll-chapter__stage { position:relative; min-height:100vh; min-height:100svh; overflow:clip; }
.scroll-chapter__caption { position:absolute; z-index:1; top:38px; left:clamp(24px,5vw,88px); font-size:12px; line-height:1.5; }
.scroll-chapter__caption span { display:block; margin-top:4px; color:var(--ab-soft); font-size:10px; }
.scroll-chapter__anchor { position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; }
.scroll-chapter__title { position:relative; width:100%; height:.86em; text-align:center; color:var(--ab-accent); font-family:'Arial Black','Helvetica Neue',Arial,sans-serif; font-size:var(--chapter-size); font-weight:900; line-height:.86; letter-spacing:-.075em; transform-origin:center; }
.scroll-chapter__accessible { position:absolute; width:1px; height:1px; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
.scroll-chapter__row { position:absolute; inset:0; display:block; white-space:nowrap; }
.scroll-chapter__body { position:relative; width:min(780px,68%); margin:0 auto; padding:40vh 0 12vh; padding-top:40svh; }
.scroll-chapter__copy,.scroll-chapter__translation { margin:0; text-align:center; }
.scroll-chapter__copy { font-size:clamp(26px,3.2vw,48px); font-weight:600; line-height:1.6; letter-spacing:-.04em; }
.scroll-chapter__translation { max-width:36em; margin:28px auto 0; color:var(--ab-soft); font-size:clamp(14px,1.4vw,20px); line-height:1.65; }
.scroll-chapter__line { display:block; }
.scroll-chapter__cue { position:absolute; left:50%; bottom:28px; color:var(--ab-soft); font-size:24px; }
/* The unanimated layout is the complete, readable fallback. */
@media(max-width:760px),(max-height:649px),(prefers-reduced-motion:reduce) {
 .scroll-chapter__stage { min-height:0; padding:90px clamp(22px,5vw,80px) 70px; }
 .scroll-chapter__caption { position:static; margin:0 0 44px; }
 .scroll-chapter__anchor { position:relative; display:block; }
 .scroll-chapter__title { height:auto; min-height:1em; font-size:clamp(36px,var(--chapter-size),150px); }
 .scroll-chapter__row { position:relative; inset:auto; }
 .scroll-chapter__row ~ .scroll-chapter__row { display:none; }
 .scroll-chapter__body { width:min(780px,100%); padding:44px 0 0; }
 .scroll-chapter__copy { font-size:clamp(23px,4vw,38px); }
 .scroll-chapter__translation { font-size:14px; margin-top:22px; }
 .scroll-chapter__cue { display:none; }
}
</style>

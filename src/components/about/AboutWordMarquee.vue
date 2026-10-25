<template>
  <section
    id="identity-words"
    ref="root"
    class="identity-words"
    :aria-label="lang === 'zh' ? '我是谁' : 'Who I am'"
  >
    <p class="identity-words__caption">
      {{ lang === 'zh' ? '不止一种身份' : 'A little more about me' }}
    </p>
    <div class="identity-words__portrait" aria-hidden="true">
      <img :src="aboutQuotePortrait.src" alt="" loading="lazy" />
    </div>
    <div class="identity-words__list">
      <h2 v-for="word in words" :key="word.en" class="identity-words__word">{{ word[lang] }}</h2>
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Lang } from '../../data/aboutProfile'
import { aboutQuotePortrait } from '../../data/personalPortfolio'
import { prepareMotionLayout } from '../../utils/motionLayout'
defineProps<{ lang: Lang }>()
const words = [
  { zh: '内容策划者', en: 'Content Planner' },
  { zh: '视觉创作者', en: 'Visual Creator' },
  { zh: '影像记录者', en: 'Visual Storyteller' },
  { zh: '剪辑爱好者', en: 'Editing Enthusiast' },
  { zh: 'AI 探索者', en: 'AI Explorer' },
  { zh: '细节观察者', en: 'Detail Observer' },
  { zh: '持续学习者', en: 'Lifelong Learner' },
  { zh: '团队协作者', en: 'Team Collaborator' },
]
const root = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancel: (() => void) | undefined
gsap.registerPlugin(ScrollTrigger)
onMounted(() => {
  if (!root.value) return
  cancel = prepareMotionLayout(root.value, () => {
    if (!root.value) return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 761px) and (prefers-reduced-motion: no-preference)',
      () => {
        gsap.utils.toArray<HTMLElement>('.identity-words__word', root.value!).forEach((word) => {
          gsap.fromTo(
            word,
            { opacity: 0.15 },
            {
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: word,
                start: 'top 78%',
                end: 'top 48%',
                scrub: true,
              },
            },
          )
        })
      },
      root.value,
    )
  })
})
onBeforeUnmount(() => {
  cancel?.()
  media?.revert()
})
</script>
<style scoped>
.identity-words {
  position: relative;
  isolation: isolate;
  overflow: clip;
  padding: 12svh 20px 22svh;
  background: #0a0a0a;
  text-align: center;
}
.identity-words__caption {
  margin-bottom: 50px;
  font-size: 14px;
}
.identity-words__list {
  position: relative;
}
.identity-words__word {
  margin: 0;
  font-size: clamp(42px, 9.4vw, 180px);
  font-weight: 700;
  letter-spacing: -0.065em;
  line-height: 1.07;
  color: #fee9ce;
}
.identity-words__portrait {
  position: absolute;
  left: -12%;
  top: 10%;
  width: 55%;
  height: 75%;
  opacity: 0.16;
  z-index: -1;
  mask-image: linear-gradient(90deg, #000, transparent);
}
.identity-words__portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1);
}
@media (max-width: 760px) {
  .identity-words {
    padding: 90px 16px 120px;
  }
  .identity-words__word {
    font-size: clamp(30px, 8vw, 60px);
    line-height: 1.3;
  }
}
</style>

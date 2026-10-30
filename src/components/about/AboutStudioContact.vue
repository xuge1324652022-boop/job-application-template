<template>
  <div class="studio-contact">
    <ContactEnd :lang="lang" />
    <section class="studio-contact__closing" :aria-label="lang === 'zh' ? '结语' : 'Closing note'">
      <blockquote ref="closingQuote">“{{ TAGLINE[lang] }}”</blockquote>
      <p class="studio-contact__signature" lang="en">{{ IDENTITY.nameEn }}</p>
    </section>
    <div class="studio-contact__base">
      <RouterLink :to="{ path: '/', query: route.query }"
        >{{ lang === 'zh' ? '作品集首页' : 'Portfolio' }} ↗</RouterLink
      >
      <RouterLink :to="{ path: '/about', query: route.query, hash: '#beyond-work' }"
        >{{ lang === 'zh' ? '个人摄影' : 'Photography' }} ↗</RouterLink
      >
      <button type="button" @click="toTop">
        {{ lang === 'zh' ? '回到顶部' : 'Back to top' }} ↑
      </button>
      <span>© {{ new Date().getFullYear() }} {{ IDENTITY.nameEn }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ContactEnd from './ContactEnd.vue'
import { useFitText } from '../../composables/useFitText'
import { IDENTITY, TAGLINE, type Lang } from '../../data/aboutProfile'
import { motionScrollBehavior } from '../../utils/motion'
defineProps<{ lang: Lang }>()
const closingQuote = ref<HTMLElement | null>(null)
useFitText(closingQuote, { min: 1, max: 108 })
const route = useRoute()
function toTop() {
  window.scrollTo({
    top: 0,
    behavior: motionScrollBehavior(),
  })
}
</script>
<style scoped>
.studio-contact {
  background: var(--about-night);
  color: var(--about-on-night);
}
.studio-contact__closing {
  min-height: 80svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 8vw;
  text-align: center;
  gap: clamp(32px, 5vw, 70px);
}
.studio-contact__closing blockquote {
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  font-size: clamp(12px, 4vw, 108px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.05em;
  margin: 0;
}
.studio-contact__signature {
  position: relative;
  margin: 0;
  padding: 0 0.15em 0.3em;
  color: var(--about-accent-on-night);
  font-family: 'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive;
  font-size: clamp(28px, 4vw, 58px);
  font-weight: 400;
  font-style: italic;
  line-height: 1.4;
  letter-spacing: -0.055em;
  white-space: nowrap;
  transform: rotate(-7deg);
}
.studio-contact__signature::after {
  content: '';
  position: absolute;
  left: 8%;
  right: -3%;
  bottom: 0.1em;
  height: 0.18em;
  border-bottom: 1px solid currentColor;
  border-radius: 50%;
  transform: rotate(-3deg);
}
.studio-contact__base {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  padding: 30px 20px;
  border-top: 1px solid var(--about-line-on-night);
  font-size: 14px;
}
/*
 * 页尾三个导航原本是 14px 行内文本，命中高只有 22px（文字内容区）。
 * 统一抬到 44px 最小高度：flex 容器本就 align-items:center，文字位置不变。
 */
.studio-contact__base a,
.studio-contact__base button {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--about-accent-on-night);
  text-decoration: none;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.studio-contact__base > span {
  margin-left: auto;
  color: var(--about-soft-on-night);
  font-size: 12px;
}
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--about-accent-on-night);
  outline-offset: 7px;
}
@media (max-width: 760px) {
  .studio-contact__closing {
    min-height: 0;
    padding: 64px 6vw;
    gap: 32px;
  }
  .studio-contact__base {
    gap: 20px;
  }
  .studio-contact__base > span {
    width: 100%;
    margin: 0;
  }
}
</style>

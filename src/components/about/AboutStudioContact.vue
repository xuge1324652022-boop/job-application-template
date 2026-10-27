<template>
  <footer id="contact" class="studio-contact">
    <section class="studio-contact__scene" aria-labelledby="contact-title">
      <img
        v-if="contactPhoto"
        class="studio-contact__environment"
        :src="contactPhoto.src"
        :srcset="visualImageSources(contactPhoto)"
        sizes="100vw"
        :width="contactPhoto.width"
        :height="contactPhoto.height"
        alt=""
        loading="lazy"
      />
      <h2 id="contact-title" class="studio-contact__title" lang="en">
        <span>LET’S</span><span>HAVE</span><span>A</span><span>CHAT</span>
      </h2>
      <div class="studio-contact__links">
        <div>
          <p>{{ lang === 'zh' ? '邮件联系' : 'Email me' }}</p>
          <a :href="`mailto:${CONTACT.email}`">{{ CONTACT.email }}</a>
        </div>
        <div v-if="phones.length" class="studio-contact__phones">
          <p>{{ lang === 'zh' ? '电话联系' : 'Call me' }}</p>
          <a v-for="phone in phones" :key="phone" :href="`tel:${phone}`">{{ phone }}</a>
        </div>
        <div v-if="CONTACT.resume">
          <p>{{ lang === 'zh' ? '个人简历' : 'Résumé' }}</p>
          <a :href="CONTACT.resume" :download="`${IDENTITY.nameEn}-resume.pdf`">{{
            lang === 'zh' ? '下载简历 PDF' : 'Download résumé'
          }}</a>
        </div>
        <div>
          <p>{{ lang === 'zh' ? '继续浏览' : 'Explore' }}</p>
          <RouterLink :to="{ path: '/about', query: route.query, hash: '#stories' }">{{
            lang === 'zh' ? '查看作品' : 'Selected work'
          }}</RouterLink>
        </div>
      </div>
    </section>
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
  </footer>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { personalPortfolio } from '../../data/personalPortfolio'
import { visualImageSources } from '../../utils/responsiveImage'
import { useFitText } from '../../composables/useFitText'
import { CONTACT, IDENTITY, TAGLINE, type Lang } from '../../data/aboutProfile'
const contactPhoto = personalPortfolio?.profile.aboutMedia?.contact
const phones = 'phones' in CONTACT ? (CONTACT.phones ?? []) : []
defineProps<{ lang: Lang }>()
const closingQuote = ref<HTMLElement | null>(null)
useFitText(closingQuote, { min: 1, max: 108 })
const route = useRoute()
function toTop() {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
</script>
<style scoped>
.studio-contact {
  background: var(--about-night);
  color: var(--about-on-night);
}
.studio-contact__scene {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 20px 24px;
  isolation: isolate;
  overflow: clip;
}
.studio-contact__environment {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) brightness(0.32);
  z-index: -2;
}
.studio-contact__scene::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(rgb(18 20 15 / 0.13), rgb(18 20 15 / 0.33) 50%, var(--about-night));
  z-index: -1;
}
.studio-contact__title {
  color: var(--about-accent-on-night);
  font-size: clamp(70px, min(14vw, 19svh), 270px);
  font-family: var(--display-font);
  font-weight: 700;
  line-height: 0.87;
  letter-spacing: -0.065em;
  margin: 0 0 8svh;
}
.studio-contact__title span {
  display: block;
}
.studio-contact__title span:nth-child(1) {
  padding-left: 24%;
}
.studio-contact__title span:nth-child(2) {
  padding-left: 0;
}
.studio-contact__title span:nth-child(3) {
  text-align: right;
  padding-right: 5%;
}
.studio-contact__title span:nth-child(4) {
  padding-left: 41%;
}
.studio-contact__links {
  display: flex;
  flex-wrap: wrap;
  gap: 28px 5vw;
  margin-inline: -20px;
  padding: 24px 20px;
  background: var(--about-night);
}
.studio-contact__links > div {
  min-width: 0;
  max-width: 100%;
}
.studio-contact__phones a {
  display: block;
  margin-bottom: 14px;
  white-space: nowrap;
}
.studio-contact__links p {
  color: var(--about-sand);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}
.studio-contact__links a {
  font-size: clamp(20px, 2.3vw, 40px);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--about-on-night);
  text-decoration-thickness: 1px;
  text-underline-offset: 10px;
  overflow-wrap: anywhere;
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
.studio-contact__base a,
.studio-contact__base button {
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
  .studio-contact__scene {
    min-height: 80svh;
    padding: 36px 18px 24px;
  }
  .studio-contact__title {
    font-size: 18vw;
    margin-bottom: 32px;
  }
  .studio-contact__title span:nth-child(4) {
    padding-left: 28%;
  }
  .studio-contact__links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 16px;
    margin-inline: -18px;
    padding-inline: 18px;
  }
  .studio-contact__links > div:first-child {
    grid-column: 1 / -1;
  }
  .studio-contact__closing {
    min-height: 0;
    padding: 64px 6vw;
    gap: 32px;
  }
  .studio-contact__links a {
    font-size: 18px;
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

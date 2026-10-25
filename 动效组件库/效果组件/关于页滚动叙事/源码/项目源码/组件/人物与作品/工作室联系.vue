<template>
  <footer id="contact" class="studio-contact">
    <section class="studio-contact__scene" aria-labelledby="contact-title">
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
      <blockquote>
        <span v-for="(line, i) in quoteLines" :key="line" class="studio-contact__quote-line"
          >{{ i === 0 ? '“' : '' }}{{ line }}{{ i === quoteLines.length - 1 ? '”' : '' }}</span
        >
      </blockquote>
      <p class="studio-contact__signature">{{ IDENTITY.nameZh }}</p>
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
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CONTACT, IDENTITY, TAGLINE, type Lang } from '../../数据/人物资料'
const phones = 'phones' in CONTACT ? (CONTACT.phones ?? []) : []
const props = defineProps<{ lang: Lang }>()
const quoteLines = computed(
  () =>
    TAGLINE[props.lang]
      .match(/[^，。.!?]+[，。.!?]?/g)
      ?.map((line) => line.trim())
      .filter(Boolean) ?? [],
)
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
  background: #0a0a0a;
  color: #fee9ce;
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
.studio-contact__title {
  color: #ef5143;
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
  background: #0a0a0a;
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
  color: #ffb15f;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}
.studio-contact__links a {
  font-size: clamp(20px, 2.3vw, 40px);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #fee9ce;
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
  gap: 70px;
}
.studio-contact__closing blockquote {
  max-width: 1100px;
  font-size: clamp(26px, 5.625vw, 108px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.05em;
  margin: 0;
}
.studio-contact__quote-line {
  display: block;
  white-space: nowrap;
}
.studio-contact__signature {
  color: #ffb15f;
  font: italic 42px/1.2 cursive;
  transform: rotate(-12deg);
}
.studio-contact__base {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  padding: 30px 20px;
  border-top: 1px solid #fee9ce18;
  font-size: 14px;
}
.studio-contact__base a,
.studio-contact__base button {
  color: #ef5143;
  text-decoration: none;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.studio-contact__base > span {
  margin-left: auto;
  color: #fee9ce88;
  font-size: 12px;
}
a:focus-visible,
button:focus-visible {
  outline: 2px solid #ffb15f;
  outline-offset: 7px;
}
@media (max-width: 760px) {
  .studio-contact__scene {
    min-height: 100svh;
    padding: 60px 18px 32px;
  }
  .studio-contact__title {
    font-size: 21vw;
    margin-bottom: 100px;
  }
  .studio-contact__title span:nth-child(4) {
    padding-left: 28%;
  }
  .studio-contact__links {
    flex-direction: column;
    gap: 25px;
    margin-inline: -18px;
    padding-inline: 18px;
  }
  .studio-contact__links a {
    font-size: 21px;
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

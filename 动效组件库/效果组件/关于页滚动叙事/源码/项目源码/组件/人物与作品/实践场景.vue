<template>
  <section v-if="INDUSTRIES.length" id="industries" class="studio-industries">
    <h2>{{ lang === 'zh' ? '实践场景' : 'Fields of practice' }}</h2>
    <p>
      {{
        lang === 'zh' ? '来自已有项目与实习经历' : 'Drawn from existing projects and internships'
      }}
    </p>
    <div v-if="projectVisuals.length" class="studio-industries__visuals">
      <a v-for="item in projectVisuals" :key="item.id" href="#stories">
        <img
          :src="item.src"
          :srcset="visualImageSources(item)"
          sizes="(max-width: 760px) 42vw, 42vw"
          :width="item.width"
          :height="item.height"
          :alt="pick(item.alt, lang)"
          loading="lazy"
        />
        <span>{{ pick(item.title, lang) }}</span>
      </a>
    </div>
    <ul>
      <li v-for="item in INDUSTRIES" :key="item.id">
        <a :href="`#work-${item.workId}`">{{ pick(item.name, lang) }}</a>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import { INDUSTRIES, pick, type Lang } from '../../数据/人物资料'
import { personalPortfolio } from '../../数据/本机个人内容接口'
import { visualImageSources } from '../../工具/响应式图片'
const projectVisuals = personalPortfolio?.selectedWorks.slice(0, 2) ?? []
defineProps<{ lang: Lang }>()
</script>
<style scoped>
.studio-industries {
  padding: 8svh 6vw;
  background: var(--about-paper);
  color: var(--about-ink-on-paper);
}
.studio-industries__visuals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin: 32px 0;
}
.studio-industries__visuals a {
  padding: 0;
  border: 0;
  font-size: 14px;
}
.studio-industries__visuals img {
  width: 100%;
  height: clamp(120px, 22vw, 320px);
  object-fit: cover;
  display: block;
  margin-bottom: 12px;
}
h2 {
  color: var(--about-accent-on-paper);
  font-size: clamp(36px, 6vw, 90px);
  line-height: 1.1;
  margin-bottom: 24px;
}
p {
  color: var(--about-soft-on-paper);
  margin-bottom: 40px;
  font-size: 16px;
}
ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
a {
  display: block;
  color: inherit;
  border-top: 1px solid var(--about-line-on-paper);
  padding: 24px 0;
  min-height: 44px;
  font-size: clamp(20px, 2.4vw, 36px);
  text-decoration: none;
}
a:hover {
  color: var(--about-accent-on-paper);
}
a:focus-visible {
  outline: 2px solid var(--about-accent-on-paper);
  outline-offset: 4px;
}
@media (max-width: 760px) {
  ul {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}
</style>

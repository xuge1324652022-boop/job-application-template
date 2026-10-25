<template>
  <section v-if="INDUSTRIES.length" id="industries" class="studio-industries">
    <h2>{{ lang === 'zh' ? '实践场景' : 'Fields of practice' }}</h2>
    <p>
      {{
        lang === 'zh' ? '来自已有项目与实习经历' : 'Drawn from existing projects and internships'
      }}
    </p>
    <ul>
      <li v-for="item in INDUSTRIES" :key="item.id">
        <a :href="`#work-${item.workId}`">{{ pick(item.name, lang) }}</a>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import { INDUSTRIES, pick, type Lang } from '../../数据/人物资料'
defineProps<{ lang: Lang }>()
</script>
<style scoped>
.studio-industries {
  padding: 8svh 6vw;
  background: #0a0a0a;
  color: #fee9ce;
}
h2 {
  font-size: clamp(36px, 6vw, 90px);
  line-height: 1.1;
  margin-bottom: 24px;
}
p {
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
  border-top: 1px solid #fee9ce55;
  padding: 24px 0;
  min-height: 44px;
  font-size: clamp(20px, 2.4vw, 36px);
  text-decoration: none;
}
a:hover {
  color: #ffb15f;
}
a:focus-visible {
  outline: 2px solid #ffb15f;
  outline-offset: 4px;
}
@media (max-width: 760px) {
  ul {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}
</style>

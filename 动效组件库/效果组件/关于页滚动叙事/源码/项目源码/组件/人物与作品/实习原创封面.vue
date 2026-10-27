<template>
  <div class="internship-cover">
    <div class="internship-cover__header">
      <span>{{ String(index + 1).padStart(2, '0') }}</span>
      <span>{{ pick(experience.period, lang) }}</span>
    </div>
    <div class="internship-cover__body">
      <strong>{{ pick(experience.company, lang) }}</strong>
      <span>{{ pick(experience.role, lang) }}</span>
    </div>
    <div class="internship-cover__results">
      <span v-for="metric in experience.cardMetrics?.slice(0, 3)" :key="metric.label.en">
        <b>{{ metric.value }}</b
        ><small>{{ pick(metric.label, lang) }}</small>
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { pick, type Experience, type Lang } from '../../数据/人物资料'
defineProps<{ experience: Experience; index: number; lang: Lang }>()
</script>
<style scoped>
.internship-cover {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6%;
  background: var(--about-night);
  color: var(--about-on-night);
  border: 1px solid var(--about-line-on-night);
}
.internship-cover__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--about-soft-on-night);
  font-size: clamp(10px, 2.8cqw, 26px);
}
.internship-cover__header > span:first-child {
  font: 700 clamp(22px, 8cqw, 100px)/1 var(--display-font);
  color: var(--about-accent-on-night);
}
.internship-cover__body {
  display: grid;
  gap: 2cqw;
  padding: 3cqw 0;
}
.internship-cover__body strong {
  font-size: clamp(16px, 5.5cqw, 74px);
  line-height: 1.2;
  letter-spacing: -0.035em;
}
.internship-cover__body > span {
  font-size: clamp(10px, 2.9cqw, 32px);
  color: var(--about-accent-on-night);
}
.internship-cover__results {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-top: 3cqw;
  border-top: 1px solid var(--about-line-on-night);
}
.internship-cover__results > span {
  display: grid;
  gap: 1cqw;
}
.internship-cover__results b {
  font-size: clamp(16px, 5.4cqw, 70px);
  line-height: 1;
}
.internship-cover__results small {
  font-size: clamp(9px, 2.3cqw, 25px);
  color: var(--about-soft-on-night);
}
</style>

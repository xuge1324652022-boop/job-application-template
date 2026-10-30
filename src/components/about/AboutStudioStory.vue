<template>
  <div class="studio-story">
    <section id="experience-reveal" class="studio-experience">
      <AboutInternshipCards
        :lang="lang"
        :images="images"
        @open="(item, trigger) => emit('open', item, trigger)"
        @refresh="refresh"
      />
    </section>
    <section id="achievements" class="studio-achievements">
      <h2>{{ lang === 'zh' ? '让想法成为作品' : 'Ideas, made visible.' }}</h2>
      <article
        v-for="(work, i) in projects"
        :key="work.id"
        :id="i === projects.length - 1 ? 'beyond-work' : undefined"
        class="studio-project"
        :class="{ 'studio-project--reverse': i % 2 }"
      >
        <button
          type="button"
          :aria-label="pick(projectImage(i).title, lang)"
          @click="open(projectImage(i), $event)"
        >
          <img
            :src="projectImage(i).src"
            :srcset="visualImageSources(projectImage(i))"
            sizes="(max-width: 760px) 90vw, 48vw"
            :alt="pick(projectImage(i).alt, lang)"
            :width="projectImage(i).width"
            :height="projectImage(i).height"
            loading="lazy"
            @load="refresh"
          />
        </button>
        <div>
          <p class="studio-meta">{{ pick(work.org, lang) }}</p>
          <h3>{{ pick(work.title, lang) }}</h3>
          <p class="studio-copy">{{ pick(work.summary, lang) }}</p>
        </div>
      </article>
    </section>
    <section id="process" class="studio-practice">
      <header>
        <h2>{{ lang === 'zh' ? '创作方向' : 'Practice' }}</h2>
        <p>
          {{ lang === 'zh' ? '从策划、画面到交付' : 'From planning to production and delivery' }}
        </p>
      </header>
      <div class="studio-practice__list">
        <details v-for="capability in CAPABILITIES" :key="capability.id" @toggle="refresh">
          <summary>{{ pick(capability.title, lang) }}</summary>
          <p>{{ pick(capability.desc, lang) }}</p>
          <a :href="`#work-${capability.workId}`">{{
            lang === 'zh' ? '查看相关实践' : 'Explore the work'
          }}</a>
        </details>
      </div>
      <p class="studio-practice__tools">
        {{ lang === 'zh' ? '工具与协作：' : 'Tools & collaboration: '
        }}{{
          pick(
            RESUME_SKILLS.find((skill) => skill.id === 'post-production')?.body ??
              RESUME_SKILLS[0]!.body,
            lang,
          )
        }}
      </p>
    </section>
    <section id="recognition" class="studio-background" aria-labelledby="background-title">
      <header class="studio-background__cover">
        <p>{{ lang === 'zh' ? '教育、方法与交流' : 'Education, methods & conversation' }}</p>
        <h2 id="background-title">{{ lang === 'zh' ? '个人背景' : 'Background' }}</h2>
      </header>
      <details id="profile" class="studio-background__group" open @toggle="refresh">
        <summary>{{ lang === 'zh' ? '个人信息' : 'Profile' }}</summary>
        <dl class="studio-background__facts">
          <div v-for="(fact, i) in FACTS" :key="i">
            <dt>{{ pick(fact.k, lang) }}</dt>
            <dd>{{ pick(fact.v, lang) }}</dd>
          </div>
        </dl>
      </details>
      <details id="ai-workflow" class="studio-background__group" @toggle="refresh">
        <summary>{{ lang === 'zh' ? '技能与方法' : 'Skills & methods' }}</summary>
        <div v-for="skill in RESUME_SKILLS" :key="skill.id" class="studio-background__row">
          <h3>{{ pick(skill.title, lang) }}</h3>
          <p>{{ pick(skill.body, lang) }}</p>
        </div>
      </details>
      <details class="studio-background__group" @toggle="refresh">
        <summary>{{ lang === 'zh' ? '交流与协作' : 'Conversation' }}</summary>
        <div v-for="(pair, i) in CHAT" :key="i" class="studio-background__row">
          <h3>{{ pick(pair.q, lang) }}</h3>
          <p>{{ pick(pair.a, lang) }}</p>
        </div>
      </details>
      <details
        v-if="RECOGNITION.length"
        id="honours"
        class="studio-background__group"
        @toggle="refresh"
      >
        <summary>{{ lang === 'zh' ? '荣誉与认可' : 'Recognition' }}</summary>
        <div v-for="item in RECOGNITION" :key="item.id" class="studio-background__row">
          <h3>{{ pick(item.title, lang) }}</h3>
          <p>{{ pick(item.note, lang) }}</p>
        </div>
      </details>
    </section>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import {
  WORKS,
  CAPABILITIES,
  FACTS,
  RESUME_SKILLS,
  RECOGNITION,
  CHAT,
  pick,
  type Lang,
} from '../../data/aboutProfile'
import AboutInternshipCards from './AboutInternshipCards.vue'
import { personalPortfolio } from '../../data/personalPortfolio'
import { editorial, photography, type VisualAsset } from '../../data/visualPortfolio'
import { visualImageSources } from '../../utils/responsiveImage'
import { requestMotionLayoutRefresh } from '../../utils/motionLayout'
const props = defineProps<{ lang: Lang }>()
const emit = defineEmits<{ open: [item: VisualAsset, trigger: HTMLElement] }>()
const images = personalPortfolio?.selectedWorks.length
  ? personalPortfolio.selectedWorks
  : [...editorial, ...photography].slice(0, 7)
// Keep each image attached to its authored story; array order is not a project association.
const projects = personalPortfolio?.storyPanels.length
  ? personalPortfolio.storyPanels.map((panel) => ({
      id: panel.key,
      title: panel.title,
      org: panel.label,
      summary: panel.copy,
      image: images.find((image) => image.id === panel.assetId) ?? images[0]!,
    }))
  : WORKS.map((work) => ({
      ...work,
      image: {
        id: work.id,
        title: work.title,
        alt: work.title,
        src: work.cover,
        thumb: work.cover,
        large: work.cover,
        width: 1200,
        height: 900,
      },
    }))
const projectImage = (i: number) => projects[i]!.image
function open(item: VisualAsset, event: MouseEvent) {
  emit('open', item, event.currentTarget as HTMLElement)
}
let cancelRefresh: (() => void) | undefined
let disposed = false
function refresh() {
  if (disposed) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}
onMounted(refresh)
watch(
  () => props.lang,
  async () => {
    await nextTick()
    refresh()
  },
)
onBeforeUnmount(() => {
  disposed = true
  cancelRefresh?.()
})
</script>
<style scoped>
.studio-story {
  --studio-paper: var(--about-paper);
  --studio-red: var(--about-accent-on-paper);
  --studio-black: var(--about-ink-on-paper);
}
.studio-experience {
  background: var(--studio-paper);
  color: var(--studio-black);
  padding: 8svh 0;
}
.studio-meta {
  color: var(--about-soft-on-paper);
  font-size: 12px;
  margin: 0 0 16px;
}
.studio-copy {
  font-size: clamp(20px, 2.25vw, 38px);
  line-height: 1.35;
  letter-spacing: -0.035em;
}
.studio-achievements {
  padding: 12vw 6vw;
  background: var(--studio-paper);
  color: var(--studio-black);
}
.studio-achievements > h2 {
  color: var(--about-accent-on-paper);
  font-size: clamp(40px, 7vw, 134px);
  line-height: 1.1;
  letter-spacing: -0.06em;
  text-align: center;
  margin-bottom: 12vw;
}
.studio-project {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 7vw;
  margin: 0 0 13vw;
}
.studio-project:last-child {
  margin-bottom: 0;
}
.studio-project--reverse > button {
  order: 2;
}
.studio-project button {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.studio-project img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 70svh;
  object-fit: contain;
}
.studio-project h3 {
  font-size: clamp(28px, 3vw, 48px);
  line-height: 1.2;
  letter-spacing: -0.04em;
  margin-bottom: 24px;
}
.studio-practice {
  position: relative;
  background: var(--studio-paper);
  color: var(--studio-black);
  padding: 10vw 5vw 8vw;
  text-align: center;
  overflow: clip;
}
.studio-practice header h2 {
  color: var(--about-accent-on-paper);
  font-size: clamp(64px, 15vw, 280px);
  line-height: 0.95;
  font-weight: 700;
  letter-spacing: -0.065em;
  margin-bottom: 35px;
}
.studio-practice header p {
  font-size: 16px;
  margin-bottom: 65px;
}
.studio-practice__list summary {
  font-size: clamp(36px, 5.625vw, 108px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.055em;
  cursor: pointer;
  list-style: none;
  padding: 6px 0;
}
summary::-webkit-details-marker {
  display: none;
}
.studio-practice__list summary:hover,
.studio-practice__list details[open] summary {
  color: var(--about-accent-on-paper);
}
.studio-practice__list details > p {
  width: min(700px, 90%);
  margin: 24px auto 14px;
  font-size: 20px;
  line-height: 1.6;
}
/*
 * 折叠面板里的「查看相关实践」原本是 96×26 的纯文本链接，手指很难点中。
 * 改成 inline-flex + 44px 最小高度：文字位置不变，命中区从 26 抬到 44。
 * 它是 <details> 里最后一个元素，且面板默认收起，不影响首屏排版。
 */
.studio-practice__list a {
  color: inherit;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: 32px;
  text-underline-offset: 6px;
}
.studio-practice__tools {
  max-width: 760px;
  margin: 48px auto 0;
  font-size: 15px;
  line-height: 1.8;
}
.studio-background {
  padding: clamp(48px, 7vw, 100px) 8%;
  background: var(--studio-paper);
  color: var(--studio-black);
}
.studio-background__cover {
  margin-bottom: 40px;
}
.studio-background__cover p {
  font-size: 14px;
}
.studio-background__cover h2 {
  color: var(--studio-red);
  font-size: clamp(40px, 7vw, 100px);
  line-height: 1.1;
  letter-spacing: -0.05em;
  margin: 16px 0;
}
.studio-background__group {
  border-top: 1px solid #1b1c1833;
  scroll-margin-top: 76px;
}
.studio-background__group:last-child {
  border-bottom: 1px solid #1b1c1833;
}
.studio-background__group > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 0;
  min-height: 64px;
  list-style: none;
  cursor: pointer;
  font-size: clamp(22px, 2.4vw, 34px);
  font-weight: 700;
}
.studio-background__group > summary::after {
  content: '+';
  font-weight: 400;
}
.studio-background__group[open] > summary::after {
  content: '−';
}
.studio-background__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px 6vw;
  padding: 8px 0 32px;
}
.studio-background__facts dt,
.studio-background__row h3 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
}
.studio-background__facts dd,
.studio-background__row p {
  font-size: 16px;
  line-height: 1.7;
  margin: 0;
}
.studio-background__row {
  max-width: 800px;
  padding: 8px 0 28px;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 6px;
}
@media (max-width: 760px) {
  .studio-experience {
    padding: 56px 0;
  }
  .studio-achievements {
    padding: 56px 6vw;
  }
  .studio-achievements > h2 {
    color: var(--about-accent-on-paper);
    margin-bottom: 40px;
  }
  .studio-project {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 48px;
  }
  .studio-project img {
    max-height: 260px;
  }
  .studio-project h3 {
    margin-bottom: 16px;
  }
  .studio-project--reverse > button {
    order: 0;
  }
  .studio-copy {
    font-size: 18px;
    line-height: 1.5;
  }
  .studio-practice {
    padding: 56px 5vw;
  }
  .studio-practice header h2 {
    color: var(--about-accent-on-paper);
    font-size: 17vw;
  }
  .studio-practice header p {
    margin-bottom: 32px;
  }
  .studio-practice__list summary {
    font-size: 9vw;
  }
  .studio-practice__list details > p {
    font-size: 16px;
  }
  .studio-background {
    padding: 48px 6vw;
  }
  .studio-background__cover {
    margin-bottom: 24px;
  }
  .studio-background__facts {
    grid-template-columns: 1fr;
    gap: 16px;
    padding-bottom: 24px;
  }
  .studio-background__facts > div {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 16px;
  }
  .studio-background__group > summary {
    padding: 18px 0;
    font-size: 24px;
  }
}
</style>

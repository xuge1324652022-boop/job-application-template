<template>
  <div ref="root" class="studio-story">
    <section id="experience-reveal" class="studio-experience">
      <div id="identity" class="studio-experience__intro">
        <p v-for="(line, i) in PROFILE_LINES" :key="i" class="studio-statement">
          {{ pick(line, lang) }}
        </p>
      </div>
      <div
        id="stories"
        class="studio-ribbon"
        :aria-label="lang === 'zh' ? '精选作品' : 'Selected work'"
      >
        <div class="studio-ribbon__track">
          <button v-for="item in images" :key="item.id" type="button" @click="open(item, $event)">
            <img
              :src="item.src"
              :srcset="visualImageSources(item)"
              sizes="(max-width: 760px) 65vw, 28vw"
              :width="item.width"
              :height="item.height"
              :alt="pick(item.alt, lang)"
              loading="lazy"
              @load="refresh"
            />
          </button>
        </div>
      </div>
      <div id="experience" class="studio-experience__history">
        <article
          v-for="experience in EXPERIENCE"
          :id="`work-${experience.workId}`"
          :key="experience.id"
        >
          <p class="studio-meta">{{ pick(experience.period, lang) }}</p>
          <h2>{{ pick(experience.company, lang) }}</h2>
          <p class="studio-role">{{ pick(experience.role, lang) }}</p>
          <p class="studio-copy">{{ pick(experience.focus, lang) }}</p>
          <details @toggle="refresh">
            <summary>
              {{ lang === 'zh' ? '完整经历' : 'Full experience' }}<span aria-hidden="true">＋</span>
            </summary>
            <div v-for="(detail, index) in experience.details" :key="index" class="studio-detail">
              <h3>{{ pick(detail.title, lang) }}</h3>
              <p>{{ pick(detail.body, lang) }}</p>
            </div>
          </details>
        </article>
      </div>
    </section>
    <section id="achievements" class="studio-achievements">
      <h2>{{ lang === 'zh' ? '让想法成为作品' : 'Ideas, made visible.' }}</h2>
      <article
        v-for="(work, i) in projects"
        :key="work.id"
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
      <div class="studio-practice__tags" aria-hidden="true">
        <span v-for="skill in RESUME_SKILLS" :key="skill.id">{{ pick(skill.title, lang) }}</span>
      </div>
    </section>
    <section id="recognition" ref="recognition" class="studio-background">
      <div ref="recognitionStage" class="studio-background__stage">
        <div ref="recognitionTrack" class="studio-background__track">
          <header class="studio-background__cover">
            <p>{{ lang === 'zh' ? '关于我的更多信息' : 'A closer look' }}</p>
            <h2>{{ lang === 'zh' ? '个人履历' : 'Background' }}</h2>
            <span aria-hidden="true">↗</span>
          </header>
          <article id="profile" class="studio-background__panel">
            <h3>{{ lang === 'zh' ? '个人信息' : 'Profile' }}</h3>
            <dl>
              <div v-for="(fact, i) in FACTS" :key="i">
                <dt>{{ pick(fact.k, lang) }}</dt>
                <dd>{{ pick(fact.v, lang) }}</dd>
              </div>
            </dl>
          </article>
          <article id="ai-workflow" class="studio-background__panel">
            <h3>{{ lang === 'zh' ? '技能与方法' : 'Skills & methods' }}</h3>
            <div>
              <section
                v-for="skill in RESUME_SKILLS"
                :key="skill.id"
                class="studio-background__row"
              >
                <h4>{{ pick(skill.title, lang) }}</h4>
                <p>{{ pick(skill.body, lang) }}</p>
              </section>
            </div>
          </article>
          <article class="studio-background__panel">
            <h3>{{ lang === 'zh' ? '交流与协作' : 'Conversation' }}</h3>
            <div>
              <section v-for="(pair, i) in CHAT" :key="i" class="studio-background__row">
                <h4>{{ pick(pair.q, lang) }}</h4>
                <p>{{ pick(pair.a, lang) }}</p>
              </section>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  PROFILE_LINES,
  EXPERIENCE,
  WORKS,
  CAPABILITIES,
  FACTS,
  RESUME_SKILLS,
  CHAT,
  pick,
  type Lang,
} from '../../data/aboutProfile'
import { personalPortfolio } from '../../data/personalPortfolio'
import { editorial, photography, type VisualAsset } from '../../data/visualPortfolio'
import { visualImageSources } from '../../utils/responsiveImage'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
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
const root = ref<HTMLElement | null>(null)
const recognition = ref<HTMLElement | null>(null)
const recognitionStage = ref<HTMLElement | null>(null)
const recognitionTrack = ref<HTMLElement | null>(null)
let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let disposed = false
function refresh() {
  if (disposed) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}
gsap.registerPlugin(ScrollTrigger)
onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    if (disposed || !root.value) return
    media = gsap.matchMedia()
    media.add(
      '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
      () => {
        const el = root.value!
        gsap.utils.toArray<HTMLElement>('.studio-statement', el).forEach((line) => {
          gsap.fromTo(
            line,
            { opacity: 0.22 },
            {
              opacity: 1,
              ease: 'none',
              scrollTrigger: { trigger: line, start: 'top 85%', end: 'bottom 65%', scrub: true },
            },
          )
        })
        const ribbon = el.querySelector<HTMLElement>('.studio-ribbon__track')!
        gsap.to(ribbon, {
          x: () => -Math.max(0, ribbon.scrollWidth - el.clientWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: ribbon.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        const track = recognitionTrack.value!
        gsap.to(track, {
          x: () => -Math.max(0, track.scrollWidth - recognitionStage.value!.clientWidth),
          ease: 'none',
          scrollTrigger: {
            id: 'about-background-horizontal',
            trigger: recognition.value!,
            pin: recognitionStage.value!,
            start: 'top top',
            end: () =>
              `+=${Math.max(1, track.scrollWidth - recognitionStage.value!.clientWidth) * 1.25}`,
            scrub: 0.35,
            invalidateOnRefresh: true,
            refreshPriority: 10,
          },
        })
      },
      root.value,
    )
    refresh()
  })
})
watch(
  () => props.lang,
  async () => {
    await nextTick()
    refresh()
  },
)
onBeforeUnmount(() => {
  disposed = true
  cancelPreparation?.()
  cancelRefresh?.()
  media?.revert()
})
</script>
<style scoped>
.studio-story {
  --studio-paper: #fee9ce;
  --studio-red: #ef5143;
  --studio-black: #0a0a0a;
}
.studio-experience {
  background: var(--studio-paper);
  color: var(--studio-black);
  padding: 14svh 0 18svh;
}
.studio-experience__intro {
  width: min(1120px, 83%);
  margin: 0 auto 14svh;
  text-align: center;
}
.studio-statement {
  font-size: clamp(32px, 5.625vw, 108px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 1.12;
  color: var(--studio-red);
  margin-bottom: 0.7em;
}
.studio-ribbon {
  overflow: hidden;
  padding: 4vw 0 9vw;
}
.studio-ribbon__track {
  display: flex;
  gap: 24px;
  width: max-content;
  transform: rotate(-5deg);
}
.studio-ribbon button {
  width: 28vw;
  height: 24vw;
  min-width: 220px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.studio-ribbon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.studio-experience__history {
  max-width: 1240px;
  width: 84%;
  margin: 6vw auto 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7vw;
}
.studio-experience__history article {
  scroll-margin-top: 40px;
}
.studio-meta {
  font-size: 12px;
  margin: 0 0 16px;
}
.studio-experience__history h2 {
  font-size: clamp(26px, 2.5vw, 44px);
  line-height: 1.2;
  letter-spacing: -0.04em;
}
.studio-role {
  margin: 12px 0 24px;
  font-size: 15px;
}
.studio-copy {
  font-size: clamp(20px, 2.25vw, 38px);
  line-height: 1.35;
  letter-spacing: -0.035em;
}
.studio-experience details {
  margin-top: 24px;
  border-top: 1px solid #0a0a0a22;
}
.studio-experience summary {
  padding: 16px 0;
  font-size: 13px;
  cursor: pointer;
}
.studio-experience summary span {
  float: right;
}
.studio-detail {
  margin: 22px 0;
  font-size: 15px;
  line-height: 1.8;
}
.studio-detail h3 {
  font-size: 17px;
  margin-bottom: 8px;
}
.studio-achievements {
  padding: 12vw 6vw;
  background: var(--studio-black);
  color: var(--studio-paper);
}
.studio-achievements > h2 {
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
  background: var(--studio-red);
  color: var(--studio-paper);
  padding: 10vw 5vw 8vw;
  text-align: center;
  overflow: clip;
}
.studio-practice header h2 {
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
  color: #0a0a0a;
}
.studio-practice__list details > p {
  width: min(700px, 90%);
  margin: 24px auto 14px;
  font-size: 20px;
  line-height: 1.6;
}
.studio-practice__list a {
  color: inherit;
  display: inline-block;
  margin-bottom: 32px;
  text-underline-offset: 6px;
}
.studio-practice__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
  margin-top: 85px;
}
.studio-practice__tags span {
  border: 1px solid currentColor;
  border-radius: 40px;
  padding: 12px 26px;
  font-size: 16px;
}
.studio-background {
  background: var(--studio-paper);
  color: var(--studio-black);
}
.studio-background__stage {
  overflow: clip;
}
.studio-background__track {
  display: flex;
  width: max-content;
  min-height: 100svh;
}
.studio-background__cover {
  width: 75vw;
  flex: none;
  padding: 7vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.studio-background__cover p {
  font-size: 15px;
}
.studio-background__cover h2 {
  color: var(--studio-red);
  font-size: clamp(64px, 12vw, 210px);
  line-height: 1.05;
  letter-spacing: -0.06em;
  margin: 32px 0;
}
.studio-background__cover > span {
  font-size: 100px;
}
.studio-background__panel {
  width: 70vw;
  display: grid;
  grid-template-columns: 90px 1fr;
  border-left: 1px solid #0a0a0a22;
  padding: 45px 5vw 45px 0;
  gap: 3vw;
}
.studio-background__panel > h3 {
  align-self: end;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 28px;
  color: var(--studio-red);
  padding: 0 20px;
}
.studio-background__panel dl > div,
.studio-background__row {
  border-top: 1px solid #0a0a0a22;
  padding: 23px 0;
}
.studio-background__panel dt,
.studio-background__row h4 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
}
.studio-background__panel dd,
.studio-background__row p {
  font-size: 16px;
  line-height: 1.65;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 6px;
}
@media (max-width: 980px), (max-height: 649px), (prefers-reduced-motion: reduce) {
  .studio-background__track {
    width: 100%;
    display: block;
  }
  .studio-background__cover {
    width: 100%;
    padding: 80px 6vw;
  }
  .studio-background__panel {
    width: 100%;
    grid-template-columns: 1fr;
    padding: 50px 6vw;
    border-top: 1px solid #0a0a0a22;
  }
  .studio-background__panel > h3 {
    writing-mode: horizontal-tb;
    transform: none;
    padding: 0;
  }
  .studio-ribbon {
    overflow-x: auto;
  }
  .studio-ribbon__track {
    transform: none;
  }
}
@media (max-width: 760px) {
  .studio-experience {
    padding: 90px 0;
  }
  .studio-experience__intro {
    width: 90%;
    margin-bottom: 60px;
  }
  .studio-statement {
    font-size: 8vw;
    line-height: 1.3;
  }
  .studio-ribbon button {
    width: 65vw;
    height: 55vw;
  }
  .studio-experience__history {
    grid-template-columns: 1fr;
    width: 88%;
    gap: 54px;
    margin-top: 60px;
  }
  .studio-achievements {
    padding-block: 90px;
  }
  .studio-project {
    grid-template-columns: 1fr;
    gap: 30px;
    margin-bottom: 80px;
  }
  .studio-project--reverse > button {
    order: 0;
  }
  .studio-practice {
    padding: 90px 5vw;
  }
  .studio-practice header h2 {
    font-size: 17vw;
  }
  .studio-practice__list summary {
    font-size: 9vw;
  }
  .studio-practice__list details > p {
    font-size: 16px;
  }
}
</style>

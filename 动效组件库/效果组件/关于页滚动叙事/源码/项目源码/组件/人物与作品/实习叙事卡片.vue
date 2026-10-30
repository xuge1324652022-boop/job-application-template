<template>
  <section
    id="experience"
    ref="root"
    class="internship-story"
    :aria-label="lang === 'zh' ? '实习与实践' : 'Internships and practice'"
    :data-night="darkActive"
  >
    <span
      v-for="experience in experiences"
      :id="animated ? `work-${experience.workId}` : undefined"
      :key="experience.id"
      class="internship-story__anchor"
      aria-hidden="true"
    ></span>
    <div ref="stage" class="internship-story__stage">
      <div id="stories" ref="ribbons" class="internship-story__ribbons">
        <div class="studio-ribbon studio-ribbon--first">
          <p class="studio-ribbon__label">{{ lang === 'zh' ? '精选作品' : 'Selected work' }}</p>
          <div ref="upperTrack" class="studio-ribbon__track">
            <button
              v-for="image in images"
              :key="image.id"
              type="button"
              @click="openImage(image, $event)"
            >
              <img
                :src="image.src"
                :srcset="visualImageSources(image)"
                sizes="(max-width: 760px) 65vw, 30vw"
                :width="image.width"
                :height="image.height"
                :alt="pick(image.alt, lang)"
                loading="lazy"
                @load="refresh"
              />
            </button>
          </div>
        </div>
        <div id="identity" class="internship-story__intro">
          <p>{{ pick(PROFILE_LINES[0]!, lang) }}</p>
          <aside>
            <p v-for="(line, i) in PROFILE_LINES.slice(1)" :key="i">{{ pick(line, lang) }}</p>
          </aside>
        </div>
        <div class="studio-ribbon studio-ribbon--second">
          <p class="studio-ribbon__label">
            {{ lang === 'zh' ? '实习经历 · 向下滚动展开' : 'Internships · Scroll to unfold' }}
          </p>
          <div ref="lowerTrack" class="studio-ribbon__track">
            <a
              v-for="(experience, index) in experiences"
              :key="experience.id"
              :href="`#work-${experience.workId}`"
              class="internship-story__thumbnail"
              :data-card="index"
            >
              <AboutInternshipCover :experience="experience" :index="index" :lang="lang" />
            </a>
          </div>
        </div>
      </div>
      <div ref="cover" class="internship-story__extracted" aria-hidden="true">
        <AboutInternshipCover
          v-if="experiences[0]"
          :experience="experiences[0]"
          :index="0"
          :lang="lang"
        />
      </div>
      <div ref="frame" class="internship-story__frame">
        <div ref="track" class="internship-story__track">
          <template v-for="(experience, index) in experiences" :key="experience.id">
            <section
              class="internship-story__panel internship-story__card"
              :class="{ 'internship-story__card--first': index === 0 }"
              :data-slide="index * 2"
              :aria-label="pick(experience.company, lang)"
            >
              <AboutInternshipCover :experience="experience" :index="index" :lang="lang" />
            </section>
            <article
              :id="animated ? undefined : `work-${experience.workId}`"
              class="internship-story__panel internship-story__text"
              :data-slide="index * 2 + 1"
              :aria-labelledby="`internship-title-${experience.id}`"
            >
              <div
                class="internship-story__reading"
                :tabindex="animated ? 0 : undefined"
                role="region"
                :aria-labelledby="`internship-title-${experience.id}`"
              >
                <header class="internship-story__resume-header">
                  <div class="internship-story__resume-heading">
                    <p class="internship-story__period">{{ experience.period[lang] }}</p>
                    <h2 :id="`internship-title-${experience.id}`">
                      <span class="internship-story__company-text">{{
                        experience.company[lang]
                      }}</span>
                    </h2>
                  </div>
                  <p class="internship-story__role">{{ experience.role[lang] }}</p>
                </header>
                <div class="internship-story__details">
                  <p v-for="(detail, i) in experience.details" :key="i">
                    <strong>-{{ detail.title[lang] }}{{ lang === 'zh' ? '：' : ': ' }}</strong
                    >{{ detail.body[lang] }}
                  </p>
                </div>
              </div>
            </article>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import AboutInternshipCover from './实习原创封面.vue'
import { useInternshipStoryMotion } from './实习叙事动效'
import { useInternshipTextMotion } from './实习正文文字揭示'
import { EXPERIENCE, PROFILE_LINES, pick, type Lang } from '../../数据/人物资料'
import { personalPortfolio } from '../../数据/本机个人内容接口'
import type { VisualAsset } from '../../数据/视觉作品资料'
import { visualImageSources } from '../../工具/响应式图片'
const props = defineProps<{ lang: Lang; images: VisualAsset[] }>()
const emit = defineEmits<{ open: [item: VisualAsset, trigger: HTMLElement]; refresh: [] }>()
const experiences = personalPortfolio?.profile.EXPERIENCE ?? EXPERIENCE
const {
  root,
  stage,
  ribbons,
  upperTrack,
  lowerTrack,
  cover,
  frame,
  track,
  animated,
  darkActive,
  refresh,
} = useInternshipStoryMotion(
  () => props.lang,
  experiences.length,
  () => emit('refresh'),
)
useInternshipTextMotion(root, () => props.lang)

function openImage(image: VisualAsset, event: MouseEvent) {
  emit('open', image, event.currentTarget as HTMLElement)
}
</script>
<style scoped>
.internship-story {
  position: relative;
  background: var(--about-paper);
  color: var(--about-ink-on-paper);
}
.internship-story__anchor {
  position: absolute;
  left: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
.internship-story__stage {
  position: relative;
}
.internship-story__ribbons {
  padding: 36px 0 60px;
  overflow: hidden;
}
.studio-ribbon {
  padding: 20px 0 30px;
}
.studio-ribbon__label {
  margin: 0 5vw 22px;
  font-size: 13px;
}
.studio-ribbon__track {
  display: flex;
  width: max-content;
  gap: 24px;
  padding: 0 5vw;
}
.studio-ribbon--first .studio-ribbon__track {
  rotate: -3deg;
  transform-origin: left center;
}
.studio-ribbon--first button {
  display: block;
  width: 28vw;
  height: 20vw;
  min-width: 230px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
}
.studio-ribbon--first img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.internship-story__thumbnail {
  display: block;
  position: relative;
  width: 32vw;
  height: 23vw;
  min-width: 260px;
  overflow: hidden;
  background: var(--about-night);
  color: var(--about-on-night);
  text-decoration: none;
}

.internship-story__extracted {
  display: none;
}
.is-animated .internship-story__extracted {
  display: block;
  position: absolute;
  inset: 0;
  z-index: 4;
  visibility: hidden;
  contain: layout paint;
  pointer-events: none;
}
.internship-story__intro {
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  align-items: start;
  gap: 6vw;
  padding: 7svh 9vw;
}
.internship-story__intro > p {
  margin: 0;
  font-size: clamp(24px, 3vw, 48px);
  font-weight: 700;
  line-height: 1.35;
}
.internship-story__intro aside {
  border-top: 2px solid var(--about-accent-on-paper);
  color: var(--about-accent-on-paper);
  font-size: clamp(14px, 1.2vw, 20px);
  line-height: 1.45;
}
.studio-ribbon--second .studio-ribbon__track {
  rotate: -3deg;
  transform-origin: left center;
}
.internship-story__frame {
  background: var(--about-paper);
  color: var(--about-ink-on-paper);
}
.internship-story__panel {
  box-sizing: border-box;
  position: relative;
  min-width: 0;
}
.internship-story__card {
  display: none;
}
.internship-story__text {
  padding: clamp(36px, 5vw, 76px);
  scroll-margin-top: 24px;
}
.internship-story__reading {
  width: 100%;
  max-width: 1000px;
  text-align: left;
  font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: -0.015em;
}
.internship-story__resume-header {
  margin-bottom: 4px;
}
.internship-story__resume-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}
.internship-story__period {
  flex-shrink: 0;
  font-size: 17px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  margin: 0;
}
.internship-story__reading h2 {
  font-family: inherit;
  font-size: clamp(20px, 1.7vw, 28px);
  font-weight: 700;
  line-height: 1.4;
  text-align: right;
  overflow: clip;
  padding-block: 0.08em;
  margin: -0.08em 0;
}
.internship-story__company-text {
  display: block;
}
.internship-story__role {
  font-size: 20px;
  line-height: 1.5;
  margin: 0;
}
.internship-story__details p {
  margin: 0;
  font-size: clamp(16px, 1.2vw, 19px);
  line-height: 1.65;
  overflow-wrap: anywhere;
}
.internship-story__details strong {
  font-weight: 700;
}
button:focus-visible,
a:focus-visible,
.internship-story__reading:focus-visible {
  outline: 2px solid var(--about-accent-on-paper);
  outline-offset: 4px;
}
.is-animated .internship-story__stage {
  height: 100svh;
  min-height: 650px;
  overflow: clip;
  isolation: isolate;
}
.is-animated .internship-story__ribbons {
  position: absolute;
  inset: 0 0 auto;
  padding: 10svh 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 3svh;
}
.is-animated .studio-ribbon {
  flex: 0 0 auto;
  padding: 0;
}
.is-animated .studio-ribbon--first button {
  height: 28svh;
}
.is-animated .internship-story__thumbnail {
  height: 30svh;
}
.is-animated .internship-story__frame {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: clip;
  visibility: hidden;
}
.is-animated .internship-story__track {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4vw;
  height: 100%;
  will-change: transform;
}
.is-animated .internship-story__panel {
  flex-shrink: 0;
  min-width: 0;
}
.is-animated .internship-story__card {
  display: block;
  flex-basis: 60%;
  width: 60%;
  height: 84%;
}
.is-animated .internship-story__card--first {
  flex-basis: 100%;
  width: 100%;
  height: 100%;
}
.is-animated .internship-story__text {
  display: flex;
  align-items: center;
  flex-basis: 76%;
  width: 76%;
  height: 100%;
  padding: 44px 3vw;
}
.is-animated .internship-story__reading {
  max-height: 100%;
  overflow-y: auto;
  padding: 8px 16px 8px 4px;
  overscroll-behavior-y: auto;
}
@media (max-width: 980px), (max-height: 649px), (prefers-reduced-motion: reduce) {
  .internship-story__intro {
    grid-template-columns: 1fr;
    padding: 36px 6vw;
    gap: 20px;
  }
  .studio-ribbon {
    overflow-x: auto;
    scroll-padding-inline: 5vw;
  }
  .studio-ribbon__track {
    rotate: none !important;
  }
  .internship-story__ribbons {
    padding: 24px 0;
  }
  .internship-story__text {
    padding: 36px 6vw 48px;
    border-bottom: 1px solid var(--about-line-on-paper);
  }
  .internship-story__resume-heading {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .internship-story__reading h2 {
    flex: 1 1 100%;
    text-align: left;
    font-size: 19px;
  }
  .internship-story__period {
    font-size: 16px;
  }
  .internship-story__role {
    font-size: 18px;
    margin-bottom: 4px;
  }
}
@media (max-width: 760px) {
  .studio-ribbon--first button,
  .internship-story__thumbnail {
    width: 65vw;
    height: 42vw;
    min-width: 0;
  }
  .studio-ribbon__track {
    gap: 14px;
  }
  .internship-story__thumbnail {
    height: auto;
    min-height: 200px;
    overflow: visible;
  }
  .internship-story__thumbnail .internship-cover {
    min-height: 200px;
    height: 100%;
  }
}
</style>

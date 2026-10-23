<template>
  <section id="profile" ref="root" class="identity-scene" aria-labelledby="identity-name">
    <div class="identity-scene__intro">
      <div class="identity-scene__visual">
        <figure ref="portraitFigure" class="identity-scene__portrait">
          <div ref="imageMask" class="identity-scene__image-mask">
            <img :src="portraitSources.src" :srcset="visualImageSources(portraitSources)"
              sizes="(max-width: 760px) calc(100vw - 40px), 49vw" width="1448" height="1086"
              :alt="lang === 'zh' ? '用于个人简介版式演示的合成几何占位图' : 'Synthetic geometric placeholder illustrating the profile layout'"
              decoding="async" loading="lazy" />
            <span class="identity-scene__dim" aria-hidden="true"></span>
          </div>
          <figcaption>合成图像示例<span lang="en">Synthetic image example</span></figcaption>
        </figure>
        <div class="identity-scene__tools" role="group" :aria-label="lang === 'zh' ? '选择创作工具' : 'Select a creative tool'">
          <button v-for="tool in AI_TOOLS" :key="tool.id" type="button"
            :class="{ 'is-selected': activeTool === tool.id }" :aria-pressed="activeTool === tool.id"
            :disabled="!active" aria-controls="ai-tool-detail"
            :aria-label="`${tool.name}：${lang === 'zh' ? tool.roleZh : tool.roleEn}`"
            @click="selectTool(tool.id)">
            <span class="identity-scene__tool-icon" :class="{ 'identity-scene__tool-icon--light': tool.logoTone === 'light' }"><img :src="tool.src" alt="" width="28" height="28" loading="lazy" /></span>
            <span>{{ tool.name }}</span><span v-if="activeTool === tool.id" class="identity-scene__selected" aria-hidden="true"></span>
          </button>
        </div>
        <a class="identity-scene__process-link" href="#ai-workflow">探索创作过程<span lang="en">Explore the creative process</span><span aria-hidden="true">↘</span></a>
      </div>

      <div class="identity-scene__biography">
        <p class="identity-scene__label">关于我<span lang="en">About me</span></p>
        <h2 id="identity-name">{{ IDENTITY.nameZh }}<span lang="en">{{ IDENTITY.nameEn }}</span></h2>
        <p class="identity-scene__role">{{ pick(ROLE_LINE, 'zh') }}<span lang="en">{{ pick(ROLE_LINE, 'en') }}</span></p>
        <p class="identity-scene__tagline">{{ pick(TAGLINE, 'zh') }}<span lang="en">{{ pick(TAGLINE, 'en') }}</span></p>
        <div class="identity-scene__description">
          <template v-for="(line, index) in PROFILE_LINES" :key="index">
            <p v-for="copyLang in (['zh', 'en'] as const)" :key="copyLang" class="identity-scene__reading" :lang="copyLang">
              <span class="identity-scene__readable">{{ pick(line, copyLang) }}</span>
              <span aria-hidden="true"><span v-for="(word, wordIndex) in textParts(pick(line, copyLang), copyLang)" :key="wordIndex" class="identity-scene__word">{{ word }}</span></span>
            </p>
          </template>
        </div>
      </div>
    </div>

    <dl class="identity-scene__facts">
      <div v-for="(fact, index) in FACTS" :key="index">
        <dt>{{ fact.k.zh }}<span lang="en">{{ fact.k.en }}</span></dt>
        <dd><template v-for="(part, partIndex) in resumeFactParts(pick(fact.v, 'zh'), index, 'zh')" :key="partIndex"><strong v-if="part.strong">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template><span lang="en"><template v-for="(part, partIndex) in resumeFactParts(pick(fact.v, 'en'), index, 'en')" :key="partIndex"><strong v-if="part.strong">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template></span></dd>
      </div>
    </dl>

    <div class="identity-scene__skills">
      <h3>制作与工具<span lang="en">Production & tools</span></h3>
      <dl>
        <div v-for="skill in RESUME_SKILLS" :key="skill.id" :data-skill="skill.id">
          <dt>{{ skill.title.zh }}<span lang="en">{{ skill.title.en }}</span></dt>
          <dd><p v-for="copyLang in (['zh', 'en'] as const)" :key="copyLang" :lang="copyLang"><template v-for="(part, partIndex) in resumeSkillParts(skill.body[copyLang], skill.id, copyLang)" :key="partIndex"><strong v-if="part.strong">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template></p></dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 自然阅读流中的简介：图片遮罩与文字亮度随滚动变化，不创建新的滚动容器或固定区域。
 * 工具按钮直接复用工作流共享 ID；其可用性只由页面转场门闩决定。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AI_TOOLS } from '../../data/aiTools'
import { FACTS, IDENTITY, PROFILE_LINES, RESUME_SKILLS, ROLE_LINE, TAGLINE, pick, type Lang } from '../../data/aboutProfile'
import { resumeFactParts, resumeSkillParts } from '../../data/resumeEmphasis'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../utils/motionLayout'
import { visualImageSources } from '../../utils/responsiveImage'

const props = defineProps<{ lang: Lang; active: boolean; activeTool: string }>()
const emit = defineEmits<{ 'update:activeTool': [id: string] }>()
const root = ref<HTMLElement | null>(null)
const imageMask = ref<HTMLElement | null>(null)
const portraitFigure = ref<HTMLElement | null>(null)
const portraitSources = { thumb: '/about/portrait-400.webp', src: '/about/portrait-900.webp', large: '/about/portrait-1448.webp' }
const textParts = (text: string, lang: Lang): string[] => lang === 'zh' ? Array.from(text) : text.match(/\S+\s*/gu) ?? [text]

function selectTool(id: string): void {
  if (props.active) emit('update:activeTool', id)
}

let media: gsap.MatchMedia | undefined
let cancelPreparation: (() => void) | undefined
let cancelRefresh: (() => void) | undefined
let dead = false
gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  if (!root.value) return
  cancelPreparation = prepareMotionLayout(root.value, () => {
    cancelPreparation = undefined
    if (dead || !root.value || !imageMask.value) return
    media = gsap.matchMedia()
    // 小屏与减少动态偏好保留完整自然流；matchMedia 回退自动撤销内联遮罩及文字颜色。
    media.add('(min-width: 761px) and (min-height: 561px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(imageMask.value!, { clipPath: 'inset(14% 22% 14% 22%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: imageMask.value!, start: 'top 92%', end: 'center 48%', scrub: .6, invalidateOnRefresh: true },
      })
      root.value!.querySelectorAll<HTMLElement>('.identity-scene__reading').forEach(paragraph => {
        gsap.fromTo(paragraph.querySelectorAll('.identity-scene__word'), { color: '#777b83' }, {
          color: '#f1f1ed', stagger: .035, ease: 'none',
          scrollTrigger: { trigger: paragraph, start: 'top 88%', end: 'bottom 55%', scrub: .4, invalidateOnRefresh: true },
        })
      })
      // 照片放大接管：人物图固定后等比铺满视口，简介、工具与图注同步淡出；
      // 铺满后叠加暗化蒙层并轻微回缩，让基本信息与技能从暗化的照片上滚入。
      const dim = imageMask.value!.querySelector<HTMLElement>('.identity-scene__dim')
      if (portraitFigure.value && dim) {
        const coverScale = () => {
          // offsetWidth/Height 是布局尺寸，不受缩放影响，refresh 时可安全重算。
          const width = imageMask.value!.offsetWidth
          const height = imageMask.value!.offsetHeight
          const center = innerHeight * .12 + height / 2
          return Math.max(innerWidth / width, 2 * Math.max(center, innerHeight - center) / height)
        }
        const fadeGroup = Array.from(root.value!.querySelectorAll<HTMLElement>(
          '.identity-scene__biography, .identity-scene__tools, .identity-scene__process-link, .identity-scene__portrait figcaption'))
        // 起步放缓并拉长距离：单次滚轮只引起轻微增长，避免照片“突然”铺满视口。
        gsap.timeline({
          scrollTrigger: {
            id: 'about-portrait-takeover', trigger: portraitFigure.value, refreshPriority: 15,
            start: 'top 12%', end: '+=150%', pin: true, anticipatePin: 1, scrub: .5, invalidateOnRefresh: true,
          },
        })
          .fromTo(imageMask.value!, { scale: 1 }, { scale: coverScale, duration: .68, ease: 'power2.inOut' }, 0)
          .fromTo(fadeGroup, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: .5, ease: 'none' }, .05)
          .fromTo(dim, { autoAlpha: 0 }, { autoAlpha: .58, duration: .45, ease: 'none' }, .55)
          .to(imageMask.value!, { scale: () => coverScale() * .965, duration: .28, ease: 'power1.inOut' }, .72)
      }
    }, root.value)
    cancelRefresh = requestMotionLayoutRefresh()
    void document.fonts.ready.then(() => {
      if (dead) return
      cancelRefresh?.()
      cancelRefresh = requestMotionLayoutRefresh()
    })
  })
})

onBeforeUnmount(() => {
  dead = true
  cancelPreparation?.()
  cancelRefresh?.()
  media?.revert()
})
</script>

<style scoped>
.identity-scene { position:relative; padding:clamp(76px,10vw,160px) 0 clamp(90px,12vw,180px); color:var(--ab-ink,#f1f1ed); scroll-margin-top:80px; }
.identity-scene__intro { display:grid; grid-template-columns:minmax(0,1.16fr) minmax(0,1fr); column-gap:clamp(44px,7vw,120px); align-items:start; }
.identity-scene__visual { position:relative; z-index:2; min-width:0; }
.identity-scene__portrait { margin:0; }
.identity-scene__image-mask { aspect-ratio:4/3; overflow:hidden; background:#171a20; pointer-events:none; }
.identity-scene__image-mask img { display:block; width:100%; height:100%; object-fit:contain; }
/* 放大接管期间的暗化层；无脚本时保持不可见。 */
.identity-scene__dim { position:absolute; inset:0; background:var(--ab-bg,#0c0d0f); opacity:0; visibility:hidden; }
.identity-scene__portrait figcaption { display:flex; flex-wrap:wrap; gap:6px 14px; margin-top:14px; color:var(--ab-soft,#a4a7ae); font-size:11px; line-height:1.6; }
.identity-scene__portrait figcaption span { font-size:10px; }
.identity-scene__biography { position:relative; z-index:1; padding-top:5px; min-width:0; }
.identity-scene__label { display:flex; align-items:baseline; gap:15px; margin:0 0 38px; font-size:12px; line-height:1.5; }
.identity-scene__label span { color:var(--ab-soft,#a4a7ae); font-size:11px; }
.identity-scene h2 { margin:0; font-size:clamp(36px,4.1vw,68px); font-weight:400; line-height:1.18; letter-spacing:-.055em; overflow-wrap:anywhere; }
.identity-scene h2 > span { display:block; margin-top:13px; font-size:clamp(19px,2vw,31px); letter-spacing:-.03em; color:var(--ab-soft,#a4a7ae); }
.identity-scene__role { margin:33px 0 0; font-size:14px; line-height:1.7; }
.identity-scene__role span { display:block; margin-top:5px; font-size:12px; color:var(--ab-soft,#a4a7ae); }
.identity-scene__tagline { margin:48px 0 0; max-width:19em; font-size:clamp(23px,2.25vw,33px); line-height:1.55; letter-spacing:-.025em; }
.identity-scene__tagline span { display:block; margin-top:14px; font-size:16px; line-height:1.6; letter-spacing:0; color:var(--ab-soft,#a4a7ae); }
.identity-scene__description { margin-top:34px; }
.identity-scene__reading { margin:0; font-size:clamp(17px,1.65vw,23px); line-height:1.85; letter-spacing:-.015em; }
.identity-scene__reading[lang=en] { max-width:58ch; margin-top:20px; font-size:14px; line-height:1.8; letter-spacing:0; color:var(--ab-soft,#a4a7ae); }
.identity-scene__word { white-space:pre-wrap; }
.identity-scene__readable { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
.identity-scene__tools { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px 16px; margin-top:32px; }
.identity-scene__tools button { position:relative; display:flex; gap:10px; align-items:center; min-height:54px; padding:8px 0; background:none; border:0; border-bottom:1px solid var(--ab-line,#30333a); font:inherit; font-size:13px; line-height:1.4; text-align:left; color:var(--ab-soft,#a4a7ae); cursor:pointer; }
.identity-scene__tools button.is-selected,.identity-scene__tools button:hover { color:var(--ab-ink,#f1f1ed); border-color:#6289ff; }
.identity-scene__tools button:disabled { cursor:default; }
.identity-scene__tool-icon { display:grid; flex:0 0 34px; place-items:center; width:34px; height:34px; border-radius:7px; background:#f1f1ed; }
.identity-scene__tool-icon img { display:block; max-width:28px; max-height:28px; object-fit:contain; }
.identity-scene__tool-icon--light { background:#23262d; }
.identity-scene__selected { width:5px; height:5px; margin-left:auto; flex:0 0 5px; border-radius:50%; background:#6289ff; }
.identity-scene__process-link { display:flex; flex-wrap:wrap; align-items:center; gap:5px 12px; width:fit-content; min-height:44px; margin-top:18px; color:inherit; font-size:12px; line-height:1.6; text-decoration:none; }
.identity-scene__process-link span[lang=en] { color:var(--ab-soft,#a4a7ae); font-size:11px; }
.identity-scene__process-link span:last-child { margin-left:10px; font-size:22px; }
/* 接管结束后放大的暗化照片仍在视觉列内；后续区块以更高层叠滚入其上方。 */
.identity-scene__facts { position:relative; z-index:3; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:35px clamp(32px,6vw,90px); margin:clamp(76px,9vw,140px) 0 0; }
.identity-scene__facts > div { padding-top:20px; border-top:1px solid var(--ab-line,#30333a); }
.identity-scene__facts dt { display:flex; flex-wrap:wrap; gap:5px 12px; font-size:12px; line-height:1.5; color:var(--ab-soft,#a4a7ae); }
.identity-scene__facts dt span { font-size:11px; }
.identity-scene__facts dd { margin:20px 0 0; font-size:16px; line-height:1.7; overflow-wrap:anywhere; }
.identity-scene__facts dd span { display:block; margin-top:8px; font-size:12px; line-height:1.7; color:var(--ab-soft,#a4a7ae); }
.identity-scene__skills { position:relative; z-index:3; display:grid; grid-template-columns:minmax(180px,.38fr) minmax(0,1fr); gap:clamp(34px,6vw,100px); margin-top:clamp(76px,9vw,140px); }
.identity-scene__skills h3 { margin:0; padding-top:24px; border-top:1px solid var(--ab-line,#30333a); font-size:clamp(23px,2.4vw,36px); font-weight:400; letter-spacing:-.035em; line-height:1.35; }
.identity-scene__skills h3 span { display:block; margin-top:9px; font-size:14px; line-height:1.6; letter-spacing:0; color:var(--ab-soft,#a4a7ae); }
.identity-scene__skills dl { margin:0; }
.identity-scene__skills dl > div { display:grid; grid-template-columns:minmax(135px,.38fr) minmax(0,1fr); gap:28px; padding:25px 0; border-top:1px solid var(--ab-line,#30333a); }
.identity-scene__skills dt { font-size:17px; line-height:1.6; }
.identity-scene__skills dt span { display:block; margin-top:6px; font-size:12px; line-height:1.65; color:var(--ab-soft,#a4a7ae); }
.identity-scene__skills dd { margin:0; }
.identity-scene__skills dd p { margin:0; max-width:42em; font-size:15px; line-height:1.9; }
.identity-scene__skills dd p[lang=en] { margin-top:12px; font-size:13px; line-height:1.75; color:var(--ab-soft,#a4a7ae); }
.identity-scene__facts strong,.identity-scene__skills strong { font-weight:600; color:inherit; }
.identity-scene a:focus-visible,.identity-scene button:focus-visible { outline:2px solid #6289ff; outline-offset:6px; }
@media(max-width:1100px) { .identity-scene__intro { column-gap:40px; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }.identity-scene__tools { grid-template-columns:repeat(2,minmax(0,1fr)); }.identity-scene__tagline { margin-top:32px; }.identity-scene__skills { grid-template-columns:minmax(150px,.3fr) minmax(0,1fr); gap:38px; } }
@media(max-width:760px) {
  .identity-scene { padding:65px 0 90px; scroll-margin-top:64px; }
  .identity-scene__intro { display:flex; flex-direction:column; gap:44px; }
  .identity-scene__biography { order:-1; padding-top:0; }
  .identity-scene__label { margin-bottom:28px; }
  .identity-scene h2 { font-size:clamp(34px,8.5vw,56px); }
  .identity-scene h2 > span { font-size:22px; }
  .identity-scene__tagline { max-width:none; font-size:25px; }
  .identity-scene__description { margin-top:28px; }
  .identity-scene__reading { font-size:18px; line-height:1.85; }
  .identity-scene__visual { width:100%; }
  .identity-scene__image-mask { aspect-ratio:4/3; }
  .identity-scene__tools { grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 14px; margin-top:24px; }
  .identity-scene__tools button { gap:8px; font-size:12px; }
  .identity-scene__facts { grid-template-columns:repeat(2,minmax(0,1fr)); gap:30px 28px; margin-top:68px; }
  .identity-scene__facts dd { margin-top:16px; font-size:15px; }
  .identity-scene__skills { grid-template-columns:1fr; gap:32px; margin-top:68px; }
  .identity-scene__skills h3 { font-size:28px; }
}
@media(max-width:430px) { .identity-scene__tools { grid-template-columns:repeat(2,minmax(0,1fr)); }.identity-scene__facts { column-gap:20px; }.identity-scene__skills dl > div { grid-template-columns:1fr; gap:16px; }.identity-scene__skills dt span { margin-top:3px; } }
</style>

<template>
  <!--
    01 / ABOUT —— 首页画廊里「关于我」卡片的装饰预览，非 AboutView 正文首屏。
    三层由远及近：巨型 ABOUT 排版 → Q 几何身份结构与取景窗口 → 文字信息。
    尺度、层级、颜色都在 aboutExperience.css；指针位移在
    aboutExperienceAnimation.ts。这里只负责把它们摆在一起。

    aria-hidden：整张卡是装饰性排版，文字信息在别处以可读形式存在，
    屏幕阅读器不该再读一遍超尺寸被裁掉一半的巨型字。
  -->
  <div ref="rootRef" class="about-exp" aria-hidden="true">
    <!-- 第 1 层：巨型 ABOUT。主导尺度，允许被卡片边缘裁掉一部分 -->
    <h2 class="about-exp__type">
      <span class="about-exp__type-inner">ABOUT</span>
    </h2>

    <!-- 第 2 层：几何结构 Q 与身份取景窗口 -->
    <div class="about-exp__logo">
      <div class="about-exp__logo-inner">
        <TemplateMark />
      </div>
    </div>

    <!-- 第 3 层：文字信息。尺度最小，锚在左下 -->
    <div class="about-exp__info">
      <span class="about-exp__index">01</span>
      <span class="about-exp__rule" />
      <h3 class="about-exp__lead">关于我</h3>
      <div class="about-exp__name-row">
        <span class="about-exp__name">
          <span
            v-for="(char, i) in nameChars"
            :key="i"
            class="about-exp__char"
          >{{ char }}</span>
        </span>
        <span v-if="IDENTITY.nameEn" class="about-exp__name-en">{{ IDENTITY.nameEn }}</span>
      </div>
      <span class="about-exp__role">VIDEO EDITOR</span>
      <span class="about-exp__role">COLORIST</span>
      <span class="about-exp__role">VISUAL DESIGNER</span>
      <div class="about-exp__meta">
        <span>2026</span>
        <span>CHINA</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import TemplateMark from './个人标志扫描.vue'
import { IDENTITY } from '../../数据/人物资料'
import { createAboutExperience, type AboutExperienceHandle } from './人物经历动画'
import './人物经历样式.css'

const rootRef = ref<HTMLElement | null>(null)
let handle: AboutExperienceHandle | null = null

const nameChars = computed(() => Array.from(IDENTITY.nameZh || ''))

onMounted(() => {
  if (rootRef.value) handle = createAboutExperience(rootRef.value)
})

onUnmounted(() => {
  handle?.destroy()
  handle = null
})
</script>
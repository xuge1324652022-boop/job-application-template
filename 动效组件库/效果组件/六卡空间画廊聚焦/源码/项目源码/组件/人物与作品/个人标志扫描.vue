<template>
  <!--
    01 / ABOUT —— 由几何结构组成的 Q 身份徽记与取景遮罩。
    0–0.5s: 实心圆急速进场与物理压缩回弹。
    0.5–1.4s: 分解为圆环、矩形与对角短线拼合成 Q。
    1.4–2.6s: Q 圆心成为遮罩窗口，姓名字母穿出。
    2.6–4s: 人像辅助层显影，ABOUT 前推。
  -->
  <svg
    class="demo q-mark"
    :viewBox="`0 0 ${GEO.w} ${GEO.h}`"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <!-- Q 内腔圆形遮罩：限定人像与窗口投影在 Q 圆形内部 -->
      <mask :id="qMaskId">
        <circle :cx="GEO.circle.cx" :cy="GEO.circle.cy" :r="GEO.circle.r - 2" fill="#fff" />
      </mask>

      <!-- 扫描线遮罩 -->
      <mask :id="maskId">
        <g stroke="#fff" stroke-width="4" stroke-linecap="butt">
          <circle :cx="GEO.circle.cx" :cy="GEO.circle.cy" :r="GEO.circle.r" fill="#666" />
          <path class="q-tail-mask" d="M140 148 L188 196 L174 210 L126 162 Z" fill="#fff" />
          <line
            v-for="(l, i) in GEO.bars"
            :key="`bar-${i}`"
            :x1="l.x1"
            :y1="l.y1"
            :x2="l.x2"
            :y2="l.y2"
            fill="none"
          />
          <path :d="GEO.stem" fill="none" />
          <path :d="GEO.fork" fill="none" />
        </g>
      </mask>
    </defs>

    <!-- 0.0s – 0.5s: 进场与物理压缩回弹的实心圆 -->
    <circle
      class="q-disc"
      :cx="GEO.circle.cx"
      :cy="GEO.circle.cy"
      :r="GEO.circle.r"
    />

    <!-- 人像辅助图层：仅在 Q 内核窗口遮罩内显现 -->
    <g :mask="`url(#${qMaskId})`" class="q-window">
      <rect
        class="q-window-shade"
        :x="GEO.circle.cx - GEO.circle.r"
        :y="GEO.circle.cy - GEO.circle.r"
        :width="GEO.circle.r * 2"
        :height="GEO.circle.r * 2"
      />
      <image
        v-if="portraitUrl"
        class="q-portrait"
        :href="portraitUrl"
        :x="GEO.circle.cx - GEO.circle.r"
        :y="GEO.circle.cy - GEO.circle.r"
        :width="GEO.circle.r * 2"
        :height="GEO.circle.r * 2"
        preserveAspectRatio="xMidYMid slice"
      />
    </g>

    <!-- 结构本体：Q 的圆环、尾巴短线与几何标定构件 -->
    <g class="demo__structure q-structure">
      <!-- Q 主圆环 -->
      <circle
        class="demo__circle q-ring"
        :cx="GEO.circle.cx"
        :cy="GEO.circle.cy"
        :r="GEO.circle.r"
      />

      <!-- Q 尾巴短线：对角切线，0.5-1.4s 旋转咬合 -->
      <path
        class="q-tail"
        d="M140 148 L188 196 L174 210 L126 162 Z"
      />

      <!-- 辅助线标定 -->
      <line
        v-for="(l, i) in GEO.bars"
        :key="`x-${i}`"
        class="demo__bar q-bar"
        :x1="l.x1"
        :y1="l.y1"
        :x2="l.x2"
        :y2="l.y2"
      />

      <!-- 竖干 + 分叉 -->
      <path class="demo__stem q-stem" :d="GEO.stem" />
      <path class="demo__fork q-fork" :d="GEO.fork" />

      <!-- 基准细线 -->
      <line
        class="demo__base q-base"
        :x1="GEO.base.x1"
        :y1="GEO.base.y"
        :x2="GEO.base.x2"
        :y2="GEO.base.y"
      />
    </g>

    <!-- 三条扫描线：只在图形内部可见 -->
    <g :mask="`url(#${maskId})`">
      <rect
        v-for="(s, i) in GEO.scans"
        :key="`scan-${i}`"
        class="demo__scan"
        :class="`demo__scan--${i + 1}`"
        :x="0"
        :y="s.y"
        :width="s.width"
        :height="s.height"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { aboutPortrait, personalSiteValue } from '../../数据/本机个人内容接口'

const templateGeometry = {
  w: 240,
  h: 240,
  circle: { cx: 104, cy: 116, r: 70 },
  bars: [
    { x1: 132, y1: 92, x2: 210, y2: 92 },
    { x1: 132, y1: 140, x2: 210, y2: 140 },
  ],
  stem: 'M50 188 L50 164 L112 164 L112 188',
  fork: 'M144 178 L170 160 L196 178',
  base: { x1: 24, y: 196, x2: 216 },
  scans: [
    { y: 78, width: 52, height: 2 },
    { y: 112, width: 38, height: 2 },
    { y: 158, width: 64, height: 2 },
  ],
} as const
const GEO = personalSiteValue('home', 'markGeometry', templateGeometry)

const maskId = `demo-scan-${useId()}`
const qMaskId = `q-window-${useId()}`
const portraitUrl = aboutPortrait?.thumb || aboutPortrait?.src || '/about/portrait-400.webp'
</script>

<style scoped>
.demo {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

/* --- Q 几何特有元素 --- */
.q-disc {
  fill: rgba(241, 241, 236, 0.95);
  transform-origin: 104px 116px;
  will-change: transform, opacity;
}
.q-ring {
  fill: rgba(241, 241, 236, 0.04);
  stroke: rgba(241, 241, 236, 0.85);
  stroke-width: 2.2;
  transform-origin: 104px 116px;
  will-change: transform, opacity;
}
.q-tail {
  fill: rgba(241, 241, 236, 0.85);
  transform-origin: 104px 116px;
  will-change: transform, opacity;
}
.q-window-shade {
  fill: rgba(14, 14, 13, 0.8);
}
.q-portrait {
  opacity: 0.35;
  filter: grayscale(1) contrast(1.15);
  mix-blend-mode: screen;
}

/* --- 结构本体：线条为主，弱填充 --- */
.demo__circle {
  fill: rgba(241, 241, 236, 0.035);
  stroke: rgba(241, 241, 236, 0.62);
  stroke-width: 1.4;
}
.demo__bar {
  stroke: rgba(241, 241, 236, 0.5);
  stroke-width: 1.2;
}
.demo__stem {
  stroke: rgba(241, 241, 236, 0.58);
  stroke-width: 1.4;
}
.demo__fork {
  stroke: rgba(241, 241, 236, 0.44);
  stroke-width: 1.2;
}
/* 辅助线：比主结构弱一档，只用来锚定水平面 */
.demo__base {
  stroke: rgba(241, 241, 236, 0.22);
  stroke-width: 0.8;
}

/* --- 扫描线：机械、匀速、无限循环 --- */
.demo__scan {
  fill: rgba(241, 241, 236, 0.92);
  animation: demo-scan 4.2s linear infinite;
}
.demo__scan--2 {
  animation-duration: 5.6s;
  animation-delay: -1.4s;
}
.demo__scan--3 {
  animation-duration: 7.1s;
  animation-delay: -2.9s;
}

@keyframes demo-scan {
  from {
    transform: translateX(-72px);
  }
  to {
    transform: translateX(248px);
  }
}

/* 开启「减少动态效果」时扫描停住：一条静止的线仍然是构图的一部分 */
@media (prefers-reduced-motion: reduce) {
  .demo__scan {
    animation: none;
    opacity: 0.5;
  }
  .q-disc {
    opacity: 0.04;
  }
  .q-ring,
  .q-tail {
    opacity: 1;
    transform: none;
  }
}
</style>
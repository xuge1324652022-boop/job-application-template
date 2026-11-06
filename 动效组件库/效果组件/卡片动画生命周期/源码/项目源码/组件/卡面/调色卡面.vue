<template>
  <div class="cv cv-color">
    <!-- 后层：色轮辅助构架 (Back layer: 20 / 12 px) -->
    <div class="cv-color__wheel">
      <div class="cv-color__wheel-disc" />
    </div>

    <!-- 中后层：代码生成的色彩塑形色场 Canvas 与几何竖条层 (Mid-back: 28 / 20 px) -->
    <div class="cv-color__field-wrap">
      <canvas ref="canvasRef" class="cv-color__canvas" width="640" height="420" />
      <!-- 竖条遮挡切片（10 根等宽竖条，负责抬起高度差与前后物理遮挡） -->
      <div class="cv-color__strips-grid">
        <div v-for="i in 10" :key="i" :class="['cv-color__strip-bar', `cv-color__strip-bar--${i}`]" />
      </div>
    </div>

    <!-- 中层：色调曲线 (Mid: 24 / 17 px) -->
    <div class="cv-color__curves">
      <div class="cv-color__curve-wrap">
        <svg class="cv-color__curve" viewBox="0 0 200 120" aria-hidden="true">
          <path class="cv-color__curve-path" d="M4 108 C 46 100, 62 74, 86 52 S 138 18, 196 8" />
          <circle cx="4" cy="108" r="2.4" />
          <circle cx="86" cy="52" r="2.4" />
          <circle cx="196" cy="8" r="2.4" />
        </svg>
      </div>
      <span class="cv-color__curve-label">TONE CURVE</span>
    </div>

    <!-- 中前层：色阶阶调条 (Mid-front: 35 / 25 px) -->
    <div class="cv-color__strips">
      <div class="cv-color__strip" />
      <div class="cv-color__strip-labels">
        <span>SHADOW</span>
        <span>MIDTONE</span>
        <span>HIGHLIGHT</span>
      </div>
    </div>

    <!-- 前层：COLOR 标题（镂空与实心无缝切换）(Front: 50 / 35 px) -->
    <div class="cv-color__type">
      <!-- 镂空态：与几何色场相互咬合 -->
      <span class="cv-color__word cv-color__word--cutout">COLOR</span>
      <!-- 实心态：稳定高保真标题排版 -->
      <span class="cv-color__word cv-color__word--solid">COLOR</span>
    </div>

    <!-- 静态参照框：永不移动，永不做动画 (Movement 0) -->
    <div class="cv-color__info">
      <span class="cv-color__eyebrow">03</span>
      <span class="cv-color__title">COLOR</span>
      <span class="cv-color__lead">调色</span>
      <span class="cv-color__sub">COLOR GRADING</span>
      <span class="cv-color__sub">FILM / TONE / IMAGE</span>
    </div>
    <div class="cv-color__params">
      <span><i>EXPOSURE</i><b>+0.35</b></span>
      <span><i>CONTRAST</i><b>+12</b></span>
      <span><i>SATURATION</i><b>-08</b></span>
    </div>
    <div class="cv-color__lut">
      <span>FILM LOOK</span>
      <span>LUT 01</span>
      <span>35MM</span>
      <span>LOG &rarr; REC709</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function renderStaticField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height

  // 绘制中性胶片阶调几何底色
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#1c2328')
  grad.addColorStop(0.5, '#282b2d')
  grad.addColorStop(1, '#3a332a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // 绘制 10 根等宽中性色场带
  const barW = w / 10
  for (let i = 0; i < 10; i++) {
    const alpha = 0.08 + (i % 3) * 0.05
    ctx.fillStyle = `rgba(241, 241, 236, ${alpha})`
    ctx.fillRect(i * barW + 1, 0, barW - 2, h)
  }
}

function updateResolution() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
  const scale = Math.min(dpr, 2)
  const clientW = canvas.clientWidth || 320
  const clientH = canvas.clientHeight || 210

  canvas.width = Math.round(clientW * scale)
  canvas.height = Math.round(clientH * scale)
  renderStaticField(canvas)
}

onMounted(() => {
  updateResolution()
  if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateResolution()
    })
    resizeObserver.observe(canvasRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
/* ---- 03 / COLOR 调色 — 色彩塑形 ---------------------------------- */

/* --- 后层：色轮辅助结构 --- */
.cv-color__wheel {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 54vh;
  height: 54vh;
  margin: -27vh 0 0 -27vh;
  border-radius: 50%;
  pointer-events: none;
}
.cv-color__wheel-disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 210deg,
    rgba(88, 126, 148, 0.15),
    rgba(78, 92, 138, 0.15),
    rgba(112, 84, 128, 0.15),
    rgba(138, 82, 88, 0.15),
    rgba(158, 116, 74, 0.15),
    rgba(88, 126, 148, 0.15)
  );
  -webkit-mask: radial-gradient(circle, transparent 56%, #000 57%);
  mask: radial-gradient(circle, transparent 56%, #000 57%);
  opacity: 0.6;
}

/* --- 中后层：色彩塑形 Canvas 与竖条切片 --- */
.cv-color__field-wrap {
  position: absolute;
  left: 6%;
  top: 18%;
  width: 58%;
  height: 52%;
  overflow: hidden;
  border: 1px solid rgba(241, 241, 236, 0.16);
  background: #0f1011;
}
.cv-color__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.88;
}
.cv-color__strips-grid {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}
.cv-color__strip-bar {
  flex: 1;
  height: 100%;
  border-right: 1px solid rgba(241, 241, 236, 0.08);
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.3);
  transform-origin: center center;
  will-change: transform, opacity;
}

/* --- 中层：色调曲线 --- */
.cv-color__curves {
  position: absolute;
  inset: 0;
}
.cv-color__curve-wrap {
  position: absolute;
  right: 10%;
  top: 60%;
  width: 22%;
  height: 18%;
}
.cv-color__curve {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.cv-color__curve path {
  fill: none;
  stroke: rgba(241, 241, 236, 0.5);
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}
.cv-color__curve circle {
  fill: #f1f1ec;
  opacity: 0.55;
}
.cv-color__curve-label {
  position: absolute;
  right: 10%;
  top: 79%;
  font-size: clamp(7px, 0.62vw, 10px);
  letter-spacing: 0.26em;
  color: rgba(241, 241, 236, 0.34);
}

/* --- 中前层：阶调指示条 --- */
.cv-color__strips {
  position: absolute;
  inset: 0;
}
.cv-color__strip {
  position: absolute;
  left: 8%;
  top: 73%;
  width: 48%;
  height: 1.2vh;
  background: linear-gradient(
    90deg,
    rgba(72, 108, 132, 0.55) 0%,
    rgba(120, 128, 134, 0.5) 30%,
    rgba(150, 148, 144, 0.5) 52%,
    rgba(176, 138, 92, 0.55) 78%,
    rgba(186, 148, 96, 0.55) 100%
  );
}
.cv-color__strip-labels {
  position: absolute;
  left: 8%;
  top: 76%;
  width: 48%;
  display: flex;
  justify-content: space-between;
  font-size: clamp(7px, 0.62vw, 10px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.34);
}

/* --- 前层：巨型 COLOR 标题 --- */
.cv-color__type {
  position: absolute;
  inset: 0;
}
.cv-color__word {
  position: absolute;
  right: -4%;
  top: 24%;
  display: block;
  font-weight: 700;
  font-size: 24vh;
  line-height: 0.8;
  letter-spacing: -0.02em;
  user-select: none;
  white-space: nowrap;
  will-change: transform, opacity;
}
/* 镂空字形态：融入中性色场 */
.cv-color__word--cutout {
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(241, 241, 236, 0.75);
  opacity: 0.85;
}
/* 实心字形态：经典高保真排版 */
.cv-color__word--solid {
  color: rgba(241, 241, 236, 0.92);
  opacity: 0;
}

/* --- 静态参照框 --- */
.cv-color__info {
  position: absolute;
  left: 9%;
  top: 10%;
  display: flex;
  flex-direction: column;
  gap: 1vh;
}
.cv-color__eyebrow {
  font-size: clamp(9px, 0.82vw, 13px);
  letter-spacing: 0.3em;
  color: rgba(241, 241, 236, 0.34);
}
.cv-color__title {
  font-size: clamp(12px, 1.3vw, 20px);
  letter-spacing: 0.22em;
  color: rgba(241, 241, 236, 0.72);
}
.cv-color__lead {
  font-size: clamp(17px, 2.1vw, 32px);
  font-weight: 300;
  letter-spacing: 0.04em;
  color: rgba(241, 241, 236, 0.9);
}
.cv-color__sub {
  font-size: clamp(8px, 0.72vw, 12px);
  letter-spacing: 0.26em;
  color: rgba(241, 241, 236, 0.38);
}
.cv-color__params {
  position: absolute;
  left: 9%;
  bottom: 13%;
  display: flex;
  flex-direction: column;
  gap: 0.7vh;
  font-size: clamp(8px, 0.7vw, 11px);
  letter-spacing: 0.2em;
}
.cv-color__params span {
  display: flex;
  gap: 1.4vw;
}
.cv-color__params i {
  font-style: normal;
  color: rgba(241, 241, 236, 0.34);
}
.cv-color__params b {
  font-weight: 400;
  color: rgba(241, 241, 236, 0.6);
  font-variant-numeric: tabular-nums;
}
.cv-color__lut {
  position: absolute;
  left: 9%;
  bottom: 5%;
  display: flex;
  gap: clamp(14px, 1.8vw, 34px);
  font-size: clamp(7px, 0.62vw, 10px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.28);
}

@media (prefers-reduced-motion: reduce) {
  .cv-color__word--cutout {
    display: none;
  }
  .cv-color__word--solid {
    opacity: 0.92 !important;
  }
  .cv-color__field-wrap {
    opacity: 0.35;
  }
  .cv-color__strip-bar {
    transform: none !important;
  }
}
</style>

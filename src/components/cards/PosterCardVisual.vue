<template>
  <div class="cv cv-poster">
    <!-- 3D 纵深递进矩形空间容器 (Perspective Stage) -->
    <div class="cv-poster__spatial-stage">
      <!-- 远景版面 (Deep Plate: 远景深空，保留透视深渊) -->
      <div class="cv-poster__plate-layer cv-poster__plate-layer--deep">
        <div class="plate-deep-content">
          <span class="plate-deep-grid" />
          <span class="plate-deep-title">GRAPHIC / 03</span>
          <div class="plate-deep-block" />
        </div>
      </div>

      <!-- 主海报版面 (Main Plate: 核心停驻海报，包含粗大窄体与星芒印记) -->
      <div class="cv-poster__plate-layer cv-poster__plate-layer--main">
        <div class="cv-poster__art">
          <div class="cv-poster__art-head">
            <span class="cv-poster__art-kicker">POSTER</span>
            <span class="cv-poster__art-year">2026</span>
          </div>

          <!-- 星芒印记徽标：从文字后方旋转穿出落位 -->
          <div class="cv-poster__badge">
            <svg class="cv-poster__star-badge" viewBox="0 0 48 48" aria-hidden="true">
              <!-- 十二角星芒与同心套准圆 -->
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 2" />
              <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="1" />
              <path
                d="M24 2 L26 18 L42 16 L28 24 L40 34 L25 28 L24 46 L21 28 L8 34 L18 24 L4 16 L22 18 Z"
                fill="currentColor"
                opacity="0.9"
              />
            </svg>
          </div>

          <!-- 主海报标题文字 (沿不同基线进入后对齐) -->
          <div class="cv-poster__letters-group">
            <span class="cv-poster__p-char cv-poster__p-char--p">P</span>
            <span class="cv-poster__p-char cv-poster__p-char--o">O</span>
            <span class="cv-poster__p-char cv-poster__p-char--s">S</span>
            <span class="cv-poster__p-char cv-poster__p-char--t">T</span>
            <span class="cv-poster__p-char cv-poster__p-char--e">E</span>
            <span class="cv-poster__p-char cv-poster__p-char--r">R</span>
          </div>

          <div class="cv-poster__art-bottom">
            <span class="cv-poster__art-title">VISUAL<br />STUDY</span>
            <span class="cv-poster__art-foot">SWISS TYPOGRAPHY / 01</span>
          </div>
        </div>

        <!-- 版面裁切套准标记 -->
        <div class="cv-poster__plate-marks">
          <span class="plate-mark plate-mark--tl" />
          <span class="plate-mark plate-mark--tr" />
          <span class="plate-mark plate-mark--bl" />
          <span class="plate-mark plate-mark--br" />
        </div>
      </div>

      <!-- 近景版面 (Fore Plate: 0.8-2s 从镜头前景掠过并留下边缘残余) -->
      <div class="cv-poster__plate-layer cv-poster__plate-layer--fore">
        <div class="plate-fore-frame">
          <span class="plate-fore-tag">SERIES 02</span>
          <div class="plate-fore-slit" />
        </div>
      </div>
    </div>

    <!-- 背景版式网格 (16 / 12 px) -->
    <div class="cv-poster__grid">
      <span
        v-for="x in [14, 32, 50, 68, 86]"
        :key="'v' + x"
        class="cv-poster__vline"
        :style="{ left: x + '%' }"
      />
      <span
        v-for="y in [22, 46, 72]"
        :key="'h' + y"
        class="cv-poster__hline"
        :style="{ top: y + '%' }"
      />
    </div>

    <!-- 巨型后景 POSTER 粗大窄体 (46 / 30 px) -->
    <div class="cv-poster__type">
      <span class="cv-poster__type-inner">
        <span class="cv-poster__word">POSTER</span>
      </span>
    </div>

    <!-- 印刷印装裁切线与套印十字 (22 / 15 px) -->
    <div class="cv-poster__marks">
      <span class="cv-poster__crop cv-poster__crop--tl" />
      <span class="cv-poster__crop cv-poster__crop--bl" />
      <span class="cv-poster__crop cv-poster__crop--tr" />
      <span class="cv-poster__reg" />
    </div>

    <!-- 静态说明区：永不移动 (Movement 0) -->
    <div class="cv-poster__info">
      <span class="cv-poster__eyebrow">05</span>
      <span class="cv-poster__title">POSTER</span>
      <span class="cv-poster__lead">海报设计</span>
    </div>
    <div class="cv-poster__series"><span>01</span><span>02</span><span>03</span></div>
    <div class="cv-poster__meta">
      <span>GRAPHIC DESIGN</span>
      <span>VISUAL STUDY</span>
      <span>2026</span>
    </div>
  </div>
</template>

<style scoped>
/* ---- 05 / POSTER 海报设计 — 有纵深的动态海报 ---------------------- */

/* 3D 纵深透视空间舞台 */
.cv-poster__spatial-stage {
  position: absolute;
  inset: 0;
  perspective: 900px;
  perspective-origin: 65% 45%;
  pointer-events: none;
  z-index: 4;
}

.cv-poster__plate-layer {
  position: absolute;
  transform-style: preserve-3d;
  will-change: transform, opacity;
}

/* 远景版面：沉底深色构架 */
.cv-poster__plate-layer--deep {
  right: -2%;
  top: 10%;
  width: 32%;
  height: 48%;
  background: #141517;
  border: 1px solid rgba(241, 241, 236, 0.14);
  transform: translateZ(-240px) rotateY(-12deg);
  opacity: 0.65;
}
.plate-deep-content {
  padding: 12%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.plate-deep-title {
  font-size: clamp(8px, 0.7vw, 11px);
  letter-spacing: 0.28em;
  color: rgba(241, 241, 236, 0.35);
}
.plate-deep-block {
  width: 60%;
  height: 2px;
  background: rgba(241, 241, 236, 0.2);
}

/* 主海报版面：实体米白印刷板 */
.cv-poster__plate-layer--main {
  right: 5%;
  top: 14%;
  width: 40%;
  height: 60%;
  background-color: #eae8e3;
  box-shadow: -14px 18px 45px rgba(0, 0, 0, 0.7);
  transform: translateZ(-60px) rotateY(-8deg) rotateX(4deg);
  overflow: hidden;
  z-index: 5;
}
.cv-poster__art {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 8%;
  color: #121310;
}
.cv-poster__art-head {
  display: flex;
  justify-content: space-between;
}
.cv-poster__art-kicker {
  font-size: clamp(8px, 0.72vw, 12px);
  letter-spacing: 0.32em;
  color: rgba(18, 19, 16, 0.65);
}
.cv-poster__art-year {
  font-size: clamp(9px, 0.9vw, 15px);
  letter-spacing: 0.24em;
  color: rgba(18, 19, 16, 0.6);
}

/* 星芒徽标印记 */
.cv-poster__badge {
  position: absolute;
  right: 12%;
  top: 28%;
  width: clamp(38px, 4.4vw, 76px);
  height: clamp(38px, 4.4vw, 76px);
  color: #1a1a15;
  transform: scale(0) rotate(-120deg);
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  will-change: transform, opacity;
}
.cv-poster__star-badge {
  width: 100%;
  height: 100%;
}

/* 主海报字母群组 */
.cv-poster__letters-group {
  margin-top: 1.5vh;
  display: flex;
  font-weight: 800;
  font-size: clamp(24px, 3.6vw, 62px);
  line-height: 0.88;
  letter-spacing: -0.02em;
  color: #121310;
  z-index: 3;
}
.cv-poster__p-char {
  display: inline-block;
  will-change: transform, opacity;
}

.cv-poster__art-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8vh;
  z-index: 3;
}
.cv-poster__art-title {
  font-weight: 700;
  font-size: clamp(20px, 2.8vw, 44px);
  line-height: 0.88;
  letter-spacing: -0.02em;
}
.cv-poster__art-foot {
  font-size: clamp(7px, 0.62vw, 10px);
  letter-spacing: 0.28em;
  color: rgba(18, 19, 16, 0.5);
}

.cv-poster__plate-marks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.plate-mark {
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: rgba(18, 19, 16, 0.4);
}
.plate-mark--tl { left: 4px; top: 4px; border-left: 1px solid; border-top: 1px solid; }
.plate-mark--tr { right: 4px; top: 4px; border-right: 1px solid; border-top: 1px solid; }
.plate-mark--bl { left: 4px; bottom: 4px; border-left: 1px solid; border-bottom: 1px solid; }
.plate-mark--br { right: 4px; bottom: 4px; border-right: 1px solid; border-bottom: 1px solid; }

/* 近景版面：从前景呼啸穿过 */
.cv-poster__plate-layer--fore {
  right: -12%;
  top: 6%;
  width: 44%;
  height: 64%;
  background: rgba(26, 27, 28, 0.94);
  border: 1px solid rgba(241, 241, 236, 0.4);
  box-shadow: -20px 24px 60px rgba(0, 0, 0, 0.85);
  transform: translateZ(180px) rotateY(-18deg);
  z-index: 7;
}
.plate-fore-frame {
  padding: 10%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.plate-fore-tag {
  font-size: clamp(9px, 0.8vw, 13px);
  letter-spacing: 0.32em;
  color: rgba(241, 241, 236, 0.8);
}
.plate-fore-slit {
  width: 80%;
  height: 4px;
  background: rgba(241, 241, 236, 0.5);
}

/* --- 后层：版式网格 (16 / 12 px) --- */
.cv-poster__grid {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  z-index: 1;
}
.cv-poster__vline,
.cv-poster__hline {
  position: absolute;
  background: #f1f1ec;
}
.cv-poster__vline {
  top: 6%;
  bottom: 20%;
  width: 1px;
}
.cv-poster__hline {
  left: 5%;
  right: 18%;
  height: 1px;
}

/* --- 中后层：巨型 POSTER --- */
.cv-poster__type {
  position: absolute;
  inset: 0;
  z-index: 2;
}
.cv-poster__type-inner {
  display: block;
  width: 100%;
  height: 100%;
  will-change: transform, opacity;
}
.cv-poster__word {
  position: absolute;
  left: -6%;
  top: 52%;
  display: block;
  font-weight: 700;
  font-size: 30vh;
  line-height: 0.8;
  letter-spacing: -0.03em;
  color: rgba(241, 241, 236, 0.94);
  user-select: none;
  white-space: nowrap;
}

/* --- 裁切标记与套准十字 --- */
.cv-poster__marks {
  position: absolute;
  inset: 0;
  z-index: 6;
}
.cv-poster__crop {
  position: absolute;
  width: 1.4vw;
  height: 1.4vw;
}
.cv-poster__crop--tl {
  left: 55%;
  top: 14%;
  transform: translate(calc(-100% - 10px), calc(-100% - 10px));
  border-left: 1px solid rgba(241, 241, 236, 0.42);
  border-top: 1px solid rgba(241, 241, 236, 0.42);
}
.cv-poster__crop--bl {
  left: 55%;
  top: 74%;
  transform: translate(calc(-100% - 10px), 10px);
  border-left: 1px solid rgba(241, 241, 236, 0.42);
  border-bottom: 1px solid rgba(241, 241, 236, 0.42);
}
.cv-poster__crop--tr {
  left: 95%;
  top: 14%;
  transform: translate(10px, calc(-100% - 10px));
  border-right: 1px solid rgba(241, 241, 236, 0.42);
  border-top: 1px solid rgba(241, 241, 236, 0.42);
}
.cv-poster__reg {
  position: absolute;
  left: 55%;
  top: 44%;
  width: 12px;
  height: 12px;
  transform: translate(calc(-100% - 14px), -50%);
}
.cv-poster__reg::before,
.cv-poster__reg::after {
  content: '';
  position: absolute;
  background: rgba(241, 241, 236, 0.55);
}
.cv-poster__reg::before {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}
.cv-poster__reg::after {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}

/* --- 静态说明块 --- */
.cv-poster__info {
  position: absolute;
  left: 8%;
  top: 9%;
  display: flex;
  flex-direction: column;
  gap: 1vh;
  z-index: 10;
}
.cv-poster__eyebrow {
  font-size: clamp(9px, 0.82vw, 13px);
  letter-spacing: 0.3em;
  color: rgba(241, 241, 236, 0.34);
}
.cv-poster__title {
  font-size: clamp(12px, 1.3vw, 20px);
  letter-spacing: 0.22em;
  color: rgba(241, 241, 236, 0.72);
}
.cv-poster__lead {
  font-size: clamp(17px, 2.1vw, 32px);
  font-weight: 300;
  letter-spacing: 0.04em;
  color: rgba(241, 241, 236, 0.9);
}
.cv-poster__series {
  position: absolute;
  left: 79%;
  top: 76%;
  display: flex;
  gap: clamp(10px, 1.1vw, 22px);
  font-size: clamp(7px, 0.62vw, 10px);
  letter-spacing: 0.26em;
  color: rgba(241, 241, 236, 0.32);
  z-index: 10;
}
.cv-poster__series span:first-child {
  color: rgba(241, 241, 236, 0.72);
}
.cv-poster__meta {
  position: absolute;
  left: 8%;
  bottom: 8%;
  display: flex;
  gap: clamp(14px, 1.8vw, 34px);
  font-size: clamp(8px, 0.7vw, 11px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.3);
  z-index: 10;
}

@media (prefers-reduced-motion: reduce) {
  .cv-poster__plate-layer--fore {
    display: none;
  }
  .cv-poster__plate-layer--main {
    transform: translateZ(0) rotateY(0) rotateX(0) !important;
  }
  .cv-poster__badge {
    transform: scale(1) rotate(0deg) !important;
    opacity: 0.9 !important;
  }
  .cv-poster__p-char {
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>

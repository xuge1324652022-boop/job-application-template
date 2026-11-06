<template>
  <div class="cv cv-news">
    <!-- 后层：广播滚动数据流跑马灯 (Back: 15 / 10 px) -->
    <div class="cv-news__ticker">
      <div class="cv-news__ticker-track">
        <span>NEWS</span>
        <span>REPORT</span>
        <span>UPDATE</span>
        <span>FIELD</span>
        <span>TOKYO 2026</span>
        <span>NEWS</span>
        <span>REPORT</span>
        <span>UPDATE</span>
        <span>FIELD</span>
        <span>TOKYO 2026</span>
      </div>
    </div>

    <!-- 中后层：信息阵列网络 (4x4 传播波格点系统) (Mid-back: 20 / 14 px) -->
    <div class="cv-news__matrix">
      <div
        v-for="(item, idx) in matrixItems"
        :key="idx"
        class="cv-news__matrix-cell"
        :class="[`cv-news__matrix-cell--${item.type}`, `cell-row-${item.row}`, `cell-col-${item.col}`]"
      >
        <span v-if="item.type === 'dot'" class="matrix-dot" />
        <span v-else-if="item.type === 'rect'" class="matrix-rect" />
        <span v-else class="matrix-tick" />
      </div>
      <!-- 衔接循环的扩展波节点 -->
      <div class="cv-news__expand-node" />
    </div>

    <!-- 中层：四个汇聚区域与 N-E-W-S 字形窗口 (Mid: 28 / 20 px) -->
    <div class="cv-news__quads">
      <div class="cv-news__quad cv-news__quad--n">
        <span class="quad-letter">N</span>
        <div class="quad-stream" />
        <span class="quad-coord">01 / N</span>
      </div>
      <div class="cv-news__quad cv-news__quad--e">
        <span class="quad-letter">E</span>
        <div class="quad-stream" />
        <span class="quad-coord">02 / E</span>
      </div>
      <div class="cv-news__quad cv-news__quad--w">
        <span class="quad-letter">W</span>
        <div class="quad-stream" />
        <span class="quad-coord">03 / W</span>
      </div>
      <div class="cv-news__quad cv-news__quad--s">
        <span class="quad-letter">S</span>
        <div class="quad-stream" />
        <span class="quad-coord">04 / S</span>
      </div>
    </div>

    <!-- 中前层：横向信息带与下三分之一字幕条 (Mid-front: 32 / 22 px) -->
    <div class="cv-news__headline">
      <div class="cv-news__headline-bar" />
      <span class="cv-news__headline-text">新闻影像 · LATEST UPDATE / FIELD REPORT</span>
    </div>

    <!-- 前层：聚合成型的巨型 NEWS (Front: 45 / 32 px) -->
    <div class="cv-news__type">
      <div class="cv-news__word">
        <span class="cv-news__char cv-news__char--n">N</span>
        <span class="cv-news__char cv-news__char--e">E</span>
        <span class="cv-news__char cv-news__char--w">W</span>
        <span class="cv-news__char cv-news__char--s">S</span>
      </div>
    </div>

    <!-- 前层角标：LIVE 真实直播状态指示 (Front-top: 15 / 10 px) -->
    <div class="cv-news__live">
      <span class="cv-news__live-dot" />
      <span class="cv-news__live-label">LIVE</span>
      <span class="cv-news__live-time">09:42</span>
    </div>

    <!-- 静态参照框：永不移动 (Movement 0) -->
    <div class="cv-news__info">
      <span class="cv-news__eyebrow">04</span>
      <span class="cv-news__title">NEWS</span>
      <span class="cv-news__lead">新闻影像</span>
    </div>
    <div class="cv-news__dateline">
      <span>TOKYO / 2026</span>
      <span>09:42:16</span>
      <span>VIDEO REPORT</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 4x4 信息阵列数据：包含点、矩形和刻度短线，组成有序几何信息阵列
const matrixItems = [
  { row: 1, col: 1, type: 'dot' },
  { row: 1, col: 2, type: 'rect' },
  { row: 1, col: 3, type: 'tick' },
  { row: 1, col: 4, type: 'dot' },
  { row: 2, col: 1, type: 'rect' },
  { row: 2, col: 2, type: 'dot' },
  { row: 2, col: 3, type: 'rect' },
  { row: 2, col: 4, type: 'tick' },
  { row: 3, col: 1, type: 'tick' },
  { row: 3, col: 2, type: 'rect' },
  { row: 3, col: 3, type: 'dot' },
  { row: 3, col: 4, type: 'rect' },
  { row: 4, col: 1, type: 'dot' },
  { row: 4, col: 2, type: 'tick' },
  { row: 4, col: 3, type: 'rect' },
  { row: 4, col: 4, type: 'dot' },
]
</script>

<style scoped>
/* ---- 04 / NEWS 新闻影像 — 信息汇聚与发布 ------------------------ */

/* --- 后层：跑马灯数据流 --- */
.cv-news__ticker {
  position: absolute;
  left: 0;
  right: 0;
  top: 3.6%;
  overflow: hidden;
  padding: 0.7vh 0;
  border-top: 1px solid rgba(241, 241, 236, 0.08);
  border-bottom: 1px solid rgba(241, 241, 236, 0.08);
  z-index: 1;
}
.cv-news__ticker-track {
  display: flex;
  width: max-content;
  will-change: transform;
}
.cv-news__ticker-track span {
  padding-right: clamp(28px, 3.2vw, 64px);
  font-size: clamp(8px, 0.72vw, 12px);
  letter-spacing: 0.34em;
  color: rgba(241, 241, 236, 0.22);
  white-space: nowrap;
}

/* --- 中后层：4x4 信息阵列网络 --- */
.cv-news__matrix {
  position: absolute;
  left: 12%;
  top: 22%;
  width: 76%;
  height: 52%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 1.5vh;
  pointer-events: none;
  z-index: 2;
}
.cv-news__matrix-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform, opacity;
}
.matrix-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(241, 241, 236, 0.55);
}
.matrix-rect {
  width: 14px;
  height: 8px;
  border: 1px solid rgba(241, 241, 236, 0.35);
  background: rgba(241, 241, 236, 0.08);
}
.matrix-tick {
  width: 18px;
  height: 1px;
  background: rgba(241, 241, 236, 0.6);
}

/* 循环衔接扩展节点 */
.cv-news__expand-node {
  position: absolute;
  right: 4%;
  top: 4%;
  width: 18px;
  height: 18px;
  border: 1px solid rgba(241, 241, 236, 0.8);
  opacity: 0;
  transform: scale(0);
}

/* --- 中层：N-E-W-S 四汇聚区域与字形窗口 --- */
.cv-news__quads {
  position: absolute;
  left: 14%;
  top: 24%;
  width: 72%;
  height: 48%;
  pointer-events: none;
  z-index: 3;
}
.cv-news__quad {
  position: absolute;
  width: 44%;
  height: 42%;
  border: 1px solid rgba(241, 241, 236, 0.28);
  background: rgba(18, 19, 20, 0.72);
  backdrop-filter: blur(2px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1vh 1vw;
  opacity: 0;
  will-change: transform, opacity;
}
.cv-news__quad--n {
  left: 0;
  top: 0;
  z-index: 4;
}
.cv-news__quad--e {
  right: 0;
  top: 4%;
  z-index: 5;
}
.cv-news__quad--w {
  left: 3%;
  bottom: 0;
  z-index: 6;
}
.cv-news__quad--s {
  right: 2%;
  bottom: 2%;
  z-index: 7;
}
.quad-letter {
  font-size: clamp(22px, 3.4vw, 56px);
  font-weight: 700;
  line-height: 1;
  color: rgba(241, 241, 236, 0.88);
}
.quad-stream {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(241, 241, 236, 0.8), transparent);
}
.quad-coord {
  font-size: clamp(7px, 0.6vw, 10px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.4);
}

/* --- 中前层：横向信息带与下三分之一字幕条 --- */
.cv-news__headline {
  position: absolute;
  left: 9%;
  top: 67%;
  width: 78%;
  z-index: 8;
}
.cv-news__headline-bar {
  width: 0%;
  height: 2px;
  background: rgba(241, 241, 236, 0.8);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  margin-bottom: 0.8vh;
  will-change: width;
}
.cv-news__headline-text {
  display: block;
  font-size: clamp(9px, 0.86vw, 13px);
  letter-spacing: 0.28em;
  color: rgba(241, 241, 236, 0.85);
  white-space: nowrap;
  opacity: 0;
  will-change: transform, opacity;
}

/* --- 前层：聚合成型的巨型 NEWS --- */
.cv-news__type {
  position: absolute;
  inset: 0;
  z-index: 9;
}
.cv-news__word {
  position: absolute;
  left: 6%;
  top: 32%;
  display: flex;
  user-select: none;
}
.cv-news__char {
  display: inline-block;
  font-weight: 700;
  font-size: 25vh;
  line-height: 0.8;
  letter-spacing: -0.02em;
  color: rgba(241, 241, 236, 0.92);
  will-change: transform, opacity;
}

/* --- LIVE 状态指示 --- */
.cv-news__live {
  position: absolute;
  right: 9%;
  top: 13.5%;
  display: flex;
  align-items: center;
  gap: clamp(8px, 0.85vw, 15px);
  z-index: 10;
}
.cv-news__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(198, 74, 60, 0.95);
  box-shadow: 0 0 8px rgba(198, 74, 60, 0.8);
}
.cv-news__live-label {
  font-size: clamp(8px, 0.72vw, 11px);
  letter-spacing: 0.34em;
  color: rgba(241, 241, 236, 0.85);
}
.cv-news__live-time {
  font-size: clamp(8px, 0.72vw, 11px);
  letter-spacing: 0.2em;
  color: rgba(241, 241, 236, 0.45);
  font-variant-numeric: tabular-nums;
}

/* --- 静态参照框 --- */
.cv-news__info {
  position: absolute;
  left: 9%;
  top: 10%;
  display: flex;
  flex-direction: column;
  gap: 1vh;
  z-index: 10;
}
.cv-news__eyebrow {
  font-size: clamp(9px, 0.82vw, 13px);
  letter-spacing: 0.3em;
  color: rgba(241, 241, 236, 0.34);
}
.cv-news__title {
  font-size: clamp(12px, 1.3vw, 20px);
  letter-spacing: 0.22em;
  color: rgba(241, 241, 236, 0.72);
}
.cv-news__lead {
  font-size: clamp(17px, 2.1vw, 32px);
  font-weight: 300;
  letter-spacing: 0.04em;
  color: rgba(241, 241, 236, 0.9);
}
.cv-news__dateline {
  position: absolute;
  left: 9%;
  bottom: 7%;
  display: flex;
  gap: clamp(16px, 2vw, 40px);
  font-size: clamp(8px, 0.7vw, 11px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.32);
  z-index: 10;
}
.cv-news__dateline span {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .cv-news__matrix {
    opacity: 0.15;
  }
  .cv-news__quads {
    display: none;
  }
  .cv-news__char {
    transform: none !important;
    opacity: 0.92 !important;
  }
  .cv-news__headline-bar {
    width: 60% !important;
  }
  .cv-news__headline-text {
    opacity: 0.85 !important;
  }
}
</style>

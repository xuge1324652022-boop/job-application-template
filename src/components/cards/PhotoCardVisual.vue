<template>
  <div class="cv cv-photo">
    <!-- 3D 光学结构透视舞台 (3D Optical Perspective Stage) -->
    <div class="cv-photo__optical-stage">
      <!-- 镜头环 1：外环焦距环 (Lens Outer Ring: 带有刻度与发丝圈) -->
      <div class="cv-photo__lens-ring cv-photo__lens-ring--outer">
        <svg class="lens-ring-svg" viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r="114" fill="none" stroke="rgba(241, 241, 236, 0.28)" stroke-width="1.5" />
          <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(241, 241, 236, 0.15)" stroke-width="1" stroke-dasharray="2 4" />
          <circle cx="120" cy="120" r="96" fill="none" stroke="rgba(241, 241, 236, 0.22)" stroke-width="1" />
          <!-- 环形刻度线 -->
          <line x1="120" y1="6" x2="120" y2="14" stroke="rgba(241, 241, 236, 0.6)" stroke-width="1.5" />
          <line x1="198" y1="42" x2="192" y2="48" stroke="rgba(241, 241, 236, 0.4)" stroke-width="1" />
          <line x1="228" y1="120" x2="220" y2="120" stroke="rgba(241, 241, 236, 0.5)" stroke-width="1.2" />
          <line x1="198" y1="198" x2="192" y2="192" stroke="rgba(241, 241, 236, 0.4)" stroke-width="1" />
          <line x1="120" y1="234" x2="120" y2="226" stroke="rgba(241, 241, 236, 0.5)" stroke-width="1.2" />
          <line x1="42" y1="198" x2="48" y2="192" stroke="rgba(241, 241, 236, 0.4)" stroke-width="1" />
          <line x1="12" y1="120" x2="20" y2="120" stroke="rgba(241, 241, 236, 0.5)" stroke-width="1.2" />
          <line x1="42" y1="42" x2="48" y2="48" stroke="rgba(241, 241, 236, 0.4)" stroke-width="1" />
        </svg>
      </div>

      <!-- 镜头环 2：内环对焦环 (Lens Inner Ring: 带有内凹环形斜角明暗) -->
      <div class="cv-photo__lens-ring cv-photo__lens-ring--inner">
        <svg class="lens-ring-svg" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(241, 241, 236, 0.35)" stroke-width="2" />
          <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(241, 241, 236, 0.18)" stroke-width="1" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(241, 241, 236, 0.25)" stroke-width="1" stroke-dasharray="4 6" />
        </svg>
      </div>

      <!-- 光圈叶片机构 (Aperture Blades System) -->
      <div class="cv-photo__aperture-wrap">
        <svg class="cv-photo__aperture-svg" viewBox="0 0 160 160" aria-hidden="true">
          <g class="aperture-blades-group">
            <path class="aperture-blade blade-1" d="M80 15 L120 40 L105 75 Z" fill="rgba(28, 29, 30, 0.88)" stroke="rgba(241, 241, 236, 0.4)" stroke-width="0.8" />
            <path class="aperture-blade blade-2" d="M135 60 L145 105 L110 115 Z" fill="rgba(24, 25, 26, 0.88)" stroke="rgba(241, 241, 236, 0.4)" stroke-width="0.8" />
            <path class="aperture-blade blade-3" d="M125 120 L90 145 L70 115 Z" fill="rgba(28, 29, 30, 0.88)" stroke="rgba(241, 241, 236, 0.4)" stroke-width="0.8" />
            <path class="aperture-blade blade-4" d="M70 140 L30 115 L55 85 Z" fill="rgba(24, 25, 26, 0.88)" stroke="rgba(241, 241, 236, 0.4)" stroke-width="0.8" />
            <path class="aperture-blade blade-5" d="M25 95 L20 50 L60 55 Z" fill="rgba(28, 29, 30, 0.88)" stroke="rgba(241, 241, 236, 0.4)" stroke-width="0.8" />
            <path class="aperture-blade blade-6" d="M45 35 L85 20 L95 60 Z" fill="rgba(24, 25, 26, 0.88)" stroke="rgba(241, 241, 236, 0.4)" stroke-width="0.8" />
          </g>
        </svg>
      </div>

      <!-- 摄影画幅与作品本体 (由光圈圆孔连续扩展成矩形画幅) -->
      <div class="cv-photo__image">
        <div class="cv-photo__plate">
          <img
            class="cv-photo__artwork"
            :src="defaultPhoto"
            alt="Photography Artwork"
            loading="lazy"
          />
          <div class="cv-photo__artwork-scrim" />
        </div>
      </div>
    </div>

    <!-- 卡纸线框与微光刻线 (Mount frame & light line) -->
    <div class="cv-photo__frame">
      <span class="cv-photo__frame-box" />
      <span class="cv-photo__light" />
    </div>

    <!-- 对焦标记与拍摄参数 (Focus mark & Exif) -->
    <div class="cv-photo__meta">
      <span class="cv-photo__mark" />
      <span class="cv-photo__exif">50MM · F/1.4</span>
      <span class="cv-photo__archive">PHOTO / 01</span>
      <span class="cv-photo__year">2026</span>
    </div>

    <!-- 标题：PHOTO 字母从画幅后方穿出落位 -->
    <div class="cv-photo__type">
      <div class="cv-photo__word">
        <span class="cv-photo__letter cv-photo__letter--p">P</span>
        <span class="cv-photo__letter cv-photo__letter--h">H</span>
        <span class="cv-photo__letter cv-photo__letter--o1">O</span>
        <span class="cv-photo__letter cv-photo__letter--t">T</span>
        <span class="cv-photo__letter cv-photo__letter--o2">O</span>
      </div>
    </div>

    <!-- 静态说明：永不移动 (Movement 0) -->
    <div class="cv-photo__info">
      <span class="cv-photo__eyebrow">06</span>
      <span class="cv-photo__lead">摄影</span>
    </div>
    <span class="cv-photo__note">OPTICAL / LIGHT / MOMENT</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { photoCollection } from '../../data/visualPortfolio'

const defaultPhoto = computed(() => photoCollection[0]?.src || '/portfolio/mountain-cloud-1600.webp')
</script>

<style scoped>
/* ---- 06 / PHOTO 摄影 — 光学结构形成影像 -------------------------- */

/* 3D 光学透视舞台 */
.cv-photo__optical-stage {
  position: absolute;
  inset: 0;
  perspective: 900px;
  perspective-origin: 62% 46%;
  pointer-events: none;
  z-index: 4;
}

/* 两个立体镜头环 */
.cv-photo__lens-ring {
  position: absolute;
  left: 60%;
  top: 48%;
  transform-style: preserve-3d;
  pointer-events: none;
  will-change: transform, opacity;
}
.lens-ring-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.cv-photo__lens-ring--outer {
  width: 52vh;
  height: 52vh;
  margin: -26vh 0 0 -26vh;
  transform: translateZ(60px) rotateY(-36deg) rotateX(18deg);
  opacity: 0.8;
  z-index: 6;
}
.cv-photo__lens-ring--inner {
  width: 44vh;
  height: 44vh;
  margin: -22vh 0 0 -22vh;
  transform: translateZ(20px) rotateY(28deg) rotateX(-14deg);
  opacity: 0.7;
  z-index: 5;
}

/* 光圈叶片机构 */
.cv-photo__aperture-wrap {
  position: absolute;
  left: 60%;
  top: 48%;
  width: 34vh;
  height: 34vh;
  margin: -17vh 0 0 -17vh;
  transform-style: preserve-3d;
  z-index: 4;
  opacity: 0.9;
  will-change: transform, opacity;
}
.cv-photo__aperture-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.aperture-blade {
  transform-origin: center center;
  transition: transform 0.2s ease;
}

/* 摄影画幅本体：由圆形开口连续扩展为矩形画幅 */
.cv-photo__image {
  position: absolute;
  inset: 0;
  z-index: 3;
}
.cv-photo__plate {
  position: absolute;
  right: 12%;
  top: 20%;
  width: 42%;
  height: 54%;
  overflow: hidden;
  background-color: #121312;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
  clip-path: circle(22% at 50% 50%);
  will-change: clip-path, transform, opacity;
}
.cv-photo__artwork {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform-origin: center center;
  will-change: transform;
}
.cv-photo__artwork-scrim {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(10, 10, 10, 0.45) 100%);
  pointer-events: none;
}

/* 卡纸线框与微光 */
.cv-photo__frame {
  position: absolute;
  inset: 0;
  z-index: 2;
}
.cv-photo__frame-box {
  position: absolute;
  right: calc(12% - 10px);
  top: calc(20% - 10px);
  width: calc(42% + 20px);
  height: calc(54% + 20px);
  border: 1px solid rgba(241, 241, 236, 0.45);
  opacity: 0.5;
  will-change: transform, opacity;
}
.cv-photo__light {
  position: absolute;
  right: 12%;
  top: calc(74% + 18px);
  width: 24%;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(241, 241, 236, 0) 0%,
    rgba(241, 241, 236, 0.4) 45%,
    rgba(241, 241, 236, 0) 100%
  );
}

/* 对焦标记与 Exif */
.cv-photo__meta {
  position: absolute;
  inset: 0;
  z-index: 8;
}
.cv-photo__mark {
  position: absolute;
  left: 69%;
  top: 76%;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
}
.cv-photo__mark::before,
.cv-photo__mark::after {
  content: '';
  position: absolute;
  background: rgba(241, 241, 236, 0.65);
}
.cv-photo__mark::before {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}
.cv-photo__mark::after {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}
.cv-photo__exif,
.cv-photo__archive,
.cv-photo__year {
  position: absolute;
  right: 12%;
  font-size: clamp(8px, 0.7vw, 11px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.35);
}
.cv-photo__exif {
  bottom: 16%;
  color: rgba(241, 241, 236, 0.68);
  font-variant-numeric: tabular-nums;
}
.cv-photo__archive {
  bottom: 11.5%;
}
.cv-photo__year {
  bottom: 7%;
}

/* 标题：从画幅后方穿出的字母 */
.cv-photo__type {
  position: absolute;
  inset: 0;
  z-index: 5;
}
.cv-photo__word {
  position: absolute;
  left: 8%;
  top: 24%;
  display: flex;
  user-select: none;
}
.cv-photo__letter {
  display: inline-block;
  font-weight: 700;
  font-size: clamp(38px, 6vw, 92px);
  line-height: 0.86;
  letter-spacing: -0.01em;
  color: rgba(241, 241, 236, 0.92);
  will-change: transform, opacity;
}

/* 静态说明 */
.cv-photo__info {
  position: absolute;
  left: 8%;
  top: 9%;
  display: flex;
  flex-direction: column;
  gap: 0.8vh;
  z-index: 10;
}
.cv-photo__eyebrow {
  font-size: clamp(9px, 0.82vw, 13px);
  letter-spacing: 0.3em;
  color: rgba(241, 241, 236, 0.34);
}
.cv-photo__lead {
  font-size: clamp(17px, 2.1vw, 32px);
  font-weight: 300;
  letter-spacing: 0.04em;
  color: rgba(241, 241, 236, 0.9);
}
.cv-photo__note {
  position: absolute;
  left: 8%;
  bottom: 7%;
  font-size: clamp(8px, 0.7vw, 11px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.28);
  z-index: 10;
}

@media (prefers-reduced-motion: reduce) {
  .cv-photo__lens-ring {
    display: none;
  }
  .cv-photo__aperture-wrap {
    display: none;
  }
  .cv-photo__plate {
    clip-path: none !important;
  }
  .cv-photo__letter {
    transform: none !important;
    opacity: 0.92 !important;
  }
}
</style>

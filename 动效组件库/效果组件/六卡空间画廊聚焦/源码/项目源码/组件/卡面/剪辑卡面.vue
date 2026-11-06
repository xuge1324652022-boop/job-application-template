<template>
  <div class="cv cv-edit">
    <!-- 后层：视频帧与后方斜向文字带 (Back Layer, parallax: 20/13 px) -->
    <div class="cv-edit__frames">
      <div class="cv-edit__frame cv-edit__frame--b" />
      <div class="cv-edit__frame cv-edit__frame--a">
        <span>VIDEO</span>
        <span>FRAME</span>
      </div>

      <!-- 后方斜向宽文字带 (Back Ribbon: Behind Title) -->
      <div class="cv-edit__ribbon cv-edit__ribbon--back">
        <div class="cv-edit__ribbon-track cv-edit__ribbon-track--back">
          <span>CUT</span>
          <span>SEQUENCE</span>
          <span>RHYTHM</span>
          <span>EDIT</span>
          <span>MONTAGE</span>
          <span>BEAT</span>
          <span>CUT</span>
          <span>SEQUENCE</span>
          <span>RHYTHM</span>
          <span>EDIT</span>
          <span>MONTAGE</span>
          <span>BEAT</span>
        </div>
      </div>
    </div>

    <!-- 中层：巨型 EDIT 与三段切片 (Middle Layer, parallax: 55/36 px) -->
    <div class="cv-edit__type">
      <!-- 三切片区域：切片穿过字形并错位吸附 -->
      <div class="cv-edit__slice cv-edit__slice--1">
        <span class="cv-edit__letter cv-edit__letter--e">E</span>
        <span class="cv-edit__letter cv-edit__letter--d">D</span>
        <span class="cv-edit__letter cv-edit__letter--i">I</span>
        <span class="cv-edit__letter cv-edit__letter--t">T</span>
      </div>
      <div class="cv-edit__slice cv-edit__slice--2">
        <span class="cv-edit__letter cv-edit__letter--e">E</span>
        <span class="cv-edit__letter cv-edit__letter--d">D</span>
        <span class="cv-edit__letter cv-edit__letter--i">I</span>
        <span class="cv-edit__letter cv-edit__letter--t">T</span>
      </div>
      <div class="cv-edit__slice cv-edit__slice--3">
        <span class="cv-edit__letter cv-edit__letter--e">E</span>
        <span class="cv-edit__letter cv-edit__letter--d">D</span>
        <span class="cv-edit__letter cv-edit__letter--i">I</span>
        <span class="cv-edit__letter cv-edit__letter--t">T</span>
      </div>

      <!-- 切片刀光线条 -->
      <div class="cv-edit__cutlines">
        <span class="cv-edit__cutline cv-edit__cutline--1" />
        <span class="cv-edit__cutline cv-edit__cutline--2" />
      </div>

      <!-- 终末带走切片光效 -->
      <div class="cv-edit__exit-cut" />
    </div>

    <!-- 前景斜向宽文字带 (Front Ribbon: In Front of Title) -->
    <div class="cv-edit__ribbon-front-layer">
      <div class="cv-edit__ribbon cv-edit__ribbon--front">
        <div class="cv-edit__ribbon-track cv-edit__ribbon-track--front">
          <span>RHYTHM</span>
          <span>CUT</span>
          <span>SEQUENCE</span>
          <span>00:01:24:12</span>
          <span>EDIT</span>
          <span>KEYFRAME</span>
          <span>RHYTHM</span>
          <span>CUT</span>
          <span>SEQUENCE</span>
          <span>00:01:24:12</span>
          <span>EDIT</span>
          <span>KEYFRAME</span>
        </div>
      </div>
    </div>

    <!-- 前层：时间线与播放头 (Front Layer, parallax: 30/20 px) -->
    <div class="cv-edit__timeline">
      <div class="cv-edit__track" />
      <div class="cv-edit__clips">
        <span class="cv-edit__clip cv-edit__clip--a" />
        <span class="cv-edit__clip cv-edit__clip--b" />
        <span class="cv-edit__clip cv-edit__clip--c" />
      </div>
      <div class="cv-edit__blade" />
      <div class="cv-edit__playhead" />
      <span class="cv-edit__timecode">00:01:24:12</span>
    </div>

    <!-- Static frame of reference — movement 0, never animated. -->
    <div class="cv-edit__info">
      <span class="cv-edit__eyebrow">02</span>
      <span class="cv-edit__title">EDIT</span>
      <span class="cv-edit__lead">视频剪辑</span>
      <span class="cv-edit__role">VIDEO EDITOR</span>
    </div>
    <div class="cv-edit__words">
      <span>CUT</span>
      <span>SEQUENCE</span>
      <span>RHYTHM</span>
    </div>
  </div>
</template>

<style scoped>
/* ---- 02 / EDIT 剪辑 — Time / Sequence / Cut ---------------------- */

.cv-edit {
  container-type: inline-size;
}

/* --- 后层：视频帧与后方斜向文字带 --- */
.cv-edit__frames {
  position: absolute;
  inset: 0;
}
.cv-edit__frame {
  position: absolute;
  border: 1px solid rgba(241, 241, 236, 0.32);
}
.cv-edit__frame--a {
  right: 7%;
  top: 26%;
  width: 21%;
  height: 27%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.4vh;
  padding: 1.2vh 1vw;
}
.cv-edit__frame--a span {
  font-size: clamp(8px, 0.72vw, 12px);
  letter-spacing: 0.24em;
  color: rgba(241, 241, 236, 0.4);
}
.cv-edit__frame--b {
  right: 19%;
  top: 17%;
  width: 13%;
  height: 17%;
  border-color: rgba(241, 241, 236, 0.14);
}

/* 斜向文字带基础容器 */
.cv-edit__ribbon {
  position: absolute;
  left: -35%;
  width: 170%;
  height: 5.4vh;
  display: flex;
  align-items: center;
  transform: rotate(-13deg);
  overflow: hidden;
  pointer-events: none;
  will-change: transform, opacity;
}
.cv-edit__ribbon--back {
  top: 36%;
  background: rgba(18, 18, 17, 0.84);
  border-top: 1px solid rgba(241, 241, 236, 0.22);
  border-bottom: 1px solid rgba(241, 241, 236, 0.22);
  opacity: 0;
}
.cv-edit__ribbon-front-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}
.cv-edit__ribbon--front {
  top: 48%;
  background: #f1f1ec;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75);
  border-top: 1px solid #ffffff;
  border-bottom: 1px solid #ffffff;
  opacity: 0;
}
.cv-edit__ribbon-track {
  display: flex;
  white-space: nowrap;
  gap: 3vw;
  will-change: transform;
}
.cv-edit__ribbon-track--back span {
  font-size: clamp(10px, 1.15vw, 18px);
  font-weight: 700;
  letter-spacing: 0.28em;
  color: rgba(241, 241, 236, 0.6);
}
.cv-edit__ribbon-track--front span {
  font-size: clamp(11px, 1.25vw, 19px);
  font-weight: 800;
  letter-spacing: 0.32em;
  color: #0e0e0d;
}

/* --- 中层：巨型 EDIT。它是一串序列，不是一个logo。 --- */
.cv-edit__type {
  position: absolute;
  inset: 0;
}
.cv-edit__slice {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.cv-edit__slice--1 {
  clip-path: inset(0% 0% 67% 0%);
}
.cv-edit__slice--2 {
  clip-path: inset(33% 0% 34% 0%);
}
.cv-edit__slice--3 {
  clip-path: inset(66% 0% 0% 0%);
}

.cv-edit__letter {
  position: absolute;
  top: 25%;
  display: block;
  font-weight: 800;
  font-size: clamp(48px, 22cqw, 140px);
  line-height: 0.8;
  letter-spacing: -0.04em;
  color: rgba(241, 241, 236, 0.9);
  user-select: none;
}
.cv-edit__letter--e {
  left: 8%;
}
.cv-edit__letter--d {
  left: 27%;
}
.cv-edit__letter--i {
  left: 49%;
}
.cv-edit__letter--t {
  left: 63%;
}

/* 切片刀线 */
.cv-edit__cutlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.cv-edit__cutline {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 1px;
  background: rgba(241, 241, 236, 0.9);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.95);
  transform-origin: left center;
  opacity: 0;
}
.cv-edit__cutline--1 {
  top: 33.3%;
}
.cv-edit__cutline--2 {
  top: 66.6%;
}

/* 终末带走切片光效 */
.cv-edit__exit-cut {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(241, 241, 236, 0.75) 45%,
    rgba(255, 255, 255, 0.95) 50%,
    transparent 100%
  );
  opacity: 0;
  transform: scaleX(0);
  transform-origin: left center;
  pointer-events: none;
}

/* --- 前层：抽象化的时间线。 -------------------------------------- */
.cv-edit__timeline {
  position: absolute;
  inset: 0;
  z-index: 5;
}
.cv-edit__track {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 64%;
  height: 1px;
  background: rgba(241, 241, 236, 0.22);
}
.cv-edit__clips {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 67.5%;
}
.cv-edit__clip {
  position: absolute;
  height: 1.1vh;
  background: rgba(241, 241, 236, 0.5);
}
.cv-edit__clip--a {
  left: 2%;
  width: 17%;
}
.cv-edit__clip--b {
  left: 27%;
  width: 26%;
  background: rgba(241, 241, 236, 0.34);
}
.cv-edit__clip--c {
  left: 60%;
  width: 14%;
  background: rgba(241, 241, 236, 0.24);
}
.cv-edit__blade {
  position: absolute;
  left: 46%;
  top: 58%;
  width: 1px;
  height: 12vh;
  background: #ffffff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
  opacity: 0;
  pointer-events: none;
}
.cv-edit__playhead {
  position: absolute;
  left: 46%;
  top: 58%;
  width: 1px;
  height: 12vh;
  background: #f1f1ec;
}
.cv-edit__timecode {
  position: absolute;
  left: 8%;
  top: 73%;
  font-size: clamp(8px, 0.7vw, 11px);
  letter-spacing: 0.22em;
  font-variant-numeric: tabular-nums;
  color: rgba(241, 241, 236, 0.34);
}

/* --- 静态参照框：永不移动。 -------------------------------------- */
.cv-edit__info {
  position: absolute;
  left: 9%;
  top: 11%;
  display: flex;
  flex-direction: column;
  gap: 1.1vh;
  z-index: 6;
}
.cv-edit__eyebrow {
  font-size: clamp(9px, 0.82vw, 13px);
  letter-spacing: 0.3em;
  color: rgba(241, 241, 236, 0.34);
}
.cv-edit__title {
  font-size: clamp(12px, 1.3vw, 20px);
  letter-spacing: 0.22em;
  color: rgba(241, 241, 236, 0.72);
}
.cv-edit__lead {
  font-size: clamp(17px, 2.1vw, 32px);
  font-weight: 300;
  letter-spacing: 0.04em;
  color: rgba(241, 241, 236, 0.9);
}
.cv-edit__role {
  font-size: clamp(9px, 0.82vw, 13px);
  letter-spacing: 0.26em;
  color: rgba(241, 241, 236, 0.4);
}
.cv-edit__words {
  position: absolute;
  left: 9%;
  bottom: 8%;
  display: flex;
  gap: clamp(16px, 2vw, 40px);
  font-size: clamp(8px, 0.72vw, 12px);
  letter-spacing: 0.26em;
  color: rgba(241, 241, 236, 0.3);
  z-index: 6;
}

@media (prefers-reduced-motion: reduce) {
  .cv-edit__ribbon {
    display: none;
  }
  .cv-edit__slice {
    transform: none !important;
  }
}
</style>
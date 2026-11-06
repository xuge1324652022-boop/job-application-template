<template>
  <div id="app">
    <!-- 1. GSAP 开场动画 -->
    <Preloader
      v-if="showPreloader"
      @complete="onPreloaderComplete"
    />

    <!-- 2. 六章节空间 Gallery：同一卡片连续展开 -->
    <ThreeHome v-if="showMain" />

    <!-- 3. 底部版权信息 -->
    <div v-if="showMain" class="footer-copyright">
      &copy; 2026 全翔宇 &middot; 由 AI 协作开发
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Preloader from './components/Preloader.vue'
import ThreeHome from './components/ThreeHome.vue'

const showPreloader = ref(true)
const showMain = ref(false)

function onPreloaderComplete() {
  showPreloader.value = false
  showMain.value = true
}
</script>

<style>
/* ============================================================
   全局样式重置
   ============================================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  background: #0a0a0a;
  font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  color: #fff;
}

body {
  overscroll-behavior: none;
}

#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
}

/* ============================================================
   底部版权（半透明，不干扰交互）
   ============================================================ */
.footer-copyright {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  color: rgba(255, 255, 255, 0.12);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  pointer-events: none;
  font-weight: 300;
  text-align: center;
  white-space: nowrap;
  mix-blend-mode: difference;
}

/* ============================================================
   响应式：移动端底部版权隐藏
   ============================================================ */
@media (max-width: 480px) {
  .footer-copyright {
    display: none;
  }
}
</style>
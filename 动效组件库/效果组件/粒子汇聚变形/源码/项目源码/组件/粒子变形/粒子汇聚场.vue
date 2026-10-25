<template>
  <!--
    粒子云变形场：散布的粒子随滚动进度（setProgress 0→1）汇聚成目标字母。
    目标点集来自离屏画布对字母的像素采样；每粒子带独立延迟与缓动，
    停留时轻微呼吸抖动。颜色取页面深色主题的奶油与珊瑚红。
  -->
  <canvas ref="canvas" class="morph-field" :aria-label="ariaLabel" role="img" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 粒子最终汇聚成的字符（模板用示例求职者首字母，避免借用原作者身份）。 */
    letter?: string
    ariaLabel?: string
    /** 停留阶段的呼吸幅度（CSS 像素）。 */
    wobble?: number
  }>(),
  { letter: 'E', ariaLabel: '粒子汇聚成字母的动画画面', wobble: 1.2 },
)

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let dead = false
let progress = 0
let dpr = 1
let width = 0
let height = 0

interface Particle {
  x0: number
  y0: number
  x1: number
  y1: number
  delay: number
  size: number
  color: string
  phase: number
}
let particles: Particle[] = []

/** 视频同款：纯白微尘，少量亮灰做层次，不带彩色。 */
const PALETTE = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#e6e6e6']
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** 把字母画进离屏画布并采样不透明像素，得到粒子目标点集。 */
function sampleTargets(count: number): { x: number; y: number }[] {
  const off = document.createElement('canvas')
  off.width = width
  off.height = height
  const c = off.getContext('2d')
  if (!c) return []
  c.fillStyle = '#fff'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  let size = Math.floor(height * 0.88)
  c.font = `900 ${size}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`
  while (c.measureText(props.letter).width > width * 0.82 && size > 12) {
    size -= 4
    c.font = `900 ${size}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`
  }
  c.fillText(props.letter, width / 2, height * 0.52)
  const data = c.getImageData(0, 0, width, height).data
  const points: { x: number; y: number }[] = []
  const step = Math.max(1, Math.round(Math.sqrt((width * height) / (count * 5))))
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] > 128) points.push({ x, y })
    }
  }
  while (points.length > count) points.splice((Math.random() * points.length) | 0, 1)
  return points
}

function rebuild(): void {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  dpr = Math.min(2, window.devicePixelRatio || 1)
  width = Math.max(1, Math.round(rect.width * dpr))
  height = Math.max(1, Math.round(rect.height * dpr))
  canvas.value.width = width
  canvas.value.height = height
  const count = Math.round(Math.min(5600, (width * height) / 120))
  const targets = sampleTargets(count)
  particles = Array.from({ length: targets.length }, (_, i) => ({
    x0: Math.random() * width,
    y0: Math.random() * height,
    x1: targets[i]!.x,
    y1: targets[i]!.y,
    delay: Math.random() * 0.4,
    size: (0.65 + Math.random() * 0.9) * dpr,
    color: PALETTE[(Math.random() * PALETTE.length) | 0]!,
    phase: Math.random() * Math.PI * 2,
  }))
}

function draw(now: number): void {
  if (!ctx || dead) return
  ctx.clearRect(0, 0, width, height)
  const settle = 1 - progress
  for (const p of particles) {
    // 延迟映射：前 40% 进度只启动一部分粒子，后段全体到位，倒滚对称恢复。
    const local = Math.max(0, Math.min(1, (progress - p.delay) / 0.6))
    const e = easeInOut(local)
    const wobble = settle * props.wobble * dpr
    const wx = Math.sin(now / 430 + p.phase) * wobble
    const wy = Math.cos(now / 510 + p.phase) * wobble
    const x = p.x0 + (p.x1 - p.x0) * e + wx
    const y = p.y0 + (p.y1 - p.y0) * e + wy
    ctx.fillStyle = p.color
    ctx.globalAlpha = 0.68 + e * 0.32
    ctx.fillRect(x, y, p.size, p.size)
  }
  ctx.globalAlpha = 1
  raf = requestAnimationFrame(draw)
}

/** 供视图的 ScrollTrigger scrub 回调写入 0–1 汇聚进度。 */
function setProgress(value: number): void {
  progress = Math.max(0, Math.min(1, value))
}
defineExpose({ setProgress })

function onResize(): void {
  rebuild()
}

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  rebuild()
  void document.fonts?.ready.then(() => {
    if (!dead) rebuild()
  })
  window.addEventListener('resize', onResize, { passive: true })
  raf = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  dead = true
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.morph-field {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

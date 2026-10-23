<template>
  <div ref="host" class="lazy-section" :style="loaded ? undefined : { minHeight }">
    <slot v-if="loaded" />
  </div>
</template>

<script setup lang="ts">
/**
 * 首屏以下区块的延迟挂载：进入视口前一屏才加载，缩小路由 chunk 的初始体积。
 * eager 用于锚点跳转等需要内容立即可见的场景；内容挂载后请求一次布局刷新，
 * 让后续固定章节与横向轨道按真实高度重量。加载过即保持挂载，不随滚动卸载。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { requestMotionLayoutRefresh } from '../utils/motionLayout'

const props = defineProps<{ minHeight?: string; eager?: boolean }>()
const host = ref<HTMLElement | null>(null)
const loaded = ref(props.eager === true)
let observer: IntersectionObserver | undefined
let cancelRefresh: (() => void) | undefined

onMounted(() => {
  if (loaded.value || !host.value) return
  if (typeof IntersectionObserver === 'undefined') {
    loaded.value = true
    return
  }
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) loaded.value = true
  }, { rootMargin: '100% 0px 100% 0px' })
  observer.observe(host.value)
})

watch(() => props.eager, value => {
  if (value) loaded.value = true
})
watch(loaded, value => {
  if (!value) return
  observer?.disconnect()
  observer = undefined
  // 延迟区块改变文档高度后，下游固定区域要按真实高度重量；
  // motionLayout 会等区块内动画完成布局准备后合并刷新。
  cancelRefresh = requestMotionLayoutRefresh()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelRefresh?.()
})
</script>

<style scoped>
.lazy-section { width: 100%; }
</style>

<template>
  <div ref="host" class="lazy-section" :style="resolved ? undefined : { minHeight }" :aria-busy="resolved ? undefined : true" :data-lazy-ready="resolved">
    <Suspense v-if="loaded" @resolve="onResolved">
      <div class="lazy-section__content"><slot /></div>
      <template #fallback><div aria-hidden="true"></div></template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
/**
 * 首屏以下区块的延迟挂载：进入视口前一屏才加载，缩小路由 chunk 的初始体积。
 * eager 用于锚点跳转等需要内容立即可见的场景；内容挂载后请求一次布局刷新，
 * 让后续固定章节与横向轨道按真实高度重量。加载过即保持挂载，不随滚动卸载。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { requestMotionLayoutRefresh } from '../utils/motionLayout'

const props = defineProps<{ minHeight?: string; eager?: boolean }>()
const host = ref<HTMLElement | null>(null)
const loaded = ref(props.eager === true)
const resolved = ref(false)
let observer: IntersectionObserver | undefined
let resize: ResizeObserver | undefined
let cancelRefresh: (() => void) | undefined
let disposed = false
let finishReady: () => void = () => {}
const readiness = new Promise<void>(resolve => { finishReady = resolve })

function refreshLayout(): void {
  if (disposed || !resolved.value) return
  cancelRefresh?.()
  cancelRefresh = requestMotionLayoutRefresh()
}

async function onResolved(): Promise<void> {
  // Suspense resolves the async slot before its mounted hooks are flushed.
  // Keep the reserved height until those hooks have committed the real subtree.
  await nextTick()
  if (disposed || resolved.value) return
  resolved.value = true
  observer?.disconnect()
  observer = undefined
  await nextTick()
  if (disposed) return
  refreshLayout()
  finishReady()
}

function ensureReady(): Promise<void> {
  loaded.value = true
  return readiness
}
defineExpose({ ensureReady })

onMounted(() => {
  if (host.value && typeof ResizeObserver !== 'undefined') {
    resize = new ResizeObserver(refreshLayout)
    resize.observe(host.value)
  }
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
})

onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  resize?.disconnect()
  cancelRefresh?.()
  finishReady()
})
</script>

<style scoped>
.lazy-section { width: 100%; }
</style>

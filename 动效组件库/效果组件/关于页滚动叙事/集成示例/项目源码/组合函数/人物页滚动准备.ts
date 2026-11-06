import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, useRouter, type RouterScrollBehavior } from 'vue-router'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { registerRouteScrollPreparation } from '../工具/路由滚动准备'
import { abortable, nextFrame } from '../工具/可取消异步等待'
import { routeCurtainBlocked } from './页面幕布控制'

interface ReadySection {
  ensureReady(): Promise<void>
}

/** Own About's async hash/history preparation and its cancellation lifecycle. */
export function useAboutScrollPreparation(sections: readonly Ref<ReadySection | null>[]) {
  const aboutRouter = useRouter()

  // 正常阅读继续按需加载。锚点和历史恢复等待真实组件、字体及固定舞台落位，
  // 再把坐标交还原有 scrollBehavior；每次等待都有唯一所有者与取消信号。
  const eagerAll = ref(false)
  let scrollRequest: AbortController | undefined
  let disposed = false

  function cancelScrollRequest(): void {
    scrollRequest?.abort()
    scrollRequest = undefined
  }

  function waitForCurtain(signal: AbortSignal): Promise<void> {
    // Seek while the curtain is revealing, before the page accepts input.
    // Waiting for its full exit exposes the old coordinate for a visible frame.
    if (!routeCurtainBlocked.value) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const stop = watch(routeCurtainBlocked, (active) => {
        if (active) return
        stop()
        signal.removeEventListener('abort', abort)
        resolve()
      })
      const abort = () => {
        stop()
        reject(new DOMException('Scroll request cancelled', 'AbortError'))
      }
      signal.addEventListener('abort', abort, { once: true })
      if (signal.aborted) abort()
    })
  }

  async function prepareScroll(
    hash: string,
    saved: Parameters<RouterScrollBehavior>[2],
  ): Promise<boolean> {
    cancelScrollRequest()
    let validHash = false
    try {
      validHash = !!decodeURIComponent(hash.slice(1))
    } catch {
      /* The router safely handles malformed hashes. */
    }
    if (!saved && !validHash) return true
    const request = new AbortController()
    scrollRequest = request
    const { signal } = request
    try {
      eagerAll.value = true
      await nextTick()
      await abortable(Promise.all(sections.map((section) => section.value?.ensureReady())), signal)
      await abortable(document.fonts.ready, signal)
      await waitForCurtain(signal)
      // Mounted children schedule their motion work in the shared layout queue.
      // Two paint boundaries let that work commit; one final refresh measures all
      // upstream pins before the router applies the requested coordinate once.
      await nextFrame(signal)
      await nextFrame(signal)
      if (disposed || signal.aborted) return false
      if (!saved && validHash) {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)))
        let group = target?.closest('details')
        while (group) {
          group.open = true
          group = group.parentElement?.closest('details') ?? null
        }
        await nextTick()
        await nextFrame(signal)
      }
      ScrollTrigger.refresh()
      return true
    } catch (error) {
      if (signal.aborted || disposed) return false
      throw error
    } finally {
      if (scrollRequest === request) scrollRequest = undefined
    }
  }
  const unregisterScrollPreparation = registerRouteScrollPreparation('/about', prepareScroll)
  onBeforeRouteLeave(cancelScrollRequest)

  function onAnchorClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        : null
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self'))
      return
    const hash = anchor.getAttribute('href')
    if (!hash || hash === '#') return
    event.preventDefault()
    const route = aboutRouter.currentRoute.value
    void aboutRouter.push({ path: route.path, query: route.query, hash })
  }

  function onManualKey(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key))
      cancelScrollRequest()
  }
  onMounted(() => {
    window.addEventListener('wheel', cancelScrollRequest, { passive: true })
    window.addEventListener('touchstart', cancelScrollRequest, { passive: true })
    window.addEventListener('pointerdown', cancelScrollRequest, { passive: true })
    window.addEventListener('keydown', onManualKey)
  })
  onBeforeUnmount(() => {
    disposed = true
    cancelScrollRequest()
    unregisterScrollPreparation()
    window.removeEventListener('wheel', cancelScrollRequest)
    window.removeEventListener('touchstart', cancelScrollRequest)
    window.removeEventListener('pointerdown', cancelScrollRequest)
    window.removeEventListener('keydown', onManualKey)
  })
  return { eagerAll, onAnchorClick }
}

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Lang } from '../../数据/人物资料'
import { prepareMotionLayout, requestMotionLayoutRefresh } from '../../工具/动效布局调度'

import { createStorySchedule, STORY_TIMING } from './实习叙事节奏'

gsap.registerPlugin(ScrollTrigger)

/** Owns the internship scene's DOM refs, timeline, deep links and teardown. */
export function useInternshipStoryMotion(
  language: () => Lang,
  experienceCount: number,
  onRefresh: () => void,
) {
  const root = ref<HTMLElement | null>(null)
  const stage = ref<HTMLElement | null>(null)
  const ribbons = ref<HTMLElement | null>(null)
  const upperTrack = ref<HTMLElement | null>(null)
  const lowerTrack = ref<HTMLElement | null>(null)
  const cover = ref<HTMLElement | null>(null)
  const frame = ref<HTMLElement | null>(null)
  const track = ref<HTMLElement | null>(null)
  const animated = ref(false)
  const current = ref(0)
  const darkActive = ref(false)
  let media: gsap.MatchMedia | undefined
  let timeline: gsap.core.Timeline | undefined
  let cancelPreparation: (() => void) | undefined
  let cancelRefresh: (() => void) | undefined
  let disposed = false
  const readingTimes: number[] = []
  function refresh() {
    if (disposed) return
    cancelRefresh?.()
    cancelRefresh = requestMotionLayoutRefresh()
    onRefresh()
  }
  function seek(index: number) {
    const trigger = timeline?.scrollTrigger
    const time = readingTimes[index]
    if (!trigger || !timeline || time === undefined) return
    window.scrollTo({
      top: trigger.start + ((trigger.end - trigger.start) * time) / timeline.duration(),
      behavior: 'instant',
    })
    ScrollTrigger.update()
    trigger.getTween()?.progress(1)
  }
  onMounted(() => {
    if (!root.value) return
    cancelPreparation = prepareMotionLayout(root.value, () => {
      if (
        disposed ||
        !root.value ||
        !stage.value ||
        !frame.value ||
        !track.value ||
        !lowerTrack.value ||
        !cover.value ||
        !ribbons.value ||
        !upperTrack.value
      )
        return
      const host = root.value
      const scene = stage.value
      const surface = frame.value
      const strip = track.value
      const flight = cover.value
      const source = lowerTrack.value.querySelector<HTMLElement>('[data-card="0"]')
      if (!source) return
      media = gsap.matchMedia()
      media.add(
        '(min-width: 981px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)',
        (context) => {
          host.classList.add('is-animated')
          animated.value = true
          const panels = [...strip.querySelectorAll<HTMLElement>('[data-slide]')]
          const markers = [...host.querySelectorAll<HTMLElement>('.internship-story__anchor')]
          const geometry = () => {
            // The source remains in its original ribbon. Measure unscaled layout, independent of scroll progress.
            const s = source.getBoundingClientRect()
            const ribbonY = Number(gsap.getProperty(ribbons.value!, 'y')) || 0
            const b = scene.getBoundingClientRect()
            const angle = (-3 * Math.PI) / 180
            return {
              x: s.left - b.left,
              // A rotated bounding box starts at the top-right corner; recover the actual top-left.
              y:
                s.top -
                b.top -
                Math.sin(angle) * source.offsetWidth -
                ribbonY -
                scene.clientHeight * 0.65,
              scaleX: source.offsetWidth / scene.clientWidth,
              scaleY: source.offsetHeight / scene.clientHeight,
            }
          }
          let box = geometry()
          // One shared strip keeps neighbouring cards and resume pages in the same space.
          const measureStops = () =>
            panels.map((panel, index) =>
              Math.max(
                0,
                Math.min(
                  strip.scrollWidth - scene.clientWidth,
                  panel.offsetLeft - scene.clientWidth * (index % 2 ? 0.18 : 0.04),
                ),
              ),
            )
          let stops = measureStops()
          let schedule = createStorySchedule(stops)
          const syncSchedule = () => {
            schedule = createStorySchedule(stops)
            readingTimes.splice(0, readingTimes.length, ...schedule.readingTimes)
          }
          syncSchedule()
          const updateTheme = (time: number, active: boolean) => {
            darkActive.value =
              active && time >= schedule.surfaceAt && time < (readingTimes[1] ?? schedule.coverEnd)
          }
          const travel = { progress: 0 }
          const setFlight = gsap.quickSetter(flight, 'css')
          // Expand directly into the first panel; both copies share identical final geometry.
          // No second flying/left-curtain phase and no full-screen product-photo swap.
          const renderFlight = () => {
            const t = travel.progress
            const expansion = t * t * (3 - 2 * t)
            setFlight({
              x: box.x * (1 - expansion),
              y: box.y * (1 - expansion),
              scaleX: box.scaleX + (1 - box.scaleX) * expansion,
              scaleY: box.scaleY + (1 - box.scaleY) * expansion,
              rotation: -3 * (1 - expansion),
              force3D: true,
            })
          }
          const updateAnchors = () => {
            const trigger = timeline?.scrollTrigger
            if (!trigger || !timeline) return
            markers.forEach((marker, i) => {
              // Router subtracts 24px from hash targets; compensate so each deep link reaches its reading position in the continuous row.
              marker.style.top = `${((trigger.end - trigger.start) * readingTimes[i * 2 + 1]!) / timeline!.duration() + 24}px`
            })
          }
          timeline = gsap.timeline({
            defaults: { ease: 'none' },
            onUpdate(this: gsap.core.Timeline) {
              updateTheme(this.time(), Boolean(this.scrollTrigger?.isActive))
              const x = Math.abs(Number(gsap.getProperty(strip, 'x')))
              current.value = Math.min(
                panels.length - 1,
                Math.max(
                  0,
                  stops.reduce(
                    (best, stop, index) =>
                      Math.abs(stop - x) < Math.abs(stops[best]! - x) ? index : best,
                    0,
                  ),
                ),
              )
            },
            scrollTrigger: {
              id: 'about-internship-story',
              trigger: host,
              pin: scene,
              start: 'top top',
              end: () => `+=${Math.round(scene.clientHeight * (3 + experienceCount * 1.15))}`,
              scrub: 0.22,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              refreshPriority: 25,
              onRefreshInit: () => {
                box = geometry()
                stops = measureStops()
                syncSchedule()
              },
              onRefresh: () => {
                renderFlight()
                updateAnchors()
              },
              onToggle: (self) => {
                updateTheme(timeline?.time() ?? 0, self.isActive)
              },
            },
          })
          timeline
            .set(surface, { autoAlpha: 0 }, 0)
            .set(flight, { autoAlpha: 0, transformOrigin: '0 0', willChange: 'transform' }, 0)
            .fromTo(
              ribbons.value,
              { y: 0 },
              { y: () => -scene.clientHeight * 0.65, duration: STORY_TIMING.ribbon },
              0,
            )
            .fromTo(
              upperTrack.value,
              { x: 0 },
              { x: () => -scene.clientWidth * 0.32, duration: STORY_TIMING.ribbon },
              0,
            )
            .fromTo(
              travel,
              { progress: 0 },
              { progress: 1, duration: STORY_TIMING.extraction, onUpdate: renderFlight },
              STORY_TIMING.ribbon,
            )
            .set(flight, { autoAlpha: 1 }, STORY_TIMING.ribbon)
            .set(source, { opacity: 0 }, STORY_TIMING.ribbon)
            .set(surface, { autoAlpha: 1 }, schedule.surfaceAt)
            .to(
              ribbons.value,
              { opacity: 0, duration: STORY_TIMING.ribbonFade },
              STORY_TIMING.ribbon + STORY_TIMING.ribbonFadeOffset,
            )
            .to(flight, { autoAlpha: 0, duration: STORY_TIMING.handoff }, schedule.surfaceAt)
            .fromTo(
              strip,
              { x: 0 },
              {
                x: () => -stops[stops.length - 1]!,
                duration: STORY_TIMING.rowTravel,
                force3D: true,
              },
              schedule.readingAt,
            )
          const focus = (event: FocusEvent) => {
            const target =
              event.target instanceof HTMLElement
                ? event.target.closest<HTMLElement>('[data-slide]')
                : null
            if (!target) return
            const index = Number(target.dataset.slide)
            if (current.value !== index || timeline!.time() < schedule.readingAt) seek(index)
          }
          strip.addEventListener('focusin', focus)
          refresh()
          return () => {
            strip.removeEventListener('focusin', focus)
            context.ignore(() =>
              gsap.set([surface, strip, source, cover.value, ribbons.value, upperTrack.value], {
                clearProps: 'transform,transformOrigin,opacity,visibility,willChange',
              }),
            )
            host.classList.remove('is-animated')
            markers.forEach((marker) => marker.style.removeProperty('top'))
            animated.value = false
            darkActive.value = false
            current.value = 0
            timeline = undefined
          }
        },
        host,
      )
      refresh()
    })
  })
  watch(language, async () => {
    await nextTick()
    refresh()
  })
  onBeforeUnmount(() => {
    disposed = true
    cancelPreparation?.()
    cancelRefresh?.()
    media?.revert()
  })

  return {
    root,
    stage,
    ribbons,
    upperTrack,
    lowerTrack,
    cover,
    frame,
    track,
    animated,
    current,
    darkActive,
    refresh,
  }
}

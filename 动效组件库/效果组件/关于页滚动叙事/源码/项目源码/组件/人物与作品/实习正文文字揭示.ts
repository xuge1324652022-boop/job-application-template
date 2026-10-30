import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { routeCurtainActive } from '../../组合函数/页面幕布控制'
import { prepareMotionLayout } from '../../工具/动效布局调度'

gsap.registerPlugin(SplitText)

const chineseWordBoundary =
  /(?<=[\p{Script=Han}，。！？；：、）】》”’])(?=[\p{Script=Han}A-Za-z0-9（【《“‘])/gu

/** Reuse the colour page's real-line rhythm without taking ownership of the horizontal strip. */
export function useInternshipTextMotion(root: Ref<HTMLElement | null>, language?: () => unknown) {
  let media: gsap.MatchMedia | undefined
  let cancelPreparation: (() => void) | undefined
  let disposed = false
  let version = 0
  let flushVisible = () => {}
  const seen = new WeakSet<HTMLElement>()

  const prepare = () => {
    const host = root.value
    if (disposed || !host || typeof IntersectionObserver === 'undefined') return
    cancelPreparation?.()
    cancelPreparation = prepareMotionLayout(host, () => {
      if (disposed) return
      media = gsap.matchMedia()
      media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          let active = true
          type Reading = {
            heading: HTMLElement
            cues: HTMLElement[]
            visible: Set<Element>
            passed: Set<Element>
            started: boolean
            title: gsap.core.Timeline
            paragraphs: { split: SplitText; animation?: gsap.core.Animation; restore: () => void }[]
          }
          const readings: Reading[] = []
          const byCue = new Map<Element, Reading>()
          const observer = new IntersectionObserver(
            (entries) => {
              if (!active || disposed) return
              for (const entry of entries) {
                const reading = byCue.get(entry.target)
                if (!reading) continue
                if (entry.isIntersecting) reading.visible.add(entry.target)
                else reading.visible.delete(entry.target)
                const rect = entry.boundingClientRect
                if (rect.width > 0 && rect.height > 0 && (rect.bottom <= 0 || rect.right <= 0))
                  reading.passed.add(entry.target)
                else reading.passed.delete(entry.target)
              }
              flushVisible()
            },
            { threshold: 0.1, rootMargin: '0px' },
          )

          const release = (reading: Reading) =>
            reading.cues.forEach((cue) => observer.unobserve(cue))
          flushVisible = () => {
            if (!active || disposed || routeCurtainActive.value) return
            for (const reading of readings) {
              if (reading.visible.size && !reading.started) {
                reading.started = true
                seen.add(reading.heading)
                reading.title.play()
                reading.paragraphs.forEach((item) => item.animation?.play())
              } else if (reading.passed.size && !reading.visible.size) {
                seen.add(reading.heading)
                reading.started = true
                reading.title.progress(1).pause()
                reading.paragraphs.forEach((item) => item.animation?.progress(1).pause())
                release(reading)
              }
            }
          }

          for (const readingNode of host.querySelectorAll<HTMLElement>(
            '.internship-story__reading',
          )) {
            const heading = readingNode.querySelector<HTMLElement>('h2')
            const company = heading?.querySelector<HTMLElement>('.internship-story__company-text')
            if (!heading || !company || seen.has(heading)) continue
            const period = readingNode.querySelector<HTMLElement>('.internship-story__period')
            const role = readingNode.querySelector<HTMLElement>('.internship-story__role')
            const paragraphs = [
              ...readingNode.querySelectorAll<HTMLElement>('.internship-story__details p'),
            ]
            const title = gsap
              .timeline({ paused: true, defaults: { ease: 'power3.out' } })
              .fromTo(company, { yPercent: 100 }, { yPercent: 0, duration: 0.8 }, 0)
            if (period)
              title.fromTo(period, { y: 8, opacity: 0.72 }, { y: 0, opacity: 1, duration: 0.8 }, 0)
            if (role)
              title.fromTo(
                role,
                { y: 12, opacity: 0.72 },
                { y: 0, opacity: 1, duration: 0.8 },
                0.08,
              )
            const reading: Reading = {
              heading,
              cues: [heading, ...paragraphs.slice(0, 1)],
              visible: new Set(),
              passed: new Set(),
              started: false,
              title,
              paragraphs: [],
            }
            readings.push(reading)
            const unit = window.innerWidth > 900 ? window.innerWidth / 144 : 10
            for (const [index, paragraph] of paragraphs.entries()) {
              // Split clones so Vue's original strong/text node identities survive every revert.
              const originalNodes = [...paragraph.childNodes]
              const originalStyle = paragraph.getAttribute('style')
              paragraph.replaceChildren(...originalNodes.map((node) => node.cloneNode(true)))
              const state: { animation?: gsap.core.Animation } = {}
              const split = SplitText.create(paragraph, {
                type: 'lines',
                autoSplit: true,
                aria: 'auto',
                linesClass: 'internship-resume-line',
                ...(language?.() === 'zh' || /\p{Script=Han}/u.test(paragraph.textContent ?? '')
                  ? { wordDelimiter: { delimiter: chineseWordBoundary, replaceWith: '' } }
                  : {}),
                onSplit(self) {
                  if (!active || disposed) return
                  // Once reading starts, a font/width reflow must not hide the new line nodes again.
                  if (reading.started) {
                    state.animation = gsap
                      .timeline()
                      .set(paragraph, { opacity: 1, y: 0 })
                      .set(self.lines, { opacity: 1, y: 0 })
                  } else {
                    state.animation = gsap
                      .timeline({ paused: true, defaults: { ease: 'power3.out' } })
                      .fromTo(
                        paragraph,
                        { opacity: 0, y: 5 * unit },
                        { opacity: 1, y: 0, duration: 1 },
                        index * 0.08,
                      )
                      .fromTo(
                        self.lines,
                        { opacity: 0, y: 6 * unit },
                        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
                        index * 0.08,
                      )
                  }
                  return state.animation
                },
              })
              reading.paragraphs.push({
                split,
                get animation() {
                  return state.animation
                },
                restore() {
                  state.animation?.revert()
                  split.kill()
                  split.revert()
                  paragraph.replaceChildren(...originalNodes)
                  if (originalStyle === null) paragraph.removeAttribute('style')
                  else paragraph.setAttribute('style', originalStyle)
                },
              })
            }
            reading.cues.forEach((cue) => {
              byCue.set(cue, reading)
              observer.observe(cue)
            })
          }
          return () => {
            active = false
            flushVisible = () => {}
            observer.disconnect()
            readings.forEach((reading) => reading.paragraphs.forEach((item) => item.restore()))
          }
        },
        host,
      )
    })
  }

  watch(routeCurtainActive, (blocked) => {
    if (!blocked) flushVisible()
  })
  if (language)
    watch(
      language,
      async () => {
        const token = ++version
        cancelPreparation?.()
        media?.revert()
        media = undefined
        await nextTick()
        if (!disposed && token === version) prepare()
      },
      { flush: 'pre' },
    )
  onMounted(prepare)
  onBeforeUnmount(() => {
    disposed = true
    version++
    cancelPreparation?.()
    media?.revert()
  })
}

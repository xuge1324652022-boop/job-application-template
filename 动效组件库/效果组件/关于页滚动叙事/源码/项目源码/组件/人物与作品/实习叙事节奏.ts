/** Cover handoff and a continuous horizontal row share one timing contract. */
export const STORY_TIMING = {
  ribbon: 1.2,
  extraction: 1.25,
  handoff: 0.12,
  rowTravel: 8,
  ribbonFade: 0.7,
  ribbonFadeOffset: 0.35,
} as const

/** Measured offsets locate deep links on the row; they do not introduce pauses. */
export function createStorySchedule(stops: readonly number[]) {
  const surfaceAt = STORY_TIMING.ribbon + STORY_TIMING.extraction
  const readingAt = surfaceAt + STORY_TIMING.handoff
  const maxStop = Math.max(0, ...stops)
  const readingTimes = stops.map((stop) => {
    const progress = maxStop ? Math.max(0, Math.min(1, stop / maxStop)) : 0
    return readingAt + progress * STORY_TIMING.rowTravel
  })
  return { surfaceAt, readingAt, coverEnd: readingAt, readingTimes }
}

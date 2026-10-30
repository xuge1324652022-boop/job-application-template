import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createStorySchedule,
  STORY_TIMING,
} from '../src/components/about/internshipStorySchedule.ts'

test('deep links map measured offsets onto the continuous row without per-panel holds', () => {
  const stops = [0, 760, 1480, 2150, 2810]
  const schedule = createStorySchedule(stops)
  assert.equal(schedule.surfaceAt, STORY_TIMING.ribbon + STORY_TIMING.extraction)
  assert.equal(schedule.readingAt, schedule.surfaceAt + STORY_TIMING.handoff)
  assert.equal(schedule.coverEnd, schedule.readingAt)
  assert.equal(schedule.readingTimes.length, stops.length)
  for (const [index, time] of schedule.readingTimes.entries()) {
    const position = ((time - schedule.readingAt) / STORY_TIMING.rowTravel) * stops.at(-1)
    assert.ok(Math.abs(position - stops[index]) < 1e-9)
  }
  assert.equal(schedule.readingTimes[0], schedule.readingAt)
  assert.equal(schedule.readingTimes.at(-1), schedule.readingAt + STORY_TIMING.rowTravel)
  assert.equal('transitions' in schedule, false)
})

test('equal distances take equal time throughout the row', () => {
  const { readingTimes } = createStorySchedule([0, 300, 600, 900, 1200])
  for (let index = 1; index < readingTimes.length; index++) {
    assert.equal(readingTimes[index] - readingTimes[index - 1], STORY_TIMING.rowTravel / 4)
  }
})

test('empty and zero-distance rows have no invalid navigation times', () => {
  const schedule = createStorySchedule([])
  assert.deepEqual(schedule.readingTimes, [])
  const stationary = createStorySchedule([0, 0, 0])
  assert.deepEqual(stationary.readingTimes, [
    stationary.readingAt,
    stationary.readingAt,
    stationary.readingAt,
  ])
  const repeated = createStorySchedule([0, 400, 400, 1000])
  assert.ok(repeated.readingTimes.every(Number.isFinite))
  assert.equal(repeated.readingTimes[1], repeated.readingTimes[2])
  assert.equal(repeated.readingTimes.at(-1), repeated.readingAt + STORY_TIMING.rowTravel)
})

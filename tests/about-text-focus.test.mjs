import assert from 'node:assert/strict'
import test from 'node:test'
import { findSolidTextFocus } from '../src/components/about/aboutTextFocus.ts'

function raster(width, height, opaque) {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) pixels[(y * width + x) * 4 + 3] = opaque(x, y)
  }
  return pixels
}

test('zoom chooses solid ink instead of the gap between horizontal strokes', () => {
  const width = 80,
    height = 60
  const pixels = raster(width, height, (_x, y) => (y < 14 || y >= 46 ? 255 : 0))
  const focus = findSolidTextFocus(pixels, width, height)
  assert.ok(focus)
  assert.equal(focus.size, 14)
  assert.ok(focus.y < 14 || focus.y >= 46)
  // The final viewport footprint must lie wholly within the selected ink square.
  for (const [vw, vh] of [
    [1920, 1080],
    [1280, 720],
    [1024, 1366],
  ]) {
    const scale = (Math.max(vw, vh) / focus.size) * 1.12
    for (const dx of [-vw / 2, 0, vw / 2]) {
      for (const dy of [-vh / 2, 0, vh / 2]) {
        const x = Math.floor(focus.x + dx / scale),
          y = Math.floor(focus.y + dy / scale)
        assert.equal(pixels[(y * width + x) * 4 + 3], 255)
      }
    }
  }
})

test('a letter counter and antialiased edge are never selected as the zoom centre', () => {
  const pixels = raster(60, 60, (x, y) => {
    if (x < 2 || y < 2 || x > 57 || y > 57) return 100
    return x >= 18 && x < 42 && y >= 18 && y < 42 ? 0 : 255
  })
  const focus = findSolidTextFocus(pixels, 60, 60)
  assert.ok(focus)
  for (let y = focus.y - focus.size / 2; y < focus.y + focus.size / 2; y++) {
    for (let x = focus.x - focus.size / 2; x < focus.x + focus.size / 2; x++) {
      assert.equal(pixels[(y * 60 + x) * 4 + 3], 255)
    }
  }
})

test('empty or malformed text rasters disable zoom instead of producing invalid geometry', () => {
  assert.equal(findSolidTextFocus(new Uint8ClampedArray(0), 0, 0), null)
  assert.equal(findSolidTextFocus(new Uint8ClampedArray(16), 3, 3), null)
  assert.equal(
    findSolidTextFocus(
      raster(12, 12, () => 0),
      12,
      12,
    ),
    null,
  )
})

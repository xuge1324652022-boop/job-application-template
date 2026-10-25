/** Largest fully opaque square inside the rasterised letters, rather than the glyph box.
 * Zooming around a glyph centre can aim straight into a counter or between two strokes.
 */
export function findSolidTextFocus(alpha: Uint8ClampedArray, width: number, height: number) {
  if (alpha.length !== width * height * 4 || width < 1 || height < 1) return null
  let previous = new Uint32Array(width + 1)
  let current = new Uint32Array(width + 1)
  let best = { x: 0, y: 0, size: 0 }
  let bestDistance = Infinity
  for (let y = 0; y < height; y++) {
    current.fill(0)
    for (let x = 0; x < width; x++) {
      if (alpha[(y * width + x) * 4 + 3]! < 250) continue
      const size = 1 + Math.min(previous[x]!, previous[x + 1]!, current[x]!)
      current[x + 1] = size
      const centreX = x + 1 - size / 2,
        centreY = y + 1 - size / 2
      const distance = Math.hypot(centreX - width / 2, centreY - height / 2)
      if (size > best.size || (size === best.size && distance < bestDistance)) {
        best = { x: centreX, y: centreY, size }
        bestDistance = distance
      }
    }
    ;[previous, current] = [current, previous]
  }
  return best.size >= 2 ? best : null
}

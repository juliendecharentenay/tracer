import { reactive } from 'vue'

const POINT_TOLERANCE = 5

export function useSvgData() {
  const data = reactive({ points: [], controlPoints: [], paths: [] })

  function addPoint(x, y) {
    const rx = Math.round(x)
    const ry = Math.round(y)
    const idx = data.points.findIndex(
      ([px, py]) => Math.abs(px - rx) <= POINT_TOLERANCE && Math.abs(py - ry) <= POINT_TOLERANCE
    )
    if (idx !== -1) return idx
    data.points.push([rx, ry])
    return data.points.length - 1
  }

  function addPath(type, startIdx, endIdx) {
    data.paths.push({ type, points: [startIdx, endIdx], controlPoints: [] })
  }

  function updatePoint(idx, x, y) {
    data.points[idx] = [Math.round(x), Math.round(y)]
  }

  function removePath(idx) {
    // Points referenced only by the removed path are left in data.points; their
    // indices remain stable so any current paths can still reference them correctly.
    data.paths.splice(idx, 1)
  }

  return { data, addPoint, addPath, updatePoint, removePath }
}

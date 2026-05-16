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

  function addControlPoint(x, y) {
    data.controlPoints.push([Math.round(x), Math.round(y)])
    return data.controlPoints.length - 1
  }

  function updateControlPoint(idx, x, y) {
    data.controlPoints[idx] = [Math.round(x), Math.round(y)]
  }

  function togglePathType(pathIdx) {
    const path = data.paths[pathIdx]
    if (!path) return
    if (path.type === 'line') {
      if (path.controlPoints.length === 0) {
        const [x1, y1] = data.points[path.points[0]]
        const [x2, y2] = data.points[path.points[1]]
        const cp1Idx = addControlPoint(x1 + (x2 - x1) / 3, y1 + (y2 - y1) / 3)
        const cp2Idx = addControlPoint(x1 + 2 * (x2 - x1) / 3, y1 + 2 * (y2 - y1) / 3)
        path.controlPoints = [cp1Idx, cp2Idx]
      }
      path.type = 'cubicBezier'
    } else {
      path.type = 'line'
    }
  }

  return { data, addPoint, addPath, updatePoint, removePath, addControlPoint, updateControlPoint, togglePathType }
}

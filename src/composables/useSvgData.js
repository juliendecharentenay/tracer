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

  return { data, addPoint }
}

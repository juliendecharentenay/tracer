export function useCoordinateMapper() {
  const ptCache = new WeakMap()

  function mapMouseEvent(evt) {
    const svg = evt.currentTarget
    if (!ptCache.has(svg)) ptCache.set(svg, svg.createSVGPoint())
    const pt = ptCache.get(svg)
    pt.x = evt.clientX
    pt.y = evt.clientY
    const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: Math.round(x), y: Math.round(y) }
  }

  return { mapMouseEvent }
}

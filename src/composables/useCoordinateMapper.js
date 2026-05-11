export function useCoordinateMapper() {
  let svg = null
  let pt = null

  function mapMouseEvent(evt) {
    if (!svg) {
      svg = document.getElementById('canvas')
      pt = svg.createSVGPoint()
    }
    pt.x = evt.clientX
    pt.y = evt.clientY
    const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: Math.round(x), y: Math.round(y) }
  }

  return { mapMouseEvent }
}

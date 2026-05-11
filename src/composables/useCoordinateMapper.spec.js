import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCoordinateMapper } from './useCoordinateMapper'

function makeSvgElement(transformResult) {
  const inverse = vi.fn().mockReturnValue('ctmInverse')
  const getScreenCTM = vi.fn().mockReturnValue({ inverse })
  const matrixTransform = vi.fn().mockReturnValue(transformResult)
  const pt = { x: 0, y: 0, matrixTransform }
  const createSVGPoint = vi.fn().mockReturnValue(pt)
  return { getScreenCTM, createSVGPoint, _pt: pt, _matrixTransform: matrixTransform }
}

function makeEvent(svgEl, clientX, clientY) {
  return { currentTarget: svgEl, clientX, clientY }
}

describe('useCoordinateMapper', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps clientX/clientY to rounded SVG viewBox coordinates', () => {
    const svgEl = makeSvgElement({ x: 42.6, y: 99.3 })
    const { mapMouseEvent } = useCoordinateMapper()

    const result = mapMouseEvent(makeEvent(svgEl, 200, 300))

    expect(result).toEqual({ x: 43, y: 99 })
  })

  it('rounds fractional coordinates to integers', () => {
    const svgEl = makeSvgElement({ x: 10.5, y: 20.5 })
    const { mapMouseEvent } = useCoordinateMapper()

    const result = mapMouseEvent(makeEvent(svgEl, 0, 0))

    expect(Number.isInteger(result.x)).toBe(true)
    expect(Number.isInteger(result.y)).toBe(true)
  })

  it('creates the SVGPoint once per SVG element, not on every call', () => {
    const svgEl = makeSvgElement({ x: 0, y: 0 })
    const { mapMouseEvent } = useCoordinateMapper()

    mapMouseEvent(makeEvent(svgEl, 0, 0))
    mapMouseEvent(makeEvent(svgEl, 1, 1))

    expect(svgEl.createSVGPoint).toHaveBeenCalledTimes(1)
  })

  it('creates a separate SVGPoint for each distinct SVG element', () => {
    const svgA = makeSvgElement({ x: 0, y: 0 })
    const svgB = makeSvgElement({ x: 0, y: 0 })
    const { mapMouseEvent } = useCoordinateMapper()

    mapMouseEvent(makeEvent(svgA, 0, 0))
    mapMouseEvent(makeEvent(svgB, 0, 0))

    expect(svgA.createSVGPoint).toHaveBeenCalledTimes(1)
    expect(svgB.createSVGPoint).toHaveBeenCalledTimes(1)
  })

  it('passes the mouse coordinates through to matrixTransform', () => {
    const svgEl = makeSvgElement({ x: 5, y: 10 })
    const { mapMouseEvent } = useCoordinateMapper()

    mapMouseEvent(makeEvent(svgEl, 150, 250))

    expect(svgEl._pt.x).toBe(150)
    expect(svgEl._pt.y).toBe(250)
    expect(svgEl._matrixTransform).toHaveBeenCalledWith('ctmInverse')
  })
})

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

describe('useCoordinateMapper', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps clientX/clientY to rounded SVG viewBox coordinates', () => {
    const svgEl = makeSvgElement({ x: 42.6, y: 99.3 })
    vi.spyOn(document, 'getElementById').mockReturnValue(svgEl)

    const { mapMouseEvent } = useCoordinateMapper()
    const result = mapMouseEvent({ clientX: 200, clientY: 300 })

    expect(result).toEqual({ x: 43, y: 99 })
  })

  it('rounds fractional coordinates to integers', () => {
    const svgEl = makeSvgElement({ x: 10.5, y: 20.5 })
    vi.spyOn(document, 'getElementById').mockReturnValue(svgEl)

    const { mapMouseEvent } = useCoordinateMapper()
    const result = mapMouseEvent({ clientX: 0, clientY: 0 })

    expect(Number.isInteger(result.x)).toBe(true)
    expect(Number.isInteger(result.y)).toBe(true)
  })

  it('acquires the SVG element lazily — only on the first call', () => {
    const svgEl = makeSvgElement({ x: 0, y: 0 })
    const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(svgEl)

    const { mapMouseEvent } = useCoordinateMapper()

    expect(getSpy).not.toHaveBeenCalled()

    mapMouseEvent({ clientX: 0, clientY: 0 })
    expect(getSpy).toHaveBeenCalledTimes(1)

    mapMouseEvent({ clientX: 1, clientY: 1 })
    expect(getSpy).toHaveBeenCalledTimes(1)
  })

  it('passes the mouse coordinates through to matrixTransform', () => {
    const svgEl = makeSvgElement({ x: 5, y: 10 })
    vi.spyOn(document, 'getElementById').mockReturnValue(svgEl)

    const { mapMouseEvent } = useCoordinateMapper()
    mapMouseEvent({ clientX: 150, clientY: 250 })

    expect(svgEl._pt.x).toBe(150)
    expect(svgEl._pt.y).toBe(250)
    expect(svgEl._matrixTransform).toHaveBeenCalledWith('ctmInverse')
  })
})

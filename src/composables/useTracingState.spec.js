import { describe, it, expect } from 'vitest'
import { useTracingState } from './useTracingState'

describe('useTracingState', () => {
  it('isDrawing is false initially', () => {
    const { isDrawing } = useTracingState()
    expect(isDrawing.value).toBe(false)
  })

  it('drawingStartIdx is null initially', () => {
    const { drawingStartIdx } = useTracingState()
    expect(drawingStartIdx.value).toBeNull()
  })

  it('beginDraw sets isDrawing to true', () => {
    const { isDrawing, beginDraw } = useTracingState()
    beginDraw(3)
    expect(isDrawing.value).toBe(true)
  })

  it('beginDraw stores the given point index', () => {
    const { drawingStartIdx, beginDraw } = useTracingState()
    beginDraw(3)
    expect(drawingStartIdx.value).toBe(3)
  })

  it('cancelDraw resets isDrawing to false', () => {
    const { isDrawing, beginDraw, cancelDraw } = useTracingState()
    beginDraw(3)
    cancelDraw()
    expect(isDrawing.value).toBe(false)
  })

  it('cancelDraw resets drawingStartIdx to null', () => {
    const { drawingStartIdx, beginDraw, cancelDraw } = useTracingState()
    beginDraw(3)
    cancelDraw()
    expect(drawingStartIdx.value).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { useTracingState } from './useTracingState'

describe('useTracingState', () => {
  it('isDrawing is false initially', () => {
    const { isDrawing } = useTracingState()
    expect(isDrawing.value).toBe(false)
  })

  it('drawingStartCoords is null initially', () => {
    const { drawingStartCoords } = useTracingState()
    expect(drawingStartCoords.value).toBeNull()
  })

  it('beginDraw sets isDrawing to true', () => {
    const { isDrawing, beginDraw } = useTracingState()
    beginDraw(10, 20)
    expect(isDrawing.value).toBe(true)
  })

  it('beginDraw stores the given coordinates', () => {
    const { drawingStartCoords, beginDraw } = useTracingState()
    beginDraw(10, 20)
    expect(drawingStartCoords.value).toEqual([10, 20])
  })

  it('cancelDraw resets isDrawing to false', () => {
    const { isDrawing, beginDraw, cancelDraw } = useTracingState()
    beginDraw(10, 20)
    cancelDraw()
    expect(isDrawing.value).toBe(false)
  })

  it('cancelDraw resets drawingStartCoords to null', () => {
    const { drawingStartCoords, beginDraw, cancelDraw } = useTracingState()
    beginDraw(10, 20)
    cancelDraw()
    expect(drawingStartCoords.value).toBeNull()
  })

  it('hoveredPathIndex is null initially', () => {
    const { hoveredPathIndex } = useTracingState()
    expect(hoveredPathIndex.value).toBeNull()
  })

  it('setHoveredPathIndex sets the index', () => {
    const { hoveredPathIndex, setHoveredPathIndex } = useTracingState()
    setHoveredPathIndex(2)
    expect(hoveredPathIndex.value).toBe(2)
  })

  it('setHoveredPathIndex(null) clears the index', () => {
    const { hoveredPathIndex, setHoveredPathIndex } = useTracingState()
    setHoveredPathIndex(1)
    setHoveredPathIndex(null)
    expect(hoveredPathIndex.value).toBeNull()
  })

  it('selectedPathIndex is null initially', () => {
    const { selectedPathIndex } = useTracingState()
    expect(selectedPathIndex.value).toBeNull()
  })

  it('setSelectedPathIndex sets the index', () => {
    const { selectedPathIndex, setSelectedPathIndex } = useTracingState()
    setSelectedPathIndex(3)
    expect(selectedPathIndex.value).toBe(3)
  })

  it('setSelectedPathIndex(null) clears the index', () => {
    const { selectedPathIndex, setSelectedPathIndex } = useTracingState()
    setSelectedPathIndex(2)
    setSelectedPathIndex(null)
    expect(selectedPathIndex.value).toBeNull()
  })
})

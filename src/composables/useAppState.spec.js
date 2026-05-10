import { describe, it, expect } from 'vitest'
import { useAppState } from './useAppState'

describe('useAppState', () => {
  it('initialises with null image base64 and crop', () => {
    const { state } = useAppState()
    expect(state.image.base64).toBeNull()
    expect(state.image.crop).toBeNull()
  })

  it('setImageBase64 stores the base64 string', () => {
    const { state, setImageBase64 } = useAppState()
    setImageBase64('data:image/png;base64,abc')
    expect(state.image.base64).toBe('data:image/png;base64,abc')
  })

  it('setCropResult stores the cropped base64 and rect parameters', () => {
    const { state, setCropResult } = useAppState()
    const rect = { x: 10, y: 20, width: 100, height: 80 }
    setCropResult('data:image/png;base64,cropped', rect)
    expect(state.image.crop.base64).toBe('data:image/png;base64,cropped')
    expect(state.image.rect.x).toBe(10)
    expect(state.image.rect.y).toBe(20)
    expect(state.image.rect.width).toBe(100)
    expect(state.image.rect.height).toBe(80)
  })

  it('initialises canvas.parameters as null', () => {
    const { state } = useAppState()
    expect(state.canvas.parameters).toBeNull()
  })

  it('setCanvasParameters stores width and height', () => {
    const { state, setCanvasParameters } = useAppState()
    setCanvasParameters(1000, 562)
    expect(state.canvas.parameters.width).toBe(1000)
    expect(state.canvas.parameters.height).toBe(562)
  })

  it('setCanvasParameters overwrites previous values', () => {
    const { state, setCanvasParameters } = useAppState()
    setCanvasParameters(800, 450)
    setCanvasParameters(1200, 675)
    expect(state.canvas.parameters.width).toBe(1200)
    expect(state.canvas.parameters.height).toBe(675)
  })
})

import { describe, it, expect } from 'vitest'
import { useSvgData } from './useSvgData'

describe('useSvgData', () => {
  it('initialises with empty arrays', () => {
    const { data } = useSvgData()
    expect(data.points).toEqual([])
    expect(data.controlPoints).toEqual([])
    expect(data.paths).toEqual([])
  })

  it('addPoint inserts the first point and returns index 0', () => {
    const { data, addPoint } = useSvgData()
    const idx = addPoint(10, 20)
    expect(idx).toBe(0)
    expect(data.points).toEqual([[10, 20]])
  })

  it('addPoint returns the existing index for a point within tolerance', () => {
    const { data, addPoint } = useSvgData()
    addPoint(100, 200)
    const idx = addPoint(103, 202)
    expect(idx).toBe(0)
    expect(data.points).toHaveLength(1)
  })

  it('addPoint creates a new entry for a point beyond tolerance', () => {
    const { data, addPoint } = useSvgData()
    const idx0 = addPoint(0, 0)
    const idx1 = addPoint(50, 50)
    expect(idx0).toBe(0)
    expect(idx1).toBe(1)
    expect(data.points).toHaveLength(2)
  })

  it('addPoint rounds coordinates to integers', () => {
    const { data, addPoint } = useSvgData()
    addPoint(10.6, 20.3)
    expect(data.points[0]).toEqual([11, 20])
  })

  it('addPoint deduplicates when distance equals tolerance (at limit)', () => {
    const { data, addPoint } = useSvgData()
    addPoint(0, 0)
    const idx = addPoint(5, 0)
    expect(idx).toBe(0)
    expect(data.points).toHaveLength(1)
  })

  it('addPoint creates new entry when distance is one beyond tolerance', () => {
    const { data, addPoint } = useSvgData()
    addPoint(0, 0)
    const idx = addPoint(6, 0)
    expect(idx).toBe(1)
    expect(data.points).toHaveLength(2)
  })

  it('each call to useSvgData produces independent state', () => {
    const a = useSvgData()
    const b = useSvgData()
    a.addPoint(1, 1)
    expect(a.data.points).toHaveLength(1)
    expect(b.data.points).toHaveLength(0)
  })
})

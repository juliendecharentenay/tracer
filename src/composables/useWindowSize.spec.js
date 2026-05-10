import { describe, it, expect, beforeEach } from 'vitest'
import { useWindowSize } from './useWindowSize'

describe('useWindowSize', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth',  { writable: true, configurable: true, value: 1024 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 })
  })

  it('initialises refs with the current window dimensions', () => {
    const { innerWidth, innerHeight } = useWindowSize()
    expect(innerWidth.value).toBe(1024)
    expect(innerHeight.value).toBe(768)
  })

  it('updates refs when onResize is called after a window resize', () => {
    const { innerWidth, innerHeight, onResize } = useWindowSize()
    window.innerWidth  = 1440
    window.innerHeight = 900
    onResize()
    expect(innerWidth.value).toBe(1440)
    expect(innerHeight.value).toBe(900)
  })
})

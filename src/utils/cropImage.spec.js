import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cropImage } from './cropImage'

describe('cropImage', () => {
  let drawImageSpy
  let toDataURLSpy
  let fakeDataURL

  beforeEach(() => {
    fakeDataURL = 'data:image/png;base64,cropped'
    drawImageSpy = vi.fn()
    toDataURLSpy = vi.fn(() => fakeDataURL)

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: drawImageSpy }),
          toDataURL: toDataURLSpy,
        }
      }
      if (tag === 'img') {
        const img = {
          onload: null,
          onerror: null,
          src: '',
        }
        // Simulate async image load when src is set
        Object.defineProperty(img, 'src', {
          set(value) {
            this._src = value
            setTimeout(() => img.onload && img.onload(), 0)
          },
          get() { return this._src },
        })
        return img
      }
      return {}
    })
  })

  it('returns a data URL string', async () => {
    const result = await cropImage('data:image/png;base64,orig', { x: 10, y: 20, width: 100, height: 80 })
    expect(result).toBe(fakeDataURL)
  })

  it('sets canvas dimensions to crop width and height', async () => {
    let capturedCanvas
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        capturedCanvas = { width: 0, height: 0, getContext: () => ({ drawImage: drawImageSpy }), toDataURL: toDataURLSpy }
        return capturedCanvas
      }
      if (tag === 'img') {
        const img = { onload: null, _src: '' }
        Object.defineProperty(img, 'src', {
          set(v) { this._src = v; setTimeout(() => img.onload && img.onload(), 0) },
          get() { return this._src },
        })
        return img
      }
      return {}
    })

    await cropImage('data:image/png;base64,orig', { x: 5, y: 15, width: 200, height: 150 })
    expect(capturedCanvas.width).toBe(200)
    expect(capturedCanvas.height).toBe(150)
  })

  it('draws the image with the correct negative offset', async () => {
    await cropImage('data:image/png;base64,orig', { x: 30, y: 40, width: 60, height: 50 })
    expect(drawImageSpy).toHaveBeenCalledWith(expect.anything(), -30, -40)
  })
})

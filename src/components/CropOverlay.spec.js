import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import CropOverlay from './CropOverlay.vue'

const IMAGE_W = 800
const IMAGE_H = 600

function mountOverlay(props = {}) {
  return mount(CropOverlay, {
    props: { imageWidth: IMAGE_W, imageHeight: IMAGE_H, ...props },
    attachTo: document.body,
  })
}

function mockBoundingRect(wrapper) {
  vi.spyOn(wrapper.find('svg').element, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, width: IMAGE_W, height: IMAGE_H,
  })
}

async function dragHandle(wrapper, corner, toX, toY) {
  const handle = wrapper.find(`[data-handle="${corner}"]`)
  await handle.trigger('mousedown', { clientX: 0, clientY: 0 })
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: toX, clientY: toY }))
  await nextTick()
}

describe('CropOverlay', () => {
  let wrapper

  afterEach(() => {
    document.dispatchEvent(new MouseEvent('mouseup'))
    wrapper?.unmount()
  })

  it('initialises the crop rect to cover the full image', () => {
    wrapper = mountOverlay()
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(rect.attributes('x')).toBe('0')
    expect(rect.attributes('y')).toBe('0')
    expect(rect.attributes('width')).toBe('800')
    expect(rect.attributes('height')).toBe('600')
  })

  it('renders four corner handles', () => {
    wrapper = mountOverlay()
    expect(wrapper.find('[data-handle="tl"]').exists()).toBe(true)
    expect(wrapper.find('[data-handle="tr"]').exists()).toBe(true)
    expect(wrapper.find('[data-handle="bl"]').exists()).toBe(true)
    expect(wrapper.find('[data-handle="br"]').exists()).toBe(true)
  })

  it('dragging the tl handle moves the top-left corner', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'tl', 100, 80)
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(rect.attributes('x')).toBe('100')
    expect(rect.attributes('y')).toBe('80')
    expect(rect.attributes('width')).toBe('700')
    expect(rect.attributes('height')).toBe('520')
  })

  it('dragging the tr handle moves the top-right corner', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'tr', 700, 80)
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(rect.attributes('x')).toBe('0')
    expect(rect.attributes('y')).toBe('80')
    expect(rect.attributes('width')).toBe('700')
    expect(rect.attributes('height')).toBe('520')
  })

  it('dragging the bl handle moves the bottom-left corner', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'bl', 100, 500)
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(rect.attributes('x')).toBe('100')
    expect(rect.attributes('y')).toBe('0')
    expect(rect.attributes('width')).toBe('700')
    expect(rect.attributes('height')).toBe('500')
  })

  it('dragging the br handle moves the bottom-right corner', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'br', 700, 500)
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(rect.attributes('x')).toBe('0')
    expect(rect.attributes('y')).toBe('0')
    expect(rect.attributes('width')).toBe('700')
    expect(rect.attributes('height')).toBe('500')
  })

  it('clamps tl handle to (0,0) when dragged to negative coords', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'tl', -50, -30)
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(rect.attributes('x')).toBe('0')
    expect(rect.attributes('y')).toBe('0')
  })

  it('clamps br handle to imageWidth/imageHeight when dragged past bounds', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'br', 900, 700)
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(Number(rect.attributes('width'))).toBeLessThanOrEqual(IMAGE_W)
    expect(Number(rect.attributes('height'))).toBeLessThanOrEqual(IMAGE_H)
  })

  it('enforces minimum size when tl handle is dragged past br corner', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'tl', 795, 595)
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(Number(rect.attributes('width'))).toBeGreaterThanOrEqual(10)
    expect(Number(rect.attributes('height'))).toBeGreaterThanOrEqual(10)
  })

  it('stops tracking position after mouseup', async () => {
    wrapper = mountOverlay()
    mockBoundingRect(wrapper)
    await dragHandle(wrapper, 'tl', 100, 80)
    document.dispatchEvent(new MouseEvent('mouseup'))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
    await nextTick()
    const rect = wrapper.find('[data-testid="crop-rect"]')
    expect(rect.attributes('x')).toBe('100')
    expect(rect.attributes('y')).toBe('80')
  })
})

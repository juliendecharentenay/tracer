import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import CanvasArea from './CanvasArea.vue'

describe('CanvasArea', () => {
  const src = 'data:image/png;base64,abc123'

  function createWrapper(vw = 1000, vh = 800) {
    return mount(CanvasArea, {
      props: { src },
      global: {
        provide: {
          innerWidth:  ref(vw),
          innerHeight: ref(vh),
        },
      },
    })
  }

  async function loadImage(wrapper, naturalWidth, naturalHeight) {
    const imgEl = wrapper.find('img').element
    Object.defineProperty(imgEl, 'naturalWidth',  { configurable: true, value: naturalWidth })
    Object.defineProperty(imgEl, 'naturalHeight', { configurable: true, value: naturalHeight })
    await wrapper.find('img').trigger('load')
  }

  it('renders an img with the provided src', () => {
    expect(createWrapper().find('img').attributes('src')).toBe(src)
  })

  it('wraps the image in a relative inline-block container', () => {
    const classes = createWrapper().find('div').classes()
    expect(classes).toContain('relative')
    expect(classes).toContain('inline-block')
  })

  it('applies no explicit size before the image loads', () => {
    expect(createWrapper().find('img').attributes('style') ?? '').toBe('')
  })

  it('scales a landscape image so its width fills 80vw when that is the tighter constraint', async () => {
    // 1000x500 image, viewport 1000x800 → 80vw=800, 80vh=640 → scale=0.8 → 800×400
    const wrapper = createWrapper(1000, 800)
    await loadImage(wrapper, 1000, 500)
    const style = wrapper.find('img').attributes('style')
    expect(style).toContain('width: 800px')
    expect(style).toContain('height: 400px')
  })

  it('scales a portrait image so its height fills 80vh when that is the tighter constraint', async () => {
    // 400x1000 image, viewport 1000x800 → 80vw=800, 80vh=640 → scale=0.64 → 256×640
    const wrapper = createWrapper(1000, 800)
    await loadImage(wrapper, 400, 1000)
    const style = wrapper.find('img').attributes('style')
    expect(style).toContain('width: 256px')
    expect(style).toContain('height: 640px')
  })

  it('recalculates dimensions reactively when innerWidth changes', async () => {
    const innerWidth  = ref(1000)
    const innerHeight = ref(800)
    const wrapper = mount(CanvasArea, {
      props: { src },
      global: { provide: { innerWidth, innerHeight } },
    })
    // 1000x500 image at 1000x800 viewport → 800×400
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('img').attributes('style')).toContain('width: 800px')

    // Resize viewport to 600x800 → 80vw=480, 80vh=640 → scale=0.48 → 480×240
    innerWidth.value = 600
    await wrapper.vm.$nextTick()
    const style = wrapper.find('img').attributes('style')
    expect(style).toContain('width: 480px')
    expect(style).toContain('height: 240px')
  })
})

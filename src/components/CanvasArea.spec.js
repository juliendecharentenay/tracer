import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { ref, reactive } from 'vue'
import CanvasArea from './CanvasArea.vue'

describe('CanvasArea', () => {
  const src = 'data:image/png;base64,abc123'

  function makeState(parameters = null) {
    return reactive({ canvas: { parameters } })
  }

  function createWrapper(vw = 1000, vh = 800, state = makeState()) {
    return mount(CanvasArea, {
      props: { src },
      global: {
        provide: {
          state,
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

  it('does not render an svg before the image loads', () => {
    expect(createWrapper().find('svg').exists()).toBe(false)
  })

  it('renders an svg with id="canvas" after the image loads', async () => {
    const wrapper = createWrapper()
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('svg#canvas').exists()).toBe(true)
  })

  it('gives the svg the same pixel dimensions as the displayed image', async () => {
    // 1000x500 image, viewport 1000x800 → display 800×400
    const wrapper = createWrapper(1000, 800)
    await loadImage(wrapper, 1000, 500)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('800')
    expect(svg.attributes('height')).toBe('400')
  })

  it('positions the svg absolutely over the image', async () => {
    const wrapper = createWrapper()
    await loadImage(wrapper, 1000, 500)
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('absolute')
    expect(svg.classes()).toContain('top-0')
    expect(svg.classes()).toContain('left-0')
  })

  it('does not set a viewBox attribute when canvas.parameters is null', async () => {
    const wrapper = createWrapper(1000, 800, makeState(null))
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('svg').attributes('viewBox')).toBeUndefined()
  })

  it('applies the viewBox attribute derived from canvas.parameters', async () => {
    const wrapper = createWrapper(1000, 800, makeState({ width: 1000, height: 500 }))
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 1000 500')
  })

  it('recalculates dimensions reactively when innerWidth changes', async () => {
    const innerWidth  = ref(1000)
    const innerHeight = ref(800)
    const wrapper = mount(CanvasArea, {
      props: { src },
      global: { provide: { state: makeState(), innerWidth, innerHeight } },
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

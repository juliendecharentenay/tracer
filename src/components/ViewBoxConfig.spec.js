import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { reactive } from 'vue'
import ViewBoxConfig from './ViewBoxConfig.vue'

function makeState(rectWidth = 1600, rectHeight = 900) {
  return reactive({ image: { rect: { width: rectWidth, height: rectHeight } }, canvas: { parameters: null } })
}

function createWrapper(state = makeState(), setCanvasParameters = vi.fn()) {
  return mount(ViewBoxConfig, {
    global: { provide: { state, setCanvasParameters } },
  })
}

describe('ViewBoxConfig', () => {
  it('renders a number input for viewBox width', () => {
    expect(createWrapper().find('input[type="number"]').exists()).toBe(true)
  })

  it('defaults the width input to 1000', () => {
    expect(createWrapper().find('input[type="number"]').element.value).toBe('1000')
  })

  it('displays the derived height for the default width', () => {
    // 1600×900 image, width=1000 → height = round(1000 * 900 / 1600) = round(562.5) = 563
    expect(createWrapper(makeState(1600, 900)).text()).toContain('563')
  })

  it('calls setCanvasParameters with default values on mount', () => {
    const setCanvasParameters = vi.fn()
    createWrapper(makeState(1600, 900), setCanvasParameters)
    expect(setCanvasParameters).toHaveBeenCalledWith(1000, 563)
  })

  it('recomputes height when width changes', async () => {
    const wrapper = createWrapper(makeState(1000, 500))
    await wrapper.find('input[type="number"]').setValue('2000')
    // height = round(2000 * 500 / 1000) = 1000
    expect(wrapper.text()).toContain('1000')
  })

  it('calls setCanvasParameters when width changes', async () => {
    const setCanvasParameters = vi.fn()
    const wrapper = createWrapper(makeState(1000, 500), setCanvasParameters)
    await wrapper.find('input[type="number"]').setValue('2000')
    expect(setCanvasParameters).toHaveBeenLastCalledWith(2000, 1000)
  })

  it('displays a height label so the user can read the derived value', () => {
    // 800×600 image, width=1000 → height = round(1000 * 600 / 800) = 750
    expect(createWrapper(makeState(800, 600)).text()).toContain('750')
  })
})

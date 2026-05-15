import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import ElementTree from './ElementTree.vue'

describe('ElementTree', () => {
  function createWrapper(paths = []) {
    const state = reactive({
      canvas: {
        svg: {
          points: [],
          controlPoints: [],
          paths
        }
      }
    })

    return mount(ElementTree, {
      global: {
        provide: {
          state
        }
      }
    })
  }

  it('shows "No paths yet" when paths array is empty', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('No paths yet')
  })

  it('renders one entry per path', () => {
    const paths = [
      { type: 'line', points: [0, 1], controlPoints: [] },
      { type: 'cubicBezier', points: [1, 2], controlPoints: [0, 1] }
    ]
    const wrapper = createWrapper(paths)
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)
  })

  it('displays path type and index', () => {
    const paths = [
      { type: 'line', points: [0, 1], controlPoints: [] },
      { type: 'cubicBezier', points: [1, 2], controlPoints: [0, 1] }
    ]
    const wrapper = createWrapper(paths)
    expect(wrapper.text()).toContain('[0]')
    expect(wrapper.text()).toContain('line')
    expect(wrapper.text()).toContain('[1]')
    expect(wrapper.text()).toContain('cubicBezier')
  })

  it('reactively updates when paths are added', async () => {
    const state = reactive({
      canvas: {
        svg: {
          points: [],
          controlPoints: [],
          paths: []
        }
      }
    })

    const wrapper = mount(ElementTree, {
      global: {
        provide: { state }
      }
    })

    expect(wrapper.text()).toContain('No paths yet')

    state.canvas.svg.paths.push({ type: 'line', points: [0, 1], controlPoints: [] })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('No paths yet')
    expect(wrapper.text()).toContain('line')
  })

  it('reactively updates when paths are removed', async () => {
    const state = reactive({
      canvas: {
        svg: {
          points: [],
          controlPoints: [],
          paths: [
            { type: 'line', points: [0, 1], controlPoints: [] },
            { type: 'cubicBezier', points: [1, 2], controlPoints: [0, 1] }
          ]
        }
      }
    })

    const wrapper = mount(ElementTree, {
      global: {
        provide: { state }
      }
    })

    expect(wrapper.findAll('li')).toHaveLength(2)

    state.canvas.svg.paths.pop()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('li')).toHaveLength(1)
  })
})

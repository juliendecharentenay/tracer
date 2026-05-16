import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import ElementTree from './ElementTree.vue'

describe('ElementTree', () => {
  function makeState(paths = []) {
    return reactive({
      canvas: {
        svg: {
          points: [],
          controlPoints: [],
          paths
        }
      }
    })
  }

  function createWrapper(state = makeState(), extra = {}) {
    return mount(ElementTree, {
      global: {
        provide: {
          state,
          hoveredPathIndex:  ref(null),
          selectedPathIndex: ref(null),
          setHoveredPathIndex: vi.fn(),
          ...extra,
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
    const wrapper = createWrapper(makeState(paths))
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)
  })

  it('displays path type and index', () => {
    const paths = [
      { type: 'line', points: [0, 1], controlPoints: [] },
      { type: 'cubicBezier', points: [1, 2], controlPoints: [0, 1] }
    ]
    const wrapper = createWrapper(makeState(paths))
    expect(wrapper.text()).toContain('[0]')
    expect(wrapper.text()).toContain('line')
    expect(wrapper.text()).toContain('[1]')
    expect(wrapper.text()).toContain('cubicBezier')
  })

  it('reactively updates when paths are added', async () => {
    const state = makeState()
    const wrapper = createWrapper(state)

    expect(wrapper.text()).toContain('No paths yet')

    state.canvas.svg.paths.push({ type: 'line', points: [0, 1], controlPoints: [] })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('No paths yet')
    expect(wrapper.text()).toContain('line')
  })

  it('reactively updates when paths are removed', async () => {
    const state = makeState([
            { type: 'line', points: [0, 1], controlPoints: [] },
            { type: 'cubicBezier', points: [1, 2], controlPoints: [0, 1] }
          ])
    const wrapper = createWrapper(state)

    expect(wrapper.findAll('li')).toHaveLength(2)

    state.canvas.svg.paths.pop()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('li')).toHaveLength(1)
  })

  describe('hover and selection styling', () => {
    it('does not apply font-bold when entry is neither hovered nor selected', () => {
      const paths = [{ type: 'line', points: [0, 1], controlPoints: [] }]
      const wrapper = createWrapper(makeState(paths), {
        hoveredPathIndex:  ref(null),
        selectedPathIndex: ref(null),
      })
      const item = wrapper.find('li')
      expect(item.classes()).not.toContain('font-bold')
    })

    it('applies font-bold when entry is hovered', () => {
      const paths = [
        { type: 'line', points: [0, 1], controlPoints: [] },
        { type: 'line', points: [1, 2], controlPoints: [] }
      ]
      const wrapper = createWrapper(makeState(paths), {
        hoveredPathIndex:  ref(0),
        selectedPathIndex: ref(null),
      })
      const items = wrapper.findAll('li')
      expect(items[0].classes()).toContain('font-bold')
      expect(items[1].classes()).not.toContain('font-bold')
    })

    it('applies font-bold when entry is selected', () => {
      const paths = [
        { type: 'line', points: [0, 1], controlPoints: [] },
        { type: 'line', points: [1, 2], controlPoints: [] }
      ]
      const wrapper = createWrapper(makeState(paths), {
        hoveredPathIndex:  ref(null),
        selectedPathIndex: ref(1),
      })
      const items = wrapper.findAll('li')
      expect(items[0].classes()).not.toContain('font-bold')
      expect(items[1].classes()).toContain('font-bold')
    })

    it('applies font-bold when entry is either hovered or selected', () => {
      const paths = [
        { type: 'line', points: [0, 1], controlPoints: [] },
        { type: 'line', points: [1, 2], controlPoints: [] }
      ]
      const wrapper = createWrapper(makeState(paths), {
        hoveredPathIndex:  ref(0),
        selectedPathIndex: ref(1),
      })
      const items = wrapper.findAll('li')
      expect(items[0].classes()).toContain('font-bold')
      expect(items[1].classes()).toContain('font-bold')
    })
  })

  describe('hover event handlers', () => {
    it('calls setHoveredPathIndex with the index on mouseenter', () => {
      const setHoveredPathIndex = vi.fn()
      const paths = [
        { type: 'line', points: [0, 1], controlPoints: [] },
        { type: 'line', points: [1, 2], controlPoints: [] }
      ]
      const wrapper = createWrapper(makeState(paths), { setHoveredPathIndex })
      const items = wrapper.findAll('li')
      items[1].trigger('mouseenter')
      expect(setHoveredPathIndex).toHaveBeenCalledWith(1)
    })

    it('calls setHoveredPathIndex(null) on mouseleave', () => {
      const setHoveredPathIndex = vi.fn()
      const paths = [{ type: 'line', points: [0, 1], controlPoints: [] }]
      const wrapper = createWrapper(makeState(paths), { setHoveredPathIndex })
      const item = wrapper.find('li')
      item.trigger('mouseleave')
      expect(setHoveredPathIndex).toHaveBeenCalledWith(null)
    })
  })
})

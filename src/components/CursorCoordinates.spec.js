import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CursorCoordinates from './CursorCoordinates.vue'

describe('CursorCoordinates', () => {
  it('displays cursor coordinates when cursor is provided', () => {
    const wrapper = mount(CursorCoordinates, {
      props: {
        cursor: { x: 120, y: 340 }
      }
    })
    expect(wrapper.text()).toContain('x:')
    expect(wrapper.text()).toContain('120')
    expect(wrapper.text()).toContain('y:')
    expect(wrapper.text()).toContain('340')
  })

  it('displays dash when cursor is null', () => {
    const wrapper = mount(CursorCoordinates, {
      props: {
        cursor: null
      }
    })
    expect(wrapper.text()).toContain('–')
  })

  it('displays dash when cursor prop is omitted', () => {
    const wrapper = mount(CursorCoordinates)
    expect(wrapper.text()).toContain('–')
  })

  it('updates when cursor prop changes', async () => {
    const wrapper = mount(CursorCoordinates, {
      props: {
        cursor: { x: 100, y: 200 }
      }
    })

    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('200')

    await wrapper.setProps({ cursor: { x: 250, y: 350 } })

    expect(wrapper.text()).toContain('250')
    expect(wrapper.text()).toContain('350')
    expect(wrapper.text()).not.toContain('100')
  })

  it('updates to dash when cursor becomes null', async () => {
    const wrapper = mount(CursorCoordinates, {
      props: {
        cursor: { x: 100, y: 200 }
      }
    })

    expect(wrapper.text()).not.toContain('–')

    await wrapper.setProps({ cursor: null })

    expect(wrapper.text()).toContain('–')
  })
})

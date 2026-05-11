import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import PointSymbol from './PointSymbol.vue'
import { SIZE } from './PointSymbol.js'

describe('PointSymbol', () => {
  function makeWrapper(props) {
    return mount(PointSymbol, { props })
  }

  it('renders a rect centred on x, y', () => {
    const wrapper = makeWrapper({ x: 100, y: 200, type: 'start/end' })
    const rect = wrapper.find('rect')
    expect(Number(rect.attributes('x'))).toBe(100 - SIZE / 2)
    expect(Number(rect.attributes('y'))).toBe(200 - SIZE / 2)
  })

  it('renders a rect with the configured size', () => {
    const wrapper = makeWrapper({ x: 0, y: 0, type: 'start/end' })
    const rect = wrapper.find('rect')
    expect(Number(rect.attributes('width'))).toBe(SIZE)
    expect(Number(rect.attributes('height'))).toBe(SIZE)
  })

  it('renders a filled rect for type "start/end"', () => {
    const wrapper = makeWrapper({ x: 0, y: 0, type: 'start/end' })
    expect(wrapper.find('rect').attributes('fill')).not.toBe('none')
  })

  it('renders a non-filled rect for type "control"', () => {
    const wrapper = makeWrapper({ x: 0, y: 0, type: 'control' })
    expect(wrapper.find('rect').attributes('fill')).toBe('none')
  })

  it('applies an active attribute when status is "active"', () => {
    const active = makeWrapper({ x: 0, y: 0, type: 'start/end', status: 'active' })
    const def = makeWrapper({ x: 0, y: 0, type: 'start/end', status: 'default' })
    expect(active.find('rect').attributes('class')).not.toBe(def.find('rect').attributes('class'))
  })
})

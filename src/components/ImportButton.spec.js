import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ImportButton from './ImportButton.vue'

function makeProvide() {
  const state = { image: { base64: null } }
  const setImageBase64 = vi.fn((base64) => { state.image.base64 = base64 })
  return { state, provide: { setImageBase64 } }
}

describe('ImportButton', () => {
  it('renders an Import button', () => {
    const { provide } = makeProvide()
    const wrapper = mount(ImportButton, { global: { provide } })
    expect(wrapper.find('button').text()).toBe('Import')
  })

  it('triggers file input click when button is clicked', async () => {
    const { provide } = makeProvide()
    const wrapper = mount(ImportButton, { global: { provide } })
    const input = wrapper.find('input[type="file"]')
    const clickSpy = vi.spyOn(input.element, 'click')
    await wrapper.find('button').trigger('click')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('reads selected file as data URL and stores in state', async () => {
    const fakeDataUrl = 'data:image/png;base64,abc123'
    class MockFileReader {
      readAsDataURL() {
        this.onload({ target: { result: fakeDataUrl } })
      }
    }
    vi.stubGlobal('FileReader', MockFileReader)

    const { state, provide } = makeProvide()
    const wrapper = mount(ImportButton, { global: { provide } })
    const input = wrapper.find('input[type="file"]')
    const fakeFile = new File([''], 'test.png', { type: 'image/png' })
    Object.defineProperty(input.element, 'files', { value: [fakeFile] })
    await input.trigger('change')

    expect(state.image.base64).toBe(fakeDataUrl)

    vi.unstubAllGlobals()
  })
})

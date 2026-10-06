import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModView from '../views/ModView.vue'

describe('ModView', () => {
  it('shows 56.7 for default 21% O2 and 1.4 ppO2', () => {
    const wrapper = mount(ModView)
    expect(wrapper.text()).toContain('56.7')
  })

  it('recalculates when oxygen percent changes', async () => {
    const wrapper = mount(ModView)
    const o2 = wrapper.get('input[aria-label="Oxygen percent"]')
    await o2.setValue(32)
    expect(wrapper.text()).toContain('33.8')
  })

  it('applies standard gas and use-case dropdowns', async () => {
    const wrapper = mount(ModView)
    await wrapper.get('select[aria-label="Standard gas"]').setValue('100')
    await wrapper.get('select[aria-label="ppO2 use case"]').setValue('1.6')
    expect(wrapper.text()).toContain('6.0')
  })
})

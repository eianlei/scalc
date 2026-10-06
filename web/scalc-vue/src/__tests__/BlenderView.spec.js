import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '../router'
import ppIdg from '../lib/blender/__fixtures__/pp-idg.json'

describe('BlenderView', () => {
  it('shows Gas Blender heading and default PP IDG instructions', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/blender')
    await router.isReady()
    const wrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router] } },
    )
    await flushPromises()
    expect(wrapper.text()).toContain('Gas Blender')
    expect(wrapper.get('textarea[aria-label="Blend instructions"]').element.value).toBe(ppIdg.text)
    expect(wrapper.get('select[aria-label="Blending method"]').element.value).toBe('pp')
    const top = wrapper.find('option[value="top"]')
    expect(top.attributes('disabled')).toBeDefined()
  })
})

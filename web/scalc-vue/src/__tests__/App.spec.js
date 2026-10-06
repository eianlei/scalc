import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import { routes } from '../router'

describe('App', () => {
  it('renders SCALC tab labels', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/about')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('ABOUT')
    expect(wrapper.text()).toContain('MOD')
    expect(wrapper.text()).toContain('Blender')
    expect(wrapper.text()).toContain('Planner')
  })
})

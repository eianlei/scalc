import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '../router'
import plannerFixture from '../lib/planner/__fixtures__/default-50m-30min.json'

describe('PlannerView', () => {
  it('shows planner heading and default plan text', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/planner')
    await router.isReady()
    const wrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router] } },
    )
    await flushPromises()
    expect(wrapper.text()).toContain('Dive Planner Prototype')
    expect(wrapper.get('textarea[aria-label="Planner text output"]').element.value).toBe(
      plannerFixture.text,
    )
    expect(wrapper.get('canvas[aria-label="Dive profile"]').element.width).toBe(600)
  })

  it('opens and closes the help panel', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/planner')
    await router.isReady()
    const wrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router] } },
    )
    await flushPromises()
    expect(wrapper.find('.planner-help-panel').exists()).toBe(false)
    await wrapper.get('button[title="Show planner help documentation"]').trigger('click')
    expect(wrapper.find('.planner-help-panel').exists()).toBe(true)
    expect(wrapper.find('.planner-help-content').text()).toContain('Dive Planner Help')
    await wrapper.get('.planner-help-close').trigger('click')
    expect(wrapper.find('.planner-help-panel').exists()).toBe(false)
  })
})

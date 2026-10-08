import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ProfileCanvas from '../ProfileCanvas.vue'
import { createDefaultRunPlan } from '@/lib/planner/defaultRunPlan.js'
import { calculatePlan } from '@/lib/planner/calculatePlan.js'

describe('ProfileCanvas', () => {
  it('renders dive profile canvases from diveplan prop', async () => {
    const dp = createDefaultRunPlan()
    calculatePlan(dp)
    const wrapper = mount(ProfileCanvas, {
      props: { diveplan: dp },
    })
    await flushPromises()
    const canvases = wrapper.findAll('canvas')
    expect(canvases).toHaveLength(2)
    expect(canvases[0].element.width).toBe(600)
    expect(canvases[0].element.height).toBe(200)
  })

  it('accepts custom width and height', () => {
    const wrapper = mount(ProfileCanvas, {
      props: { width: 400, height: 150 },
    })
    const root = wrapper.get('.profile-canvas')
    expect(root.element.style.width).toBe('400px')
    expect(root.element.style.height).toBe('150px')
    expect(wrapper.find('canvas').element.width).toBe(400)
  })

  it('shows a corner resize handle when resizable', () => {
    const wrapper = mount(ProfileCanvas)
    expect(wrapper.find('.resize-handle').exists()).toBe(true)
  })

  it('hides resize handle when resizable is false', () => {
    const wrapper = mount(ProfileCanvas, { props: { resizable: false } })
    expect(wrapper.find('.resize-handle').exists()).toBe(false)
  })
})

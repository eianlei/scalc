import { describe, it, expect, vi } from 'vitest'
import { createPlannerState } from '../composables/usePlanner.js'
import plannerFixture from '../lib/planner/__fixtures__/default-50m-30min.json'

describe('createPlannerState', () => {
  it('matches default 50 m / 30 min plan text', () => {
    const p = createPlannerState()
    expect(p.textOutput).toBe(plannerFixture.text)
    expect(p.diveplan.wayPoints).toEqual(plannerFixture.wayPoints)
    expect(p.diveplan.profileSampled.length).toBe(plannerFixture.profileSampledLength)
  })

  it('reverts invalid bottom O2 with alert', () => {
    const p = createPlannerState()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    p.bottomO2 = 10
    p.runPlan()
    expect(alertSpy).toHaveBeenCalled()
    expect(p.bottomO2).toBe(21)
    alertSpy.mockRestore()
  })
})

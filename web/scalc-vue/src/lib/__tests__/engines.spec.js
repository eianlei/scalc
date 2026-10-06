import { describe, it, expect } from 'vitest'
import { calculateMod } from '../mod.js'
import { tmxcalc_num, tmxcalc_text } from '../blender/tmxcalc.js'
import { vdw_calc } from '../blender/vanderwaals.js'
import { vdw_calc_temp } from '../blender/vdw_temp.js'
import { calculatePlan } from '../planner/calculatePlan.js'
import { plan_txt } from '../planner/planTxt.js'
import { createDefaultRunPlan } from '../planner/defaultRunPlan.js'
import ppIdg from '../blender/__fixtures__/pp-idg.json'
import nxIdg from '../blender/__fixtures__/nx-idg.json'
import airIdg from '../blender/__fixtures__/air-idg.json'
import vdw1 from '../blender/__fixtures__/pp-vdw1.json'
import vdw2 from '../blender/__fixtures__/pp-vdw2.json'
import plannerFixture from '../planner/__fixtures__/default-50m-30min.json'

function expectNumericResult(actual, expected) {
  expect(actual.status_code).toBe(expected.status_code)
  for (const key of Object.keys(expected)) {
    if (key === 'status_code' || key === 'status_txt') continue
    expect(actual[key]).toBeCloseTo(expected[key], 5)
  }
}

describe('calculateMod', () => {
  it('matches vanilla default 21% / 1.4 -> 56.7 m', () => {
    expect(calculateMod(21, 1.4).toFixed(1)).toBe('56.7')
  })
})

describe('tmxcalc_num', () => {
  it('matches default PP + IDG fill 100 bar 21/35 -> 200 bar 21/35', () => {
    const { inputs, result, text } = ppIdg
    const actual = tmxcalc_num(
      inputs.filltype,
      inputs.start_bar,
      inputs.start_o2,
      inputs.start_he,
      inputs.stop_bar,
      inputs.stop_o2,
      inputs.stop_he,
      false,
      false,
    )
    expectNumericResult(actual, result)
    expect(actual.add_he).toBeCloseTo(35, 1)
    expect(actual.add_o2).toBeCloseTo(9.3, 1)
    expect(actual.add_air).toBeCloseTo(55.7, 1)
    expect(tmxcalc_text(actual)).toBe(text)
  })

  it('matches Nitrox CFM from 1 bar 21% to 200 bar 32%', () => {
    const { inputs, result, text } = nxIdg
    const actual = tmxcalc_num(
      inputs.filltype,
      inputs.start_bar,
      inputs.start_o2,
      inputs.start_he,
      inputs.stop_bar,
      inputs.stop_o2,
      inputs.stop_he,
      false,
      false,
    )
    expectNumericResult(actual, result)
    expect(tmxcalc_text(actual)).toBe(text)
  })

  it('matches plain air top-up 100 -> 200 bar', () => {
    const { inputs, result, text } = airIdg
    const actual = tmxcalc_num(
      inputs.filltype,
      inputs.start_bar,
      inputs.start_o2,
      inputs.start_he,
      inputs.stop_bar,
      inputs.stop_o2,
      inputs.stop_he,
      false,
      false,
    )
    expectNumericResult(actual, result)
    expect(tmxcalc_text(actual)).toBe(text)
  })
})

describe('vdw_calc', () => {
  it('matches default PP + VdW1 100 bar 21/35 -> 200 bar 21/35, 24 L, 20 C', () => {
    const { inputs, result } = vdw1
    const actual = vdw_calc(
      inputs.start_bar,
      inputs.start_o2,
      inputs.start_he,
      inputs.want_bar,
      inputs.want_o2,
      inputs.want_he,
      inputs.volume,
      inputs.temp,
    )
    expectNumericResult(actual, result)
    expect(actual.status_txt).toBe(result.status_txt)
    expect(actual.add_he).toBeCloseTo(37.3, 1)
  })
})

describe('vdw_calc_temp', () => {
  it('matches default PP + VdW2 temperatures', () => {
    const { inputs, result } = vdw2
    const actual = vdw_calc_temp(
      inputs.start_bar,
      inputs.start_o2,
      inputs.start_he,
      inputs.want_bar,
      inputs.want_o2,
      inputs.want_he,
      inputs.volume,
      inputs.temp_start,
      inputs.temp_he,
      inputs.temp_o2,
      inputs.temp_air,
      inputs.temp_final,
      inputs.temp_use,
      'pp',
    )
    expectNumericResult(actual, result)
    expect(actual.status_txt).toBe(result.status_txt)
    expect(actual.add_he).toBeCloseTo(41.3, 1)
  })
})

describe('calculatePlan', () => {
  it('matches vanilla default 50 m / 30 min GF 30/80', () => {
    const dp = createDefaultRunPlan()
    calculatePlan(dp)
    expect(dp.wayPoints).toEqual(plannerFixture.wayPoints)
    const stops = dp.decoStopsCalculated.filter(Boolean).map((s) => ({
      depth: s.depth,
      runtime: s.runtime,
      duration: s.duration,
      o2: s.o2,
      he: s.he,
    }))
    expect(stops.length).toBe(plannerFixture.decoStopsCalculated.length)
    stops.forEach((stop, i) => {
      expect(stop.depth).toBeCloseTo(plannerFixture.decoStopsCalculated[i].depth, 8)
      expect(stop.runtime).toBeCloseTo(plannerFixture.decoStopsCalculated[i].runtime, 8)
      expect(stop.duration).toBeCloseTo(plannerFixture.decoStopsCalculated[i].duration, 8)
      expect(stop.o2).toBe(plannerFixture.decoStopsCalculated[i].o2)
      expect(stop.he).toBe(plannerFixture.decoStopsCalculated[i].he)
    })
    expect(dp.profileSampled.length).toBe(plannerFixture.profileSampledLength)
    expect(dp.profileSampled.at(-1).time).toBeCloseTo(plannerFixture.lastRuntime, 8)
    expect(plan_txt(dp.decoStopsCalculated, dp.wayPoints, dp.tankList)).toBe(plannerFixture.text)
  })
})

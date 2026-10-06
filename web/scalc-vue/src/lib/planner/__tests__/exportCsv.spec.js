import { describe, it, expect } from 'vitest'
import { createDefaultRunPlan } from '../defaultRunPlan.js'
import { calculatePlan } from '../calculatePlan.js'
import { createTableCSV } from '../exportCsv.js'

describe('createTableCSV', () => {
  it('uses EU semicolon separator and comma decimals', () => {
    const dp = createDefaultRunPlan()
    calculatePlan(dp)
    const csv = createTableCSV(dp.profileSampled)
    expect(csv.startsWith('idx;min;m;phase;tank;')).toBe(true)
    expect(csv).toContain('TC0;')
    expect(csv).not.toMatch(/^idx,min/m)
    const dataLine = csv.split('\n')[1]
    expect(dataLine).toContain(';')
    expect(dataLine).toMatch(/\d,\d/)
  })
})

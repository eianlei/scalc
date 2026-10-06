import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { createBlenderState } from '../composables/useBlender.js'
import { calculateCost } from '../lib/blender/calculateCost.js'
import ppIdg from '../lib/blender/__fixtures__/pp-idg.json'
import vdw2 from '../lib/blender/__fixtures__/pp-vdw2.json'

describe('createBlenderState', () => {
  it('matches default PP + IDG text and add gas', () => {
    const b = createBlenderState()
    expect(b.result.status_code).toBe(0)
    expect(b.textOutput).toBe(ppIdg.text)
    expect(b.result.add_he).toBeCloseTo(ppIdg.result.add_he, 5)
    expect(b.result.add_o2).toBeCloseTo(ppIdg.result.add_o2, 5)
    expect(b.result.add_air).toBeCloseTo(ppIdg.result.add_air, 5)
    expect(b.costOutput).toContain('Total cost of the fill is:')
  })

  it('matches default PP + VdW2 status text', async () => {
    const b = createBlenderState()
    b.algorithm = 'VdW2'
    await nextTick()
    expect(b.result.status_code).toBe(0)
    expect(b.textOutput).toBe(vdw2.result.status_txt)
    expect(b.result.add_he).toBeCloseTo(vdw2.result.add_he, 5)
  })

  it('EMPTY sets 1 bar air start mix', async () => {
    const b = createBlenderState()
    b.emptyTank()
    await nextTick()
    expect(b.startBar).toBe(1)
    expect(b.startO2).toBe(21)
    expect(b.startHe).toBe(0)
    expect(b.startGas).toBe('21/0')
  })
})

describe('calculateCost', () => {
  it('uses parseInt-style euro prices (4.6 O2 becomes 4)', () => {
    const [, txt] = calculateCost(24, 200, 9.303797468354418, 35, parseInt(4.6, 10), parseInt(35, 10), parseInt(6, 10))
    expect(txt).toContain('Total cost of the fill is:')
    expect(txt).toContain('EUR')
    const o2Eur = ((24 * 9.303797468354418 * 4) / 1000).toFixed(2)
    expect(txt).toContain(o2Eur)
  })
})

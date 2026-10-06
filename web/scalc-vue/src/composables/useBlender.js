import { computed, inject, provide, reactive, watch } from 'vue'
import { tmxcalc_num, tmxcalc_text } from '@/lib/blender/tmxcalc.js'
import { vdw_calc } from '@/lib/blender/vanderwaals.js'
import { vdw_calc_temp } from '@/lib/blender/vdw_temp.js'
import { calculateCost } from '@/lib/blender/calculateCost.js'
import { computeCompressor, computeHeStorage, computeO2Storage } from '@/lib/blender/storage.js'

export const blenderKey = 'blender'

function parseI(value) {
  return parseInt(value, 10)
}

export function createBlenderState() {
  const s = reactive({
    filltype: 'pp',
    algorithm: 'IDG',
    startGas: '21/35',
    wantedGas: '21/35',
    endBarPreset: '200',
    startBar: 100,
    startO2: 21,
    startHe: 35,
    endBar: 200,
    endO2: 21,
    endHe: 35,
    tempStart: 22,
    tempHe: 30,
    tempO2: 40,
    tempAir: 50,
    tempFinal: 22,
    tempUse: 10,
    tankLiters: 24,
    o2Price: 4.6,
    hePrice: 35,
    cPrice: 6,
    o2StorageLiters: 50,
    o2StorageStart: 200,
    o2StorageRate: 5,
    heStorageLiters: 50,
    heStorageStart: 200,
    heStorageRate: 5,
    compressorRate: 315,
    result: null,
    textOutput: '',
    costOutput: '',
  })

  function calculateBlend() {
    if (!s.filltype || !s.algorithm) return
    const start_bar = parseI(s.startBar)
    const end_bar = parseI(s.endBar)
    const start_o2_pct = parseI(s.startO2)
    const start_he_pct = parseI(s.startHe)
    const end_o2_pct = parseI(s.endO2)
    const end_he_pct = parseI(s.endHe)
    const liters = parseI(s.tankLiters)
    if ([start_bar, end_bar, start_o2_pct, start_he_pct, end_o2_pct, end_he_pct, liters].some((n) => Number.isNaN(n))) {
      return
    }
    let next

    if (s.filltype == 'pp' && s.algorithm == 'VdW1') {
      next = vdw_calc(start_bar, start_o2_pct, start_he_pct, end_bar, end_o2_pct, end_he_pct, liters, 20.0)
      s.textOutput = next.status_txt
    } else if (s.filltype == 'pp' && s.algorithm == 'VdW2') {
      next = vdw_calc_temp(
        start_bar,
        start_o2_pct,
        start_he_pct,
        end_bar,
        end_o2_pct,
        end_he_pct,
        liters,
        parseI(s.tempStart),
        parseI(s.tempHe),
        parseI(s.tempO2),
        parseI(s.tempAir),
        parseI(s.tempFinal),
        parseI(s.tempUse),
      )
      s.textOutput = next.status_txt
    } else {
      next = tmxcalc_num(
        s.filltype,
        start_bar,
        start_o2_pct,
        start_he_pct,
        end_bar,
        end_o2_pct,
        end_he_pct,
        false,
        false,
      )
      if (next.status_code == 0) {
        s.textOutput = tmxcalc_text(next)
      } else {
        s.textOutput = next.status_txt
      }
    }

    next.tank_liters = liters
    s.result = next
  }

  function doCost() {
    if (!s.result) return
    const liters = parseI(s.tankLiters)
    const o2_price_eur = parseI(s.o2Price)
    const he_price_eur = parseI(s.hePrice)
    const fill_price_eur = parseI(s.cPrice)
    s.result.tank_liters = liters
    const [, txt] = calculateCost(
      liters,
      parseI(s.endBar),
      s.result.add_o2,
      s.result.add_he,
      o2_price_eur,
      he_price_eur,
      fill_price_eur,
    )
    s.costOutput = txt
  }

  function emptyTank() {
    s.startBar = 1
    s.startO2 = 21
    s.startHe = 0
    s.startGas = '21/0'
  }

  function applyStartGas() {
    if (!s.startGas) return
    const gases = String(s.startGas).split('/')
    s.startO2 = parseI(gases[0])
    s.startHe = parseI(gases[1])
  }

  function applyWantedGas() {
    if (!s.wantedGas) return
    const gases = String(s.wantedGas).split('/')
    s.endO2 = parseI(gases[0])
    s.endHe = parseI(gases[1])
  }

  function applyEndBarPreset() {
    if (!s.endBarPreset) return
    s.endBar = parseI(s.endBarPreset)
  }

  const o2Storage = computed(() => {
    if (!s.result) return { use: 'not used', need: '000', time: '000', used: '000', end: '000' }
    return computeO2Storage(
      s.result,
      parseI(s.tankLiters),
      parseI(s.o2StorageLiters),
      parseI(s.o2StorageStart),
      parseI(s.o2StorageRate),
    )
  })

  const heStorage = computed(() => {
    if (!s.result) return { use: 'not used', need: '000', time: '000', used: '000', end: '000' }
    return computeHeStorage(
      s.result,
      parseI(s.tankLiters),
      parseI(s.heStorageLiters),
      parseI(s.heStorageStart),
      parseI(s.heStorageRate),
    )
  })

  const compressor = computed(() => {
    if (!s.result) {
      return { o2: ' 0 ', he: ' 0 ', delta: ' 0 ', tankLiters: ' 0 ', time: ' 0 ' }
    }
    return computeCompressor(s.result, parseI(s.tankLiters), parseI(s.compressorRate))
  })

  watch(() => s.startGas, applyStartGas)
  watch(() => s.wantedGas, applyWantedGas)
  watch(() => s.endBarPreset, applyEndBarPreset)

  watch(
    () => [
      s.filltype,
      s.algorithm,
      s.startBar,
      s.startO2,
      s.startHe,
      s.endBar,
      s.endO2,
      s.endHe,
      s.tempStart,
      s.tempHe,
      s.tempO2,
      s.tempAir,
      s.tempFinal,
      s.tempUse,
    ],
    calculateBlend,
    { immediate: true },
  )

  watch(() => [s.tankLiters, s.o2Price, s.hePrice, s.cPrice, s.result], doCost, { immediate: true })

  return Object.assign(s, {
    o2Storage,
    heStorage,
    compressor,
    calculateBlend,
    doCost,
    emptyTank,
  })
}

export function provideBlender() {
  const state = createBlenderState()
  provide(blenderKey, state)
  return state
}

export function useBlender() {
  const state = inject(blenderKey)
  if (!state) {
    throw new Error('useBlender() requires provideBlender() in BlenderView')
  }
  return state
}

import { computed, inject, provide, reactive, watch } from 'vue'
import { calculatePlan } from '@/lib/planner/calculatePlan.js'
import { createDiveplan } from '@/lib/planner/createDiveplan.js'
import { plan_txt } from '@/lib/planner/planTxt.js'

export const plannerKey = 'planner'

function parseI(value) {
  return parseInt(value, 10)
}

export function createPlannerState() {
  const s = reactive({
    diveDepth: 50,
    diveBottomTime: 30,
    gfLow: 30,
    gfHigh: 80,
    gfPreset: '',
    bottomGas: '21/35',
    bottomO2: 21,
    bottomHe: 35,
    bottomBar: 200,
    bottomLiters: 24,
    bottomSac: 15,
    deco1Use: true,
    deco1O2: 50,
    deco1He: 0,
    deco1Bar: 200,
    deco1Liters: 11,
    deco1Switch: 21,
    deco1Sac: 15,
    deco2Use: true,
    deco2O2: 100,
    deco2He: 0,
    deco2Bar: 200,
    deco2Liters: 7,
    deco2Switch: 6,
    deco2Sac: 15,
    descSteps: 5,
    bottomSteps: 5,
    diveplan: null,
    textOutput: '',
    showHowto: false,
  })

  function applyBottomGas() {
    if (!s.bottomGas) return
    const gases = String(s.bottomGas).split('/')
    s.bottomO2 = parseI(gases[0])
    s.bottomHe = parseI(gases[1])
  }

  function applyGfPreset() {
    if (!s.gfPreset) return
    const gfs = String(s.gfPreset).split('/')
    s.gfLow = parseI(gfs[0])
    s.gfHigh = parseI(gfs[1])
  }

  function runPlan() {
    let bottom_O2_in = parseI(s.bottomO2)
    let bottom_He_in = parseI(s.bottomHe)
    if (bottom_O2_in > 100 || bottom_O2_in < 18) {
      alert(`invalid bottom O2% = ${bottom_O2_in}\nreverting to 21%`)
      bottom_O2_in = 21
      s.bottomO2 = 21
    }
    if (bottom_O2_in + bottom_He_in > 100 || bottom_He_in > 82) {
      alert(
        `invalid bottom O2/He% = ${bottom_O2_in}/${bottom_He_in} \n` + 'reverting to 21/35%',
      )
      bottom_O2_in = 21
      bottom_He_in = 35
      s.bottomO2 = 21
      s.bottomHe = 35
    }

    const tankBottom = {
      label: 'BOTTOM',
      name: 'B',
      use: true,
      o2: bottom_O2_in,
      he: bottom_He_in,
      SAC: parseI(s.bottomSac),
      ppo2max: 1.4,
      liters: parseI(s.bottomLiters),
      bar: parseI(s.bottomBar),
      pressure: 200.0,
      useFromTime: 0,
      useUntilTime: 0,
      type: 'bottom',
      useOrder: 1,
      color: 'Magenta',
    }
    const tankDeco1 = {
      label: 'deco1',
      name: 'D1',
      use: s.deco1Use,
      o2: parseI(s.deco1O2),
      he: parseI(s.deco1He),
      changeDepth: parseI(s.deco1Switch),
      SAC: parseI(s.deco1Sac),
      ppo2max: 1.6,
      liters: parseI(s.deco1Liters),
      bar: parseI(s.deco1Bar),
      pressure: 200.0,
      useFromTime: 0,
      useUntilTime: 0,
      type: 'deco',
      useOrder: 2,
      color: 'Cyan',
    }
    const tankDeco2 = {
      label: 'deco2',
      name: 'D2',
      use: s.deco2Use,
      o2: parseI(s.deco2O2),
      he: parseI(s.deco2He),
      changeDepth: parseI(s.deco2Switch),
      SAC: parseI(s.deco2Sac),
      ppo2max: 1.6,
      liters: parseI(s.deco2Liters),
      bar: parseI(s.deco2Bar),
      pressure: 200.0,
      useFromTime: 0,
      useUntilTime: 0,
      type: 'deco',
      useOrder: 3,
      color: 'LightGray',
    }

    const myTanks = [tankBottom, tankDeco1, tankDeco2]
    const myDP = createDiveplan()
    myDP.bottomDepth = parseI(s.diveDepth)
    myDP.bottomTime = parseI(s.diveBottomTime)
    myDP.desc_rate = 10
    myDP.desc_steps = parseI(s.descSteps)
    myDP.bottom_steps = parseI(s.bottomSteps)
    myDP.ascRateToDeco = 1
    myDP.ascRateAtDeco = 1
    myDP.ascRateToSurface = 1
    myDP.GFlow = parseI(s.gfLow) / 100.0
    myDP.GFhigh = parseI(s.gfHigh) / 100.0
    myDP.tankList = myTanks
    myDP.currentTank = tankBottom
    myDP.tankBottom = tankBottom
    myDP.tankDeco1 = tankDeco1
    myDP.tankDeco2 = tankDeco2

    try {
      calculatePlan(myDP)
    } catch (err) {
      alert(
        `calculatePlan() exception: ${err}\n` +
          'aborted, press F12 to see console.log\n' +
          'resetting depth and bottom time to 30m/20min',
      )
      s.diveDepth = 30
      s.diveBottomTime = 20
      return
    }

    s.textOutput = plan_txt(myDP.decoStopsCalculated, myDP.wayPoints, myDP.tankList)
    s.diveplan = myDP
  }

  const profileRows = computed(() => s.diveplan?.profileSampled ?? [])

  watch(() => s.bottomGas, applyBottomGas)
  watch(() => s.gfPreset, applyGfPreset)

  watch(
    () => [
      s.diveDepth,
      s.diveBottomTime,
      s.gfLow,
      s.gfHigh,
      s.bottomO2,
      s.bottomHe,
      s.bottomBar,
      s.bottomLiters,
      s.bottomSac,
      s.deco1Use,
      s.deco1O2,
      s.deco1He,
      s.deco1Bar,
      s.deco1Liters,
      s.deco1Switch,
      s.deco1Sac,
      s.deco2Use,
      s.deco2O2,
      s.deco2He,
      s.deco2Bar,
      s.deco2Liters,
      s.deco2Switch,
      s.deco2Sac,
      s.descSteps,
      s.bottomSteps,
    ],
    runPlan,
    { immediate: true },
  )

  return Object.assign(s, {
    profileRows,
    runPlan,
    toggleHowto() {
      s.showHowto = !s.showHowto
    },
  })
}

export function providePlanner() {
  const state = createPlannerState()
  provide(plannerKey, state)
  return state
}

export function usePlanner() {
  const state = inject(plannerKey)
  if (!state) {
    throw new Error('usePlanner() requires providePlanner() in PlannerView')
  }
  return state
}

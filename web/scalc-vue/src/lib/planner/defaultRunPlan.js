import { createDiveplan } from './createDiveplan.js'

/**
 * Tank objects matching planner.js runPlan() defaults (50 m / 30 min, GF 30/80).
 */
export function defaultRunPlanTanks() {
  const tankBottom = {
    label: 'BOTTOM',
    name: 'B',
    use: true,
    o2: 21,
    he: 35,
    SAC: 15,
    ppo2max: 1.4,
    liters: 24,
    bar: 200,
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
    use: true,
    o2: 50,
    he: 0,
    changeDepth: 21,
    SAC: 15,
    ppo2max: 1.6,
    liters: 11,
    bar: 200,
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
    use: true,
    o2: 100,
    he: 0,
    changeDepth: 6,
    SAC: 15,
    ppo2max: 1.6,
    liters: 7,
    bar: 200,
    pressure: 200.0,
    useFromTime: 0,
    useUntilTime: 0,
    type: 'deco',
    useOrder: 3,
    color: 'LightGray',
  }
  return { tankBottom, tankDeco1, tankDeco2 }
}

/** Same field assignments as runPlan() before calculatePlan(). */
export function createDefaultRunPlan() {
  const { tankBottom, tankDeco1, tankDeco2 } = defaultRunPlanTanks()
  const myDP = createDiveplan()
  myDP.bottomDepth = 50
  myDP.bottomTime = 30
  myDP.desc_rate = 10
  myDP.desc_steps = 5
  myDP.bottom_steps = 5
  myDP.ascRateToDeco = 1
  myDP.ascRateAtDeco = 1
  myDP.ascRateToSurface = 1
  myDP.GFlow = 30 / 100.0
  myDP.GFhigh = 80 / 100.0
  myDP.tankList = [tankBottom, tankDeco1, tankDeco2]
  myDP.currentTank = tankBottom
  myDP.tankBottom = tankBottom
  myDP.tankDeco1 = tankDeco1
  myDP.tankDeco2 = tankDeco2
  return myDP
}

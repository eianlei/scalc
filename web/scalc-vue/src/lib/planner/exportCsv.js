/** CSV export for planner table (EU format: ; separator, comma decimals). */

export function createTableCSV(profileSampled) {
  let txt = 'idx;min;m;phase;tank;O2%;HE%;bar;ppO2;GF;C3m;ceil;marg;lead;'
  for (let i = 0; i < 16; i++) {
    txt += `TC${i};`
  }
  txt += '\n'
  for (let i = 0; i < profileSampled.length; i++) {
    const point = profileSampled[i]
    txt += `${i};`
    txt += `${point.time.toFixed(1).replace('.', ',')};`
    txt += `${point.depth.toFixed(1).replace('.', ',')};`
    txt += `${point.divephase};`
    txt += `${point.tank.name};`
    txt += `${point.tank.o2.toFixed(0)};`
    txt += `${point.tank.he.toFixed(0)};`
    txt += `${point.tankPressure.toFixed(0)};`
    txt += `${point.ppOxygen.toFixed(1).replace('.', ',')};`
    txt += `${point.gfNow.toFixed(2).replace('.', ',')};`
    txt += `${point.ceiling3m.toFixed(0)};`
    txt += `${point.ceiling.toFixed(1).replace('.', ',')};`
    txt += `${point.margin.toFixed(1).replace('.', ',')};`
    txt += `${point.leadTC.toFixed(0).replace('.', ',')};`
    for (let tc = 0; tc < point.TCm.length; tc++) {
      txt += `${point.TCm[tc].toFixed(1).replace('.', ',')};`
    }
    txt += '\n'
  }
  return txt
}

export function downloadPlannerCsv(profileSampled) {
  const content = createTableCSV(profileSampled)
  const a = document.createElement('a')
  const file = new Blob([content], { type: 'text/plain' })
  a.href = URL.createObjectURL(file)
  a.download = 'planner_table.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

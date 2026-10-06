/** Fill-profile canvas (ported from blender.js). Overlay canvas is unused, matching vanilla. */

export function drawFillProfile(c, _cTXT, result) {
  if (!c || !result) return
  let ctx
  try {
    ctx = c.getContext('2d')
  } catch {
    return
  }
  if (!ctx) return
  ctx.font = '9px Arial'
  ctx.fillStyle = 'black'
  ctx.globalAlpha = 0.8

  ctx.clearRect(0, 0, c.width, c.height)
  if (result.status_code > 0) {
    ctx.font = '20px Arial'
    ctx.fillStyle = 'red'
    ctx.fillText(`ERROR`, 50, 100)
    return
  }

  var tx = [0, 40, 80, 120, 170, 210, 270, 320, 320]
  var steps
  var divs
  switch (result.filltype_in) {
    case 'air':
      ctx.fillText(`plain air fill`, tx[1] + 2, 15)
      steps = [0, 3]
      divs = [tx[1], tx[6]]
      break
    case 'nx':
      ctx.fillText(`CFM fill with Nitrox`, tx[1] + 2, 15)
      steps = [0, 3]
      divs = [tx[1], tx[6]]
      break
    case 'tmx':
      ctx.fillText(`CFM fill with Trimix`, tx[1] + 2, 15)
      steps = [0, 3]
      divs = [tx[1], tx[6]]
      break
    case 'cfm':
      ctx.fillText(`add He`, tx[1] + 2, 15)
      ctx.fillText(`${result.add_he.toFixed(1)} bar`, tx[1] + 2, 25)
      ctx.fillText(`CFM fill with Nitrox`, tx[2] + 2, 15)
      steps = [0, 1, 3]
      divs = [tx[1], tx[2], tx[6]]
      break
    default:
      steps = [0, 1, 2, 3]
      divs = tx

      ;[
        [1, 'He', result.add_he],
        [3, 'O2', result.add_o2],
        [5, 'air', result.add_air],
      ].forEach((i) => {
        ctx.fillText(`add ${i[1]}`, tx[i[0]] + 2, 15)
        ctx.fillText(`${i[2].toFixed(1)}`, tx[i[0]] + 2, 25)
      })
  }

  var b1Bar = [result.start_bar_in, result.tbar_2, result.tbar_3, result.stop_bar_in]

  var bHePct = [result.start_he_in, result.t2_he_pct, result.t3_he_pct, result.mix_he_pct]
  var bHeBar = [
    (result.start_bar_in * (100 - result.start_he_in)) / 100,
    (result.tbar_2 * (100 - result.t2_he_pct)) / 100,
    (result.tbar_3 * (100 - result.t3_he_pct)) / 100,
    (result.stop_bar_in * (100 - result.mix_he_pct)) / 100,
  ]

  var bO2Pct = [result.start_o2_in, result.t2_o2_pct, result.t3_o2_pct, result.mix_o2_pct]
  var bO2Bar = Array(4)
  bO2Bar[0] = (result.start_bar_in * result.start_o2_in) / 100
  bO2Bar[1] = (result.tbar_2 * result.t2_o2_pct) / 100
  bO2Bar[2] = (result.tbar_3 * result.t3_o2_pct) / 100
  bO2Bar[3] = (result.stop_bar_in * result.mix_o2_pct) / 100

  var bN2Pct = [
    100 - result.start_o2_in - result.start_he_in,
    result.t2_n2_pct,
    result.t3_n2_pct,
    result.mix_n2_pct,
  ]

  drawRamp(ctx, 'Coral', tx, b1Bar, steps)
  drawRamp(ctx, 'LightBlue', tx, bHeBar, steps)
  drawRamp(ctx, 'cyan', tx, bO2Bar, steps)
  drawVertLines(ctx, divs)

  ctx.beginPath()
  ctx.fillStyle = 'black'

  for (let s = 0; s < steps.length; s++) {
    const i = steps[s]
    ctx.fillText(`${b1Bar[i].toFixed(0)} bar`, tx[i * 2] + 2, 308 - b1Bar[i])
    if (bHePct[i] > 0) ctx.fillText(`${bHePct[i].toFixed(0)} % He`, tx[i * 2] + 2, 318 - b1Bar[i])

    ctx.fillText(`${bO2Pct[i].toFixed(0)} % O2`, tx[i * 2] + 2, 318 - bO2Bar[i])
    ctx.fillText(`${bN2Pct[i].toFixed(0)} % N2`, tx[i * 2] + 2, 318 - bHeBar[i])
  }

  ctx.stroke()
}

export function drawRamp(ctx, color, tx, bar_arr, steps) {
  var x = 0
  var x2 = 0
  var y = 0
  ctx.beginPath()
  ctx.moveTo(0, 0)
  for (let s = 0; s < steps.length; s++) {
    const i = steps[s]
    if (bar_arr[i] == null) break
    x = tx[i * 2]
    x2 = tx[i * 2 + 1]
    y = 310 - bar_arr[i]
    ctx.lineTo(x, y)
    ctx.lineTo(x2, y)
  }
  ctx.lineTo(x2, 310)
  ctx.lineTo(0, 310)
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.lineWidth = 1
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'black'
  ctx.stroke()
  ctx.closePath()
}

export function drawVertLines(ctx, divs) {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineWidth = 1
  ctx.strokeStyle = 'black'

  for (let s = 0; s < divs.length; s++) {
    const x = divs[s]
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 310)
    ctx.stroke()
  }
  ctx.stroke()
  ctx.closePath()
}

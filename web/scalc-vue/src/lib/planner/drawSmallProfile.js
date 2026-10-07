/** Dive profile canvas (ported from planner.js drawSmallProfile). */

export function getProfilePointText(dp, xMouse, pw, ph) {
  if (!dp?.profileSampled?.length) return ['', 0]
  const prof = dp.profileSampled
  const profLastIndex = prof.length - 1
  const totalTime = prof[profLastIndex].time
  const maxDepth = dp.bottomDepth
  if (xMouse > pw) return ['', 0]
  const mouseTime = (xMouse * totalTime) / pw
  let pointIdx = 0
  for (; pointIdx < prof.length; pointIdx++) {
    if (prof[pointIdx].time >= mouseTime) break
  }
  const mousePoint = prof[pointIdx]
  const pointTxt = `${mousePoint.depth.toFixed(0)} m, ${mouseTime.toFixed(0)} min`
  const depthY = (mousePoint.depth / maxDepth) * ph
  return [pointTxt, depthY]
}

export function drawSmallProfile(c, dp) {
  if (!c || !dp?.profileSampled?.length) return
  let ctx
  try {
    ctx = c.getContext('2d')
  } catch {
    return
  }
  if (!ctx) return

  const pw = c.width - 50
  const ph = c.height - 15
  const prof = dp.profileSampled
  const profLastIndex = prof.length - 1
  const totalTime = prof[profLastIndex].time
  const maxDepth = dp.bottomDepth

  ctx.clearRect(0, 0, c.width, c.height)
  ctx.beginPath()
  ctx.moveTo(0, 0)

  for (let i = 0; i < prof.length; i++) {
    const point = prof[i]
    const x = (point.time / totalTime) * pw
    const y = (point.depth / maxDepth) * ph
    ctx.lineTo(x, y)
  }
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.lineWidth = 1
  const grd = ctx.createLinearGradient(0, 0, 0, ph)
  grd.addColorStop(0, 'lightBlue')
  grd.addColorStop(1, 'darkBlue')
  ctx.fillStyle = grd
  ctx.fill()
  ctx.strokeStyle = 'blue'
  ctx.stroke()
  ctx.closePath()

  ctx.beginPath()
  ctx.lineTo(0, 0)
  ctx.globalAlpha = 0.6
  for (let i = 0; i < prof.length; i++) {
    const point = prof[i]
    const x = (point.time / totalTime) * pw
    const y = (point.ceiling / maxDepth) * ph
    ctx.lineTo(x, y)
  }
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.lineWidth = 1
  const grd2 = ctx.createLinearGradient(0, 0, 0, ph)
  grd2.addColorStop(0, 'lightGreen')
  grd2.addColorStop(1, 'Green')
  ctx.fillStyle = grd2
  ctx.fill()
  ctx.strokeStyle = 'darkGreen'
  ctx.stroke()
  ctx.closePath()
  ctx.globalAlpha = 0.9

  for (let tt = 0; tt < totalTime; tt += 1) {
    const x = (tt / totalTime) * pw
    ctx.beginPath()
    ctx.moveTo(x, ph)
    ctx.lineTo(x, ph + 5)
    ctx.strokeStyle = 'black'
    ctx.stroke()
  }
  for (let tt = 5; tt < totalTime; tt += 5) {
    const x = (tt / totalTime) * pw
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, ph - 1)
    ctx.strokeStyle = 'Grey'
    ctx.stroke()
    ctx.font = '8pt Arial'
    ctx.fillStyle = 'black'
    ctx.fillText(`${tt}`, x - 5, ph + 14)
  }

  for (let dd = 0; dd < maxDepth; dd += 5) {
    const y = (dd / maxDepth) * ph
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(pw, y)
    ctx.strokeStyle = 'Green'
    ctx.stroke()
    ctx.font = '8pt Arial'
    ctx.fillStyle = 'blue'
    ctx.fillText(`${dd} m`, pw + 1, y + 5)
  }
  ctx.stroke()

  let previousTank = null
  let lastPressure = null
  ctx.strokeStyle = 'Orange'
  ctx.fillStyle = 'red'
  ctx.font = '9pt Arial'
  let x1 = 0
  let y1 = (1.0 - prof[0].tankPressure / 300.0) * ph
  ctx.beginPath()
  for (let i = 0; i < prof.length; i++) {
    const point = prof[i]
    const thisTank = point.tank
    const x = (point.time / totalTime) * pw
    const y = (1.0 - point.tankPressure / 300.0) * ph
    if (thisTank != previousTank) {
      if (lastPressure) {
        ctx.fillText(`${lastPressure.toFixed(0)} bar`, x - 5, y1)
        ctx.fillText(`${previousTank.name}> ${thisTank.name}`, x - 5, y1 + 10)
        ctx.beginPath()
        ctx.moveTo(x1, y1 + 5)
        ctx.lineTo(x1, y - 5)
        ctx.lineWidth = 4
        ctx.strokeStyle = 'red'
        ctx.stroke()
      }
      ctx.fillText(`${point.tankPressure.toFixed(0)} bar`, x + 5, y)
      y1 = y
    }
    ctx.strokeStyle = 'Orange'
    ctx.lineWidth = 1
    ctx.moveTo(x1, y1)
    ctx.lineTo(x, y)
    ctx.stroke()
    x1 = x
    y1 = y
    previousTank = thisTank
    lastPressure = point.tankPressure
  }
  ctx.closePath()
  ctx.fillText(`${lastPressure.toFixed(0)}`, x1 - 20, y1 - 10)
}

export function drawProfileMouseOverlay(ctxTXT, dp, x, y) {
  if (!ctxTXT || !dp) return
  const pw = ctxTXT.canvas.width - 50
  const ph = ctxTXT.canvas.height - 15
  const [pointTxt, depthY] = getProfilePointText(dp, x, pw, ph)
  ctxTXT.clearRect(0, 0, ctxTXT.canvas.width, ctxTXT.canvas.height)
  ctxTXT.beginPath()
  ctxTXT.font = '8pt Arial'
  ctxTXT.fillStyle = 'black'
  ctxTXT.strokeStyle = 'black'
  ctxTXT.lineWidth = 1
  ctxTXT.fillText(pointTxt, x + 2, y)
  ctxTXT.moveTo(x, 0)
  ctxTXT.lineTo(x, ctxTXT.canvas.height)
  ctxTXT.closePath()
  ctxTXT.moveTo(0, depthY)
  ctxTXT.lineTo(ctxTXT.canvas.width, depthY)
  ctxTXT.stroke()
  ctxTXT.closePath()
}

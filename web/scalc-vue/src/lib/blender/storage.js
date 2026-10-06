/** Storage tank and compressor readout text (same branches as vanilla blender.js). */

export function computeO2Storage(result, liters, o2_storage_liters, o2_storage_start, o2_storage_rate) {
  const add_o2 = result.add_o2
  const add_o2_liters = liters * add_o2
  const usage_bars = add_o2_liters / o2_storage_liters
  const end_bars = o2_storage_start - usage_bars
  const time = add_o2 / o2_storage_rate
  let use = ''
  let need = '0'
  let timeTxt = ''

  switch (result.filltype_in) {
    case 'pp':
      use =
        `decanting to ${liters} liter tank ` +
        `from ${result.tbar_2.toFixed(1)}` +
        ` to ${result.tbar_3.toFixed(1)} bar`
      need = (result.tbar_2 + usage_bars).toFixed(1)
      timeTxt = time.toFixed(1)
      break
    case 'air':
      use = 'not used'
      need = 'none'
      timeTxt = 'N/A'
      break
    case 'nx':
    case 'tmx':
    case 'cfm':
      use = 'continuous flow mix to compressor'
      need = usage_bars.toFixed(1)
      timeTxt = 'N/A'
      break
  }

  return {
    use,
    need,
    time: timeTxt,
    used: usage_bars.toFixed(1),
    end: end_bars.toFixed(1),
  }
}

export function computeHeStorage(result, liters, He_storage_liters, He_storage_start, He_storage_rate) {
  const add_He = result.add_he
  const add_He_liters = liters * add_He
  const usage_bars = add_He_liters / He_storage_liters
  const end_bars = He_storage_start - usage_bars
  const time = add_He / He_storage_rate
  let use = ''
  let need = '0'
  let timeTxt = ''

  if ((result.filltype_in == 'pp' || result.filltype_in == 'cfm') && usage_bars > 0) {
    use =
      `decanting to ${liters} liter tank ` +
      `from ${result.start_bar_in.toFixed(1)}` +
      ` to ${result.tbar_2.toFixed(1)} bar`
    need = (result.start_bar_in + usage_bars).toFixed(1)
    timeTxt = time.toFixed(1)
  } else if (result.filltype_in == 'air' || usage_bars == 0) {
    use = 'not used'
    need = 'none'
    timeTxt = 'N/A'
  } else if (result.filltype_in == 'tmx') {
    use = 'continuous flow mix to compressor'
    need = usage_bars.toFixed(1)
    timeTxt = 'N/A'
  }

  return {
    use,
    need,
    time: timeTxt,
    used: usage_bars.toFixed(1),
    end: end_bars.toFixed(1),
  }
}

export function computeCompressor(result, liters, rate) {
  let delta
  let filled_liters
  let compressor_o2 = '0'
  let compressor_he = '0'

  if (result.filltype_in == 'air' || result.filltype_in == 'pp') {
    delta = result.add_air
    filled_liters = liters * delta
    compressor_o2 = 'n/a'
    compressor_he = 'n/a'
  } else if (result.filltype_in == 'nx' || result.filltype_in == 'cfm') {
    delta = result.add_nitrox
    filled_liters = liters * delta
    const flow_o2 = rate * ((result.nitrox_pct - 21) / 100)
    compressor_o2 = flow_o2.toFixed(0)
    compressor_he = 'n/a'
  } else if (result.filltype_in == 'tmx') {
    delta = result.add_tmx
    filled_liters = liters * delta
    const flow_o2 = rate * (result.tmx_preo2_pct / 100)
    const flow_he = rate * (result.tmx_he_pct / 100)
    compressor_o2 = flow_o2.toFixed(0)
    compressor_he = flow_he.toFixed(0)
  }

  const time = filled_liters / rate

  return {
    o2: compressor_o2,
    he: compressor_he,
    delta: delta.toFixed(0),
    tankLiters: liters.toFixed(0),
    time: time.toFixed(1),
  }
}

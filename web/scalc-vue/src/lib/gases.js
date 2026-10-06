/** Standard mixes for blender dropdowns (includes hypoxic TMX). */
export const blenderStartGases = [
  { value: '21/0', label: 'air' },
  { value: '28/0', label: 'EAN 28%' },
  { value: '32/0', label: 'EAN 32%' },
  { value: '30/30', label: 'TMX 30/30' },
  { value: '21/35', label: 'TMX 21/35' },
  { value: '18/45', label: 'TMX 18/45' },
  { value: '15/55', label: 'TMX 15/55' },
  { value: '12/65', label: 'TMX 12/65' },
  { value: '10/70', label: 'TMX 10/70' },
  { value: '50/0', label: 'EAN 50%' },
  { value: '100/0', label: 'EAN 100%' },
]

export const blenderWantedGases = [
  { value: '21/0', label: 'air' },
  { value: '28/0', label: 'EAN 28%' },
  { value: '32/0', label: 'EAN 32%' },
  { value: '30/30', label: 'TMX 30/30' },
  { value: '21/35', label: 'TMX 21/35' },
  { value: '18/45', label: 'TMX 18/45' },
  { value: '15/55', label: 'TMX 15/55' },
  { value: '12/65', label: 'TMX 12/65' },
  { value: '10/70', label: 'TMX 10/70' },
  { value: '50/0', label: 'EAN 50%' },
  { value: '100/0', label: 'Oxygen' },
]

export const blenderFillMethods = [
  { value: 'air', label: 'plain air fill' },
  { value: 'nx', label: 'Nitrox CFM' },
  { value: 'tmx', label: 'Trimix CFM' },
  { value: 'pp', label: 'Partial Pressure' },
  { value: 'cfm', label: 'Helium + Nitrox CFM' },
  { value: 'top', label: 'He + O2 + topoff gas', disabled: true },
]

export const blenderAlgorithms = [
  { value: 'IDG', label: 'ideal gas law' },
  { value: 'VdW1', label: 'Van Der Waals law, simple' },
  { value: 'VdW2', label: 'Van Der Waals law, temperatures' },
]

export const blenderEndPressures = ['200', '232', '300']

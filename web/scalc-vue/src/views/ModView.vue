<script setup>
import { computed, ref, watch } from 'vue'
import { calculateMod } from '@/lib/mod.js'

const o2Pct = ref(21)
const ppo2 = ref(1.4)
const gasPreset = ref('21')
const ppPreset = ref('1.4')

const modResult = computed(() => {
  const mod = calculateMod(Number(o2Pct.value), Number(ppo2.value))
  return Number.isFinite(mod) ? mod.toFixed(1) : ''
})

watch(gasPreset, (value) => {
  const next = Number(value)
  if (Number.isFinite(next)) o2Pct.value = next
})

watch(ppPreset, (value) => {
  const next = Number(value)
  if (Number.isFinite(next)) ppo2.value = next
})

function resetSelect(which) {
  if (which === 'gas') gasPreset.value = ''
  if (which === 'pp') ppPreset.value = ''
}
</script>


<template>
  <article class="tool-page">
    <h1>Calculate MOD</h1>
    <p>
      This form calculates
      <a href="https://en.wikipedia.org/wiki/Maximum_operating_depth" target="_blank">Maximum Operating Depth</a>
      for a breathing gas, given the Oxygen percentage and maximum ppo2.
    </p>
    <table class="t1">
      <tbody>
      <tr>
        <td>Standard gas:</td>
        <td>
          <select
            v-model="gasPreset"
            name="ddl"
            class="ddl"
            aria-label="Standard gas"
            @mousedown="resetSelect('gas')"
          >
            <option value="21">air</option>
            <option value="32">Nitrox 32%</option>
            <option value="50">Nitrox 50%</option>
            <option value="100">Oxygen 100%</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>Oxygen (%)</td>
        <td>
          <input
            v-model.number="o2Pct"
            type="number"
            min="10"
            max="100"
            class="input"
            aria-label="Oxygen percent"
          />
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <input
            v-model.number="o2Pct"
            type="range"
            name="o2range"
            class="slider"
            min="10"
            max="100"
            aria-label="Oxygen percent slider"
          />
        </td>
      </tr>
      <tr>
        <td>use case</td>
        <td>
          <select
            v-model="ppPreset"
            name="ddl_pp"
            class="ddl"
            aria-label="ppO2 use case"
            @mousedown="resetSelect('pp')"
          >
            <option value="1.4">bottom gas 1.4</option>
            <option value="1.6">deco gas 1.6</option>
            <option value="1.2">extended use 1.2</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>ppO2 (bar/ATA)</td>
        <td>
          <input
            v-model.number="ppo2"
            type="number"
            min="1.0"
            max="2.0"
            step="0.1"
            class="input"
            aria-label="ppO2"
          />
        </td>
      </tr>
      <tr>
        <td>MOD result is</td>
        <td>
          <b><span>{{ modResult }}</span></b>
        </td>
      </tr>
      </tbody>
    </table>
  </article>
</template>

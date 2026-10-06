<script setup>
import { toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useBlender } from '@/composables/useBlender.js'

const { tankLiters, o2Price, hePrice, cPrice, costOutput } = toRefs(useBlender())
const router = useRouter()
</script>

<template>
  <div>
    <h2>Cost calculation of the gas fill</h2>
    <button type="button" @click="router.push('/blender')">BACK to main</button>
    <button type="button" @click="router.push('/blender/sources')">gas sources</button>
    <table class="t1">
      <tbody>
        <tr>
          <td>tank size (liters)</td>
          <td>
            <input
              v-model="tankLiters"
              type="number"
              min="1"
              max="50"
              step="1"
              class="in_cost"
              aria-label="Tank size"
            />
          </td>
        </tr>
        <tr>
          <td>Oxygen price (EUR/m<sup>3</sup>)</td>
          <td>
            <input
              v-model="o2Price"
              type="number"
              min="1"
              max="50"
              step="0.1"
              class="in_cost"
              aria-label="Oxygen price"
            />
          </td>
        </tr>
        <tr>
          <td>Helium price (EUR/m<sup>3</sup></td>
          <td>
            <input
              v-model="hePrice"
              type="number"
              min="10"
              max="200"
              step="0.1"
              class="in_cost"
              aria-label="Helium price"
            />
          </td>
        </tr>
        <tr>
          <td>compressor run (€)</td>
          <td>
            <input
              v-model="cPrice"
              type="number"
              min="1"
              max="50"
              step="1"
              class="in_cost"
              aria-label="Compressor price"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <textarea
      :value="costOutput"
      name="cost_output"
      cols="80"
      rows="10"
      readonly
      aria-label="Cost of fill"
    ></textarea>
  </div>
</template>

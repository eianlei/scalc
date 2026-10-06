<script setup>
import { toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useBlender } from '@/composables/useBlender.js'
import {
  blenderAlgorithms,
  blenderEndPressures,
  blenderFillMethods,
  blenderStartGases,
  blenderWantedGases,
} from '@/lib/gases.js'

const blender = useBlender()
const {
  filltype,
  algorithm,
  startGas,
  wantedGas,
  endBarPreset,
  startBar,
  startO2,
  startHe,
  endBar,
  endO2,
  endHe,
  tempStart,
  tempHe,
  tempO2,
  tempAir,
  tempFinal,
  tempUse,
  textOutput,
} = toRefs(blender)
const { emptyTank } = blender
const router = useRouter()
</script>

<template>
  <div>
    <p>Calculate gas blending instructions by changing any input control. The new instruction will print automatically.</p>
    <div class="wrap-flex">
      <p><b>Blending method selection: </b></p>
      <select
        v-model="filltype"
        class="ddl"
        aria-label="Blending method"
        @mousedown="filltype = ''"
      >
        <option
          v-for="method in blenderFillMethods"
          :key="method.value"
          :value="method.value"
          :disabled="method.disabled"
        >
          {{ method.label }}
        </option>
      </select>
    </div>
    <span>algorithm: </span>
    <select
      v-model="algorithm"
      class="ddl"
      aria-label="Algorithm"
      @mousedown="algorithm = ''"
    >
      <option v-for="algo in blenderAlgorithms" :key="algo.value" :value="algo.value">
        {{ algo.label }}
      </option>
    </select>

    <div>
      <button type="button" @click="router.push('/blender/cost')">Cost of this fill</button>
      <button type="button" @click="router.push('/blender/sources')">Gas Sources</button>
    </div>

    <div class="left_right">
      <div class="child">
        <b>Current and wanted mixes</b>
        <table class="t1">
          <tbody>
            <tr>
              <td><b>Current tank mix</b></td>
              <td>
                <select
                  v-model="startGas"
                  class="ddl"
                  aria-label="Current tank mix"
                  @mousedown="startGas = ''"
                >
                  <option v-for="gas in blenderStartGases" :key="gas.value" :value="gas.value">
                    {{ gas.label }}
                  </option>
                </select>
              </td>
            </tr>
            <tr>
              <td>Current tank pressure (bar)</td>
              <td>
                <input
                  v-model="startBar"
                  type="number"
                  min="1"
                  max="300"
                  step="1"
                  class="input2"
                  aria-label="Current tank pressure"
                />
              </td>
              <td><button type="button" @click="emptyTank()">EMPTY</button></td>
            </tr>
            <tr>
              <td>Current Oxygen (%)</td>
              <td>
                <input
                  v-model="startO2"
                  type="number"
                  min="10"
                  max="100"
                  step="1"
                  class="input2"
                  aria-label="Current Oxygen"
                />
              </td>
            </tr>
            <tr>
              <td>Current Helium (%)</td>
              <td>
                <input
                  v-model="startHe"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="input2"
                  aria-label="Current Helium"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
        <table class="t1">
          <tbody>
            <tr>
              <td><b>Wanted tank mix</b></td>
              <td>
                <select
                  v-model="wantedGas"
                  class="ddl"
                  aria-label="Wanted tank mix"
                  @mousedown="wantedGas = ''"
                >
                  <option v-for="gas in blenderWantedGases" :key="gas.value" :value="gas.value">
                    {{ gas.label }}
                  </option>
                </select>
              </td>
            </tr>
            <tr>
              <td>Wanted tank pressure (bar)</td>
              <td>
                <input
                  v-model="endBar"
                  type="number"
                  min="1"
                  max="300"
                  step="1"
                  class="input2"
                  aria-label="Wanted tank pressure"
                />
              </td>
              <td>
                <select
                  v-model="endBarPreset"
                  class="ddl"
                  aria-label="Wanted pressure preset"
                  @mousedown="endBarPreset = ''"
                >
                  <option v-for="bar in blenderEndPressures" :key="bar" :value="bar">{{ bar }}</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>Wanted Oxygen (%)</td>
              <td>
                <input
                  v-model="endO2"
                  type="number"
                  min="10"
                  max="100"
                  step="1"
                  class="input2"
                  aria-label="Wanted Oxygen"
                />
              </td>
            </tr>
            <tr>
              <td>Wanted Helium (%)</td>
              <td>
                <input
                  v-model="endHe"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="input2"
                  aria-label="Wanted Helium"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="child">
        <b>Gas temperatures in Celcius</b>
        <table class="t1">
          <tbody>
            <tr>
              <td>at start</td>
              <td>
                <input v-model="tempStart" type="number" min="1" max="50" step="1" class="input2" />
              </td>
            </tr>
            <tr>
              <td>after Helium fill</td>
              <td>
                <input v-model="tempHe" type="number" min="1" max="90" step="1" class="input2" />
              </td>
            </tr>
            <tr>
              <td>after Oxygen fill</td>
              <td>
                <input v-model="tempO2" type="number" min="1" max="90" step="1" class="input2" />
              </td>
            </tr>
            <tr>
              <td>after compressor fill</td>
              <td>
                <input v-model="tempAir" type="number" min="1" max="90" step="1" class="input2" />
              </td>
            </tr>
            <tr>
              <td>WANTED<br />after cooling down</td>
              <td>
                <input v-model="tempFinal" type="number" min="1" max="50" step="1" class="input2" />
              </td>
            </tr>
            <tr>
              <td>begin of dive</td>
              <td>
                <input v-model="tempUse" type="number" min="1" max="50" step="1" class="input2" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <textarea
      :value="textOutput"
      name="text_output"
      cols="80"
      rows="10"
      readonly
      aria-label="Blend instructions"
    ></textarea>
  </div>
</template>

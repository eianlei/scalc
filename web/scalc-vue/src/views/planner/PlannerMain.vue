<script setup>
import { ref, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanner } from '@/composables/usePlanner.js'
import PlannerHelpPanel from '@/components/planner/PlannerHelpPanel.vue'
import ProfileCanvas from '@/components/planner/ProfileCanvas.vue'
import { plannerBottomGases, plannerGfPresets } from '@/lib/gases.js'

const showHelp = ref(false)

const planner = usePlanner()
const {
  diveDepth,
  diveBottomTime,
  gfLow,
  gfHigh,
  gfPreset,
  bottomGas,
  bottomO2,
  bottomHe,
  bottomBar,
  bottomLiters,
  bottomSac,
  deco1Use,
  deco1O2,
  deco1He,
  deco1Bar,
  deco1Liters,
  deco1Switch,
  deco1Sac,
  deco2Use,
  deco2O2,
  deco2He,
  deco2Bar,
  deco2Liters,
  deco2Switch,
  deco2Sac,
  descSteps,
  bottomSteps,
  textOutput,
  showHowto,
} = toRefs(planner)
const { runPlan, toggleHowto } = planner
const router = useRouter()
</script>

<template>
  <div class="planner-split" :class="{ 'planner-split--help': showHelp }">
    <div id="main" class="planner-split-main">
    <h1>Dive Planner Prototype (not suitable for real dives)</h1>
    <p>
      This form calculates a dive plan for a simple profile using the
      <a href="https://en.wikipedia.org/wiki/B%C3%BChlmann_decompression_algorithm" target="_blank"
        >Bühlmann algorithm</a
      >
      ZHL-16C with configurable
      <a href="https://diverite.com/gradient-factors/" target="_blank"
        >gradient factors</a
      >.
    </p>
    <p>
      This is an experimental implementation for educational use only.
      <b>Do not use for planning real dives!</b>
    </p>
    <h2>Dive bottom time and depth, Gradient Factors</h2>
    <table class="t1">
      <tbody>
        <tr>
          <td>depth (m)</td>
          <td title="bottom depth of dive in meters">
            <input
              v-model="diveDepth"
              type="number"
              min="6"
              max="70"
              class="input3"
              aria-label="Dive depth"
            />
          </td>
          <td>time (min)</td>
          <td title="bottom time in minutes">
            <input
              v-model="diveBottomTime"
              type="number"
              min="6"
              max="100"
              class="input3"
              aria-label="Bottom time"
            />
          </td>
          <td>
            <div class="popup">
              <button type="button" @click="toggleHowto()">How to use?</button>
              <span class="popuptext" :class="{ show: showHowto }">
                Use the input controls to configure the dive. Anytime you change a value, a new dive plan
                is calculated.
              </span>
            </div>
          </td>
        </tr>
        <tr>
          <td>GF low (%)</td>
          <td title="Gradient Factor LOW">
            <input v-model="gfLow" type="number" min="6" max="100" class="input3" aria-label="GF low" />
          </td>
          <td>GF high (%)</td>
          <td title="Gradient Factor HIGH">
            <input v-model="gfHigh" type="number" min="6" max="100" class="input3" aria-label="GF high" />
          </td>
          <td title="common GF settings">
            <select
              v-model="gfPreset"
              class="ddl"
              aria-label="GF preset"
              @mousedown="gfPreset = ''"
            >
              <option v-for="gf in plannerGfPresets" :key="gf.value" :value="gf.value">
                {{ gf.label }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
    <h3>Specify your tanks and gases for the dive</h3>
    <table class="t1">
      <thead>
        <tr>
          <th title="configure the tanks/gases for the dive">tank</th>
          <th title="select which deco tanks to use or not">used</th>
          <th>O2%</th>
          <th>He%</th>
          <th>start bar</th>
          <th>liters</th>
          <th>switch (m)</th>
          <th>SAC (l/min)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td title="bottom gas">bottom</td>
          <td title="select a standard gas from dropdown list">
            <select
              v-model="bottomGas"
              class="ddl"
              aria-label="Bottom gas"
              @mousedown="bottomGas = ''"
            >
              <option v-for="gas in plannerBottomGases" :key="gas.value" :value="gas.value">
                {{ gas.label }}
              </option>
            </select>
          </td>
          <td title="bottom tank Oxygen %">
            <input v-model="bottomO2" type="number" min="18" max="100" class="input3" />
          </td>
          <td title="bottom tank Helium %">
            <input v-model="bottomHe" type="number" min="0" max="45" class="input3" />
          </td>
          <td title="bottom tank pressure at start">
            <input v-model="bottomBar" type="number" min="100" max="300" class="input3" />
          </td>
          <td title="bottom tank size in liters">
            <input v-model="bottomLiters" type="number" min="7" max="36" class="input3" />
          </td>
          <td>-</td>
          <td title="Surface Air Consumption in surface liters per minute">
            <input v-model="bottomSac" type="number" min="5" max="50" class="input3" />
          </td>
        </tr>
        <tr>
          <td title="1st deco tank to deploy on ascent">deco 1</td>
          <td title="check to enable this tank">
            <input v-model="deco1Use" type="checkbox" class="input3" aria-label="Use deco 1" />
          </td>
          <td><input v-model="deco1O2" type="number" min="18" max="100" class="input3" /></td>
          <td><input v-model="deco1He" type="number" min="0" max="45" class="input3" /></td>
          <td><input v-model="deco1Bar" type="number" min="100" max="300" class="input3" /></td>
          <td><input v-model="deco1Liters" type="number" min="7" max="36" class="input3" /></td>
          <td title="depth where tank change is done">
            <input v-model="deco1Switch" type="number" min="0" max="90" class="input3" />
          </td>
          <td><input v-model="deco1Sac" type="number" min="5" max="50" class="input3" /></td>
        </tr>
        <tr>
          <td title="2nd deco tank to deploy on ascent">deco 2</td>
          <td>
            <input v-model="deco2Use" type="checkbox" class="input3" aria-label="Use deco 2" />
          </td>
          <td><input v-model="deco2O2" type="number" min="18" max="100" class="input3" /></td>
          <td><input v-model="deco2He" type="number" min="0" max="45" class="input3" /></td>
          <td><input v-model="deco2Bar" type="number" min="100" max="300" class="input3" /></td>
          <td><input v-model="deco2Liters" type="number" min="7" max="36" class="input3" /></td>
          <td title="depth where tank change is done">
            <input v-model="deco2Switch" type="number" min="0" max="90" class="input3" />
          </td>
          <td><input v-model="deco2Sac" type="number" min="5" max="50" class="input3" /></td>
        </tr>
      </tbody>
    </table>
    <div id="configure_planner">
      <span>descend steps: </span>
      <input v-model="descSteps" type="number" min="1" max="10" class="input3" />
      <span>bottom steps: </span>
      <input v-model="bottomSteps" type="number" min="2" max="20" class="input3" />
    </div>
    <div class="planner-actions">
      <button
        type="button"
        class="planner-action-btn"
        title="click to force calculation"
        @click="runPlan()"
      >
        calculate
      </button>
      <button
        type="button"
        class="planner-action-btn"
        title="click to show tabular output of the calculation"
        @click="router.push('/planner/table')"
      >
        table
      </button>
      <button
        type="button"
        class="planner-action-btn"
        title="Show planner help documentation"
        @click="showHelp = true"
      >
        HELP
      </button>
    </div>
    <h3>Dive profile plan</h3>
    <ProfileCanvas />

    <h3>Deco planner results</h3>
    <div>
      <textarea
        :value="textOutput"
        name="planner_textout"
        cols="80"
        rows="30"
        readonly
        aria-label="Planner text output"
      ></textarea>
    </div>
    </div>
    <PlannerHelpPanel v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

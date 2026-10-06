<script setup>
import { useRouter } from 'vue-router'
import { usePlanner } from '@/composables/usePlanner.js'
import { downloadPlannerCsv } from '@/lib/planner/exportCsv.js'

const planner = usePlanner()
const router = useRouter()

function saveCsv() {
  if (planner.diveplan?.profileSampled) {
    downloadPlannerCsv(planner.diveplan.profileSampled)
  }
}
</script>

<template>
  <div id="table_panel">
    <h1>Dive planner: table output</h1>
    <button type="button" @click="router.push('/planner')">BACK</button>
    <button type="button" id="table_save2csv" @click="saveCsv">SAVE CSV</button>
    <table class="pTable">
      <thead>
        <tr>
          <th title="iteration index">idx</th>
          <th title="runtime in minutes">min</th>
          <th title="dive depth in meters">m</th>
          <th title="dive phase">phase</th>
          <th title="tank name">T</th>
          <th title="Oxygen/Helium %">O2/He</th>
          <th title="tank pressure in bar">bar</th>
          <th title="partial pressure of Oxygen">ppO2</th>
          <th title="Gradient Factor % at this depth">GF</th>
          <th title="Ceiling in 3 meter step">C3m</th>
          <th title="ceiling in meters">Ceil</th>
          <th title="margin from current depth to ceiling in meters">marg</th>
          <th title="leading tissue compartment number">lead</th>
          <th v-for="tc in 16" :key="tc" :title="`tissue compartment #${tc - 1} ceiling in meters`">
            TC{{ tc - 1 }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(point, i) in planner.profileRows" :key="i">
          <td>{{ i }}</td>
          <td>{{ point.time.toFixed(1) }}</td>
          <td>{{ point.depth.toFixed(1) }}</td>
          <td>{{ point.divephase }}</td>
          <td>{{ point.tank.name }}</td>
          <td>{{ point.tank.o2 }}/{{ point.tank.he }}</td>
          <td>{{ point.tankPressure.toFixed(0) }}</td>
          <td>{{ point.ppOxygen.toFixed(2) }}</td>
          <td>{{ point.gfNow.toFixed(2) }}</td>
          <td>{{ point.ceiling3m.toFixed(0) }}</td>
          <td>{{ point.ceiling.toFixed(1) }}</td>
          <td>{{ point.margin.toFixed(1) }}</td>
          <td>{{ point.leadTC }}</td>
          <td
            v-for="(tcVal, tc) in point.TCm"
            :key="tc"
            :style="tc === point.leadTC ? { backgroundColor: 'red' } : undefined"
          >
            {{ tcVal.toFixed(1) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

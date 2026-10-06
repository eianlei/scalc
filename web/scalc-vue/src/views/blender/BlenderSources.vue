<script setup>
import { toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useBlender } from '@/composables/useBlender.js'

const {
  heStorage,
  o2Storage,
  compressor,
  heStorageLiters,
  heStorageStart,
  heStorageRate,
  o2StorageLiters,
  o2StorageStart,
  o2StorageRate,
  compressorRate,
} = toRefs(useBlender())
const router = useRouter()
</script>

<template>
  <div>
    <h2>gas sources</h2>
    <button type="button" @click="router.push('/blender')">BACK to MAIN</button>
    <button type="button" @click="router.push('/blender/cost')">fill cost</button>
    <h3>O2 and He storage tank usage</h3>
    <table class="t1">
      <thead>
        <tr>
          <th>size <br />(liters)</th>
          <th>start<br />pressure<br />(bars)</th>
          <th>end<br />pressure<br />(bars)</th>
          <th>pressure<br />used<br />(bar)</th>
          <th>pressure<br />needed<br />(bar)</th>
          <th>decanting<br />rate<br />(bar/min)</th>
          <th>decanting<br />time<br />(min)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="2"><b>Helium storage tank </b></td>
          <td colspan="5">
            <span>{{ heStorage.use }}</span>
          </td>
        </tr>
        <tr>
          <td>
            <input v-model="heStorageLiters" type="number" min="1" max="50" step="1" class="He_storage" />
          </td>
          <td>
            <input v-model="heStorageStart" type="number" min="1" max="300" step="1" class="He_storage" />
          </td>
          <td>
            <span>{{ heStorage.end }}</span>
          </td>
          <td>
            <span>{{ heStorage.used }}</span>
          </td>
          <td>
            <span>{{ heStorage.need }}</span>
          </td>
          <td>
            <input v-model="heStorageRate" type="number" min="1" max="10" step="1" class="He_storage" />
          </td>
          <td>
            <span>{{ heStorage.time }}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2"><b>Oxygen storage tank </b></td>
          <td colspan="5">
            <span>{{ o2Storage.use }}</span>
          </td>
        </tr>
        <tr>
          <td>
            <input v-model="o2StorageLiters" type="number" min="1" max="50" step="1" class="o2_storage" />
          </td>
          <td>
            <input v-model="o2StorageStart" type="number" min="1" max="300" step="1" class="o2_storage" />
          </td>
          <td>
            <span>{{ o2Storage.end }}</span>
          </td>
          <td>
            <span>{{ o2Storage.used }}</span>
          </td>
          <td>
            <span>{{ o2Storage.need }}</span>
          </td>
          <td>
            <input v-model="o2StorageRate" type="number" min="1" max="10" step="1" class="o2_storage" />
          </td>
          <td>
            <span>{{ o2Storage.time }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <h3>Compressor operation</h3>
    <table class="t1">
      <thead>
        <tr>
          <th>charging<br />rate<br />(l/min)</th>
          <th>O2<br />flow<br />(l/min)</th>
          <th>He<br />flow<br />(l/min)</th>
          <th>delta<br />pressure<br />(bar)</th>
          <th>filled<br />tank<br />(liters)</th>
          <th>fill<br />time<br />(min)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input
              v-model="compressorRate"
              type="number"
              min="50"
              max="1000"
              step="1"
              class="compressor"
              aria-label="Compressor rate"
            />
          </td>
          <td>
            <span>{{ compressor.o2 }}</span>
          </td>
          <td>
            <span>{{ compressor.he }}</span>
          </td>
          <td>
            <span>{{ compressor.delta }}</span>
          </td>
          <td>
            <span>{{ compressor.tankLiters }}</span>
          </td>
          <td>
            <span>{{ compressor.time }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

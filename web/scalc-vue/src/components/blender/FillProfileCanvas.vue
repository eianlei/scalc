<script setup>
import { onMounted, ref, watch } from 'vue'
import { drawFillProfile } from '@/lib/blender/drawFillProfile.js'

const props = defineProps({
  result: { type: Object, default: null },
})

const canvas = ref(null)
const overlay = ref(null)

function redraw() {
  if (canvas.value) drawFillProfile(canvas.value, overlay.value, props.result)
}

onMounted(redraw)
watch(() => props.result, redraw, { deep: true })
</script>

<template>
  <div class="div_bProf">
    <canvas
      ref="canvas"
      width="600"
      height="310"
      style="border: 1px solid #000000"
      aria-label="Fill profile"
    ></canvas>
    <canvas ref="overlay" width="600" height="310" style="border: 1px solid #000000"></canvas>
  </div>
</template>

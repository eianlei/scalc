<script setup>
import { onMounted, ref, watch } from 'vue'
import { drawProfileMouseOverlay, drawSmallProfile } from '@/lib/planner/drawSmallProfile.js'

const props = defineProps({
  diveplan: { type: Object, default: null },
})

const canvas = ref(null)
const overlay = ref(null)

function redraw() {
  if (canvas.value) drawSmallProfile(canvas.value, props.diveplan)
}

function onMouseMove(event) {
  const cTXT = overlay.value
  if (!cTXT || !props.diveplan) return
  const rect = cTXT.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const ctxTXT = cTXT.getContext('2d')
  drawProfileMouseOverlay(ctxTXT, props.diveplan, x, y)
}

function onMouseLeave() {
  const cTXT = overlay.value
  if (!cTXT) return
  const ctxTXT = cTXT.getContext('2d')
  ctxTXT.clearRect(0, 0, cTXT.width, cTXT.height)
}

onMounted(redraw)
watch(() => props.diveplan, redraw, { deep: true })
</script>

<template>
  <div class="profile2">
    <canvas
      ref="canvas"
      width="600"
      height="200"
      style="border: 1px solid #000000"
      aria-label="Dive profile"
    ></canvas>
    <canvas
      ref="overlay"
      width="600"
      height="200"
      style="border: 1px solid #000000"
      aria-label="Dive profile mouse overlay"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    ></canvas>
  </div>
</template>

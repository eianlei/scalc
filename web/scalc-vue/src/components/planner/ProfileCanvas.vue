<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { plannerKey } from '@/composables/usePlanner.js'
import { drawProfileMouseOverlay, drawSmallProfile } from '@/lib/planner/drawSmallProfile.js'

const MIN_WIDTH = 300
const MIN_HEIGHT = 120

const props = defineProps({
  /** When omitted, uses diveplan from providePlanner() if available. */
  diveplan: { type: Object, default: undefined },
  width: { type: Number, default: 600 },
  height: { type: Number, default: 200 },
  resizable: { type: Boolean, default: true },
})

const planner = inject(plannerKey, null)
const activeDiveplan = computed(() => props.diveplan ?? planner?.diveplan ?? null)

const displayWidth = ref(props.width)
const displayHeight = ref(props.height)

const canvas = ref(null)
const overlay = ref(null)

let resizing = false
let resizeStartX = 0
let resizeStartY = 0
let resizeStartW = 0
let resizeStartH = 0

function redraw() {
  if (canvas.value) drawSmallProfile(canvas.value, activeDiveplan.value)
}

function onMouseMove(event) {
  if (resizing) return
  const cTXT = overlay.value
  const dp = activeDiveplan.value
  if (!cTXT || !dp) return
  const rect = cTXT.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const ctxTXT = cTXT.getContext('2d')
  drawProfileMouseOverlay(ctxTXT, dp, x, y)
}

function onMouseLeave() {
  const cTXT = overlay.value
  if (!cTXT) return
  const ctxTXT = cTXT.getContext('2d')
  ctxTXT.clearRect(0, 0, cTXT.width, cTXT.height)
}

function onResizeMove(event) {
  if (!resizing) return
  displayWidth.value = Math.max(MIN_WIDTH, resizeStartW + event.clientX - resizeStartX)
  displayHeight.value = Math.max(MIN_HEIGHT, resizeStartH + event.clientY - resizeStartY)
}

function onResizeEnd() {
  resizing = false
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function onResizeStart(event) {
  if (!props.resizable) return
  event.preventDefault()
  resizing = true
  resizeStartX = event.clientX
  resizeStartY = event.clientY
  resizeStartW = displayWidth.value
  resizeStartH = displayHeight.value
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = 'nwse-resize'
  document.body.style.userSelect = 'none'
}

onMounted(redraw)
onUnmounted(onResizeEnd)

watch(() => props.width, (w) => {
  displayWidth.value = w
})
watch(() => props.height, (h) => {
  displayHeight.value = h
})
watch(activeDiveplan, redraw, { deep: true })
watch([displayWidth, displayHeight], () => nextTick(redraw))
</script>

<template>
  <div
    class="profile-canvas"
    :style="{ width: `${displayWidth}px`, height: `${displayHeight}px` }"
  >
    <canvas
      ref="canvas"
      :width="displayWidth"
      :height="displayHeight"
      aria-label="Dive profile"
    ></canvas>
    <canvas
      ref="overlay"
      :width="displayWidth"
      :height="displayHeight"
      aria-label="Dive profile mouse overlay"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    ></canvas>
    <div
      v-if="resizable"
      class="resize-handle"
      aria-label="Resize profile"
      title="Drag to resize"
      @mousedown="onResizeStart"
    ></div>
  </div>
</template>

<style scoped>
.profile-canvas {
  position: relative;
}

.profile-canvas canvas {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid #000;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  background:
    linear-gradient(
      135deg,
      transparent 0 40%,
      #666 40% 44%,
      transparent 44% 52%,
      #666 52% 56%,
      transparent 56% 64%,
      #666 64% 68%,
      transparent 68%
    );
}
</style>

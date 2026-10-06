<script setup>
import { provideBlender } from '@/composables/useBlender.js'
import FillProfileCanvas from '@/components/blender/FillProfileCanvas.vue'
import '@/assets/blender.css'

const blender = provideBlender()
</script>

<template>
  <article class="tool-page blender-page">
    <h1>Gas Blender</h1>
    <router-view />
    <FillProfileCanvas :result="blender.result" />
  </article>
</template>

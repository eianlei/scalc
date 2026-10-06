<script setup>
import { providePlanner } from '@/composables/usePlanner.js'
import '@/assets/planner.css'

providePlanner()
</script>

<template>
  <article class="tool-page planner-page">
    <router-view />
  </article>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/about', label: 'ABOUT', match: '/about' },
  { to: '/mod', label: 'MOD', match: '/mod' },
  { to: '/blender', label: 'Blender', match: '/blender' },
  { to: '/planner', label: 'Planner', match: '/planner' },
]

function isActive(match) {
  const path = route.path
  if (match === '/about') {
    return path === '/about' || path === '/'
  }
  return path === match || path.startsWith(`${match}/`)
}
</script>

<template>
  <nav class="app-tabs" aria-label="SCALC tools">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      :class="{ 'tab-active': isActive(tab.match) }"
    >
      {{ tab.label }}
    </router-link>
  </nav>
</template>

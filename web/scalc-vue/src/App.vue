<script setup>
import AppTabs from './components/AppTabs.vue'
</script>

<template>
  <div class="app-shell">
    <AppTabs />
    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>

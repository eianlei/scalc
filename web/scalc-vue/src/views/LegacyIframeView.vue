<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const src = computed(() => `${import.meta.env.BASE_URL}${route.meta.iframe}`)
const title = computed(() => route.meta.title || 'SCALC')
</script>

<template>
  <iframe
    :key="src"
    class="legacy-iframe"
    :src="src"
    :title="title"
    frameborder="0"
  ></iframe>
</template>

<script setup>
import { marked } from 'marked'
import helpMd from '@/assets/planner_help.md?raw'

defineEmits(['close'])

const helpHtml = marked.parse(helpMd)
</script>

<template>
  <aside class="planner-help-panel" aria-label="Planner help">
    <div class="planner-help-header">
      <button type="button" class="planner-help-close" @click="$emit('close')">close</button>
    </div>
    <div class="planner-help-content" v-html="helpHtml"></div>
  </aside>
</template>

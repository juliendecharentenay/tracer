<script setup>
import { inject } from 'vue'

const state = inject('state')
const hoveredPathIndex = inject('hoveredPathIndex')
const selectedPathIndex = inject('selectedPathIndex')
const setHoveredPathIndex = inject('setHoveredPathIndex')
</script>

<template>
  <div class="bg-white rounded shadow p-3 max-w-xs">
    <h3 class="text-sm font-semibold mb-2">Elements</h3>
    <div v-if="state.canvas.svg.paths.length === 0" class="text-xs text-gray-500">
      No paths yet
    </div>
    <ul v-else class="space-y-1">
      <li
        v-for="(path, idx) in state.canvas.svg.paths"
        :key="idx"
        class="text-xs font-mono cursor-pointer"
        :class="{ 'font-bold': hoveredPathIndex === idx || selectedPathIndex === idx }"
        @mouseenter="setHoveredPathIndex(idx)"
        @mouseleave="setHoveredPathIndex(null)"
      >
        <span class="text-gray-600">[{{ idx }}]</span>
        <span>{{ path.type }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { SIZE } from './PointSymbol.js'

const props = defineProps({
  x:      { type: Number, required: true },
  y:      { type: Number, required: true },
  type:   { type: String, required: true },  // 'start/end' | 'control'
  status: { type: String, default: 'default' },  // 'active' | 'default'
})
</script>

<template>
  <rect
    :x="x - SIZE / 2"
    :y="y - SIZE / 2"
    :width="SIZE"
    :height="SIZE"
    :fill="type === 'control' ? 'none' : 'currentColor'"
    :stroke="type === 'control' ? 'currentColor' : 'none'"
    :class="status === 'active' ? 'text-orange-400' : 'text-blue-500'"
    style="pointer-events: all; cursor: crosshair"
  />
</template>

<script setup>
import { reactive, computed, ref, onUnmounted } from 'vue'

const props = defineProps({
  imageWidth:  { type: Number, required: true },
  imageHeight: { type: Number, required: true },
})

const MIN = 10

const rect = reactive({
  x1: 0,
  y1: 0,
  x2: props.imageWidth,
  y2: props.imageHeight,
})

const drag = reactive({ active: false, corner: null })
const svgRef = ref(null)

const svgRect = computed(() => ({
  x:      Math.min(rect.x1, rect.x2),
  y:      Math.min(rect.y1, rect.y2),
  width:  Math.abs(rect.x2 - rect.x1),
  height: Math.abs(rect.y2 - rect.y1),
}))

const handles = computed(() => ({
  tl: { x: rect.x1, y: rect.y1 },
  tr: { x: rect.x2, y: rect.y1 },
  bl: { x: rect.x1, y: rect.y2 },
  br: { x: rect.x2, y: rect.y2 },
}))

function startDrag(corner, event) {
  drag.active = true
  drag.corner = corner
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(event) {
  if (!drag.active) return
  const { left, top } = svgRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(props.imageWidth,  event.clientX - left))
  const y = Math.max(0, Math.min(props.imageHeight, event.clientY - top))

  switch (drag.corner) {
    case 'tl':
      rect.x1 = Math.min(x, rect.x2 - MIN)
      rect.y1 = Math.min(y, rect.y2 - MIN)
      break
    case 'tr':
      rect.x2 = Math.max(x, rect.x1 + MIN)
      rect.y1 = Math.min(y, rect.y2 - MIN)
      break
    case 'bl':
      rect.x1 = Math.min(x, rect.x2 - MIN)
      rect.y2 = Math.max(y, rect.y1 + MIN)
      break
    case 'br':
      rect.x2 = Math.max(x, rect.x1 + MIN)
      rect.y2 = Math.max(y, rect.y1 + MIN)
      break
  }
}

function onDragEnd() {
  drag.active = false
  drag.corner = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
})

defineExpose({ svgRect })
</script>

<template>
  <svg
    ref="svgRef"
    :width="imageWidth"
    :height="imageHeight"
    class="absolute inset-0 fill-gray-200/70"
    style="pointer-events: none"
  >
    <rect :x="0" :y="0" :width="imageWidth" :height="svgRect.y" />
    <rect :x="0" :y="svgRect.y+svgRect.height" :width="imageWidth" :height="imageHeight-svgRect.y-svgRect.height" />
    <rect :x="0" :y="svgRect.y" :width="svgRect.x" :height="svgRect.height" />
    <rect :x="svgRect.x+svgRect.width" :y="svgRect.y" :width="imageWidth-svgRect.x-svgRect.width" :height="svgRect.height" />
    <rect
      data-testid="crop-rect"
      :x="svgRect.x"
      :y="svgRect.y"
      :width="svgRect.width"
      :height="svgRect.height"
      fill="none"
      stroke="white"
      stroke-width="1"
    />
    <rect
      v-for="(pos, corner) in handles"
      :key="corner"
      :data-handle="corner"
      :x="pos.x - 5"
      :y="pos.y - 5"
      width="10"
      height="10"
      fill="white"
      stroke="black"
      stroke-width="1"
      style="pointer-events: all; cursor: crosshair"
      @mousedown.prevent="startDrag(corner, $event)"
    />
  </svg>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useCoordinateMapper } from '@/composables/useCoordinateMapper'
import PointSymbol from './PointSymbol.vue'

defineProps({ src: { type: String, required: true } })

const state              = inject('state')
const innerWidth         = inject('innerWidth')
const innerHeight        = inject('innerHeight')
const isDrawing          = inject('isDrawing')
const beginDraw          = inject('beginDraw')
const cancelDraw         = inject('cancelDraw')
const commitLine         = inject('commitLine')
const drawingStartCoords = inject('drawingStartCoords')

const imgRef = ref(null)
const naturalSize = ref(null)
const cursor = ref(null)

const { mapMouseEvent } = useCoordinateMapper()

function onLoad() {
  naturalSize.value = {
    width:  imgRef.value.naturalWidth,
    height: imgRef.value.naturalHeight,
  }
}

const displaySize = computed(() => {
  if (!naturalSize.value) return null
  const { width: nw, height: nh } = naturalSize.value
  const scale = Math.min(
    (innerWidth.value  * 0.8) / nw,
    (innerHeight.value * 0.8) / nh,
  )
  return {
    width:  Math.round(nw * scale),
    height: Math.round(nh * scale),
  }
})

const viewBox = computed(() => {
  const p = state.canvas.parameters
  if (!p) return undefined
  return `0 0 ${p.width} ${p.height}`
})

const previewD = computed(() => {
  if (!isDrawing.value || !cursor.value || !drawingStartCoords.value) return null
  const [x1, y1] = drawingStartCoords.value
  return `M ${x1} ${y1} L ${cursor.value.x} ${cursor.value.y}`
})

function onMouseMove(evt) {
  cursor.value = mapMouseEvent(evt)
}

function onMouseLeave() {
  cursor.value = null
}

function pathD(path) {
  const [x1, y1] = state.canvas.svg.points[path.points[0]]
  const [x2, y2] = state.canvas.svg.points[path.points[1]]
  return `M ${x1} ${y1} L ${x2} ${y2}`
}

function onPointClick(idx) {
  const [px, py] = state.canvas.svg.points[idx]
  if (isDrawing.value) {
    commitLine(px, py)
  } else {
    beginDraw(px, py)
  }
}

function onPathClick(evt) {
  if (!isDrawing.value) return
  const { x, y } = mapMouseEvent(evt)
  commitLine(x, y)
}

function onBackgroundClick(evt) {
  if (!state.canvas.parameters) return
  const { x, y } = mapMouseEvent(evt)
  if (isDrawing.value) {
    commitLine(x, y)
  } else {
    beginDraw(x, y)
  }
}
</script>

<template>
  <div class="relative inline-block">
    <img
      ref="imgRef"
      :src="src"
      alt="Canvas background"
      class="block"
      :style="displaySize ? { width: displaySize.width + 'px', height: displaySize.height + 'px' } : {}"
      @load="onLoad"
    />
    <svg
      v-if="displaySize"
      id="canvas"
      class="absolute top-0 left-0"
      :width="displaySize.width"
      :height="displaySize.height"
      :viewBox="viewBox"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @click.self="onBackgroundClick"
    >
      <path
        v-for="(p, i) in state.canvas.svg.paths"
        :key="i"
        :d="pathD(p)"
        fill="none"
        stroke="currentColor"
        @click="onPathClick"
      />
      <path
        v-if="previewD"
        :d="previewD"
        fill="none"
        stroke="currentColor"
        stroke-dasharray="4 4"
        pointer-events="none"
      />
      <PointSymbol
        v-for="([px, py], i) in state.canvas.svg.points"
        :key="i"
        :x="px"
        :y="py"
        type="start/end"
        status="default"
        @click.stop="onPointClick(i)"
      />
      <PointSymbol
        v-if="isDrawing && drawingStartCoords"
        :x="drawingStartCoords[0]"
        :y="drawingStartCoords[1]"
        type="start/end"
        status="active"
        @click.stop
      />
    </svg>
    <div
      v-if="cursor"
      class="absolute bottom-1 right-1 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded pointer-events-none select-none"
    >
      {{ cursor.x }}, {{ cursor.y }}
    </div>
  </div>
</template>

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
const canvasCursor       = inject('canvasCursor')
const hoveredPathIndex   = inject('hoveredPathIndex')
const selectedPathIndex  = inject('selectedPathIndex')
const setHoveredPathIndex = inject('setHoveredPathIndex')
const setSelectedPathIndex = inject('setSelectedPathIndex')
const updatePoint          = inject('updatePoint')
const updateControlPoint   = inject('updateControlPoint')
const togglePathType       = inject('togglePathType')

const imgRef = ref(null)
const naturalSize = ref(null)
const draggingPointIdx = ref(null)
const draggingControlPointIdx = ref(null)
const hasDragged = ref(false) // Used to distinguish between click on point to start drawing and click on point to drag it

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
  if (!isDrawing.value || !canvasCursor.value || !drawingStartCoords.value) return null
  const [x1, y1] = drawingStartCoords.value
  return `M ${x1} ${y1} L ${canvasCursor.value.x} ${canvasCursor.value.y}`
})

const selectedPathPointIndices = computed(() => {
  if (selectedPathIndex.value === null) return new Set()
  const path = state.canvas.svg.paths[selectedPathIndex.value]
  return path ? new Set(path.points) : new Set()
})

const selectedPathControlPointIndices = computed(() => {
  if (selectedPathIndex.value === null) return []
  const path = state.canvas.svg.paths[selectedPathIndex.value]
  if (!path || path.type !== 'cubicBezier') return []
  return path.controlPoints
})

function onMouseMove(evt) {
  const coords = mapMouseEvent(evt)
  canvasCursor.value = coords
  if (draggingPointIdx.value !== null) {
    updatePoint(draggingPointIdx.value, coords.x, coords.y)
    hasDragged.value = true
  }
  if (draggingControlPointIdx.value !== null) {
    updateControlPoint(draggingControlPointIdx.value, coords.x, coords.y)
  }
}

function onMouseLeave() {
  canvasCursor.value = null
}

function onMouseUp() {
  draggingPointIdx.value = null
  draggingControlPointIdx.value = null
}

function pathD(path) {
  const [x1, y1] = state.canvas.svg.points[path.points[0]]
  const [x2, y2] = state.canvas.svg.points[path.points[1]]
  if (path.type === 'cubicBezier') {
    const [cx1, cy1] = state.canvas.svg.controlPoints[path.controlPoints[0]]
    const [cx2, cy2] = state.canvas.svg.controlPoints[path.controlPoints[1]]
    return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`
  } else if (path.type === 'line') {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  } else {
    throw new Error(`path type ${path.type} is not supported`);
  }
}

function onPathDblClick(pathIdx) {
  if (isDrawing.value) return
  togglePathType(pathIdx)
}

function onControlPointMouseDown(cpIdx, evt) {
  draggingControlPointIdx.value = cpIdx
  evt.stopPropagation()
}

function onPointMouseDown(idx, evt) {
  if (!isDrawing.value && selectedPathPointIndices.value.has(idx)) {
    draggingPointIdx.value = idx
    hasDragged.value = false
    evt.stopPropagation()
  }
}

function onPointClick(idx) {
  if (hasDragged.value) {
    hasDragged.value = false
    return
  }
  const [px, py] = state.canvas.svg.points[idx]
  if (isDrawing.value) {
    commitLine(px, py)
  } else if (selectedPathIndex.value !== null) {
    setSelectedPathIndex(null)
  } else {
    beginDraw(px, py)
  }
}

function onPathClick(pathIdx, evt) {
  if (isDrawing.value) {
    const { x, y } = mapMouseEvent(evt)
    commitLine(x, y)
  } else {
    setSelectedPathIndex(pathIdx)
  }
}

function onBackgroundClick(evt) {
  if (!state.canvas.parameters) return
  const { x, y } = mapMouseEvent(evt)
  if (isDrawing.value) {
    commitLine(x, y)
  } else if (selectedPathIndex.value !== null) {
    setSelectedPathIndex(null)
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
      @mouseup="onMouseUp"
      @click.self="onBackgroundClick"
    >
      <path
        v-for="(p, i) in state.canvas.svg.paths"
        :key="i"
        :d="pathD(p)"
        fill="none"
        :stroke="selectedPathIndex === i ? '#2563eb' : 'currentColor'"
        :stroke-width="selectedPathIndex === i || hoveredPathIndex === i ? 2 : 1"
        @mouseenter="setHoveredPathIndex(i)"
        @mouseleave="setHoveredPathIndex(null)"
        @click="onPathClick(i, $event)"
        @dblclick.stop="onPathDblClick(i)"
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
        @mousedown.stop="onPointMouseDown(i, $event)"
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
      <PointSymbol
        v-for="cpIdx in selectedPathControlPointIndices"
        :key="'cp-' + cpIdx"
        :x="state.canvas.svg.controlPoints[cpIdx][0]"
        :y="state.canvas.svg.controlPoints[cpIdx][1]"
        type="control"
        status="default"
        @mousedown.stop="onControlPointMouseDown(cpIdx, $event)"
      />
    </svg>
  </div>
</template>

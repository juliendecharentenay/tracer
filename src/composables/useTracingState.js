import { ref, computed } from 'vue'

export function useTracingState() {
  const drawingStartCoords = ref(null) // [x, y] | null
  const hoveredPathIndex = ref(null) // number | null
  const selectedPathIndex = ref(null) // number | null
  const isDrawing = computed(() => drawingStartCoords.value !== null)

  function beginDraw(x, y) {
    drawingStartCoords.value = [x, y]
  }

  function cancelDraw() {
    drawingStartCoords.value = null
  }

  function setHoveredPathIndex(idx) {
    hoveredPathIndex.value = idx
  }

  function setSelectedPathIndex(idx) {
    selectedPathIndex.value = idx
  }

  return {
    drawingStartCoords,
    hoveredPathIndex,
    selectedPathIndex,
    isDrawing,
    beginDraw,
    cancelDraw,
    setHoveredPathIndex,
    setSelectedPathIndex,
  }
}

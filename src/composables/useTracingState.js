import { ref, computed } from 'vue'

export function useTracingState() {
  const drawingStartCoords = ref(null) // [x, y] | null
  const isDrawing = computed(() => drawingStartCoords.value !== null)

  function beginDraw(x, y) {
    drawingStartCoords.value = [x, y]
  }

  function cancelDraw() {
    drawingStartCoords.value = null
  }

  return { drawingStartCoords, isDrawing, beginDraw, cancelDraw }
}

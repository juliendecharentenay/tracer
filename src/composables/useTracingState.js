import { ref, computed } from 'vue'

export function useTracingState() {
  const drawingStartIdx = ref(null)
  const isDrawing = computed(() => drawingStartIdx.value !== null)

  function beginDraw(idx) {
    drawingStartIdx.value = idx
  }

  function cancelDraw() {
    drawingStartIdx.value = null
  }

  return { drawingStartIdx, isDrawing, beginDraw, cancelDraw }
}

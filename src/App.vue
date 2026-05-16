<script setup>
import { provide, onMounted, onUnmounted, ref } from 'vue'
import { useAppState } from '@/composables/useAppState'
import { useWindowSize } from '@/composables/useWindowSize'
import { useTracingState } from '@/composables/useTracingState'
import { cropImage } from '@/utils/cropImage'
import ImportButton from '@/components/ImportButton.vue'
import CropOverlay from '@/components/CropOverlay.vue'
import CanvasArea from '@/components/CanvasArea.vue'
import ViewBoxConfig from '@/components/ViewBoxConfig.vue'
import ElementTree from '@/components/ElementTree.vue'
import CursorCoordinates from '@/components/CursorCoordinates.vue'
import CopySvgButton from '@/components/CopySvgButton.vue'

const { state, setImageBase64, setCropResult, setCanvasParameters, addPoint, addPath, updatePoint, removePath } = useAppState()
const { innerWidth, innerHeight, onResize } = useWindowSize()
const { drawingStartCoords, hoveredPathIndex, selectedPathIndex, isDrawing, beginDraw, cancelDraw, setHoveredPathIndex, setSelectedPathIndex } = useTracingState()
const canvasCursor = ref(null)

provide('state', state)
provide('setImageBase64', setImageBase64)
provide('setCropResult', setCropResult)
provide('setCanvasParameters', setCanvasParameters)
provide('innerWidth', innerWidth)
provide('innerHeight', innerHeight)
provide('drawingStartCoords', drawingStartCoords)
provide('isDrawing', isDrawing)
provide('beginDraw', beginDraw)
provide('cancelDraw', cancelDraw)
provide('canvasCursor', canvasCursor)
provide('hoveredPathIndex', hoveredPathIndex)
provide('selectedPathIndex', selectedPathIndex)
provide('setHoveredPathIndex', setHoveredPathIndex)
provide('setSelectedPathIndex', setSelectedPathIndex)
provide('updatePoint', updatePoint)
provide('removePath', removePath)
provide('commitLine', (endX, endY) => {
  const [startX, startY] = drawingStartCoords.value
  const startIdx = addPoint(startX, startY)
  const endIdx   = addPoint(endX, endY)
  addPath('line', startIdx, endIdx)
  cancelDraw()
})

function onKeyDown(evt) {
  if (evt.key === 'Escape') cancelDraw()
  if (evt.key === 'Delete' && selectedPathIndex.value !== null) {
    removePath(selectedPathIndex.value)
    setSelectedPathIndex(null)
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeyDown)
})

const imageRef = ref(null)
const imageDimensions = ref(null)
const cropOverlayRef = ref(null)

function onImageLoad() {
  imageDimensions.value = {
    width:  imageRef.value.naturalWidth,
    height: imageRef.value.naturalHeight,
  }
}

async function onCrop() {
  const rect = cropOverlayRef.value.svgRect
  const cropped = await cropImage(state.image.base64, rect)
  setCropResult(cropped, rect)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <ImportButton v-if="!state.image.base64" />

    <div v-else-if="!state.image.crop" class="relative inline-block">
      <img
        ref="imageRef"
        :src="state.image.base64"
        alt="Imported image"
        class="block"
        @load="onImageLoad"
      />
      <CropOverlay
        v-if="imageDimensions"
        ref="cropOverlayRef"
        :image-width="imageDimensions.width"
        :image-height="imageDimensions.height"
        class="absolute inset-0"
      />
      <button
        class="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow"
        @click="onCrop"
      >
        Crop
      </button>
    </div>

    <div v-else class="relative w-full h-screen flex flex-col items-center">
      <!-- Top-left panel: ElementTree -->
      <ElementTree v-if="state.canvas.parameters" class="fixed top-4 left-4 z-10 max-w-xs max-h-[80vh] overflow-auto" />

      <!-- Top-right panel: Cursor + Copy button -->
      <div v-if="state.canvas.parameters" class="fixed top-4 right-4 z-10 flex flex-col gap-2">
        <CopySvgButton />
        <CursorCoordinates :cursor="canvasCursor" />
      </div>

      <!-- Canvas in center -->
      <CanvasArea :src="state.image.crop.base64" />
      <ViewBoxConfig v-if="!state.canvas.parameters" />
    </div>
  </div>
</template>

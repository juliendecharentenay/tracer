<script setup>
import { provide, ref, onMounted, onUnmounted } from 'vue'
import { useAppState } from '@/composables/useAppState'
import { useWindowSize } from '@/composables/useWindowSize'
import { useTracingState } from '@/composables/useTracingState'
import { cropImage } from '@/utils/cropImage'
import ImportButton from '@/components/ImportButton.vue'
import CropOverlay from '@/components/CropOverlay.vue'
import CanvasArea from '@/components/CanvasArea.vue'
import ViewBoxConfig from '@/components/ViewBoxConfig.vue'

const { state, setImageBase64, setCropResult, setCanvasParameters, addPoint, addPath } = useAppState()
const { innerWidth, innerHeight, onResize } = useWindowSize()
const { drawingStartIdx, isDrawing, beginDraw, cancelDraw } = useTracingState()

provide('state', state)
provide('setImageBase64', setImageBase64)
provide('setCropResult', setCropResult)
provide('setCanvasParameters', setCanvasParameters)
provide('addPoint', addPoint)
provide('innerWidth', innerWidth)
provide('innerHeight', innerHeight)
provide('drawingStartIdx', drawingStartIdx)
provide('isDrawing', isDrawing)
provide('beginDraw', beginDraw)
provide('cancelDraw', cancelDraw)
provide('commitLine', (startIdx, endIdx) => {
  addPath('line', startIdx, endIdx)
  cancelDraw()
})

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

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

    <div v-else class="flex flex-col items-center">
      <CanvasArea :src="state.image.crop.base64" />
      <ViewBoxConfig v-if="!state.canvas.parameters" />
    </div>
  </div>
</template>

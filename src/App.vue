<script setup>
import { provide, ref } from 'vue'
import { useAppState } from '@/composables/useAppState'
import { cropImage } from '@/utils/cropImage'
import ImportButton from '@/components/ImportButton.vue'
import CropOverlay from '@/components/CropOverlay.vue'

const { state, setImageBase64, setCropResult } = useAppState()

provide('state', state)
provide('setImageBase64', setImageBase64)
provide('setCropResult', setCropResult)

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

    <div v-else class="relative inline-block">
      <img
        :src="state.image.crop.base64"
        alt="Cropped image"
        class="block"
      />
    </div>
  </div>
</template>

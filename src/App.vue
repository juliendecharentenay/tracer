<script setup>
import { provide, ref } from 'vue'
import { useAppState } from '@/composables/useAppState'
import ImportButton from '@/components/ImportButton.vue'
import CropOverlay from '@/components/CropOverlay.vue'

const { state, setImageBase64 } = useAppState()

provide('state', state)
provide('setImageBase64', setImageBase64)

const imageRef = ref(null)
const imageDimensions = ref(null)

function onImageLoad() {
  imageDimensions.value = {
    width:  imageRef.value.naturalWidth,
    height: imageRef.value.naturalHeight,
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <ImportButton v-if="!state.image.base64" />
    <div v-else class="relative inline-block">
      <img
        ref="imageRef"
        :src="state.image.base64"
        alt="Imported image"
        class="block"
        @load="onImageLoad"
      />
      <CropOverlay
        v-if="imageDimensions"
        :image-width="imageDimensions.width"
        :image-height="imageDimensions.height"
        class="absolute inset-0"
      />
    </div>
  </div>
</template>

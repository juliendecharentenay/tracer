<script setup>
import { provide } from 'vue'
import { useAppState } from '@/composables/useAppState'
import ImportButton from '@/components/ImportButton.vue'

const { state, setImageBase64 } = useAppState()

provide('state', state)
provide('setImageBase64', setImageBase64)
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <ImportButton v-if="!state.image.base64" />
    <img v-else :src="state.image.base64" alt="Imported image" />
  </div>
</template>

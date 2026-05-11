<script setup>
import { ref, computed, inject } from 'vue'

const state = inject('state')
const setCanvasParameters = inject('setCanvasParameters')

const imageWidth  = computed(() => state.image.rect.width)
const imageHeight = computed(() => state.image.rect.height)

const viewBoxWidth = ref(1000)

const viewBoxHeight = computed(() =>
  Math.round(viewBoxWidth.value * imageHeight.value / imageWidth.value)
)

function sync() {
  setCanvasParameters(viewBoxWidth.value, viewBoxHeight.value)
}
</script>

<template>
  <div class="flex items-center gap-4 mt-4">
    <label class="flex items-center gap-2 font-medium text-sm">
      ViewBox width
      <input
        v-model.number="viewBoxWidth"
        type="number"
        min="1"
        class="w-28 border rounded px-2 py-1 text-sm"
      />
    </label>
    <span class="text-sm text-gray-600">Height: {{ viewBoxHeight }}</span>
    <button
      class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow text-sm"
      @click="sync"
    >
      Approve
    </button>
  </div>
</template>

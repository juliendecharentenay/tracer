<script setup>
import { ref, inject, computed } from 'vue'
import { generateSvgString } from '@/utils/svgGenerator'

const state = inject('state')

const isCopied = ref(false)

const svgString = computed(() => {
  return generateSvgString(state.canvas.parameters, state.canvas.svg)
})

async function copySvg() {
  if (!svgString.value) return

  await navigator.clipboard.writeText(svgString.value)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}
</script>

<template>
  <button
    :disabled="!svgString"
    :class="[
      'px-3 py-2 rounded font-semibold text-sm transition-colors',
      isCopied
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
    ]"
    @click="copySvg"
  >
    {{ isCopied ? '✓ Copied' : 'Copy SVG' }}
  </button>
</template>

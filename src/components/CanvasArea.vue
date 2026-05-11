<script setup>
import { ref, computed, inject } from 'vue'
import { useCoordinateMapper } from '@/composables/useCoordinateMapper'

defineProps({ src: { type: String, required: true } })

const state       = inject('state')
const innerWidth  = inject('innerWidth')
const innerHeight = inject('innerHeight')

const imgRef = ref(null)
const naturalSize = ref(null)
const cursor = ref(null)

const { mapMouseEvent } = useCoordinateMapper()

function onLoad() {
  naturalSize.value = {
    width:  imgRef.value.naturalWidth,
    height: imgRef.value.naturalHeight,
  }
}

const displaySize = computed(() => {
  if (!naturalSize.value) return null
  const { width: nw, height: nh } = naturalSize.value
  const scale = Math.min(
    (innerWidth.value  * 0.8) / nw,
    (innerHeight.value * 0.8) / nh,
  )
  return {
    width:  Math.round(nw * scale),
    height: Math.round(nh * scale),
  }
})

const viewBox = computed(() => {
  const p = state.canvas.parameters
  if (!p) return undefined
  return `0 0 ${p.width} ${p.height}`
})

function onMouseMove(evt) {
  cursor.value = mapMouseEvent(evt)
}

function onMouseLeave() {
  cursor.value = null
}
</script>

<template>
  <div class="relative inline-block">
    <img
      ref="imgRef"
      :src="src"
      alt="Canvas background"
      class="block"
      :style="displaySize ? { width: displaySize.width + 'px', height: displaySize.height + 'px' } : {}"
      @load="onLoad"
    />
    <svg
      v-if="displaySize"
      id="canvas"
      class="absolute top-0 left-0"
      :width="displaySize.width"
      :height="displaySize.height"
      :viewBox="viewBox"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    />
    <div
      v-if="cursor"
      class="absolute bottom-1 right-1 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded pointer-events-none select-none"
    >
      {{ cursor.x }}, {{ cursor.y }}
    </div>
  </div>
</template>

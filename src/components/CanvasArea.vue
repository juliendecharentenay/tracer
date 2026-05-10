<script setup>
import { ref, computed, inject } from 'vue'

defineProps({ src: { type: String, required: true } })

const innerWidth  = inject('innerWidth')
const innerHeight = inject('innerHeight')

const imgRef = ref(null)
const naturalSize = ref(null)

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
  </div>
</template>

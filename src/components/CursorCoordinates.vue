<script setup>
defineProps({
  cursor: {
    type: Object,
    default: null
  }
})
</script>

<template>
  <div class="bg-white rounded shadow p-3 font-mono text-sm">
    <div v-if="cursor" class="whitespace-nowrap">
      <span class="text-gray-600">x:</span> <span>{{ cursor.x }}</span><br />
      <span class="text-gray-600">y:</span> <span>{{ cursor.y }}</span>
    </div>
    <div v-else class="text-gray-400">–</div>
  </div>
</template>

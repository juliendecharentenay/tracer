<script setup>
import { inject, ref } from 'vue'

const setImageBase64 = inject('setImageBase64')
const fileInput = ref(null)

function openFilePicker() {
  fileInput.value.click()
}

function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    setImageBase64(e.target.result)
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <button @click="openFilePicker">Import</button>
  <input
    ref="fileInput"
    type="file"
    accept="image/*"
    class="hidden"
    @change="onFileChange"
  />
</template>

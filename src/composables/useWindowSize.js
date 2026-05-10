import { ref } from 'vue'

export function useWindowSize() {
  const innerWidth  = ref(window.innerWidth)
  const innerHeight = ref(window.innerHeight)

  function onResize() {
    innerWidth.value  = window.innerWidth
    innerHeight.value = window.innerHeight
  }

  return { innerWidth, innerHeight, onResize }
}

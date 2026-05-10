import { reactive } from 'vue'

export function useAppState() {
  const state = reactive({
    image: { base64: null, crop: null },
    canvas: {
      parameters: null,
      svg: { points: [], controlPoints: [], paths: [] },
    },
  })

  function setImageBase64(base64) {
    state.image.base64 = base64
  }

  return { state, setImageBase64 }
}

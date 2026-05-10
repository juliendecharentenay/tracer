import { reactive } from 'vue'

export function useAppState() {
  const state = reactive({
    image: { base64: null, crop: null, rect: null },
    canvas: {
      parameters: null,
      svg: { points: [], controlPoints: [], paths: [] },
    },
  })

  function setImageBase64(base64) {
    state.image.base64 = base64
  }

  function setCropResult(croppedBase64, rect) {
    state.image.crop = { base64: croppedBase64 };
    state.image.rect = rect;
  }

  return { state, setImageBase64, setCropResult }
}

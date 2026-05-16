import { reactive } from 'vue'
import { useSvgData } from './useSvgData'

export function useAppState() {
  const { data: svgData, addPoint, addPath, updatePoint, removePath, updateControlPoint, togglePathType } = useSvgData()
  const state = reactive({
    image: { base64: null, crop: null, rect: null },
    canvas: {
      parameters: null,
      svg: svgData,
    },
  })

  function setImageBase64(base64) {
    state.image.base64 = base64
  }

  function setCropResult(croppedBase64, rect) {
    state.image.crop = { base64: croppedBase64 };
    state.image.rect = rect;
  }

  function setCanvasParameters(width, height) {
    state.canvas.parameters = { width, height }
  }

  return { state, setImageBase64, setCropResult, setCanvasParameters, addPoint, addPath, updatePoint, removePath, updateControlPoint, togglePathType }
}

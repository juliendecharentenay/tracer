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

  function restoreState(persisted) {
    state.image.base64 = persisted.image?.base64 ?? null
    state.image.crop = persisted.image?.crop ?? null
    state.canvas.parameters = persisted.canvas?.parameters ?? null
    const svg = persisted.canvas?.svg
    if (svg) {
      state.canvas.svg.points = svg.points ?? []
      state.canvas.svg.controlPoints = svg.controlPoints ?? []
      state.canvas.svg.paths = svg.paths ?? []
    }
  }

  return { state, setImageBase64, setCropResult, setCanvasParameters, restoreState, addPoint, addPath, updatePoint, removePath, updateControlPoint, togglePathType }
}

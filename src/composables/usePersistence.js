import { watch } from 'vue'

const STORAGE_KEY = 'tracer-state'

export function usePersistence(state) {
  watch(
    state,
    (s) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      } catch (e) {
        // storage quota exceeded or unavailable — silently skip
        console.error(e);
      }
    },
    { deep: true }
  )
}

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

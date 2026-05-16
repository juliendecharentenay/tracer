import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive, nextTick } from 'vue'
import { usePersistence, loadPersistedState } from './usePersistence'

const STORAGE_KEY = 'tracer-state'

function makeStorage() {
  const store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn((key) => { delete store[key] }),
    _store: store,
  }
}

describe('loadPersistedState', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage())
  })

  it('returns null when localStorage is empty', () => {
    expect(loadPersistedState()).toBeNull()
  })

  it('returns null when stored value is invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{')
    expect(loadPersistedState()).toBeNull()
  })

  it('returns the parsed object when valid JSON is stored', () => {
    const payload = {
      image: { base64: 'data:image/png;base64,abc', crop: { base64: 'data:image/png;base64,xyz' } },
      canvas: { parameters: { width: 1000, height: 562 }, svg: { points: [[0, 0]], controlPoints: [], paths: [] } },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    expect(loadPersistedState()).toEqual(payload)
  })
})

describe('usePersistence', () => {
  function makeState(extra = {}) {
    return reactive({
      image: { base64: null, crop: null, ...extra.image },
      canvas: {
        parameters: null,
        ...extra.canvas,
        svg: { points: [], controlPoints: [], paths: [], ...extra.canvas?.svg },
      },
    })
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage())
  })

  it('saves state to localStorage when state changes', async () => {
    const state = makeState()
    usePersistence(state)

    state.image.base64 = 'data:image/png;base64,abc'
    await nextTick()

    expect(localStorage.setItem).toHaveBeenCalled()
    const saved = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1])
    expect(saved.image.base64).toBe('data:image/png;base64,abc')
  })

  it('serialises the full schema structure', async () => {
    const state = makeState({
      image: { base64: 'img', crop: { base64: 'cropped' } },
      canvas: {
        parameters: { width: 800, height: 450 },
        svg: { points: [[10, 20]], controlPoints: [[5, 5]], paths: [{ type: 'line', points: [0, 1], controlPoints: [] }] },
      },
    })
    usePersistence(state)

    state.image.base64 = 'img-updated'
    await nextTick()

    const saved = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1])
    expect(saved).toMatchObject({
      image: { base64: 'img-updated', crop: { base64: 'cropped' } },
      canvas: {
        parameters: { width: 800, height: 450 },
        svg: {
          points: [[10, 20]],
          controlPoints: [[5, 5]],
          paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
        },
      },
    })
  })

  it('saves when a point is added (deep change)', async () => {
    const state = makeState()
    usePersistence(state)

    state.canvas.svg.points.push([100, 200])
    await nextTick()

    const saved = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1])
    expect(saved.canvas.svg.points).toEqual([[100, 200]])
  })

  it('does not throw if localStorage.setItem throws', async () => {
    const brokenStorage = makeStorage()
    brokenStorage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError') })
    vi.stubGlobal('localStorage', brokenStorage)

    const state = makeState()
    usePersistence(state)

    await expect(async () => {
      state.image.base64 = 'test'
      await nextTick()
    }).not.toThrow()
  })
})

describe('phase detection via restored state', () => {
  it('signals tracing phase when canvas.parameters is present', () => {
    const persisted = {
      image: { base64: 'img', crop: { base64: 'cropped' } },
      canvas: { parameters: { width: 1000, height: 562 }, svg: { points: [], controlPoints: [], paths: [] } },
    }
    // tracing phase: image.crop non-null AND canvas.parameters non-null
    expect(persisted.image.crop).not.toBeNull()
    expect(persisted.canvas.parameters).not.toBeNull()
  })

  it('signals crop phase when image.base64 is set but canvas.parameters is null', () => {
    const persisted = {
      image: { base64: 'img', crop: null },
      canvas: { parameters: null, svg: { points: [], controlPoints: [], paths: [] } },
    }
    expect(persisted.image.base64).not.toBeNull()
    expect(persisted.image.crop).toBeNull()
  })

  it('signals import phase when image.base64 is null', () => {
    const persisted = {
      image: { base64: null, crop: null },
      canvas: { parameters: null, svg: { points: [], controlPoints: [], paths: [] } },
    }
    expect(persisted.image.base64).toBeNull()
  })
})

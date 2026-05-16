import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'
import CanvasArea from './CanvasArea.vue'
import PointSymbol from './PointSymbol.vue'

vi.mock('@/composables/useCoordinateMapper', () => ({
  useCoordinateMapper: () => ({
    mapMouseEvent: vi.fn().mockReturnValue({ x: 100, y: 200 }),
  }),
}))

describe('CanvasArea', () => {
  const src = 'data:image/png;base64,abc123'

  function makeSvgData(points = []) {
    return { points, controlPoints: [], paths: [] }
  }

  function makeState(parameters = null, svgPoints = []) {
    return reactive({ canvas: { parameters, svg: makeSvgData(svgPoints) } })
  }

  function createWrapper(vw = 1000, vh = 800, state = makeState(), extra = {}) {
    return mount(CanvasArea, {
      props: { src },
      global: {
        provide: {
          state,
          innerWidth:          ref(vw),
          innerHeight:         ref(vh),
          isDrawing:           ref(false),
          beginDraw:           vi.fn(),
          cancelDraw:          vi.fn(),
          commitLine:          vi.fn(),
          drawingStartCoords:  ref(null),
          canvasCursor:        ref(null),
          hoveredPathIndex:    ref(null),
          selectedPathIndex:   ref(null),
          setHoveredPathIndex: vi.fn(),
          setSelectedPathIndex: vi.fn(),
          ...extra,
        },
      },
    })
  }

  async function loadImage(wrapper, naturalWidth, naturalHeight) {
    const imgEl = wrapper.find('img').element
    Object.defineProperty(imgEl, 'naturalWidth',  { configurable: true, value: naturalWidth })
    Object.defineProperty(imgEl, 'naturalHeight', { configurable: true, value: naturalHeight })
    await wrapper.find('img').trigger('load')
  }

  it('renders an img with the provided src', () => {
    expect(createWrapper().find('img').attributes('src')).toBe(src)
  })

  it('wraps the image in a relative inline-block container', () => {
    const classes = createWrapper().find('div').classes()
    expect(classes).toContain('relative')
    expect(classes).toContain('inline-block')
  })

  it('applies no explicit size before the image loads', () => {
    expect(createWrapper().find('img').attributes('style') ?? '').toBe('')
  })

  it('scales a landscape image so its width fills 80vw when that is the tighter constraint', async () => {
    // 1000x500 image, viewport 1000x800 → 80vw=800, 80vh=640 → scale=0.8 → 800×400
    const wrapper = createWrapper(1000, 800)
    await loadImage(wrapper, 1000, 500)
    const style = wrapper.find('img').attributes('style')
    expect(style).toContain('width: 800px')
    expect(style).toContain('height: 400px')
  })

  it('scales a portrait image so its height fills 80vh when that is the tighter constraint', async () => {
    // 400x1000 image, viewport 1000x800 → 80vw=800, 80vh=640 → scale=0.64 → 256×640
    const wrapper = createWrapper(1000, 800)
    await loadImage(wrapper, 400, 1000)
    const style = wrapper.find('img').attributes('style')
    expect(style).toContain('width: 256px')
    expect(style).toContain('height: 640px')
  })

  it('does not render an svg before the image loads', () => {
    expect(createWrapper().find('svg').exists()).toBe(false)
  })

  it('renders an svg with id="canvas" after the image loads', async () => {
    const wrapper = createWrapper()
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('svg#canvas').exists()).toBe(true)
  })

  it('gives the svg the same pixel dimensions as the displayed image', async () => {
    // 1000x500 image, viewport 1000x800 → display 800×400
    const wrapper = createWrapper(1000, 800)
    await loadImage(wrapper, 1000, 500)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('800')
    expect(svg.attributes('height')).toBe('400')
  })

  it('positions the svg absolutely over the image', async () => {
    const wrapper = createWrapper()
    await loadImage(wrapper, 1000, 500)
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('absolute')
    expect(svg.classes()).toContain('top-0')
    expect(svg.classes()).toContain('left-0')
  })

  it('does not set a viewBox attribute when canvas.parameters is null', async () => {
    const wrapper = createWrapper(1000, 800, makeState(null))
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('svg').attributes('viewBox')).toBeUndefined()
  })

  it('applies the viewBox attribute derived from canvas.parameters', async () => {
    const wrapper = createWrapper(1000, 800, makeState({ width: 1000, height: 500 }))
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 1000 500')
  })

  it('recalculates dimensions reactively when innerWidth changes', async () => {
    const innerWidth  = ref(1000)
    const innerHeight = ref(800)
    const wrapper = createWrapper(1000, 800, makeState(), {
      innerWidth, innerHeight
      })
    // 1000x500 image at 1000x800 viewport → 800×400
    await loadImage(wrapper, 1000, 500)
    expect(wrapper.find('img').attributes('style')).toContain('width: 800px')

    // Resize viewport to 600x800 → 80vw=480, 80vh=640 → scale=0.48 → 480×240
    innerWidth.value = 600
    await wrapper.vm.$nextTick()
    const style = wrapper.find('img').attributes('style')
    expect(style).toContain('width: 480px')
    expect(style).toContain('height: 240px')
  })

  describe('background click in tracing mode', () => {
    async function mountAndLoad(extra = {}) {
      const state = makeState({ width: 1000, height: 500 })
      const wrapper = createWrapper(1000, 800, state, extra)
      await loadImage(wrapper, 1000, 500)
      return { wrapper, state }
    }

    it('calls beginDraw with mapped coordinates when clicking the SVG background (not drawing)', async () => {
      const beginDraw = vi.fn()
      const { wrapper } = await mountAndLoad({ beginDraw })
      await wrapper.find('svg').trigger('click')
      expect(beginDraw).toHaveBeenCalledWith(100, 200)
    })

    it('does not call beginDraw when canvas.parameters is null', async () => {
      const beginDraw = vi.fn()
      const state = makeState(null)
      const wrapper = createWrapper(1000, 800, state, { beginDraw })
      await loadImage(wrapper, 1000, 500)
      await wrapper.find('svg').trigger('click')
      expect(beginDraw).not.toHaveBeenCalled()
    })
  })

  describe('live preview line', () => {
    async function mountDrawing(isDrawing, triggerMousemove = true) {
      const wrapper = createWrapper(1000, 800, makeState({ width: 1000, height: 500 }), {
        isDrawing:          ref(isDrawing),
        drawingStartCoords: ref([50, 75]),
      })
      await loadImage(wrapper, 1000, 500)
      if (triggerMousemove) {
        await wrapper.find('svg').trigger('mousemove')
      }
      return wrapper
    }

    it('does not render a preview path when not drawing', async () => {
      const wrapper = await mountDrawing(false)
      const paths = wrapper.find('svg').findAll('path')
      expect(paths).toHaveLength(0)
    })

    it('does not render a preview path when drawing but cursor has left the canvas', async () => {
      const wrapper = await mountDrawing(true)
      await wrapper.find('svg').trigger('mouseleave')
      const paths = wrapper.find('svg').findAll('path')
      expect(paths).toHaveLength(0)
    })

    it('renders a preview path with correct d attribute when drawing and cursor is over canvas', async () => {
      const wrapper = await mountDrawing(true)
      const paths = wrapper.find('svg').findAll('path')
      expect(paths).toHaveLength(1)
      expect(paths[0].attributes('d')).toBe('M 50 75 L 100 200')
    })
  })

  describe('end-point commit', () => {
    async function mountDrawing(extra = {}) {
      const state = makeState({ width: 1000, height: 500 })
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(true),
        drawingStartCoords: ref([10, 20]),
        ...extra,
      })
      await loadImage(wrapper, 1000, 500)
      return wrapper
    }

    it('calls commitLine with mapped end coords when clicking background while drawing', async () => {
      const commitLine = vi.fn()
      const wrapper = await mountDrawing({ commitLine })
      await wrapper.find('svg').trigger('click')
      expect(commitLine).toHaveBeenCalledWith(100, 200)
    })

    it('does not call beginDraw when clicking background while drawing', async () => {
      const beginDraw = vi.fn()
      const wrapper = await mountDrawing({ beginDraw })
      await wrapper.find('svg').trigger('click')
      expect(beginDraw).not.toHaveBeenCalled()
    })

    it('calls beginDraw (not commitLine) when clicking background while NOT drawing', async () => {
      const commitLine = vi.fn()
      const beginDraw = vi.fn()
      const state = makeState({ width: 1000, height: 500 })
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing: ref(false),
        commitLine,
        beginDraw,
      })
      await loadImage(wrapper, 1000, 500)
      await wrapper.find('svg').trigger('click')
      expect(beginDraw).toHaveBeenCalled()
      expect(commitLine).not.toHaveBeenCalled()
    })
  })

  describe('point symbol click', () => {
    it('calls commitLine with the symbol point coords when clicking a symbol while drawing', async () => {
      const commitLine = vi.fn()
      const state = makeState({ width: 1000, height: 500 }, [[50, 75], [200, 300]])
      const w = createWrapper(1000, 800, state, {
        isDrawing:          ref(true),
        drawingStartCoords: ref([10, 20]),
        commitLine,
      })
      await loadImage(w, 1000, 500)
      const symbols = w.findAllComponents(PointSymbol)
      await symbols[1].trigger('click')
      expect(commitLine).toHaveBeenCalledWith(200, 300)
    })

    it('calls beginDraw with symbol coords when clicking a symbol while NOT drawing', async () => {
      const beginDraw = vi.fn()
      const state = makeState({ width: 1000, height: 500 }, [[50, 75]])
      const w = createWrapper(1000, 800, state, {
        isDrawing: ref(false),
        beginDraw,
      })
      await loadImage(w, 1000, 500)
      const sym = w.findComponent(PointSymbol)
      await sym.trigger('click')
      expect(beginDraw).toHaveBeenCalledWith(50, 75)
    })
  })

  describe('committed path rendering', () => {
    it('renders a path element for each committed line in state', async () => {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const wrapper = createWrapper(1000, 800, state)
      await loadImage(wrapper, 1000, 500)
      const paths = wrapper.find('svg').findAll('path')
      expect(paths).toHaveLength(1)
      expect(paths[0].attributes('d')).toBe('M 10 20 L 50 60')
    })
  })

  describe('point symbol rendering', () => {
    it('renders a PointSymbol for each entry in state.canvas.svg.points', async () => {
      const state = makeState({ width: 1000, height: 500 }, [[100, 200], [300, 400]])
      const wrapper = createWrapper(1000, 800, state)
      await loadImage(wrapper, 1000, 500)
      // 2 committed points + no pending start (not drawing)
      expect(wrapper.findAllComponents(PointSymbol)).toHaveLength(2)
    })

    it('passes the correct x and y props to each PointSymbol', async () => {
      const state = makeState({ width: 1000, height: 500 }, [[100, 200]])
      const wrapper = createWrapper(1000, 800, state)
      await loadImage(wrapper, 1000, 500)
      const sym = wrapper.findComponent(PointSymbol)
      expect(sym.props('x')).toBe(100)
      expect(sym.props('y')).toBe(200)
    })

    it('renders committed point symbols with default status', async () => {
      const state = makeState({ width: 1000, height: 500 }, [[100, 200], [300, 400]])
      const wrapper = createWrapper(1000, 800, state)
      await loadImage(wrapper, 1000, 500)
      const symbols = wrapper.findAllComponents(PointSymbol)
      expect(symbols[0].props('status')).toBe('default')
      expect(symbols[1].props('status')).toBe('default')
    })
  })

  describe('pending start point symbol', () => {
    it('renders an extra active PointSymbol at drawingStartCoords when drawing', async () => {
      const state = makeState({ width: 1000, height: 500 }, [])
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(true),
        drawingStartCoords: ref([42, 99]),
      })
      await loadImage(wrapper, 1000, 500)
      const symbols = wrapper.findAllComponents(PointSymbol)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].props('x')).toBe(42)
      expect(symbols[0].props('y')).toBe(99)
      expect(symbols[0].props('status')).toBe('active')
    })

    it('does not render the pending start symbol when not drawing', async () => {
      const state = makeState({ width: 1000, height: 500 }, [])
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        drawingStartCoords: ref(null),
      })
      await loadImage(wrapper, 1000, 500)
      expect(wrapper.findAllComponents(PointSymbol)).toHaveLength(0)
    })
  })

  describe('path hover handlers', () => {
    it('calls setHoveredPathIndex on mouseenter of a path', async () => {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const setHoveredPathIndex = vi.fn()
      const wrapper = createWrapper(1000, 800, state, { setHoveredPathIndex })
      await loadImage(wrapper, 1000, 500)
      const paths = wrapper.find('svg').findAll('path')
      await paths[0].trigger('mouseenter')
      expect(setHoveredPathIndex).toHaveBeenCalledWith(0)
    })

    it('calls setHoveredPathIndex(null) on mouseleave of a path', async () => {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const setHoveredPathIndex = vi.fn()
      const wrapper = createWrapper(1000, 800, state, { setHoveredPathIndex })
      await loadImage(wrapper, 1000, 500)
      const paths = wrapper.find('svg').findAll('path')
      await paths[0].trigger('mouseleave')
      expect(setHoveredPathIndex).toHaveBeenCalledWith(null)
    })
  })

  describe('path click selection state machine', () => {
    async function setupWithPaths() {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60], [100, 150]],
            controlPoints: [],
            paths: [
              { type: 'line', points: [0, 1], controlPoints: [] },
              { type: 'line', points: [1, 2], controlPoints: [] },
            ],
          },
        },
      })
      return state
    }

    // Row 1: No selection + Canvas background → Start drawing
    it('starts drawing when clicking background with no selection', async () => {
      const beginDraw = vi.fn()
      const setSelectedPathIndex = vi.fn()
      const state = await setupWithPaths()
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        selectedPathIndex:  ref(null),
        beginDraw,
        setSelectedPathIndex,
      })
      await loadImage(wrapper, 1000, 500)
      await wrapper.find('svg').trigger('click')
      expect(beginDraw).toHaveBeenCalled()
      expect(setSelectedPathIndex).not.toHaveBeenCalled()
    })

    // Row 2: No selection + Path element → Select that path
    it('selects a path when clicking it with no selection', async () => {
      const setSelectedPathIndex = vi.fn()
      const beginDraw = vi.fn()
      const state = await setupWithPaths()
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        selectedPathIndex:  ref(null),
        setSelectedPathIndex,
        beginDraw,
      })
      await loadImage(wrapper, 1000, 500)
      const paths = wrapper.find('svg').findAll('path')
      await paths[0].trigger('click')
      expect(setSelectedPathIndex).toHaveBeenCalledWith(0)
      expect(beginDraw).not.toHaveBeenCalled()
    })

    // Row 3: No selection + Point symbol → Start drawing
    it('starts drawing when clicking a point symbol with no selection', async () => {
      const beginDraw = vi.fn()
      const setSelectedPathIndex = vi.fn()
      const state = await setupWithPaths()
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        selectedPathIndex:  ref(null),
        beginDraw,
        setSelectedPathIndex,
      })
      await loadImage(wrapper, 1000, 500)
      const symbols = wrapper.findAllComponents(PointSymbol)
      await symbols[0].trigger('click')
      expect(beginDraw).toHaveBeenCalledWith(10, 20)
      expect(setSelectedPathIndex).not.toHaveBeenCalled()
    })

    // Row 4: Line selected + Canvas background → Deselect the line
    it('deselects when clicking background with a selection', async () => {
      const setSelectedPathIndex = vi.fn()
      const state = await setupWithPaths()
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        selectedPathIndex:  ref(0),
        setSelectedPathIndex,
      })
      await loadImage(wrapper, 1000, 500)
      await wrapper.find('svg').trigger('click')
      expect(setSelectedPathIndex).toHaveBeenCalledWith(null)
    })

    // Row 5: Line selected + Different path → Deselect original, select new
    it('switches selection when clicking a different path', async () => {
      const setSelectedPathIndex = vi.fn()
      const state = await setupWithPaths()
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        selectedPathIndex:  ref(0),
        setSelectedPathIndex,
      })
      await loadImage(wrapper, 1000, 500)
      const paths = wrapper.find('svg').findAll('path')
      await paths[1].trigger('click')
      expect(setSelectedPathIndex).toHaveBeenCalledWith(1)
    })

    // Row 6: Line selected + Point symbol → Deselect the line
    it('deselects when clicking a point symbol with a selection', async () => {
      const setSelectedPathIndex = vi.fn()
      const state = await setupWithPaths()
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        selectedPathIndex:  ref(0),
        setSelectedPathIndex,
      })
      await loadImage(wrapper, 1000, 500)
      const symbols = wrapper.findAllComponents(PointSymbol)
      await symbols[0].trigger('click')
      expect(setSelectedPathIndex).toHaveBeenCalledWith(null)
    })
  })

  describe('path click while drawing', () => {
    it('commits the line when clicking a path while drawing', async () => {
      const commitLine = vi.fn()
      const setSelectedPathIndex = vi.fn()
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(true),
        drawingStartCoords: ref([5, 10]),
        commitLine,
        setSelectedPathIndex,
      })
      await loadImage(wrapper, 1000, 500)
      const paths = wrapper.find('svg').findAll('path')
      await paths[0].trigger('click')
      expect(commitLine).toHaveBeenCalledWith(100, 200)
      expect(setSelectedPathIndex).not.toHaveBeenCalled()
    })
  })

  describe('point click selection', () => {
    it('deselects when clicking a point symbol while a path is selected', async () => {
      const setSelectedPathIndex = vi.fn()
      const beginDraw = vi.fn()
      const state = makeState({ width: 1000, height: 500 }, [[50, 75], [200, 300]])
      const wrapper = createWrapper(1000, 800, state, {
        isDrawing:          ref(false),
        selectedPathIndex:  ref(0),
        setSelectedPathIndex,
        beginDraw,
      })
      await loadImage(wrapper, 1000, 500)
      const symbols = wrapper.findAllComponents(PointSymbol)
      await symbols[1].trigger('click')
      expect(setSelectedPathIndex).toHaveBeenCalledWith(null)
      expect(beginDraw).not.toHaveBeenCalled()
    })
  })

  describe('path visual states', () => {
    it('renders a path with default stroke when not hovered or selected', async () => {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const wrapper = createWrapper(1000, 800, state, {
        hoveredPathIndex:  ref(null),
        selectedPathIndex: ref(null),
      })
      await loadImage(wrapper, 1000, 500)
      const path = wrapper.find('svg path')
      expect(path.attributes('stroke')).toBe('currentColor')
      expect(path.attributes('stroke-width')).toBe('1')
    })

    it('renders a path with increased stroke when hovered', async () => {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const wrapper = createWrapper(1000, 800, state, {
        hoveredPathIndex:  ref(0),
        selectedPathIndex: ref(null),
      })
      await loadImage(wrapper, 1000, 500)
      const path = wrapper.find('svg path')
      expect(path.attributes('stroke')).toBe('currentColor')
      expect(path.attributes('stroke-width')).toBe('2')
    })

    it('renders a path with blue stroke when selected', async () => {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const wrapper = createWrapper(1000, 800, state, {
        hoveredPathIndex:  ref(null),
        selectedPathIndex: ref(0),
      })
      await loadImage(wrapper, 1000, 500)
      const path = wrapper.find('svg path')
      expect(path.attributes('stroke')).toBe('#2563eb')
      expect(path.attributes('stroke-width')).toBe('2')
    })

    it('prefers selected state over hover state', async () => {
      const state = reactive({
        canvas: {
          parameters: { width: 1000, height: 500 },
          svg: {
            points: [[10, 20], [50, 60]],
            controlPoints: [],
            paths: [{ type: 'line', points: [0, 1], controlPoints: [] }],
          },
        },
      })
      const wrapper = createWrapper(1000, 800, state, {
        hoveredPathIndex:  ref(0),
        selectedPathIndex: ref(0),
      })
      await loadImage(wrapper, 1000, 500)
      const path = wrapper.find('svg path')
      expect(path.attributes('stroke')).toBe('#2563eb')
      expect(path.attributes('stroke-width')).toBe('2')
    })
  })
})

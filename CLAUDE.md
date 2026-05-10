# Tracer

A Vue 3 single-page microsite that lets a user import a background image and trace over it to produce an SVG output. Only `<path>` elements using the `M`, `L` (straight line), and `C` (cubic Bézier curve) commands are supported — no other SVG primitives.

## Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite** (dev server, bundler)
- **Tailwind CSS v4** (utility styling via `@tailwindcss/vite`)
- **Vitest** + **@vue/test-utils** + **jsdom** (unit tests)

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run preview      # preview production build
npm run test:unit -- --run  # run unit tests (one-shot mode)
```

## Development approach

This project uses **test-driven development (TDD)**. Write a failing test before implementing any logic or component behaviour, then make it pass with the minimal code required.

### Test conventions

- Test files live **in the same directory** as the file they test.
- Test files use the **`.spec.js`** extension (e.g. `src/components/Toolbar.spec.js` tests `Toolbar.vue`).
- Run `npm run test:unit` to execute the full suite via Vitest.

## User journey

### 1. Image import and setup

1. User uploads an image.
2. The site proposes a crop UI: a rectangle with drag handles on its four corners is overlaid on the image. The user drags the corner handles to define the crop region (free-form, no fixed aspect ratio). A **Crop** button in the bottom-right of the screen confirms the selection.
3. The (cropped) image is inserted as the background of the canvas area.
4. The site renders an SVG canvas outline overlaid on the background image.

### 2. Canvas configuration

5. The user can reposition and resize the SVG canvas outline over the background image.
6. The user selects the `viewBox` width and height values. The SVG canvas outline maintains the same aspect ratio as the chosen viewBox dimensions.
7. The user approves the configuration to proceed to tracing.

### 3. Tracing — adding lines

8. The user single-clicks on the canvas background or on an existing point symbol to place the **start point** of a new line. As the user moves the mouse a preview line is drawn from the start point to the cursor.
9. The user single-clicks again to place the **end point**. Clicking the canvas background places a new point; clicking an existing point symbol reuses that point. Clicking an existing path element places the end point at the click location on the path.
10. The line is committed and added to the SVG element list.
11. At any point while drawing, the user can press **Escape** to abort the operation and discard the in-progress line.

### 4. UI panels

- **Top-left — element tree**: a tree-like component lists all SVG elements that have been added.
- **Top-right — cursor coordinates**: displays the current mouse position translated into SVG/viewBox coordinates.
- **Top-right — copy button**: copies the complete SVG markup to the clipboard.

### 5. Hover interaction

- Hovering over a drawn line **bolds the corresponding entry** in the element tree (and vice-versa — hovering a tree entry highlights the line).

### 6. Selection and point editing (single click on existing element)

Click behaviour depends on what is clicked and whether a line is currently selected:

| State | Click target | Result |
|---|---|---|
| No selection | Canvas background | Start drawing a new line from that point |
| No selection | Path element | Select that path |
| No selection | Point symbol | Start drawing a new line from that point |
| Line selected | Canvas background | Deselect the line |
| Line selected | Different path | Deselect original, select new path |
| Line selected | Point symbol | Deselect the line |

When a path is selected:
- The line is **highlighted** (distinct from the hover bold — see Visual states below).
- The always-visible start and end point symbols (filled squares) become draggable handles.
- If the path is a cubic Bézier, control point symbols (non-filled squares) become visible and draggable at its two control points.
- The user can drag any handle to reposition that point. Because start/end points are shared across paths, dragging a start or end handle moves **all paths** that reference that point simultaneously. Control point handles are private to their path and only affect that path.

### Visual states

| State | Canvas rendering | Element tree |
|---|---|---|
| Default | Normal stroke | Normal weight |
| Hovered | Increased stroke weight | **Bold** |
| Selected | Visually distinct from hovered (e.g. different colour or stroke style) | **Bold** |

### 7. Deleting a selected path (Delete key)

- When a path is selected, pressing the **Delete** key removes it from the SVG element list.

### 8. Toggling between line and cubic Bézier curve (double click)

- Double-clicking a line **toggles** it between a straight line and a cubic Bézier curve.
- When switching to Bézier for the first time, the two control points are placed on the original line at the 1/3 and 2/3 positions.
- In Bézier mode the always-visible start and end point symbols become draggable, and the control point symbols also become visible and draggable; all four can be edited independently.
- Double-clicking again toggles the element back to a straight line.

## Interactive canvas structure

The SVG canvas element renders three layers of children:

1. **`<path>` elements** — one per path in the data structure, drawn in order.
2. **Point symbols** — a filled square (`<rect>`) rendered at every unique start/end point in the `points` array. Always visible. Clicking one reuses that point as the start of a new line (if no line is currently being drawn) or deselects the current selection.
3. **Control point symbols** — a non-filled square (`<rect>`) rendered at each control point. Visible only when the owning path is selected and is a cubic Bézier curve.

Point and control point symbols sit on top of path elements in the SVG stacking order so their click handlers take priority.

**Note:** point and control point symbols are part of the interactive editing view only. They are not included in the SVG output copied to the clipboard.

## Implementation logic

### Data structure

The application state centres on a single data structure holding all user-defined tracing information:

```js
{
  points:        [[x, y], ...],  // start and end points, shared across paths
  controlPoints: [[x, y], ...],  // cubic Bézier control points, private to each path
  paths:         [{ type, points, controlPoints }, ...]
}
```

**Points** (start and end points)
- Each point is a two-element array `[x, y]` where both values are integers rounded with `Math.round`.
- Points are shared across paths via index references — never duplicated. Sharing enables paths to form continuous chains: moving a shared endpoint moves all connected paths together.

**Control points**
- Each control point is a two-element array `[x, y]`, also rounded to integers.
- Control points are private to their path and are not deduplicated or shared.

**Paths**
- Each path is an object `{ type: string, points: number[], controlPoints: number[] }`.
- `type` is either `"line"` or `"cubicBezier"`.
- `points` holds indices into the top-level `points` array: always `[startIdx, endIdx]`.
- `controlPoints` holds indices into the top-level `controlPoints` array:
  - A `"line"` path normally has an empty `controlPoints` array, but retains `[cp1Idx, cp2Idx]` if it was previously a `"cubicBezier"`, so that toggling back restores the original control points without loss.
  - A `"cubicBezier"` path always has `[cp1Idx, cp2Idx]`.

### Point deduplication

Before inserting a new start or end point, check whether an existing entry in `points` falls within a fixed hard-coded pixel tolerance. If one does, return its index rather than creating a new entry. This deduplication applies **only** to `points` (start/end), never to `controlPoints`. It ensures that paths sharing an endpoint move together when that point is dragged.

### Coordinate mapping

Mouse events are mapped to SVG viewBox coordinates using a lazily initialised `SVGPoint`:

```js
let svg = null;
let pt = null;
const onMouseMove = (evt) => {
  // lazily acquire the SVG element and a reusable SVGPoint
  if (!svg) {
    svg = document.getElementById('canvas');
    pt = svg.createSVGPoint();
  }
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  // returns mouse position as rounded integer SVG viewBox coordinates
  const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: Math.round(x), y: Math.round(y) };
};
```

### SVG rendering

- Each path item is rendered as its own `<path>` element — never merged. This keeps hover highlighting and future SVG re-parsing straightforward.
- A `"line"` path renders as `<path d="M x1 y1 L x2 y2" />` — `controlPoints` indices are ignored during rendering.
- A `"cubicBezier"` path renders as `<path d="M x1 y1 C cx1 cy1 cx2 cy2 x2 y2" />` using `points[0]`, `points[1]`, `controlPoints[0]`, and `controlPoints[1]`.

### SVG output metadata

- The generated SVG file includes the comment `<!-- generated by tracer -->` near the top.
- The `<svg>` opening tag carries a `data-tracer-version` attribute set to a fixed hard-coded version constant.

## State persistence

Application state is persisted to `localStorage` (Web Storage API) as a JSON string. The schema is:

```json
{
  "image": {
    "base64": "...",
    "crop": { "...crop parameters..." }
  },
  "canvas": {
    "parameters": { "...canvas parameters..." },
    "svg": {
      "points": [],
      "controlPoints": [],
      "paths": []
    }
  }
}
```

- `image.base64` holds the raw uploaded image encoded as a base64 string.
- `image.crop` holds the crop parameters applied to the image.
- `canvas.parameters` holds the canvas position, size, and viewBox configuration.
- `canvas.svg` mirrors the in-memory data structure (`points`, `controlPoints`, and `paths` arrays).

## SVG output constraints

The exported SVG must contain only:
- `<path>` elements using only the `M`, `L`, `C`, and `Z` commands — `L` for straight lines, `C` for cubic Bézier curves

No other SVG elements or path commands should be generated.

## Vite configuration

`vite.config.js` defines `@` as a path alias for `./src`, so imports can use `@/components/Foo.vue` instead of relative paths.

## State management

Application state is managed via a **composable-as-store + provide/inject** pattern:

- `useAppState()` creates and returns a fresh `reactive` state object together with named mutation functions (e.g. `setImageBase64`). No module-level singleton — each call produces its own independent state.
- `App.vue` is the sole caller of `useAppState()`. It holds the returned `state` and mutation functions, then `provide`s them to the component tree.
- Child components `inject` only what they need — the `state` object for reading, or specific mutation functions for writing. Children never call `useAppState()` directly.
- This keeps `useAppState` independently testable (call it, get state + mutations, assert — no component mounting needed) and keeps `App.vue` as a thin wiring layer.

When testing a child component that uses `inject`, supply the injected values via `global.provide` in the `mount` options rather than relying on a parent component.

## Project structure

```
src/
  main.js                    # app entry point
  App.vue                    # root component; owns state, provides it to the tree
  styles.css                 # global styles (Tailwind directives)
  composables/
    useAppState.js            # state factory + mutation functions
```

Components, composables, and utilities are added under `src/` as the feature grows, co-located with their `.spec.js` test files.

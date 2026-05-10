# Tracer — Implementation TODO

Each item is a self-contained unit of work. Items are ordered to follow the user journey and build on one another. Check the box when done.

---

## Phase 1 — Project scaffolding

### 1. Project setup
- [x] **Project setup**

  Initialise the Vue 3 + Vite project with Tailwind CSS v4 (via `@tailwindcss/vite`) and Vitest + `@vue/test-utils` + jsdom for unit testing. Configure `vite.config.js` with the `@` path alias pointing to `./src`. Verify that `npm run dev`, `npm run build`, and `npm run test:unit -- --run` all work without errors. The root `App.vue` and `src/main.js` entry point should be minimal placeholders.

  **Success criteria:** running `npm run test:unit -- --run` exits with zero failures on an empty test suite; `npm run dev` starts the dev server without errors.

---

## Phase 2 — Image import and crop

### 2. Import image
- [x] **Import image**

  Implement a button labelled "Import" that opens the native file-selection dialog filtered to image files. When the user selects a file, read it as a base64-encoded data URL using `FileReader` and store it in reactive application state. The image should be immediately displayed on screen at its natural size so the user can see it before cropping.

  **Success criteria:** the user can click "Import", choose an image file from disk, and see the image rendered on the page.

### 3. Crop UI — corner handles
- [x] **Crop UI — corner handles**

  Overlay a crop rectangle on the imported image with four filled-square drag handles, one at each corner. The rectangle is initialised to cover the full image. The user can drag any corner handle freely (no fixed aspect ratio) to reshape the crop region. The rectangle and handles should remain constrained within the image bounds. Implement this as a dedicated `CropOverlay` component with unit tests covering handle dragging logic.

  **Success criteria:** all four corner handles can be independently dragged to reposition that corner of the crop rectangle.

### 4. Crop confirmation
- [x] **Crop confirmation**

  Add a "Crop" button in the bottom-right of the screen. When clicked, it reads the current crop-rectangle coordinates, crops the displayed image to that region (client-side, using a `<canvas>` element), encodes the result as a base64 string, and stores it in application state under `image.crop`. The crop UI is then dismissed and the application transitions to the canvas-setup phase.

  **Success criteria:** clicking "Crop" produces a cropped image that is stored in state and the crop overlay is no longer visible.

---

## Phase 3 — Canvas configuration

### 5. Canvas background
- [x] **Canvas background**

  Display the cropped image as the background of a canvas area. The image must be shown at its natural aspect ratio, fully visible within the viewport, sized to fit within 80 % of the screen width and 80 % of the screen height (whichever constraint is tighter). The image is a non-interactive background layer and is the container for all subsequent SVG overlay work.

  **Success criteria:** after cropping, the cropped image is visible with correct aspect ratio, fully on-screen, and occupies at most 80 % of both the viewport width and height.

### 6. SVG canvas overlay
- [x] **SVG canvas overlay**

  Render an `<svg>` element overlaid on the background image, sized to cover the image exactly (same pixel width and height). This SVG is the drawing canvas for all tracing work; it is not draggable or resizable — it always matches the image dimensions.

  **Success criteria:** the SVG canvas overlay covers the background image precisely; no repositioning or resizing controls are present.

### 7. ViewBox configuration
- [x] **ViewBox configuration**

  Provide a numeric input for the SVG `viewBox` width. The height is derived automatically to preserve the same aspect ratio as the cropped image (`height = width * imageHeight / imageWidth`), so there is no separate height input. Store the chosen width (and computed height) in canvas state. Default to a sensible initial width (e.g. 1000).

  **Success criteria:** changing the viewBox width immediately updates the stored height to maintain the image aspect ratio; the displayed coordinates reflect the new viewBox scale.

### 8. Approve canvas configuration
- [ ] **Approve canvas configuration**

  Add a button to confirm the viewBox configuration and proceed to the tracing phase. Clicking it locks in the viewBox values and switches the application to tracing mode. The background image and SVG canvas remain visible; no further viewBox editing is available.

  **Success criteria:** after clicking "Approve", the viewBox configuration control disappears and the tracing interface becomes active.

---

## Phase 4 — Core data structure and utilities

### 9. SVG data structure and point deduplication
- [ ] **SVG data structure and point deduplication**

  Define and export the reactive SVG data structure (`{ points, controlPoints, paths }`) as a composable (e.g. `useSvgData`). Implement the `addPoint(x, y)` utility that checks existing points within a hard-coded pixel tolerance and returns the index of the matching point or inserts a new one. Write unit tests covering deduplication (near-identical coordinates share an index) and insertion (distant coordinates create a new entry).

  **Success criteria:** unit tests confirm that two points within tolerance share an index, and that two points beyond tolerance each get their own index.

### 10. Coordinate mapping
- [ ] **Coordinate mapping**

  Implement the `useCoordinateMapper` composable that lazily acquires the SVG element and a reusable `SVGPoint`, then maps a `MouseEvent` (`clientX`, `clientY`) to rounded integer SVG viewBox coordinates via `matrixTransform(getScreenCTM().inverse())`. Write unit tests using a mocked SVG element. Expose the mapper for use by both the tracing and display panels.

  **Success criteria:** unit tests confirm that a known client coordinate is correctly transformed to the expected viewBox coordinate and returned as rounded integers.

---

## Phase 5 — Tracing

### 11. Draw a straight line — start point
- [ ] **Draw a straight line — start point**

  In tracing mode, a single click on the SVG canvas background places the start point of a new line. The point is added to the `points` array (with deduplication). A filled-square point symbol (`<rect>`) is rendered at that location. The application enters "drawing in progress" state, ready to receive an end point.

  **Success criteria:** clicking the canvas background in tracing mode places a visible point symbol and the app waits for the end point.

### 12. Draw a straight line — live preview
- [ ] **Draw a straight line — live preview**

  While the user is in "drawing in progress" state (start point placed), render a live preview line from the start point to the current mouse cursor position. The preview line updates on every `mousemove` event. The preview is not part of the committed data structure and disappears if the operation is aborted.

  **Success criteria:** moving the mouse after placing a start point shows a line that follows the cursor in real time.

### 13. Draw a straight line — end point and commit
- [ ] **Draw a straight line — end point and commit**

  A single click in "drawing in progress" state places the end point and commits the line. Clicking the canvas background adds a new point (with deduplication); clicking an existing point symbol reuses that point's index; clicking an existing path element adds a new point at the click location on the path. The committed path (`type: "line"`, `points: [startIdx, endIdx]`, `controlPoints: []`) is pushed into the `paths` array. The preview line is removed and the app returns to idle state.

  **Success criteria:** after two clicks a `<path d="M x1 y1 L x2 y2">` element appears in the SVG and the point symbols are visible at both endpoints.

### 14. Abort drawing with Escape
- [ ] **Abort drawing with Escape**

  When the user is in "drawing in progress" state, pressing the **Escape** key discards the in-progress line, removes any speculatively added start point from `points` (if it was newly created and not shared), and returns the app to idle state. The preview line and any uncommitted point symbol disappear.

  **Success criteria:** pressing Escape while drawing removes the preview line and uncommitted point symbol without adding any entry to `paths`.

---

## Phase 6 — UI panels

### 15. Element tree panel
- [ ] **Element tree panel**

  Implement a `ElementTree` component anchored to the top-left of the screen. It lists every path in the `paths` array, one entry per path, showing its type (`line` or `cubicBezier`) and its sequential index. The list updates reactively as paths are added or removed. Write unit tests for the list rendering logic.

  **Success criteria:** after drawing two lines the element tree shows two entries; removing a line removes its entry.

### 16. Cursor coordinates display
- [ ] **Cursor coordinates display**

  Implement a small `CursorCoordinates` component anchored to the top-right of the screen. It displays the current mouse position in SVG viewBox coordinates (e.g. `x: 120, y: 340`), updated live on every `mousemove` over the canvas. Shows `–` or nothing when the cursor is outside the canvas.

  **Success criteria:** moving the mouse over the canvas updates the displayed coordinates in viewBox units.

### 17. Copy SVG button
- [ ] **Copy SVG button**

  Add a "Copy SVG" button in the top-right panel. Clicking it assembles the complete SVG markup: the `<svg>` opening tag with the `viewBox` attribute and `data-tracer-version` attribute, the `<!-- generated by tracer -->` comment, and one `<path>` element per committed path (line or cubicBezier). Point symbols and control point symbols are excluded. The assembled string is written to the clipboard via the Clipboard API.

  **Success criteria:** clicking "Copy SVG" puts valid SVG markup (including the comment and version attribute, containing only `<path>` elements) on the clipboard.

---

## Phase 7 — Hover and selection

### 18. Hover highlighting
- [ ] **Hover highlighting**

  When the user hovers over a `<path>` element on the canvas, increase its stroke weight (hover visual state). Simultaneously bold the corresponding entry in the element tree. The reverse also applies: hovering an entry in the element tree increases the stroke weight of the matching path. Both directions use a shared `hoveredPathIndex` reactive reference. Write unit tests for the hover-state logic.

  **Success criteria:** mousing over a drawn line bolds its tree entry; mousing over a tree entry thickens the corresponding line.

### 19. Path selection — click behaviour
- [ ] **Path selection — click behaviour**

  Implement the full click-selection state machine as described in the specification table. Clicking a path element when nothing is selected selects it (sets `selectedPathIndex`). Clicking the canvas background or a point symbol deselects. Clicking a different path while one is selected deselects the original and selects the new one. Clicking a point symbol in idle state starts drawing, not a selection. Write unit tests for each state transition.

  **Success criteria:** all six rows of the click-behaviour table are covered by passing unit tests.

### 20. Selection visual state
- [ ] **Selection visual state**

  When a path is selected, render it with a visually distinct style that differs from both the default and hovered states (e.g. a different colour or dashed stroke). The corresponding element tree entry is also bolded. The selection style is removed when the path is deselected.

  **Success criteria:** a selected path looks different from a hovered path and from an unselected path simultaneously.

---

## Phase 8 — Point editing

### 21. Draggable point handles (selected path)
- [ ] **Draggable point handles (selected path)**

  When a path is selected, its start and end point symbols become draggable. Dragging a point symbol updates the `[x, y]` value at the corresponding index in the shared `points` array. Because points are shared by index, all paths that reference the same index move simultaneously. Implement drag handling via `mousedown` / `mousemove` / `mouseup` events on the symbol. Write unit tests for the coordinate-update logic.

  **Success criteria:** dragging a shared point moves all connected paths' endpoints together.

### 22. Delete selected path
- [ ] **Delete selected path**

  When a path is selected, pressing the **Delete** key removes the path object from the `paths` array. Unreferenced points (no longer used by any path) are left in the `points` array (safe to keep, as indices are stable). The selection is cleared after deletion. Write unit tests confirming the correct path is removed.

  **Success criteria:** pressing Delete with a path selected removes exactly that path from the canvas and the element tree.

---

## Phase 9 — Cubic Bézier

### 23. Toggle line ↔ cubic Bézier (double click)
- [ ] **Toggle line ↔ cubic Bézier (double click)**

  Double-clicking a `<path>` element toggles it between `"line"` and `"cubicBezier"`. On the first switch to Bézier, two control points are created at the 1/3 and 2/3 positions along the original line and stored in `controlPoints`; their indices are saved in the path's `controlPoints` array. On subsequent toggles, the previously stored control point indices are reused so the positions are preserved across round-trips. Write unit tests for the initial control-point placement calculation.

  **Success criteria:** double-clicking a line converts it to a Bézier rendered with the `C` command; double-clicking again converts it back to `L`; control point positions survive the round-trip.

### 24. Control point symbols and drag (cubic Bézier)
- [ ] **Control point symbols and drag (cubic Bézier)**

  When a `"cubicBezier"` path is selected, render its two control points as non-filled square symbols on the canvas. These symbols are draggable and update the corresponding entry in the `controlPoints` array (private to the path — no deduplication). Control point symbols are hidden when the path is not selected or is a `"line"`. Write unit tests for the drag-update logic.

  **Success criteria:** selecting a cubic Bézier path shows two draggable control point symbols; dragging one reshapes the curve; deselecting hides them.

---

## Phase 10 — State persistence

### 25. Save state to localStorage
- [ ] **Save state to localStorage**

  Implement a `usePersistence` composable that watches the full application state (`image.base64`, `image.crop`, `canvas.parameters`, `canvas.svg`) with a deep watcher and serialises it to `localStorage` as a JSON string on every change. Use the schema defined in the specification. Write unit tests using a mocked `localStorage`.

  **Success criteria:** after drawing a line, refreshing the page, and restoring state (see item 27) the line is still present.

### 26. Restore state from localStorage
- [ ] **Restore state from localStorage**

  On application startup, check `localStorage` for a previously saved state JSON string. If found, deserialise it and populate the reactive state (image, crop, canvas parameters, and SVG data). The application should resume in the tracing phase if a valid canvas state exists, or in the image-import phase otherwise. Write unit tests for the deserialisation and phase-detection logic.

  **Success criteria:** closing and reopening the app restores the previous session including all drawn paths and the background image.

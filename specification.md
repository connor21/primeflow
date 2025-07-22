# Primeflow PoC Project Specification

---

## 1. Tech Stack

* **Framework:** Vue.js 3 (Composition API)
* **Language:** TypeScript
* **Rendering:** SVG (for all node graph visuals)
* **State Management:** Minimal, local state with Vue `reactive`/`ref`
* **Build Tool:** Vite (library mode)
* **Testing:** Vitest (unit tests only)
* **Linting/Formatting:** ESLint, Prettier
* **Distribution:** Local development only (PoC; no npm publishing)
* **Theming:** Dark and light themes

---

## 2. Architecture

* **Component-based design** using Vue SFCs, prefixed with `PF`
* **SVG-first rendering:** All graph elements (nodes, edges) rendered with SVG
* **Dynamic Inspector:** Renders editors for node properties based on type
* **Core Features for PoC:**

  * Node creation, drag & drop, and deletion
  * Multiple input/output ports per node
  * Edge creation by connecting output to input ports
  * Pan/Zoom of the graph canvas (mouse & touch)
  * Context menu for nodes
  * Single and multi-select for nodes (move/delete)
  * Undo/redo
  * Inspector for editing node properties
  * Import/export graph as JSON
  * Light/dark theme support
  * Minimap for overview/navigation
  * Configurable maximum number of nodes and edges (set at initialization)
  * Image support: node may show an image (URL string property), otherwise displays a 3D box SVG placeholder

---

## 3. Folder Structure

```
/src
  /components
    PFGraphEditor.vue       // Main shell
    PFGraphSVG.vue          // SVG canvas and rendering
    PFNode.vue              // Node visualization
    PFEdge.vue              // Edge visualization
    PFInspector.vue         // Inspector panel
    PFMinimap.vue           // Minimap overview
    PFContextMenu.vue       // Node context menu
    PFToolbar.vue           // Toolbar (optional)
  /composables
    usePFGraph.ts           // Core graph state/logic
    usePFHistory.ts         // Undo/redo logic
  /types
    node.ts                 // Node and property types
    edge.ts
    graph.ts
  /styles
    primeflow-dark.css
    primeflow-light.css
  /utils
    pfMath.ts
    pfHelpers.ts
  /examples
    DemoApp.vue             // Main demo application
    components/             // Optional: demo-only components
    assets/                 // Demo images, icons, 3D box SVG, etc.
```

---

## 4. Naming Conventions

* **Components:** PascalCase, prefixed with `PF` (e.g., `PFNode.vue`)
* **Composables:** camelCase, prefixed with `usePF` (e.g., `usePFGraph.ts`)
* **Types/Interfaces:** PascalCase, prefixed with `PF` (e.g., `PFNode`)
* **CSS Classes:** Prefixed with `primeflow-` (e.g., `primeflow-node`)
* **Events:** Kebab-case (e.g., `node-selected`, `edge-created`)

---

## 5. Node Model

* **Shape:** Rectangle
* **Ports:** Multiple input ports (left), multiple output ports (right)
* **Edges:** Output port connects only to input port (no output-to-output or input-to-input)
* **Display:** Each node displays a title (string property), and optionally an image at the top (string property "imageUrl"); if no image, show a 3D box SVG as placeholder

### Node Property Model

Each node has a list of **properties**.

#### Property Type Definition

```ts
type PFNodeProperty = {
  key: string,            // Unique property key
  type: 'string' | 'integer' | 'float' | 'number',
  label?: string,         // Optional display label
  default?: any,          // Optional default value
  value?: any,            // Current value (can be empty or defaulted)
}
```

#### Supported Types

* `string`: e.g., title, image URL
* `integer`: rendered as `<input type="number" step="1">`
* `float` / `number`: rendered as `<input type="number" step="any">`

#### Inspector Behavior

* The Inspector panel shows each property as a form input matching its type.
* If a property has a `default` and no `value`, the editor shows the default as placeholder.
* Editing updates the node property in real time (live binding).
* If a property has `key: 'imageUrl'` and a valid string value, node renders the image at the top. Otherwise, a 3D box placeholder SVG is shown.

---

## 6. Serialization

* **Format:** JSON
* **Supports:** Nodes, ports, edges, and all properties

---

## 7. Interactivity

* **Drag & drop:** Nodes can be repositioned interactively on the canvas (supports single and multi-select)
* **Selection:** Single and multi-select of nodes (Ctrl/Cmd/Shift click for multi-select)
* **Multi-select Actions:** Move group, delete group (removes associated edges)
* **Edge creation:** Drag from output port to input port to create an edge
* **Undo/redo:** Basic history stack (limit 20 actions)
* **Minimap:** Shows scaled overview of graph; allows click/drag to recenter main view
* **Pan/Zoom:** Canvas supports pan (mouse/touch drag) and zoom (mouse wheel/touch pinch), always keeping minimap in sync
* **Context menu:** Right-click on node shows context menu (Delete, Duplicate, Edit Properties)

---

## 8. Theming

* **Light and dark CSS themes** provided
* Theme can be toggled via a prop or class on the root component

---

## 9. Testing

* **Unit tests** only, written with Vitest

---

## 10. Demo Application

* **Purpose:** For manual testing and demonstration; always in sync with library features
* **Location:** `/src/examples/DemoApp.vue`
* **Features:**

  * Shows all core interactions and states
  * UI for testing configurable max nodes/edges
  * Theme toggle, import/export, undo/redo, minimap, pan/zoom, context menu
* **Rule:** All features must be exercised in the demo before being considered done

---

## 11. Configurable Limits

* **Max nodes** and **max edges** are configurable at initialization (default values provided; can be changed by consumer at coding time)
* **Acceptance:** Attempts to exceed these limits are rejected in UI and logic

---

## 12. Roadmap (Future)

* Custom node Vue components
* Plugin system
* Accessibility improvements
* E2E/visual testing
* npm package for public release
# Primeflow TODO & Feature Checklist

---

## **Phase 1: Project Setup & Core Structure** 

### Project Initialization
* [x] Initialize Vue 3 + TypeScript project with Vite
  * **Acceptance:** Project builds and runs with `npm run dev` ✅
  * **Acceptance:** Uses TypeScript ✅
  * **Note:** Fixed TypeScript .vue import issue with vue-shim.d.ts
* [x] Add ESLint, Prettier, Vitest
  * **Acceptance:** Linting and formatting work ✅
  * **Acceptance:** Can run a simple unit test ✅

### Folder & File Structure
* [x] Create `src/components/` with stubs for all core components
  * **Acceptance:** Files and folders match specification ✅
  * **Acceptance:** Components can be imported ✅
* [x] Create `src/composables/`, `src/types/`, `src/styles/`, `src/utils/`, `src/examples/`
  * **Note:** Basic project structure created with placeholder files

---

## **Phase 2: Graph State, Rendering, and Basic Node/Edge Editing** 

### Graph State (Composables)

* [x] Implement `usePFGraph` composable (manages nodes, ports, edges as reactive state)
  * **Acceptance:** Cannot exceed set limits 
  * **Acceptance:** DemoApp lets user test this 
  * **Note:** Fully reactive composable with CRUD operations, validation, and selection management

* [x] Enforce configurable max nodes/edges (settable on editor initialization; defaults provided)
  * **Acceptance:** Cannot exceed set limits 
  * **Acceptance:** DemoApp lets user test this 
  * **Note:** Configurable limits enforced with user feedback and demo controls

* [x] Define node, port, edge, and property types in `/types`
  * **Acceptance:** Typescript types are enforced 
  * **Acceptance:** Types match specification 
  * **Note:** Complete type system in `/src/types/graph.ts` with proper interfaces

---

### SVG Graph Canvas

* [x] Build basic `PFGraphSVG` component that renders SVG
* [x] Render nodes as rectangles at (x, y) with support for multiple in/out ports
* [x] Render edges as SVG lines/paths between ports
  * **Acceptance:** Nodes and edges show on canvas 
  * **Acceptance:** Multiple ports per node 
  * **Acceptance:** Title and image (or placeholder) visible 
  * **Note:** Full SVG rendering with curved edges, port positioning, and interactive selection

---

### Demo Application Scaffold

* [x] Create `/src/examples/DemoApp.vue`
* [x] Use `PFGraphEditor` in demo with example graph data
  * **Acceptance:** Demo app shows graph with nodes/edges ✅
  * **Acceptance:** Editing graph in demo updates the state ✅
  * **Note:** Comprehensive demo with sample data, controls, and real-time state updates

---

## **Phase 3: Interactivity – Node/Edge Editing**

### Node Drag & Drop

* [x] Enable dragging nodes with mouse/touch on the canvas (single or multi-select)

  * **Acceptance:** Node(s) position updates while dragging ✅
  * **Acceptance:** No major lag or glitches ✅
  * **Note:** Implemented with smooth delta-based position updates and multi-select support

---

### Edge Creation

* [x] Allow user to connect output port to input port by drag/click (multiple ports per node)

  * **Acceptance:** User can create edges between any output/input port ✅
  * **Acceptance:** Edge only connects output to input, not output to output or input to input ✅
  * **Note:** Fixed edge persistence bug using mouseup event handlers; edges now remain after creation

---

### Node Selection (Single/Multi)

* [x] Select a node with click
* [x] Shift/Ctrl/Cmd+Click for multi-select

  * **Acceptance:** Selected nodes are highlighted ✅
  * **Acceptance:** Multi-select can select/deselect multiple nodes ✅
  * **Note:** Visual highlighting with blue glow effect and proper state management

---

### Multi-select Actions

* [x] Move selected nodes as a group
* [ ] Delete all selected nodes and their connected edges

  * **Acceptance:** Multi-selected nodes move together ✅
  * **Acceptance:** Deleting multi-select removes all related edges
  * **Note:** Group movement implemented; deletion feature pending

---

## **Phase 4: Inspector, Context Menu & Property Editing**

### Inspector Panel (Fixed Side)

* [ ] Build `PFInspector` component as a fixed side panel
* [ ] Render correct editor for each property type (`string`, `integer`, `float`, `number`)
* [ ] Support editing property value (live binding)

  * **Acceptance:** Changing values in Inspector updates node properties
  * **Acceptance:** Editor type matches property type

---

### Node Image / Placeholder

* [ ] If node has property `imageUrl` (string), display image at top of node
* [ ] If `imageUrl` is empty/invalid, display a 3D box placeholder (SVG or embedded image)

  * **Acceptance:** Valid image URL displays the image
  * **Acceptance:** Empty/invalid URL displays 3D box placeholder

---

### Node Context Menu

* [ ] Implement right-click context menu for nodes

  * [ ] Show menu on node right-click
  * [ ] Actions: “Delete Node”, “Duplicate Node”, “Edit Properties”

    * **Acceptance:** Menu appears only on node right-click
    * **Acceptance:** Actions perform as expected
    * **Acceptance:** Menu is styled according to current theme

---

## **Phase 5: Undo/Redo, Minimap, Import/Export, Theming, Pan/Zoom**

### Undo/Redo

* [ ] Implement undo/redo stack in `usePFHistory`
* [ ] Provide UI controls for undo/redo

  * **Acceptance:** Actions (move, add, delete, connect) can be undone and redone
  * **Acceptance:** Stack has a reasonable size limit (e.g., 20)

---

### Minimap

* [ ] Add `PFMinimap` to display a scaled overview of the graph
* [ ] Clicking or dragging in minimap recenters main view

  * **Acceptance:** Minimap updates as graph changes
  * **Acceptance:** User can use minimap for navigation

---

### Import/Export

* [ ] Implement JSON export of the current graph
* [ ] Implement JSON import to restore a graph

  * **Acceptance:** Exported JSON includes all nodes, ports, edges, and properties
  * **Acceptance:** Importing JSON restores identical graph state

---

### Theming

* [ ] Implement light and dark CSS themes
* [ ] Provide toggle in DemoApp

  * **Acceptance:** All UI elements adapt to theme switch
  * **Acceptance:** DemoApp and main editor both support both themes

---

### Pan/Zoom

* [ ] Implement pan (drag canvas background with mouse/touch) in `PFGraphSVG`
* [ ] Implement zoom (mouse wheel and touch pinch) in `PFGraphSVG`

  * **Acceptance:** User can pan (move view) and zoom in/out
  * **Acceptance:** All nodes, edges, and minimap remain in sync
  * **Acceptance:** Zoom is centered on mouse/touch position

---

## **Phase 6: Final Polish and Documentation**

### Documentation

* [ ] Add comments to all public functions and types
* [ ] Basic README with usage and development instructions

  * **Acceptance:** README explains setup and usage
  * **Acceptance:** Main types and components are documented

---

### Demo Application Sync

* [ ] Every time a feature is added/updated, update DemoApp to show and test it

  * **Acceptance:** DemoApp always matches current library features
  * **Acceptance:** All acceptance criteria can be manually checked in DemoApp

---

## **Clarified Requirements**

* **Configurable max nodes/edges** (settable at initialization, defaults provided)
* **Ports:** Multiple input/output ports per node
* **Edge types:** Simple connections only
* **Inspector:** Fixed side panel
* **Image placeholder:** Use a 3D box graphic when `imageUrl` is missing/invalid
* **Multi-select:** Supports group move and delete
* **Pan/Zoom:** Mouse and touch gestures supported
* **Node context menu:** Delete, duplicate, edit properties

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
* [x] Delete all selected nodes and their connected edges

  * **Acceptance:** Multi-selected nodes move together ✅
  * **Acceptance:** Deleting multi-select removes all related edges ✅
  * **Note:** Group movement and multi-delete fully implemented with "Delete Selected" button

---

## **Phase 4: Inspector, Context Menu & Property Editing** 

### Inspector Panel (Fixed Side)

* [x] Build `PFInspector` component as a fixed side panel
* [x] Render correct editor for each property type (`string`, `integer`, `float`, `number`)
* [x] Support editing property value (live binding)

  * **Acceptance:** Changing values in Inspector updates node properties 
  * **Acceptance:** Editor type matches property type 
  * **Note:** Full Inspector panel with live property editing, image URL support, and proper TypeScript typing

---

### Node Image / Placeholder

* [x] If node has property `imageUrl` (string), display image at top of node
* [x] If `imageUrl` is empty/invalid, display a 3D box placeholder (SVG or embedded image)

  * **Acceptance:** Valid image URL displays the image 
  * **Acceptance:** Empty/invalid URL displays 3D box placeholder 
  * **Note:** Beautiful 3D isometric box placeholder with gradients and proper image error handling

---

### Node Context Menu

* [x] Implement right-click context menu for nodes

  * [x] Show menu on node right-click
  * [x] Actions: “Delete Node”, “Duplicate Node”, “Edit Properties”

    * **Acceptance:** Menu appears only on node right-click 
    * **Acceptance:** Actions perform as expected 
    * **Acceptance:** Menu is styled according to current theme 
    * **Note:** Full context menu with proper positioning, click-outside handling, and keyboard support

---

## **Phase 5: Undo/Redo, Minimap, Import/Export, Theming, Pan/Zoom** ✅

### Undo/Redo

* [x] Implement undo/redo stack in `usePFHistory`
* [x] Provide UI controls for undo/redo

  * **Acceptance:** Actions (move, add, delete, connect) can be undone and redone ✅
  * **Acceptance:** Stack has a reasonable size limit (e.g., 20) ✅
  * **Note:** Complete undo/redo system with 20-action stack limit, integrated with all graph operations

---

### Minimap

* [x] Add `PFMinimap` to display a scaled overview of the graph
* [x] Clicking or dragging in minimap recenters main view

  * **Acceptance:** Minimap updates as graph changes ✅
  * **Acceptance:** User can use minimap for navigation ✅
  * **Note:** Fully interactive minimap with viewport synchronization, drag navigation, and real-time updates

---

### Import/Export

* [x] Implement JSON export of the current graph
* [x] Implement JSON import to restore a graph

  * **Acceptance:** Exported JSON includes all nodes, ports, edges, and properties ✅
  * **Acceptance:** Importing JSON restores identical graph state ✅
  * **Note:** Complete JSON serialization with file handling, validation, and error recovery

---

### Theming

* [x] Implement light and dark CSS themes
* [x] Provide toggle in DemoApp

  * **Acceptance:** All UI elements adapt to theme switch ✅
  * **Acceptance:** DemoApp and main editor both support both themes ✅
  * **Note:** Comprehensive theme system with CSS custom properties, localStorage persistence, and complete dark/light mode support across all components

---

### Pan/Zoom

* [x] Implement pan (drag canvas background with mouse/touch) in `PFGraphSVG`
* [x] Implement zoom (mouse wheel and touch pinch) in `PFGraphSVG`

  * **Acceptance:** User can pan (move view) and zoom in/out ✅
  * **Acceptance:** All nodes, edges, and minimap remain in sync ✅
  * **Acceptance:** Zoom is centered on mouse/touch position ✅
  * **Note:** Smooth pan/zoom with SVG viewBox implementation, minimap synchronization, and mouse-centered zooming

---

## **Phase 6: Final Polish and Documentation**

### Documentation

* [x] Add comments to all public functions and types
* [x] Basic README with usage and development instructions

  * **Acceptance:** README explains setup and usage ✅
  * **Acceptance:** Main types and components are documented ✅
  * **Note:** Complete JSDoc documentation added to all core types, composables, and public functions. Comprehensive README created with setup instructions, usage examples, architecture overview, and development guidelines

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

--

# Phase 7: Improving graph editor ✅

### Enhanced Grid Background
* [x] create groups of 10x10 squares with a darker line in the background grid (image required)
  * **Acceptance:** Background shows a regular grid pattern with fine lines
  * **Acceptance:** Every 10th line (both horizontal and vertical) is visibly darker/thicker than regular grid lines
  * **Acceptance:** Grid spacing is consistent and provides good visual reference for node positioning
  * **Acceptance:** Grid adapts to zoom levels appropriately
  * **Acceptance:** Grid lines are subtle enough not to interfere with node/edge visibility
  * **Note:** Implemented dual-layer grid system with fine lines every 10px and major lines every 100px (reduced from 20px/200px for 50% tighter spacing)

### Node Header Enhancement
* [x] add a header with a title to nodes and put the image in the upper left corner of the node (image required)
  * **Acceptance:** Each node displays a distinct header section at the top
  * **Acceptance:** Node title text is prominently displayed in the header
  * **Acceptance:** Node image (or 3D box placeholder) is positioned in the upper left corner of the header
  * **Acceptance:** Header has sufficient height to accommodate both title and image
  * **Acceptance:** Text is readable and properly aligned within the header
  * **Acceptance:** Image maintains aspect ratio and fits within the designated space
  * **Acceptance:** Header visually separates from the node body content
  * **Note:** Restructured node rendering with 28px header section, 20x20px images in upper left, and proper visual separation from body

### Named Port Labels
* [x] name the input and output ports in a node (image required)
  * **Acceptance:** Input ports display descriptive labels (e.g., "SOURCE", "URL", "DESTINATION")
  * **Acceptance:** Output ports display descriptive labels (e.g., "OUT")
  * **Acceptance:** Port labels are positioned clearly near their respective connection points
  * **Acceptance:** Labels are readable at normal zoom levels
  * **Acceptance:** Labels don't overlap with port connection areas
  * **Acceptance:** Input port labels are distinguishable from output port labels
  * **Acceptance:** Multi-port nodes (like ConcatStreams with IMG, TXT, DOC, PDF inputs) show all port names clearly
  * **Note:** Added 9px font labels positioned next to port circles - input labels on right, output labels on left with proper text anchoring

### Dark Mode Color Scheme
* [x] use dark green for node headers and a lighter green for node bodies in dark mode (image required)
  * **Acceptance:** Node headers use a dark green color (#2d5a3d or similar) in dark mode
  * **Acceptance:** Node bodies use a lighter green color (#4a7c59 or similar) in dark mode
  * **Acceptance:** Color contrast between header and body is sufficient for clear visual separation
  * **Acceptance:** Text remains readable on both dark and light green backgrounds
  * **Acceptance:** Selected nodes maintain visibility with the green color scheme
  * **Acceptance:** Port connection points are clearly visible against the green backgrounds
  * **Acceptance:** Color scheme is consistent across all node types
  * **Acceptance:** Light mode retains existing color scheme or uses appropriate light theme colors
  * **Note:** Implemented CSS custom properties for node-header-bg (#2d5a3d dark, #f8f9fa light) and node-body-bg (#4a7c59 dark, #ffffff light) with proper selection highlighting


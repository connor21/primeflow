# Primeflow

A powerful, interactive visual node-based graph editor built with Vue 3 and TypeScript. Primeflow provides a complete solution for creating, editing, and managing node graphs with drag-and-drop functionality, real-time connections, and advanced features like undo/redo, theming, and minimap navigation.

## ✨ Features

### Core Functionality
- **Visual Node Editor**: Drag-and-drop interface for creating and connecting nodes
- **Multi-Port Support**: Nodes can have multiple input and output ports with different data types
- **Edge Creation**: Visual edge creation by dragging from output ports to input ports
- **Selection System**: Single and multi-select support for nodes and edges
- **Interactive Canvas**: Pan and zoom with mouse/touch gestures

### Advanced Features
- **Undo/Redo System**: Complete history tracking with 20-action stack limit
- **Minimap Navigation**: Bird's-eye view with interactive viewport control
- **Theme Support**: Light and dark themes with automatic persistence
- **Import/Export**: JSON-based graph serialization and restoration
- **Configurable Limits**: Customizable maximum nodes and edges
- **Context Menu**: Right-click operations for node management
- **Inspector Panel**: Property editing for selected nodes

### Developer Features
- **TypeScript**: Full type safety and IntelliSense support
- **Reactive State**: Vue 3 Composition API with reactive data management
- **Modular Architecture**: Clean separation of concerns with composables
- **Comprehensive Documentation**: JSDoc comments throughout the codebase

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd primeflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the demo application.

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## 📖 Usage

### Basic Usage

```typescript
import { usePFGraph } from './src/composables/usePFGraph'

// Create a new graph with custom configuration
const { state, addNode, addEdge, selectNode } = usePFGraph({
  maxNodes: 50,
  maxEdges: 100
})

// Add a node
const nodeId = addNode({
  type: 'filter',
  title: 'Blur Filter',
  x: 100,
  y: 200,
  ports: [
    { id: 'input', name: 'Input', type: 'input', dataType: 'image' },
    { id: 'output', name: 'Output', type: 'output', dataType: 'image' }
  ]
})

// Connect nodes with an edge
const edgeId = addEdge({
  sourceNodeId: 'node1',
  sourcePortId: 'output',
  targetNodeId: 'node2', 
  targetPortId: 'input'
})
```

### Using Components

```vue
<template>
  <div class="graph-container">
    <PFGraphEditor
      :state="graphState"
      @node-click="handleNodeClick"
      @edge-click="handleEdgeClick"
    />
  </div>
</template>

<script setup lang="ts">
import { PFGraphEditor } from './src/components'
import { usePFGraph } from './src/composables/usePFGraph'

const { state: graphState } = usePFGraph()

const handleNodeClick = (nodeId: string) => {
  console.log('Node clicked:', nodeId)
}

const handleEdgeClick = (edgeId: string) => {
  console.log('Edge clicked:', edgeId)
}
</script>
```

### Theme Management

```typescript
import { useTheme } from './src/composables/useTheme'

const { currentTheme, toggleTheme, setTheme } = useTheme()

// Toggle between light and dark
toggleTheme()

// Set specific theme
setTheme('light')
```

### History Management

```typescript
import { usePFHistory } from './src/composables/usePFHistory'

const history = usePFHistory(50) // Keep 50 actions

// Check if undo/redo is available
if (history.canUndo.value) {
  const restoredState = history.undo()
}

if (history.canRedo.value) {
  const restoredState = history.redo()
}
```

## 🏗️ Architecture

### Core Types

- **`PFNode`**: Represents a single node with position, ports, and properties
- **`PFEdge`**: Represents a connection between two ports
- **`PFPort`**: Represents an input or output connection point on a node
- **`PFGraph`**: Complete graph structure containing nodes, edges, and configuration
- **`PFGraphConfig`**: Configuration options for graph behavior and limits

### Composables

- **`usePFGraph`**: Main graph state management and operations
- **`usePFHistory`**: Undo/redo functionality with action tracking
- **`useTheme`**: Theme switching and persistence

### Components

- **`PFGraphEditor`**: Main editor component with toolbar and controls
- **`PFGraphSVG`**: SVG-based graph renderer with interaction handling
- **`PFMinimap`**: Miniature overview with navigation capabilities
- **`PFInspector`**: Property panel for editing selected nodes
- **`PFContextMenu`**: Right-click context menu for node operations

## 🎮 Controls

### Mouse Controls
- **Left Click**: Select nodes/edges
- **Ctrl/Cmd + Click**: Multi-select
- **Drag Node**: Move selected nodes
- **Drag Port**: Create new edge
- **Mouse Wheel**: Zoom in/out
- **Drag Canvas**: Pan the view
- **Right Click**: Open context menu

### Keyboard Shortcuts
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Delete**: Remove selected items
- **Ctrl/Cmd + D**: Duplicate selected nodes

## 🔧 Configuration

### Graph Configuration

```typescript
const graphConfig = {
  maxNodes: 100,        // Maximum number of nodes (default: 100)
  maxEdges: 200,        // Maximum number of edges (default: 200)
  nodeDefaults: {
    width: 120,         // Default node width in pixels
    height: 80          // Default node height in pixels
  }
}

const { state } = usePFGraph(graphConfig)
```

### History Configuration

```typescript
// Keep up to 50 actions in history
const history = usePFHistory(50)
```

## 📁 Project Structure

```
src/
├── components/          # Vue components
│   ├── PFGraphEditor.vue    # Main editor component
│   ├── PFGraphSVG.vue       # SVG renderer
│   ├── PFMinimap.vue        # Minimap component
│   ├── PFInspector.vue      # Property inspector
│   └── PFContextMenu.vue    # Context menu
├── composables/         # Vue composables
│   ├── usePFGraph.ts        # Graph state management
│   ├── usePFHistory.ts      # Undo/redo system
│   └── useTheme.ts          # Theme management
├── types/              # TypeScript type definitions
│   └── graph.ts            # Core graph types
├── styles/             # CSS styles and themes
├── utils/              # Utility functions
└── examples/           # Demo applications
    └── DemoApp.vue         # Full-featured demo
```

## 🎨 Theming

Primeflow supports light and dark themes with CSS custom properties. Themes are automatically persisted to localStorage.

### Custom Theme Variables

```css
:root {
  --pf-bg-primary: #1a1a1a;
  --pf-bg-secondary: #2d2d2d;
  --pf-text-primary: #ffffff;
  --pf-text-secondary: #cccccc;
  --pf-border: #404040;
  --pf-accent: #007acc;
  /* ... more variables */
}

[data-theme="light"] {
  --pf-bg-primary: #ffffff;
  --pf-bg-secondary: #f5f5f5;
  --pf-text-primary: #333333;
  /* ... light theme overrides */
}
```

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Development Guidelines

1. **Type Safety**: Always use TypeScript types for better development experience
2. **Reactive State**: Use Vue's reactive system for state management
3. **Composables**: Extract reusable logic into composables
4. **Documentation**: Add JSDoc comments to all public functions and interfaces
5. **Testing**: Write tests for critical functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Vue 3](https://vuejs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Powered by [Vite](https://vitejs.dev/) for fast development
- Styled with modern CSS custom properties
- Inspired by node-based editors like Blender's Shader Editor and Unreal Engine's Blueprint system

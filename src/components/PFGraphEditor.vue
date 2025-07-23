<template>
  <div class="pf-graph-editor">
    <div class="editor-toolbar">
      <div class="stats">
        Nodes: {{ nodeCount }}/{{ config.maxNodes }} | 
        Edges: {{ edgeCount }}/{{ config.maxEdges }}
      </div>
      <div class="actions">
        <!-- Phase 5: Undo/Redo Controls -->
        <div class="undo-redo-group">
          <button 
            @click="undo" 
            :disabled="!canUndo" 
            :title="canUndo ? `Undo: ${undoDescription}` : 'Nothing to undo'"
            class="btn btn-secondary"
          >
            ↶ Undo
          </button>
          <button 
            @click="redo" 
            :disabled="!canRedo" 
            :title="canRedo ? `Redo: ${redoDescription}` : 'Nothing to redo'"
            class="btn btn-secondary"
          >
            ↷ Redo
          </button>
        </div>
        
        <!-- Phase 5: Import/Export Controls -->
        <div class="import-export-group">
          <button @click="exportGraphToJSON" class="btn btn-primary">Export JSON</button>
          <button @click="triggerImport" class="btn btn-primary">Import JSON</button>
          <input 
            ref="fileInput" 
            type="file" 
            accept=".json" 
            @change="importGraphFromJSON" 
            style="display: none;"
          />
        </div>
        
        <!-- Phase 5: Theme Toggle -->
        <button @click="toggleTheme" class="btn btn-theme">
          {{ currentTheme === 'light' ? '🌙' : '☀️' }} 
          {{ currentTheme === 'light' ? 'Dark' : 'Light' }}
        </button>
        
        <button @click="clearGraph" class="btn btn-danger">Clear Graph</button>
        <button 
          v-if="state.selectedNodes.length > 0" 
          @click="deleteSelectedNodes" 
          class="btn btn-danger"
        >
          Delete Selected ({{ state.selectedNodes.length }})
        </button>
      </div>
    </div>
    
    <div class="editor-content">
      <PFGraphSVG
        ref="svgRef"
        :width="props.width"
        :height="props.height"
        :nodes="state.graph.nodes"
        :edges="state.graph.edges"
        @node-click="handleNodeClick"
        @node-mousedown="handleNodeMouseDown"
        @edge-click="handleEdgeClick"
        @port-click="handlePortClick"
        @canvas-click="handleCanvasClick"
        @node-drag="handleNodeDrag"
        @nodes-drag="handleNodesDrag"
        @edge-create="handleEdgeCreate"
        @node-right-click="handleNodeRightClick"
        @image-error="handleImageError"
        @image-load="handleImageLoad"
      />
      
      <!-- Phase 4: Inspector Panel -->
      <PFInspector
        :selected-nodes="selectedNodeObjects"
        @property-changed="handlePropertyChanged"
        @image-changed="handleImageChanged"
      />
      
      <!-- Phase 5: Minimap -->
      <PFMinimap
        v-if="showMinimap"
        :nodes="state.graph.nodes"
        :edges="state.graph.edges"
        :viewport="minimapViewport"
        :graph-bounds="graphBounds"
        :editor-width="width"
        :editor-height="height"
        @viewport-change="handleViewportChange"
        @toggle="toggleMinimap"
      />
    </div>
    
    <!-- Phase 4: Context Menu -->
    <PFContextMenu
      :visible="contextMenu.visible"
      :position="contextMenu.position"
      :node-id="contextMenu.nodeId"
      @delete-node="handleDeleteNode"
      @duplicate-node="handleDuplicateNode"
      @edit-properties="handleEditProperties"
      @close="handleContextMenuClose"
    />
    
    <div v-if="state.selectedNodes.length > 0" class="selection-info">
      Selected nodes: {{ state.selectedNodes.length }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import PFGraphSVG from './PFGraphSVG.vue'
import PFInspector from './PFInspector.vue'
import PFContextMenu from './PFContextMenu.vue'
import PFMinimap from './PFMinimap.vue'
import { usePFGraph, useTheme } from '../composables'
import type { PFGraphConfig } from '../types'

interface Props {
  width?: number
  height?: number
  config?: Partial<PFGraphConfig>
}

interface Emits {
  (e: 'graph-updated'): void
  (e: 'node-selected', nodeIds: string[]): void
  (e: 'edge-selected', edgeIds: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600
})

const emit = defineEmits<Emits>()

// Initialize graph composable
const {
  state,
  config,
  nodeCount,
  edgeCount,
  canAddNode,
  canAddEdge,
  addNode,
  removeNode,
  updateNode,
  getNode,
  addEdge,
  removeEdge,
  getEdge,
  selectNode,
  deselectNode,
  selectEdge,
  deselectEdge,
  clearSelection,
  loadGraph,
  exportGraph,
  // Phase 4: New functions
  updateNodeProperty,
  updateNodeImage,
  duplicateNode,
  deleteSelectedNodes,
  selectedNodeObjects,
  // Phase 5: Undo/Redo functions
  undo,
  redo,
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  clearHistory,
  // Kept for potential future debugging and exposing history details in the UI
  // @ts-expect-error: Currently unused but kept for API completeness
  getHistoryInfo
} = usePFGraph(props.config)

// Phase 4: Context menu state
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  nodeId: ''
})

// Phase 5: Minimap state
const showMinimap = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

// Phase 5: Theme functionality
const { currentTheme, toggleTheme } = useTheme()

// Reference to SVG component for accessing viewport
const svgRef = ref<InstanceType<typeof PFGraphSVG> | null>(null)

// Force reactive viewport tracking
const currentViewport = ref({
  x: 0,
  y: 0,
  width: props.width,
  height: props.height
})

// Watch for viewport changes and update our reactive copy
watch(
  () => {
    try {
      return svgRef.value?.viewport
    } catch (error) {
      console.warn('Error accessing viewport:', error)
      return null
    }
  },
  (newViewport: any) => {
    try {
      if (newViewport && typeof newViewport === 'object') {
        currentViewport.value = {
          x: newViewport.x || 0,
          y: newViewport.y || 0,
          width: newViewport.width || props.width,
          height: newViewport.height || props.height
        }
      }
    } catch (error) {
      console.warn('Error updating viewport:', error)
    }
  },
  { deep: true, immediate: false, flush: 'post' }
)

// Computed properties for minimap
const graphBounds = computed(() => {
  if (state.graph.nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: props.width, maxY: props.height }
  }
  
  const xs = state.graph.nodes.map(node => node.x)
  const ys = state.graph.nodes.map(node => node.y)
  const widths = state.graph.nodes.map(node => node.x + (node.width || 120))
  const heights = state.graph.nodes.map(node => node.y + (node.height || 80))
  
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...widths),
    maxY: Math.max(...heights)
  }
})

const minimapViewport = computed(() => {
  // Use our reactive viewport copy and include scale from SVG viewport
  const svgViewport = svgRef.value?.viewport
  const result = {
    x: currentViewport.value.x,
    y: currentViewport.value.y,
    width: currentViewport.value.width,
    height: currentViewport.value.height,
    scale: svgViewport?.scale || 1
  }
  // Minimap viewport computed successfully
  return result
})

// Event handlers
function handleNodeClick(nodeId: string, event: MouseEvent): void {
  const multiSelect = event.ctrlKey || event.metaKey || event.shiftKey
  
  if (state.selectedNodes.includes(nodeId)) {
    if (multiSelect) {
      deselectNode(nodeId)
    }
  } else {
    selectNode(nodeId, multiSelect)
  }
  
  emit('node-selected', [...state.selectedNodes])
}

function handleNodeMouseDown(nodeId: string, event: MouseEvent): void {
  // Node dragging is handled by the SVG component
  console.log('Node mouse down:', nodeId, event)
}

function handleEdgeClick(edgeId: string, event: MouseEvent): void {
  const multiSelect = event.ctrlKey || event.metaKey || event.shiftKey
  
  if (state.selectedEdges.includes(edgeId)) {
    if (multiSelect) {
      deselectEdge(edgeId)
    }
  } else {
    selectEdge(edgeId, multiSelect)
  }
  
  emit('edge-selected', [...state.selectedEdges])
}

function handlePortClick(nodeId: string, portId: string, event: MouseEvent): void {
  // Port interactions are handled by the SVG component for edge creation
  console.log('Port clicked:', nodeId, portId, event)
}

function handleCanvasClick(event: MouseEvent): void {
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
    clearSelection()
    emit('node-selected', [])
    emit('edge-selected', [])
  }
}

// Phase 3 interactive event handlers
function handleNodeDrag(nodeId: string, deltaX: number, deltaY: number): void {
  const node = state.graph.nodes.find(n => n.id === nodeId)
  if (node) {
    node.x += deltaX
    node.y += deltaY
    emit('graph-updated')
  }
}

function handleNodesDrag(nodeIds: string[], deltaX: number, deltaY: number): void {
  nodeIds.forEach(nodeId => {
    const node = state.graph.nodes.find(n => n.id === nodeId)
    if (node) {
      node.x += deltaX
      node.y += deltaY
    }
  })
  emit('graph-updated')
}

function handleEdgeCreate(fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string): void {
  try {
    addEdge({
      sourceNodeId: fromNodeId,
      sourcePortId: fromPortId,
      targetNodeId: toNodeId,
      targetPortId: toPortId,
      selected: false
    })
    
    emit('graph-updated')
  } catch (error) {
    console.error('Failed to create edge:', error)
  }
}

function clearGraph(): void {
  state.graph.nodes = []
  state.graph.edges = []
  emit('graph-updated')
}

// Phase 4: New event handlers
function handleNodeRightClick(nodeId: string, event: MouseEvent): void {
  event.preventDefault()
  contextMenu.visible = true
  contextMenu.position = { x: event.clientX, y: event.clientY }
  contextMenu.nodeId = nodeId
}

function handleImageError(nodeId: string): void {
  console.warn(`Image failed to load for node: ${nodeId}`)
}

function handleImageLoad(nodeId: string): void {
  console.log(`Image loaded successfully for node: ${nodeId}`)
}

function handlePropertyChanged(nodeId: string, propertyKey: string, value: any): void {
  updateNodeProperty(nodeId, propertyKey, value)
  emit('graph-updated')
}

function handleImageChanged(nodeId: string, imageUrl: string): void {
  updateNodeImage(nodeId, imageUrl)
  emit('graph-updated')
}

function handleDeleteNode(nodeId: string): void {
  removeNode(nodeId)
  emit('graph-updated')
}

function handleDuplicateNode(nodeId: string): void {
  const newNodeId = duplicateNode(nodeId)
  if (newNodeId) {
    emit('graph-updated')
  }
}

function handleEditProperties(nodeId: string): void {
  // Select the node to show it in the inspector
  clearSelection()
  selectNode(nodeId)
  emit('node-selected', [nodeId])
}

function handleContextMenuClose(): void {
  contextMenu.visible = false
  contextMenu.nodeId = ''
}

// Phase 5: Minimap event handlers
function handleViewportChange(viewport: { x: number; y: number; scale?: number }): void {
  // Update the SVG viewport when minimap is dragged
  if (svgRef.value?.viewport) {
    svgRef.value.viewport.x = viewport.x
    svgRef.value.viewport.y = viewport.y
    
    // Maintain scale if provided from the minimap
    if (viewport.scale !== undefined) {
      svgRef.value.viewport.scale = viewport.scale
    }
    
    console.log('Viewport updated from minimap:', viewport)
  } else {
    console.warn('SVG viewport not accessible for update')
  }
}

function toggleMinimap(): void {
  showMinimap.value = !showMinimap.value
}

// Phase 5: Import/Export functionality
function exportGraphToJSON(): void {
  try {
    const graphData = exportGraph()
    const jsonString = JSON.stringify(graphData, null, 2)
    
    // Create and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `primeflow-graph-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('Graph exported successfully')
  } catch (error) {
    console.error('Failed to export graph:', error)
    alert('Failed to export graph. Please try again.')
  }
}

function triggerImport(): void {
  fileInput.value?.click()
}

function importGraphFromJSON(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonString = e.target?.result as string
      const graphData = JSON.parse(jsonString)
      
      // Validate the imported data structure
      if (!graphData.nodes || !graphData.edges || !graphData.config) {
        throw new Error('Invalid graph data structure')
      }
      
      // Load the graph and clear history to start fresh
      loadGraph(graphData)
      clearHistory()
      
      console.log('Graph imported successfully')
      emit('graph-updated')
      
      // Clear the file input
      input.value = ''
    } catch (error) {
      console.error('Failed to import graph:', error)
      alert('Failed to import graph. Please check the file format and try again.')
      input.value = ''
    }
  }
  
  reader.readAsText(file)
}

// Expose methods for external use
defineExpose({
  addNode,
  removeNode,
  updateNode,
  getNode,
  addEdge,
  removeEdge,
  getEdge,
  selectNode,
  deselectNode,
  selectEdge,
  deselectEdge,
  clearSelection,
  clearGraph,
  loadGraph,
  exportGraph,
  canAddNode,
  canAddEdge,
  state,
  config
})
</script>

<style scoped>
.pf-graph-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  font-size: 12px;
}

.stats {
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 4px 8px;
  border: 1px solid var(--border-primary);
  border-radius: 3px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 11px;
}

.btn:hover {
  background-color: var(--bg-tertiary);
}

.btn-danger {
  background-color: var(--danger);
  color: white;
  border-color: var(--danger);
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--danger);
  opacity: 0.8;
}

.selection-info {
  padding: 4px 12px;
  background-color: var(--bg-tertiary);
  border-top: 1px solid var(--border-primary);
  font-size: 11px;
  color: var(--accent-primary);
}
</style>

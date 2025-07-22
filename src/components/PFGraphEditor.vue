<template>
  <div class="pf-graph-editor">
    <div class="editor-toolbar">
      <div class="stats">
        Nodes: {{ nodeCount }}/{{ config.maxNodes }} | 
        Edges: {{ edgeCount }}/{{ config.maxEdges }}
      </div>
      <div class="actions">
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
        :nodes="state.graph.nodes"
        :edges="state.graph.edges"
        :width="width"
        :height="height"
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
import { reactive } from 'vue'
import PFGraphSVG from './PFGraphSVG.vue'
import PFInspector from './PFInspector.vue'
import PFContextMenu from './PFContextMenu.vue'
import { usePFGraph } from '../composables'
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
  selectedNodeObjects
} = usePFGraph(props.config)

// Phase 4: Context menu state
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  nodeId: ''
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
  border: 1px solid #ddd;
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
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  font-size: 12px;
}

.stats {
  color: #666;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background-color: #fff;
  cursor: pointer;
  font-size: 11px;
}

.btn:hover {
  background-color: #f0f0f0;
}

.btn-danger {
  background-color: #f44336;
  color: white;
  border-color: #d32f2f;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.selection-info {
  padding: 4px 12px;
  background-color: #e3f2fd;
  border-top: 1px solid #ddd;
  font-size: 11px;
  color: #1976d2;
}
</style>

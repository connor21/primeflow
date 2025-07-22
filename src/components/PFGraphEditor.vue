<template>
  <div class="pf-graph-editor">
    <div class="editor-toolbar">
      <div class="stats">
        Nodes: {{ nodeCount }}/{{ config.maxNodes }} | 
        Edges: {{ edgeCount }}/{{ config.maxEdges }}
      </div>
      <div class="actions">
        <button @click="clearGraph" class="btn btn-danger">Clear Graph</button>
      </div>
    </div>
    
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
    />
    
    <div v-if="state.selectedNodes.length > 0" class="selection-info">
      Selected nodes: {{ state.selectedNodes.length }}
    </div>
  </div>
</template>

<script setup lang="ts">

import PFGraphSVG from './PFGraphSVG.vue'
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
  clearGraph: clearGraphState,
  loadGraph,
  exportGraph
} = usePFGraph(props.config)

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
  // This will be used for drag operations in Phase 3
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
  // This will be used for edge creation in Phase 3
  console.log('Port clicked:', nodeId, portId, event)
}

function handleCanvasClick(event: MouseEvent): void {
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
    clearSelection()
    emit('node-selected', [])
    emit('edge-selected', [])
  }
}

function clearGraph(): void {
  clearGraphState()
  emit('graph-updated')
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

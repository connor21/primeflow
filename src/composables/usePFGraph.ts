import { reactive, computed } from 'vue'
import type { PFGraph, PFNode, PFEdge, PFGraphConfig, PFGraphState } from '../types'

const DEFAULT_CONFIG: PFGraphConfig = {
  maxNodes: 100,
  maxEdges: 200,
  nodeDefaults: {
    width: 120,
    height: 80
  }
}

export function usePFGraph(initialConfig?: Partial<PFGraphConfig>) {
  const config = reactive({ ...DEFAULT_CONFIG, ...initialConfig })
  
  const state = reactive<PFGraphState>({
    graph: {
      nodes: [],
      edges: [],
      config
    },
    selectedNodes: [],
    selectedEdges: [],
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  })

  // Computed properties
  const nodeCount = computed(() => state.graph.nodes.length)
  const edgeCount = computed(() => state.graph.edges.length)
  const canAddNode = computed(() => nodeCount.value < config.maxNodes!)
  const canAddEdge = computed(() => edgeCount.value < config.maxEdges!)

  // Node operations
  function addNode(node: Omit<PFNode, 'id'>): string | null {
    if (!canAddNode.value) {
      console.warn(`Cannot add node: maximum of ${config.maxNodes} nodes reached`)
      return null
    }

    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNode: PFNode = {
      ...node,
      id,
      width: node.width || config.nodeDefaults!.width,
      height: node.height || config.nodeDefaults!.height,
      selected: false
    }

    state.graph.nodes.push(newNode)
    return id
  }

  function removeNode(nodeId: string): void {
    const nodeIndex = state.graph.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) return

    // Remove all edges connected to this node
    state.graph.edges = state.graph.edges.filter(
      edge => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
    )

    // Remove the node
    state.graph.nodes.splice(nodeIndex, 1)

    // Remove from selection
    const selectedIndex = state.selectedNodes.indexOf(nodeId)
    if (selectedIndex !== -1) {
      state.selectedNodes.splice(selectedIndex, 1)
    }
  }

  function updateNode(nodeId: string, updates: Partial<PFNode>): void {
    const node = state.graph.nodes.find(n => n.id === nodeId)
    if (node) {
      Object.assign(node, updates)
    }
  }

  function getNode(nodeId: string): PFNode | undefined {
    return state.graph.nodes.find(n => n.id === nodeId)
  }

  // Edge operations
  function addEdge(edge: Omit<PFEdge, 'id'>): string | null {
    if (!canAddEdge.value) {
      console.warn(`Cannot add edge: maximum of ${config.maxEdges} edges reached`)
      return null
    }

    // Validate that source and target nodes exist
    const sourceNode = getNode(edge.sourceNodeId)
    const targetNode = getNode(edge.targetNodeId)
    
    if (!sourceNode || !targetNode) {
      console.warn('Cannot add edge: source or target node not found')
      return null
    }

    // Validate that ports exist and are correct types
    const sourcePort = sourceNode.ports.find(p => p.id === edge.sourcePortId)
    const targetPort = targetNode.ports.find(p => p.id === edge.targetPortId)

    if (!sourcePort || !targetPort) {
      console.warn('Cannot add edge: source or target port not found')
      return null
    }

    if (sourcePort.type !== 'output' || targetPort.type !== 'input') {
      console.warn('Cannot add edge: must connect output port to input port')
      return null
    }

    // Check if edge already exists
    const existingEdge = state.graph.edges.find(
      e => e.sourceNodeId === edge.sourceNodeId && 
           e.sourcePortId === edge.sourcePortId &&
           e.targetNodeId === edge.targetNodeId &&
           e.targetPortId === edge.targetPortId
    )

    if (existingEdge) {
      console.warn('Edge already exists between these ports')
      return null
    }

    const id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newEdge: PFEdge = {
      ...edge,
      id,
      selected: false
    }

    state.graph.edges.push(newEdge)
    return id
  }

  function removeEdge(edgeId: string): void {
    const edgeIndex = state.graph.edges.findIndex(e => e.id === edgeId)
    if (edgeIndex === -1) return

    state.graph.edges.splice(edgeIndex, 1)

    // Remove from selection
    const selectedIndex = state.selectedEdges.indexOf(edgeId)
    if (selectedIndex !== -1) {
      state.selectedEdges.splice(selectedIndex, 1)
    }
  }

  function getEdge(edgeId: string): PFEdge | undefined {
    return state.graph.edges.find(e => e.id === edgeId)
  }

  // Selection operations
  function selectNode(nodeId: string, multiSelect = false): void {
    if (!multiSelect) {
      clearSelection()
    }

    if (!state.selectedNodes.includes(nodeId)) {
      state.selectedNodes.push(nodeId)
      const node = getNode(nodeId)
      if (node) {
        node.selected = true
      }
    }
  }

  function deselectNode(nodeId: string): void {
    const index = state.selectedNodes.indexOf(nodeId)
    if (index !== -1) {
      state.selectedNodes.splice(index, 1)
      const node = getNode(nodeId)
      if (node) {
        node.selected = false
      }
    }
  }

  function selectEdge(edgeId: string, multiSelect = false): void {
    if (!multiSelect) {
      clearSelection()
    }

    if (!state.selectedEdges.includes(edgeId)) {
      state.selectedEdges.push(edgeId)
      const edge = getEdge(edgeId)
      if (edge) {
        edge.selected = true
      }
    }
  }

  function deselectEdge(edgeId: string): void {
    const index = state.selectedEdges.indexOf(edgeId)
    if (index !== -1) {
      state.selectedEdges.splice(index, 1)
      const edge = getEdge(edgeId)
      if (edge) {
        edge.selected = false
      }
    }
  }

  function clearSelection(): void {
    // Clear node selections
    state.selectedNodes.forEach(nodeId => {
      const node = getNode(nodeId)
      if (node) {
        node.selected = false
      }
    })
    state.selectedNodes.length = 0

    // Clear edge selections
    state.selectedEdges.forEach(edgeId => {
      const edge = getEdge(edgeId)
      if (edge) {
        edge.selected = false
      }
    })
    state.selectedEdges.length = 0
  }

  // Utility functions
  function clearGraph(): void {
    state.graph.nodes.length = 0
    state.graph.edges.length = 0
    clearSelection()
  }

  function loadGraph(graph: PFGraph): void {
    clearGraph()
    state.graph.nodes.push(...graph.nodes)
    state.graph.edges.push(...graph.edges)
    Object.assign(config, graph.config)
  }

  function exportGraph(): PFGraph {
    return {
      nodes: [...state.graph.nodes],
      edges: [...state.graph.edges],
      config: { ...config }
    }
  }

  return {
    // State
    state,
    config,
    
    // Computed
    nodeCount,
    edgeCount,
    canAddNode,
    canAddEdge,
    
    // Node operations
    addNode,
    removeNode,
    updateNode,
    getNode,
    
    // Edge operations
    addEdge,
    removeEdge,
    getEdge,
    
    // Selection operations
    selectNode,
    deselectNode,
    selectEdge,
    deselectEdge,
    clearSelection,
    
    // Utility operations
    clearGraph,
    loadGraph,
    exportGraph
  }
}

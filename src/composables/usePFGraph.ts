import { reactive, computed } from 'vue'
import type { PFGraph, PFNode, PFEdge, PFGraphConfig, PFGraphState } from '../types'
import { usePFHistory } from './usePFHistory'

/**
 * Default configuration values for new graphs
 * 
 * These values provide sensible defaults for graph behavior and node dimensions
 * when no custom configuration is provided.
 */
const DEFAULT_CONFIG: PFGraphConfig = {
  maxNodes: 100,
  maxEdges: 200,
  nodeDefaults: {
    width: 120,
    height: 80
  }
}

/**
 * Main composable for managing graph state and operations
 * 
 * This composable provides a complete API for creating and managing a Primeflow graph,
 * including nodes, edges, selection state, and history tracking. It handles all CRUD
 * operations with proper validation and maintains reactive state for UI components.
 * 
 * @param initialConfig - Optional partial configuration to override defaults
 * @returns Object containing reactive state and all graph manipulation functions
 * 
 * @example
 * ```typescript
 * const { state, addNode, addEdge, selectNode } = usePFGraph({
 *   maxNodes: 50,
 *   maxEdges: 100
 * })
 * 
 * // Add a new node
 * const nodeId = addNode({
 *   type: 'filter',
 *   title: 'Blur Filter',
 *   x: 100,
 *   y: 200,
 *   ports: [{ id: 'input', name: 'Input', type: 'input', dataType: 'image' }]
 * })
 * ```
 */
export function usePFGraph(initialConfig?: Partial<PFGraphConfig>) {
  const config = reactive({ ...DEFAULT_CONFIG, ...initialConfig })
  const history = usePFHistory()
  
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
  
  // Phase 4: Computed property for selected node objects
  const selectedNodeObjects = computed(() => 
    state.selectedNodes.map(nodeId => 
      state.graph.nodes.find(node => node.id === nodeId)
    ).filter(node => node !== undefined) as PFNode[]
  )

  // Node operations
  /**
   * Adds a new node to the graph with automatic ID generation
   * 
   * Creates a new node with a unique ID and adds it to the graph if the maximum
   * node limit has not been reached. Also ensures all ports have unique IDs.
   * 
   * @param node - Node data without ID (ID will be auto-generated)
   * @returns The generated node ID if successful, null if max nodes reached
   * 
   * @example
   * ```typescript
   * const nodeId = addNode({
   *   type: 'filter',
   *   title: 'Blur Filter',
   *   x: 100,
   *   y: 200,
   *   ports: [{ name: 'Input', type: 'input', dataType: 'image' }]
   * })
   * ```
   */
  function addNode(node: Omit<PFNode, 'id'>): string | null {
    if (!canAddNode.value) {
      console.warn(`Cannot add node: maximum of ${config.maxNodes} nodes reached`)
      return null
    }

    const beforeState = exportGraph()
    
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNode: PFNode = {
      ...node,
      id,
      selected: false,
      // Ensure ports have unique IDs
      ports: node.ports.map(port => ({
        ...port,
        id: port.id || `port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    }
    
    state.graph.nodes.push(newNode)
    
    const afterState = exportGraph()
    history.recordAction('add_node', beforeState, afterState, `Add node "${newNode.title}"`);
    
    return id
  }

  /**
   * Removes a node from the graph and all its connected edges
   * 
   * Deletes the specified node and automatically removes all edges that were
   * connected to any of its ports. Also removes the node from selection if selected.
   * 
   * @param nodeId - Unique identifier of the node to remove
   * @returns true if node was found and removed, false if node not found
   */
  function removeNode(nodeId: string): boolean {
    const nodeIndex = state.graph.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) return false

    const beforeState = exportGraph()
    const nodeTitle = state.graph.nodes[nodeIndex].title

    // Remove all edges connected to this node
    state.graph.edges = state.graph.edges.filter(
      edge => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
    )

    // Remove the node
    state.graph.nodes.splice(nodeIndex, 1)

    // Remove from selection if selected
    deselectNode(nodeId)
    
    const afterState = exportGraph()
    history.recordAction('remove_node', beforeState, afterState, `Remove node "${nodeTitle}"`);
    
    return true
  }

  /**
   * Updates properties of an existing node
   * 
   * Applies the provided updates to the specified node. Records history for
   * position changes but not for selection state changes to avoid cluttering
   * the undo stack with selection operations.
   * 
   * @param nodeId - Unique identifier of the node to update
   * @param updates - Partial node data to merge with existing node
   * @returns true if node was found and updated, false if node not found
   */
  function updateNode(nodeId: string, updates: Partial<Omit<PFNode, 'id'>>): boolean {
    const node = getNode(nodeId)
    if (!node) return false

    const beforeState = exportGraph()
    Object.assign(node, updates)
    const afterState = exportGraph()
    
    // Only record history for position changes (moves), not selection changes
    if (updates.x !== undefined || updates.y !== undefined) {
      history.recordAction('move_node', beforeState, afterState, `Move node "${node.title}"`);
    }
    
    return true
  }

  /**
   * Retrieves a node by its unique identifier
   * 
   * @param nodeId - Unique identifier of the node to find
   * @returns The node object if found, undefined otherwise
   */
  function getNode(nodeId: string): PFNode | undefined {
    return state.graph.nodes.find(n => n.id === nodeId)
  }

  // Edge operations
  /**
   * Adds a new edge connecting two ports on different nodes
   * 
   * Creates a connection between an output port and an input port with full validation.
   * Ensures the edge limit hasn't been reached, both nodes exist, both ports exist,
   * and the connection is valid (output to input only).
   * 
   * @param edge - Edge data without ID (ID will be auto-generated)
   * @returns The generated edge ID if successful, null if validation fails or max edges reached
   * 
   * @example
   * ```typescript
   * const edgeId = addEdge({
   *   sourceNodeId: 'node1',
   *   sourcePortId: 'output1',
   *   targetNodeId: 'node2',
   *   targetPortId: 'input1'
   * })
   * ```
   */
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

    const beforeState = exportGraph()
    
    const id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newEdge: PFEdge = {
      ...edge,
      id,
      selected: false
    }

    state.graph.edges.push(newEdge)
    
    const afterState = exportGraph()
    history.recordAction('add_edge', beforeState, afterState, `Add edge from "${sourceNode.title}" to "${targetNode.title}"`);
    
    return id
  }

  /**
   * Removes an edge from the graph
   * 
   * Deletes the specified edge and removes it from selection if it was selected.
   * Records the action in history for undo/redo functionality.
   * 
   * @param edgeId - Unique identifier of the edge to remove
   */
  function removeEdge(edgeId: string): void {
    const edgeIndex = state.graph.edges.findIndex(e => e.id === edgeId)
    if (edgeIndex === -1) return

    const beforeState = exportGraph()
    const edge = state.graph.edges[edgeIndex]
    const sourceNode = getNode(edge.sourceNodeId)
    const targetNode = getNode(edge.targetNodeId)

    state.graph.edges.splice(edgeIndex, 1)
    
    const afterState = exportGraph()
    history.recordAction('remove_edge', beforeState, afterState, `Remove edge from "${sourceNode?.title || 'unknown'}" to "${targetNode?.title || 'unknown'}"`);
    
    // Remove from selection
    const selectedIndex = state.selectedEdges.indexOf(edgeId)
    if (selectedIndex !== -1) {
      state.selectedEdges.splice(selectedIndex, 1)
    }
  }

  /**
   * Retrieves an edge by its unique identifier
   * 
   * @param edgeId - Unique identifier of the edge to find
   * @returns The edge object if found, undefined otherwise
   */
  function getEdge(edgeId: string): PFEdge | undefined {
    return state.graph.edges.find(e => e.id === edgeId)
  }

  // Selection operations
  /**
   * Selects a node, optionally preserving existing selection
   * 
   * Adds the specified node to the selection. If multiSelect is false,
   * clears all existing selections first. Updates both the selection array
   * and the node's selected property.
   * 
   * @param nodeId - Unique identifier of the node to select
   * @param multiSelect - Whether to preserve existing selections (default: false)
   */
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

  /**
   * Removes a node from the current selection
   * 
   * @param nodeId - Unique identifier of the node to deselect
   */
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

  /**
   * Selects an edge, optionally preserving existing selection
   * 
   * @param edgeId - Unique identifier of the edge to select
   * @param multiSelect - Whether to preserve existing selections (default: false)
   */
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

  /**
   * Removes an edge from the current selection
   * 
   * @param edgeId - Unique identifier of the edge to deselect
   */
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

  /**
   * Clears all selections (both nodes and edges)
   * 
   * Removes all items from selection and updates their selected properties.
   */
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

  // Utility operations
  function clearGraph(): void {
    state.graph.nodes = []
    state.graph.edges = []
    clearSelection()
  }

  function loadGraph(graph: PFGraph): void {
    state.graph = { ...graph, config }
    clearSelection()
  }

  function exportGraph(): PFGraph {
    return {
      nodes: state.graph.nodes.map(node => ({ ...node, selected: false })),
      edges: state.graph.edges.map(edge => ({ ...edge, selected: false })),
      config
    }
  }

  // Phase 4: Property and image operations
  function updateNodeProperty(nodeId: string, propertyKey: string, value: any): boolean {
    const node = getNode(nodeId)
    if (!node) return false
    
    const beforeState = exportGraph()
    
    if (!node.properties) {
      node.properties = {}
    }
    
    node.properties[propertyKey] = value
    
    const afterState = exportGraph()
    history.recordAction('update_property', beforeState, afterState, `Update property "${propertyKey}" of node "${node.title}"`);
    
    return true
  }

  function updateNodeImage(nodeId: string, imageUrl: string): boolean {
    const node = getNode(nodeId)
    if (!node) return false
    
    const beforeState = exportGraph()
    node.image = imageUrl
    const afterState = exportGraph()
    
    history.recordAction('update_property', beforeState, afterState, `Update image of node "${node.title}"`);
    
    return true
  }

  function duplicateNode(nodeId: string): string | null {
    const originalNode = getNode(nodeId)
    if (!originalNode) return null
    
    const duplicatedNode = {
      ...originalNode,
      title: `${originalNode.title} (Copy)`,
      x: originalNode.x + 20,
      y: originalNode.y + 20,
      properties: originalNode.properties ? { ...originalNode.properties } : undefined,
      ports: originalNode.ports.map(port => ({ ...port, id: `${port.id}_copy_${Date.now()}` }))
    }
    
    const newNodeId = addNode(duplicatedNode)
    
    // Override the automatic history recording from addNode with a more specific description
    if (newNodeId && history.state.undoStack.length > 0) {
      const lastAction = history.state.undoStack[history.state.undoStack.length - 1]
      lastAction.description = `Duplicate node "${originalNode.title}"`
      lastAction.type = 'duplicate_node'
    }
    
    return newNodeId
  }

  function deleteSelectedNodes(): void {
    const selectedNodeIds = [...state.selectedNodes] // Copy array to avoid mutation issues
    if (selectedNodeIds.length === 0) return
    
    const beforeState = exportGraph()
    
    // Remove all edges connected to selected nodes
    state.graph.edges = state.graph.edges.filter(edge => 
      !selectedNodeIds.includes(edge.sourceNodeId) && 
      !selectedNodeIds.includes(edge.targetNodeId)
    )
    
    // Remove selected nodes (without individual history recording)
    selectedNodeIds.forEach(nodeId => {
      const nodeIndex = state.graph.nodes.findIndex(n => n.id === nodeId)
      if (nodeIndex !== -1) {
        state.graph.nodes.splice(nodeIndex, 1)
      }
    })
    
    clearSelection()
    
    const afterState = exportGraph()
    const nodeCount = selectedNodeIds.length
    history.recordAction('delete_selected', beforeState, afterState, `Delete ${nodeCount} selected node${nodeCount > 1 ? 's' : ''}`);
  }

  // Undo/Redo operations
  function undo(): boolean {
    const action = history.undo()
    if (!action) return false
    
    // Apply the before state
    loadGraph(action.beforeState)
    return true
  }

  function redo(): boolean {
    const action = history.redo()
    if (!action) return false
    
    // Apply the after state
    loadGraph(action.afterState)
    return true
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
    selectedNodeObjects,
    
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
    exportGraph,
    
    // Phase 4: Property and image operations
    updateNodeProperty,
    updateNodeImage,
    duplicateNode,
    deleteSelectedNodes,
    
    // Phase 5: Undo/Redo operations
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undoDescription: history.undoDescription,
    redoDescription: history.redoDescription,
    clearHistory: history.clearHistory,
    getHistoryInfo: history.getHistoryInfo
  }
}

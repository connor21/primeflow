/**
 * Core graph types for Primeflow
 */

export interface PFPort {
  id: string
  name: string
  type: 'input' | 'output'
  dataType: string
  required?: boolean
}

export interface PFNode {
  id: string
  type: string
  title: string
  x: number
  y: number
  width?: number
  height?: number
  image?: string
  ports: PFPort[]
  properties?: Record<string, any>
  selected?: boolean
}

export interface PFEdge {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  selected?: boolean
}

export interface PFGraphConfig {
  maxNodes?: number
  maxEdges?: number
  nodeDefaults?: {
    width: number
    height: number
  }
}

export interface PFGraph {
  nodes: PFNode[]
  edges: PFEdge[]
  config: PFGraphConfig
}

export interface PFGraphState {
  graph: PFGraph
  selectedNodes: string[]
  selectedEdges: string[]
  isDragging: boolean
  dragOffset: { x: number; y: number }
}

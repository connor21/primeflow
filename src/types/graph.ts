/**
 * Core graph types for Primeflow - A visual node-based graph editor
 * 
 * This module defines the fundamental data structures used throughout the Primeflow system
 * for representing nodes, edges, ports, and graph configurations.
 */

/**
 * Represents a connection point on a node that can send or receive data
 * 
 * Ports are the connection points that allow nodes to be linked together via edges.
 * Each port has a specific data type and direction (input or output).
 */
export interface PFPort {
  /** Unique identifier for this port */
  id: string
  /** Human-readable name displayed in the UI */
  name: string
  /** Direction of data flow - 'input' receives data, 'output' sends data */
  type: 'input' | 'output'
  /** The type of data this port accepts/provides (e.g., 'string', 'number', 'image') */
  dataType: string
  /** Whether this port must be connected for the node to function properly */
  required?: boolean
}

/**
 * Represents a single node in the graph with its visual and functional properties
 * 
 * Nodes are the primary building blocks of the graph. They can be dragged around,
 * selected, and connected to other nodes via their ports.
 */
export interface PFNode {
  /** Unique identifier for this node */
  id: string
  /** Category or type of node (e.g., 'filter', 'generator', 'output') */
  type: string
  /** Display name shown on the node */
  title: string
  /** X coordinate position on the canvas */
  x: number
  /** Y coordinate position on the canvas */
  y: number
  /** Width of the node in pixels (optional, uses default if not specified) */
  width?: number
  /** Height of the node in pixels (optional, uses default if not specified) */
  height?: number
  /** URL to an image to display on the node (shows 3D box placeholder if empty/invalid) */
  image?: string
  /** Array of input and output ports for this node */
  ports: PFPort[]
  /** Custom properties specific to this node type */
  properties?: Record<string, any>
  /** Whether this node is currently selected in the UI */
  selected?: boolean
}

/**
 * Represents a connection between two ports on different nodes
 * 
 * Edges define the data flow between nodes by connecting an output port
 * on one node to an input port on another node.
 */
export interface PFEdge {
  /** Unique identifier for this edge */
  id: string
  /** ID of the node that contains the source (output) port */
  sourceNodeId: string
  /** ID of the output port where this edge originates */
  sourcePortId: string
  /** ID of the node that contains the target (input) port */
  targetNodeId: string
  /** ID of the input port where this edge terminates */
  targetPortId: string
  /** Whether this edge is currently selected in the UI */
  selected?: boolean
}

/**
 * Configuration options for graph behavior and limits
 * 
 * This interface defines the constraints and default values that govern
 * how the graph behaves, including size limits and default node dimensions.
 */
export interface PFGraphConfig {
  /** Maximum number of nodes allowed in the graph (unlimited if not specified) */
  maxNodes?: number
  /** Maximum number of edges allowed in the graph (unlimited if not specified) */
  maxEdges?: number
  /** Default dimensions for new nodes */
  nodeDefaults?: {
    /** Default width in pixels for new nodes */
    width: number
    /** Default height in pixels for new nodes */
    height: number
  }
}

/**
 * Complete graph data structure containing all nodes, edges, and configuration
 * 
 * This is the root data structure that represents the entire state of a graph,
 * including all its nodes, connections, and behavioral settings.
 */
export interface PFGraph {
  /** All nodes currently in the graph */
  nodes: PFNode[]
  /** All edges currently connecting nodes in the graph */
  edges: PFEdge[]
  /** Configuration settings that control graph behavior */
  config: PFGraphConfig
}

export interface PFGraphState {
  graph: PFGraph
  selectedNodes: string[]
  selectedEdges: string[]
  isDragging: boolean
  dragOffset: { x: number; y: number }
}

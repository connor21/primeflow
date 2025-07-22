<!--
  This template renders an interactive SVG graph visualization with nodes and edges:
  - The SVG canvas is responsive to the provided width and height.
  - A grid pattern is used as the background for visual guidance.
  - Edges are rendered as paths based on their connections, with click event handling for selection.
  - Nodes are displayed as groups containing a rectangle, title, and optional image or placeholder.
  - Each node can have multiple input and output ports rendered as circles with distinct colors.
  - Interactive features include:
    * Node dragging (single and multi-select)
    * Edge creation by dragging from output to input ports
    * Node selection with click (single) and Shift/Ctrl/Cmd+click (multi-select)
    * Visual feedback for all interactions
-->
<template>
  <svg
    :width="width"
    :height="height"
    class="pf-graph-svg"
    @click="handleCanvasClick"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
  >
    <!-- Grid background (optional) -->
    <defs>
      <pattern
        id="grid"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 20 0 L 0 0 0 20"
          fill="none"
          stroke="#e5e5e5"
          stroke-width="1"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />

    <!-- Temporary edge being created -->
    <path
      v-if="edgeCreation.active"
      :d="getTemporaryEdgePath()"
      class="edge temporary-edge"
      stroke="#2196F3"
      stroke-width="2"
      stroke-dasharray="5,5"
      fill="none"
      pointer-events="none"
    />

    <!-- Edges -->
    <g class="edges">
      <path
        v-for="edge in edges"
        :key="edge.id"
        :d="getEdgePath(edge)"
        :class="['edge', { selected: edge.selected }]"
        stroke="#666"
        stroke-width="2"
        fill="none"
        @click.stop="handleEdgeClick(edge.id, $event)"
      />
    </g>

    <!-- Nodes -->
    <g class="nodes">
      <g
        v-for="node in nodes"
        :key="node.id"
        :transform="`translate(${node.x}, ${node.y})`"
        :class="['node', { selected: node.selected }]"
@mousedown="handleNodeMouseDown(node.id, $event)"
        @click.stop="handleNodeClick(node.id, $event)"
      >
        <!-- Node rectangle -->
        <rect
          :width="node.width || 120"
          :height="node.height || 80"
          :class="['node-rect', { selected: node.selected }]"
          fill="#f9f9f9"
          stroke="#ccc"
          stroke-width="1"
          rx="4"
        />

        <!-- Node title -->
        <text
          :x="(node.width || 120) / 2"
          y="20"
          text-anchor="middle"
          class="node-title"
          font-family="Arial, sans-serif"
          font-size="12"
          fill="#333"
        >
          {{ node.title }}
        </text>

        <!-- Node image placeholder -->
        <rect
          v-if="!node.image"
          :x="((node.width || 120) - 32) / 2"
          y="30"
          width="32"
          height="32"
          fill="#ddd"
          stroke="#bbb"
          rx="2"
        />
        <image
          v-else
          :href="node.image"
          :x="((node.width || 120) - 32) / 2"
          y="30"
          width="32"
          height="32"
        />

        <!-- Input ports -->
        <g class="input-ports">
          <g
            v-for="(port, index) in getInputPorts(node)"
            :key="port.id"
            :transform="`translate(${getPortPosition(port, index, getInputPorts(node).length, node, 'input').x}, ${getPortPosition(port, index, getInputPorts(node).length, node, 'input').y})`"
class="port input-port"
@click.stop="handlePortClick(node.id, port.id, $event)"
            @mousedown.stop="handlePortMouseDown(node.id, port.id, $event, 'input')"
            @mouseup.stop="handlePortMouseUp(node.id, port.id, $event, 'input')"
          >
            <circle
              r="4"
              fill="#4CAF50"
              stroke="#333"
              stroke-width="1"
            />
            <title>{{ port.name }} ({{ port.dataType }})</title>
          </g>
        </g>

        <!-- Output ports -->
        <g class="output-ports">
          <g
            v-for="(port, index) in getOutputPorts(node)"
            :key="port.id"
            :transform="`translate(${getPortPosition(port, index, getOutputPorts(node).length, node, 'output').x}, ${getPortPosition(port, index, getOutputPorts(node).length, node, 'output').y})`"
class="port output-port"
@click.stop="handlePortClick(node.id, port.id, $event)"
            @mousedown.stop="handlePortMouseDown(node.id, port.id, $event, 'output')"
            @mouseup.stop="handlePortMouseUp(node.id, port.id, $event, 'output')"
          >
            <circle
              r="4"
              fill="#FF9800"
              stroke="#333"
              stroke-width="1"
            />
            <title>{{ port.name }} ({{ port.dataType }})</title>
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { PFNode, PFEdge, PFPort } from '../types'

interface Props {
  nodes: PFNode[]
  edges: PFEdge[]
  width?: number
  height?: number
}

interface Emits {
  (e: 'node-click', nodeId: string, event: MouseEvent): void
  (e: 'node-mousedown', nodeId: string, event: MouseEvent): void
  (e: 'edge-click', edgeId: string, event: MouseEvent): void
  (e: 'port-click', nodeId: string, portId: string, event: MouseEvent): void
  (e: 'canvas-click', event: MouseEvent): void
  (e: 'node-drag', nodeId: string, deltaX: number, deltaY: number): void
  (e: 'nodes-drag', nodeIds: string[], deltaX: number, deltaY: number): void
  (e: 'edge-create', fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600
})

const emit = defineEmits<Emits>()

// Interactive state
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragNodeIds = ref<string[]>([])

// Edge creation state
const edgeCreation = reactive({
  active: false,
  fromNodeId: '',
  fromPortId: '',
  fromPortType: '' as 'input' | 'output',
  currentPos: { x: 0, y: 0 }
})

// Helper functions
function getInputPorts(node: PFNode): PFPort[] {
  return node.ports.filter(port => port.type === 'input')
}

function getOutputPorts(node: PFNode): PFPort[] {
  return node.ports.filter(port => port.type === 'output')
}

function getPortPosition(
  _port: PFPort,
  index: number,
  totalPorts: number,
  node: PFNode,
  side: 'input' | 'output'
): { x: number; y: number } {
  const nodeWidth = node.width || 120
  const nodeHeight = node.height || 80
  const spacing = nodeHeight / (totalPorts + 1)
  
  return {
    x: side === 'input' ? 0 : nodeWidth,
    y: spacing * (index + 1)
  }
}

function getPortWorldPosition(nodeId: string, portId: string): { x: number; y: number } | null {
  const node = props.nodes.find(n => n.id === nodeId)
  if (!node) return null

  const port = node.ports.find(p => p.id === portId)
  if (!port) return null

  const inputPorts = getInputPorts(node)
  const outputPorts = getOutputPorts(node)
  
  let index: number
  let totalPorts: number
  let side: 'input' | 'output'

  if (port.type === 'input') {
    index = inputPorts.findIndex(p => p.id === portId)
    totalPorts = inputPorts.length
    side = 'input'
  } else {
    index = outputPorts.findIndex(p => p.id === portId)
    totalPorts = outputPorts.length
    side = 'output'
  }

  const localPos = getPortPosition(port, index, totalPorts, node, side)
  
  return {
    x: node.x + localPos.x,
    y: node.y + localPos.y
  }
}

function getEdgePath(edge: PFEdge): string {
  const sourcePos = getPortWorldPosition(edge.sourceNodeId, edge.sourcePortId)
  const targetPos = getPortWorldPosition(edge.targetNodeId, edge.targetPortId)
  
  if (!sourcePos || !targetPos) return ''

  // Create a curved path
  const dx = targetPos.x - sourcePos.x
  const controlOffset = Math.abs(dx) * 0.5

  return `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + controlOffset} ${sourcePos.y}, ${targetPos.x - controlOffset} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`
}

// Helper function for temporary edge path
function getTemporaryEdgePath(): string {
  if (!edgeCreation.active) return ''
  
  const fromPos = getPortWorldPosition(edgeCreation.fromNodeId, edgeCreation.fromPortId)
  if (!fromPos) return ''
  
  const toPos = edgeCreation.currentPos
  const dx = toPos.x - fromPos.x
  const controlOffset = Math.abs(dx) * 0.5
  
  return `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + controlOffset} ${fromPos.y} ${toPos.x - controlOffset} ${toPos.y} ${toPos.x} ${toPos.y}`
}

// Event handlers
function handleNodeClick(nodeId: string, event: MouseEvent): void {
  // Handle multi-select with Shift/Ctrl/Cmd
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    emit('node-click', nodeId, event)
  } else {
    emit('node-click', nodeId, event)
  }
}

function handleNodeMouseDown(nodeId: string, event: MouseEvent): void {
  event.preventDefault()
  
  // Start dragging
  isDragging.value = true
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  
  // Determine which nodes to drag
  const selectedNodes = props.nodes.filter(node => node.selected)
  if (selectedNodes.some(node => node.id === nodeId)) {
    // If clicked node is selected, drag all selected nodes
    dragNodeIds.value = selectedNodes.map(node => node.id)
  } else {
    // If clicked node is not selected, drag only this node
    dragNodeIds.value = [nodeId]
  }
  
  emit('node-mousedown', nodeId, event)
}

function handleMouseMove(event: MouseEvent): void {
  if (isDragging.value && dragNodeIds.value.length > 0) {
    // Handle node dragging
    const deltaX = event.clientX - dragStartPos.value.x
    const deltaY = event.clientY - dragStartPos.value.y
    
    if (dragNodeIds.value.length === 1) {
      emit('node-drag', dragNodeIds.value[0], deltaX, deltaY)
    } else {
      emit('nodes-drag', dragNodeIds.value, deltaX, deltaY)
    }
    
    dragStartPos.value = { x: event.clientX, y: event.clientY }
  } else if (edgeCreation.active) {
    // Handle edge creation preview
    const rect = (event.target as Element).closest('svg')?.getBoundingClientRect()
    if (rect) {
      edgeCreation.currentPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }
  }
}

function handleMouseUp(): void {
  if (isDragging.value) {
    isDragging.value = false
    dragNodeIds.value = []
  }
  
  // Cancel edge creation if mouse up happens outside of a port
  if (edgeCreation.active) {
  // Edge creation cancelled
    edgeCreation.active = false
    edgeCreation.fromNodeId = ''
    edgeCreation.fromPortId = ''
    edgeCreation.fromPortType = 'output'
  }
}

function handleMouseLeave(): void {
  // Cancel any ongoing interactions when mouse leaves the SVG
  handleMouseUp()
  
  // Also cancel edge creation when mouse leaves SVG
  if (edgeCreation.active) {
    edgeCreation.active = false
    edgeCreation.fromNodeId = ''
    edgeCreation.fromPortId = ''
    edgeCreation.fromPortType = 'output'
  }
}

function handlePortMouseDown(nodeId: string, portId: string, event: MouseEvent, portType: 'input' | 'output'): void {
  event.preventDefault()
  event.stopPropagation()
  
if (portType === 'output') {
    // Start edge creation from output port
    edgeCreation.active = true
    edgeCreation.fromNodeId = nodeId
    edgeCreation.fromPortId = portId
    edgeCreation.fromPortType = portType
    
    const rect = (event.target as Element).closest('svg')?.getBoundingClientRect()
    if (rect) {
      edgeCreation.currentPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }
  }
}

function handlePortMouseUp(nodeId: string, portId: string, event: MouseEvent, portType: 'input' | 'output'): void {
  event.preventDefault()
  event.stopPropagation()
  
if (edgeCreation.active && portType === 'input') {
    // Complete edge creation on input port
    const targetPort = props.nodes
      .find(node => node.id === nodeId)
      ?.ports.find(port => port.id === portId)
    
    if (targetPort && targetPort.type === 'input' && edgeCreation.fromPortType === 'output') {
      // Valid connection: output to input
      emit('edge-create', edgeCreation.fromNodeId, edgeCreation.fromPortId, nodeId, portId)
    }
    
    // Reset edge creation state
    edgeCreation.active = false
    edgeCreation.fromNodeId = ''
    edgeCreation.fromPortId = ''
    edgeCreation.fromPortType = 'output'
  }
}

function handleEdgeClick(edgeId: string, event: MouseEvent): void {
  emit('edge-click', edgeId, event)
}

function handlePortClick(nodeId: string, portId: string, event: MouseEvent): void {
if (edgeCreation.active) {
    // Complete edge creation (fallback for click events)
    const targetPort = props.nodes
      .find(node => node.id === nodeId)
      ?.ports.find(port => port.id === portId)
    
    if (targetPort && targetPort.type === 'input' && edgeCreation.fromPortType === 'output') {
      // Valid connection: output to input
      emit('edge-create', edgeCreation.fromNodeId, edgeCreation.fromPortId, nodeId, portId)
    }
    
    // Reset edge creation state
    edgeCreation.active = false
    edgeCreation.fromNodeId = ''
    edgeCreation.fromPortId = ''
    edgeCreation.fromPortType = 'output'
  } else {
    emit('port-click', nodeId, portId, event)
  }
}

function handleCanvasClick(event: MouseEvent): void {
  // Cancel edge creation on canvas click
  if (edgeCreation.active) {
    edgeCreation.active = false
    edgeCreation.fromNodeId = ''
    edgeCreation.fromPortId = ''
    edgeCreation.fromPortType = 'output'
  }
  
  emit('canvas-click', event)
}
</script>

<style scoped>
.pf-graph-svg {
  border: 1px solid #ddd;
  background-color: #fafafa;
  cursor: default;
}

.node {
  cursor: move;
}

.node-rect {
  transition: stroke 0.2s ease;
}

.node-rect.selected {
  stroke: #2196F3;
  stroke-width: 2;
}

.node-title {
  pointer-events: none;
  user-select: none;
}

.port {
  cursor: pointer;
}

.port:hover circle {
  stroke-width: 2;
  stroke: #000;
}

.edge {
  cursor: pointer;
  transition: stroke 0.2s ease;
}

.edge:hover {
  stroke: #333;
  stroke-width: 3;
}

.edge.selected {
  stroke: #2196F3;
  stroke-width: 3;
}

.temporary-edge {
  pointer-events: none;
  opacity: 0.8;
}

.node.selected {
  filter: drop-shadow(0 0 4px rgba(33, 150, 243, 0.5));
}
</style>

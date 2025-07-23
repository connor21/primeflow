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
    :viewBox="`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`"
    class="pf-graph-svg"
    @click="handleCanvasClick"
    @mousemove="handleMouseMoveWithPanning"
    @mouseup="handleMouseUpWithPanning"
    @mouseleave="handleMouseLeave"
    @wheel="handleWheel"
    @mousedown="handleCanvasMouseDown"
  >
    <!-- Enhanced Grid background with darker lines every 10 squares -->
    <defs>
      <!-- Fine grid pattern (every square) -->
      <pattern
        id="fine-grid"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 10 0 L 0 0 0 10"
          fill="none"
          stroke="var(--grid-color)"
          stroke-width="0.5"
          opacity="0.3"
        />
      </pattern>
      <!-- Major grid pattern (every 10 squares = 100px) -->
      <pattern
        id="major-grid"
        width="100"
        height="100"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 100 0 L 0 0 0 100"
          fill="none"
          stroke="var(--grid-color)"
          stroke-width="1.5"
          opacity="0.8"
        />
      </pattern>
    </defs>
    <!-- Extended grid background that covers the entire viewport area -->
    <rect 
      :x="viewport.x - viewport.width" 
      :y="viewport.y - viewport.height" 
      :width="viewport.width * 3" 
      :height="viewport.height * 3" 
      fill="url(#fine-grid)" 
      pointer-events="none"
    />
    <!-- Major grid overlay -->
    <rect 
      :x="viewport.x - viewport.width" 
      :y="viewport.y - viewport.height" 
      :width="viewport.width * 3" 
      :height="viewport.height * 3" 
      fill="url(#major-grid)" 
      pointer-events="none"
    />

    <!-- Temporary edge being created -->
    <path
      v-if="edgeCreation.active"
      :d="getTemporaryEdgePath()"
      class="edge temporary-edge"
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
        @contextmenu.prevent="handleNodeRightClick(node.id, $event)"
      >
        <!-- Node body rectangle -->
        <rect
          :width="node.width || 120"
          :height="node.height || 80"
          :class="['node-body', { selected: node.selected }]"
          rx="4"
        />

        <!-- Node header rectangle -->
        <rect
          :width="node.width || 120"
          height="28"
          :class="['node-header', { selected: node.selected }]"
          rx="4"
        />
        <!-- Header bottom border to separate from body -->
        <rect
          :width="node.width || 120"
          y="24"
          height="4"
          :class="['node-header', { selected: node.selected }]"
          rx="0"
        />

        <!-- Node image or 3D box placeholder in header upper left -->
        <g v-if="!node.image || !isValidImageUrl(node.image)" class="node-placeholder">
          <!-- 3D Box Placeholder -->
          <g transform="translate(4, 4)">
            <!-- Back face -->
            <rect x="2" y="2" width="16" height="16" fill="#e0e0e0" stroke="#bbb" rx="1"/>
            <!-- Front face -->
            <rect x="0" y="0" width="16" height="16" fill="#f5f5f5" stroke="#999" rx="1"/>
            <!-- Top face -->
            <polygon points="0,0 2,2 18,2 16,0" fill="#eeeeee" stroke="#aaa"/>
            <!-- Right face -->
            <polygon points="16,0 18,2 18,18 16,16" fill="#d5d5d5" stroke="#aaa"/>
            <!-- Icon in center -->
            <circle cx="8" cy="8" r="2" fill="#999"/>
            <rect x="7" y="6" width="2" height="1" fill="#fff" rx="0.5"/>
            <rect x="7" y="9" width="2" height="1" fill="#fff" rx="0.5"/>
          </g>
        </g>
        <image
          v-else
          :href="node.image"
          x="4"
          y="4"
          width="20"
          height="20"
          @error="handleImageError(node.id)"
          @load="handleImageLoad(node.id)"
        />

        <!-- Node title in header -->
        <text
          x="28"
          y="17"
          text-anchor="start"
          font-family="Arial, sans-serif"
          font-size="11"
          font-weight="bold"
          fill="var(--text-primary)"
        >
          {{ node.title }}
        </text>

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
            <!-- Input port label -->
            <text
              x="8"
              y="3"
              font-family="Arial, sans-serif"
              font-size="9"
              font-weight="500"
              fill="var(--text-primary)"
              text-anchor="start"
            >
              {{ port.name }}
            </text>
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
            <!-- Output port label -->
            <text
              x="-8"
              y="3"
              font-family="Arial, sans-serif"
              font-size="9"
              font-weight="500"
              fill="var(--text-primary)"
              text-anchor="end"
            >
              {{ port.name }}
            </text>
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
  // Phase 4: New events
  (e: 'node-right-click', nodeId: string, event: MouseEvent): void
  (e: 'image-error', nodeId: string): void
  (e: 'image-load', nodeId: string): void
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

// Phase 5: Pan/Zoom state
const viewport = reactive({
  x: 0,
  y: 0,
  width: props.width,
  height: props.height,
  scale: 1
})

const isPanning = ref(false)
const panStartPos = ref({ x: 0, y: 0 })
const panStartViewport = ref({ x: 0, y: 0 })

// Coordinate transformation helper functions
// Convert screen coordinates (mouse position) to world coordinates (SVG/graph space)
function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
  const svgElement = document.querySelector('.pf-graph-svg') as SVGElement
  if (!svgElement) return { x: 0, y: 0 }
  
  const rect = svgElement.getBoundingClientRect()
  
  // Calculate the position within the SVG element
  const svgX = screenX - rect.left
  const svgY = screenY - rect.top
  
  // Convert to world coordinates using the current viewport
  const worldX = viewport.x + (svgX / rect.width) * viewport.width
  const worldY = viewport.y + (svgY / rect.height) * viewport.height
  
  return { x: worldX, y: worldY }
}

// Convert world coordinates (SVG/graph space) to screen coordinates
// This function is defined for completeness and future use in additional features
// that may require converting world coordinates back to screen coordinates
// @ts-expect-error: Currently unused but kept for API completeness
function worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
  const svgElement = document.querySelector('.pf-graph-svg') as SVGElement
  if (!svgElement) return { x: 0, y: 0 }
  
  const rect = svgElement.getBoundingClientRect()
  
  // Convert from world to screen coordinates using the current viewport
  const svgX = ((worldX - viewport.x) / viewport.width) * rect.width
  const svgY = ((worldY - viewport.y) / viewport.height) * rect.height
  
  return { x: svgX + rect.left, y: svgY + rect.top }
}

// Calculate mouse movement in world coordinates
function getWorldMouseDelta(oldScreenX: number, oldScreenY: number, newScreenX: number, newScreenY: number): { x: number; y: number } {
  const oldWorld = screenToWorld(oldScreenX, oldScreenY)
  const newWorld = screenToWorld(newScreenX, newScreenY)
  
  return {
    x: newWorld.x - oldWorld.x,
    y: newWorld.y - oldWorld.y
  }
}

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
    // Handle node dragging using world coordinate deltas
    // This ensures proper dragging at all zoom levels
    const worldDelta = getWorldMouseDelta(
      dragStartPos.value.x, 
      dragStartPos.value.y, 
      event.clientX, 
      event.clientY
    )
    
    if (dragNodeIds.value.length === 1) {
      emit('node-drag', dragNodeIds.value[0], worldDelta.x, worldDelta.y)
    } else {
      emit('nodes-drag', dragNodeIds.value, worldDelta.x, worldDelta.y)
    }
    
    dragStartPos.value = { x: event.clientX, y: event.clientY }
  } else if (edgeCreation.active) {
    // Handle edge creation preview using world coordinates
    // Convert mouse position to world coordinates for accurate preview
    const worldPos = screenToWorld(event.clientX, event.clientY)
    edgeCreation.currentPos = worldPos
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

// Phase 4: Context menu and image handling
function handleNodeRightClick(nodeId: string, event: MouseEvent): void {
  emit('node-right-click', nodeId, event)
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === '') return false
  
  // Basic URL validation
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function handleImageError(nodeId: string): void {
  console.warn(`Failed to load image for node ${nodeId}`)
  emit('image-error', nodeId)
}

function handleImageLoad(nodeId: string): void {
  console.log(`Image loaded successfully for node ${nodeId}`)
  emit('image-load', nodeId)
}

// Phase 5: Pan/Zoom event handlers
function handleWheel(event: WheelEvent): void {
  event.preventDefault()
  
  const zoomFactor = 1.1
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  // Convert mouse position to world coordinates
  const worldX = viewport.x + (mouseX / props.width) * viewport.width
  const worldY = viewport.y + (mouseY / props.height) * viewport.height
  
  if (event.deltaY < 0) {
    // Zoom in
    viewport.width /= zoomFactor
    viewport.height /= zoomFactor
    viewport.scale *= zoomFactor
  } else {
    // Zoom out
    viewport.width *= zoomFactor
    viewport.height *= zoomFactor
    viewport.scale /= zoomFactor
  }
  
  // Adjust viewport position to keep mouse position centered
  viewport.x = worldX - (mouseX / props.width) * viewport.width
  viewport.y = worldY - (mouseY / props.height) * viewport.height
  
  console.log('SVG viewport updated after zoom:', {
    x: viewport.x,
    y: viewport.y,
    width: viewport.width,
    height: viewport.height,
    scale: viewport.scale
  })
}

function handleCanvasMouseDown(event: MouseEvent): void {
  // Only start panning if clicking on empty canvas (not on nodes or edges)
  if (event.target === event.currentTarget) {
    isPanning.value = true
    panStartPos.value = { x: event.clientX, y: event.clientY }
    panStartViewport.value = { x: viewport.x, y: viewport.y }
    event.preventDefault()
  }
}

// Update existing handleMouseMove to include panning
function handleMouseMoveWithPanning(event: MouseEvent): void {
  if (isPanning.value) {
    const deltaX = event.clientX - panStartPos.value.x
    const deltaY = event.clientY - panStartPos.value.y
    
    // Convert screen delta to world delta
    const worldDeltaX = (deltaX / props.width) * viewport.width
    const worldDeltaY = (deltaY / props.height) * viewport.height
    
    viewport.x = panStartViewport.value.x - worldDeltaX
    viewport.y = panStartViewport.value.y - worldDeltaY
    
    console.log('SVG viewport updated after pan:', {
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height
    })
    return
  }
  
  // Call existing mouse move logic
  handleMouseMove(event)
}

// Update existing handleMouseUp to include panning
function handleMouseUpWithPanning(): void {
  isPanning.value = false
  handleMouseUp()
}

// Expose viewport state for parent components (like minimap)
defineExpose({
  viewport
})

</script>

<style scoped>
.pf-graph-svg {
  border: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
  cursor: default;
}

.node {
  cursor: move;
}

.node-rect {
  fill: var(--node-bg);
  stroke: var(--node-border);
  stroke-width: 1;
  transition: stroke 0.2s ease;
}

.node-rect.selected {
  stroke: var(--selection-color);
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
  stroke: var(--text-primary);
}

.edge {
  stroke: var(--edge-color);
  cursor: pointer;
  transition: stroke 0.2s ease;
}

.edge:hover {
  stroke: var(--text-secondary);
  stroke-width: 3;
}

.edge.selected {
  stroke: var(--selection-color);
  stroke-width: 3;
}

.temporary-edge {
  stroke: var(--selection-color);
  pointer-events: none;
  opacity: 0.8;
}

.node.selected {
  filter: drop-shadow(0 0 4px rgba(74, 144, 226, 0.5));
}
</style>

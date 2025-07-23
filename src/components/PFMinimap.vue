<template>
  <div class="pf-minimap" :style="{ width: width + 'px', height: height + 'px' }">
    <div class="minimap-header">
      <span class="minimap-title">Minimap</span>
      <button @click="$emit('toggle')" class="minimap-toggle">×</button>
    </div>
    
    <svg
      :width="width"
      :height="minimapHeight"
      :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`"
      class="minimap-svg"
      @click="handleMinimapClick"
      @mousedown="handleMinimapMouseDown"
      @mousemove="handleMinimapMouseMove"
      @mouseup="handleMinimapMouseUp"
      @mouseleave="handleMinimapMouseUp"
    >
      <!-- Grid background -->
      <defs>
        <pattern id="minimap-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333" stroke-width="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#minimap-grid)" />
      
      <!-- Render nodes -->
      <g class="minimap-nodes">
        <rect
          v-for="node in nodes"
          :key="node.id"
          :x="node.x"
          :y="node.y"
          :width="node.width || 120"
          :height="node.height || 80"
          :fill="node.selected ? '#4a90e2' : '#666'"
          :stroke="node.selected ? '#2171b5' : '#444'"
          :stroke-width="1"
          class="minimap-node"
        />
      </g>
      
      <!-- Render edges -->
      <g class="minimap-edges">
        <line
          v-for="edge in edges"
          :key="edge.id"
          :x1="getEdgeStartPosition(edge).x"
          :y1="getEdgeStartPosition(edge).y"
          :x2="getEdgeEndPosition(edge).x"
          :y2="getEdgeEndPosition(edge).y"
          stroke="#888"
          stroke-width="1"
          class="minimap-edge"
        />
      </g>
      
      <!-- Viewport indicator -->
      <rect
        :x="scaledViewport.x"
        :y="scaledViewport.y"
        :width="scaledViewport.width"
        :height="scaledViewport.height"
        fill="rgba(74, 144, 226, 0.2)"
        stroke="#4a90e2"
        stroke-width="2"
        class="minimap-viewport"
        style="cursor: move"
        @mousedown="handleViewportMouseDown"
        @click="handleViewportClick"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PFNode, PFEdge } from '../types'

interface Props {
  nodes: PFNode[]
  edges: PFEdge[]
  width?: number
  height?: number
  editorWidth: number
  editorHeight: number
  viewport: {
    x: number
    y: number
    width: number
    height: number
    scale: number
  }
  graphBounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
}

interface Emits {
  (e: 'viewport-change', viewport: { x: number; y: number; scale?: number }): void
  (e: 'toggle'): void
}

const props = withDefaults(defineProps<Props>(), {
  width: 200,
  height: 150
})

const emit = defineEmits<Emits>()

const isDragging = ref(false)
const minimapHeight = computed(() => props.height - 30) // Account for header

// Calculate the view box to show all graph content
const viewBox = computed(() => {
  const { minX, minY, maxX, maxY } = props.graphBounds
  const padding = 50
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  }
})

// Scale viewport to minimap coordinates
const scaledViewport = computed(() => {
  const vb = viewBox.value
  const scaleX = props.width / vb.width
  const scaleY = minimapHeight.value / vb.height
  
  // Calculate the actual visible area dimensions in graph coordinates
  // Account for the viewport scale factor to get the correct visible width/height
  // A higher scale means we're zoomed in, so the visible area is smaller
  const actualVisibleWidth = props.viewport.width / props.viewport.scale
  const actualVisibleHeight = props.viewport.height / props.viewport.scale
  
  // Calculate scaled position and size
  const scaledX = (props.viewport.x - vb.x) * scaleX
  const scaledY = (props.viewport.y - vb.y) * scaleY
  const scaledWidth = actualVisibleWidth * scaleX
  const scaledHeight = actualVisibleHeight * scaleY
  
  // Debug: viewport rectangle calculation
  console.log('Minimap viewport rect:', scaledWidth, 'x', scaledHeight, 'at', scaledX, ',', scaledY, 'scale:', props.viewport.scale)
  
  // Allow viewport to extend outside minimap bounds (don't clamp position)
  // Only clamp size to prevent viewport from being larger than minimap
  const result = {
    x: scaledX,
    y: scaledY,
    width: Math.min(scaledWidth, props.width * 2), // Allow larger viewport for zoom out
    height: Math.min(scaledHeight, minimapHeight.value * 2)
  }
  
  return result
})

// Helper functions for edge positioning
function getNodeById(nodeId: string): PFNode | undefined {
  return props.nodes.find(node => node.id === nodeId)
}

function getPortPosition(node: PFNode, portId: string): { x: number; y: number } {
  const port = node.ports.find(p => p.id === portId)
  if (!port) return { x: node.x + node.width! / 2, y: node.y + node.height! / 2 }
  
  const nodeWidth = node.width || 120
  const nodeHeight = node.height || 80
  
  // Calculate port index based on type
  const portsOfSameType = node.ports.filter(p => p.type === port.type)
  const portIndex = portsOfSameType.findIndex(p => p.id === portId)
  
  if (port.type === 'input') {
    return { x: node.x, y: node.y + (nodeHeight * 0.3) + (portIndex * 20) }
  } else {
    return { x: node.x + nodeWidth, y: node.y + (nodeHeight * 0.3) + (portIndex * 20) }
  }
}

function getEdgeStartPosition(edge: PFEdge): { x: number; y: number } {
  const sourceNode = getNodeById(edge.sourceNodeId)
  if (!sourceNode) return { x: 0, y: 0 }
  return getPortPosition(sourceNode, edge.sourcePortId)
}

function getEdgeEndPosition(edge: PFEdge): { x: number; y: number } {
  const targetNode = getNodeById(edge.targetNodeId)
  if (!targetNode) return { x: 0, y: 0 }
  return getPortPosition(targetNode, edge.targetPortId)
}

// Event handlers
function handleMinimapClick(event: MouseEvent): void {
  if (isDragging.value) return
  
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Convert minimap coordinates to graph coordinates
  const graphX = viewBox.value.x + (x / props.width) * viewBox.value.width
  const graphY = viewBox.value.y + (y / minimapHeight.value) * viewBox.value.height
  
  // Calculate the visible area size accounting for scale
  // The viewport width/height in world coordinates is divided by scale
  const visibleWidth = props.viewport.width / props.viewport.scale
  const visibleHeight = props.viewport.height / props.viewport.scale
  
  // Center the viewport on the clicked position
  const newViewportX = graphX - visibleWidth / 2
  const newViewportY = graphY - visibleHeight / 2
  
  // Preserve scale when emitting viewport change
  emit('viewport-change', { 
    x: newViewportX, 
    y: newViewportY,
    scale: props.viewport.scale 
  })
}

function handleMinimapMouseDown(event: MouseEvent): void {
  // Check if click is within viewport indicator
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const viewportInMinimap = {
    x: ((props.viewport.x - viewBox.value.x) / viewBox.value.width) * props.width,
    y: ((props.viewport.y - viewBox.value.y) / viewBox.value.height) * minimapHeight.value,
    width: (props.viewport.width / viewBox.value.width) * props.width,
    height: (props.viewport.height / viewBox.value.height) * minimapHeight.value
  }
  
  if (x >= viewportInMinimap.x && x <= viewportInMinimap.x + viewportInMinimap.width &&
      y >= viewportInMinimap.y && y <= viewportInMinimap.y + viewportInMinimap.height) {
    isDragging.value = true
    event.preventDefault()
  }
}

function handleMinimapMouseMove(event: MouseEvent): void {
  if (!isDragging.value) return
  
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Convert minimap coordinates to graph coordinates
  const graphX = viewBox.value.x + (x / props.width) * viewBox.value.width
  const graphY = viewBox.value.y + (y / minimapHeight.value) * viewBox.value.height
  
  // Center the viewport on the mouse position
  const newViewportX = graphX - props.viewport.width / 2
  const newViewportY = graphY - props.viewport.height / 2
  
  emit('viewport-change', { x: newViewportX, y: newViewportY })
}

function handleMinimapMouseUp(): void {
  isDragging.value = false
}

// Viewport-specific event handlers
function handleViewportClick(event: MouseEvent): void {
  // Prevent event bubbling to avoid triggering minimap click
  event.stopPropagation()
}

function handleViewportMouseDown(event: MouseEvent): void {
  // Prevent event bubbling and start viewport dragging
  event.stopPropagation()
  isDragging.value = true
  
  const startX = event.clientX
  const startY = event.clientY
  const startViewportX = props.viewport.x
  const startViewportY = props.viewport.y
  
  function handleMouseMove(moveEvent: MouseEvent): void {
    const deltaX = moveEvent.clientX - startX
    const deltaY = moveEvent.clientY - startY
    
    // Convert pixel movement to graph coordinates
    const vb = viewBox.value
    const scaleX = vb.width / props.width
    const scaleY = vb.height / minimapHeight.value
    
    // Calculate the delta in world coordinates
    // Need to account for viewport scale because the same pixel movement
    // in the minimap represents different distances in the world at different zoom levels
    const newViewportX = startViewportX + (deltaX * scaleX)
    const newViewportY = startViewportY + (deltaY * scaleY)
    
    console.log('Minimap emitting viewport-change:', { 
      x: newViewportX, 
      y: newViewportY,
      scale: props.viewport.scale 
    })
    emit('viewport-change', { 
      x: newViewportX, 
      y: newViewportY,
      scale: props.viewport.scale 
    })
  }
  
  function handleMouseUp(): void {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<style scoped>
.pf-minimap {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #444;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.minimap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid #444;
  border-radius: 8px 8px 0 0;
}

.minimap-title {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.minimap-toggle {
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.minimap-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.minimap-svg {
  display: block;
  cursor: pointer;
}

.minimap-node {
  cursor: pointer;
}

.minimap-edge {
  pointer-events: none;
}

.minimap-viewport {
  cursor: move;
  pointer-events: all;
}

/* Light theme adjustments */
@media (prefers-color-scheme: light) {
  .pf-minimap {
    background: rgba(255, 255, 255, 0.9);
    border-color: #ccc;
  }
  
  .minimap-header {
    background: rgba(0, 0, 0, 0.05);
    border-bottom-color: #ccc;
  }
  
  .minimap-title {
    color: #333;
  }
  
  .minimap-toggle {
    color: #333;
  }
  
  .minimap-toggle:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}
</style>

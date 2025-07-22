<!--
  This template renders an SVG graph visualization with nodes and edges:
  - The SVG canvas is responsive to the provided width and height.
  - A grid pattern is used as the background for visual guidance.
  - Edges are rendered as paths based on their connections, with click event handling for selection.
  - Nodes are displayed as groups containing a rectangle, title, and optional image or placeholder.
  - Each node can have multiple input and output ports rendered as circles with distinct colors.
  - Event handlers are attached for interactions such as node/edge selection and port clicks.
-->
<template>
  <svg
    :width="width"
    :height="height"
    class="pf-graph-svg"
    @click="handleCanvasClick"
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
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600
})

const emit = defineEmits<Emits>()

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

// Event handlers
function handleNodeClick(nodeId: string, event: MouseEvent): void {
  emit('node-click', nodeId, event)
}

function handleNodeMouseDown(nodeId: string, event: MouseEvent): void {
  emit('node-mousedown', nodeId, event)
}

function handleEdgeClick(edgeId: string, event: MouseEvent): void {
  emit('edge-click', edgeId, event)
}

function handlePortClick(nodeId: string, portId: string, event: MouseEvent): void {
  emit('port-click', nodeId, portId, event)
}

function handleCanvasClick(event: MouseEvent): void {
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
</style>

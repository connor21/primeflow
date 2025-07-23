<template>
  <div class="demo-app">
    <header class="demo-header">
      <div class="header-content">
        <div class="header-text">
          <h1>Primeflow Graph Editor Demo</h1>
          <p>Phase 5 Implementation - Undo/Redo, Minimap, Import/Export, Theming, Pan/Zoom</p>
        </div>
        <div class="header-controls">
          <!-- Phase 5: Theme Toggle -->
          <button @click="toggleTheme" class="btn btn-theme">
            {{ currentTheme === 'light' ? '🌙' : '☀️' }} 
            {{ currentTheme === 'light' ? 'Dark' : 'Light' }} Mode
          </button>
        </div>
      </div>
    </header>

    <div class="demo-controls">
      <div class="control-group">
        <h3>Graph Operations</h3>
        <button @click="addSampleNode" :disabled="!canAddNode" class="btn btn-primary">
          Add Sample Node
        </button>
        <button @click="addSampleEdge" :disabled="!canAddEdge || nodes.length < 2" class="btn btn-primary">
          Add Sample Edge
        </button>
        <button @click="loadSampleGraph" class="btn btn-secondary">
          Load Sample Graph
        </button>
        <button @click="exportCurrentGraph" class="btn btn-secondary">
          Export Graph
        </button>
      </div>

      <div class="control-group">
        <h3>Test Node Creation</h3>
        <div class="port-controls">
          <div class="port-control">
            <label>Input Ports:</label>
            <input 
              v-model.number="testNodeInputs" 
              type="number" 
              min="0" 
              max="10"
              class="port-input"
            />
          </div>
          <div class="port-control">
            <label>Output Ports:</label>
            <input 
              v-model.number="testNodeOutputs" 
              type="number" 
              min="0" 
              max="10"
              class="port-input"
            />
          </div>
        </div>
        <button @click="addTestNode" :disabled="!canAddNode" class="btn btn-primary">
          Add Test Node ({{ testNodeInputs }}in/{{ testNodeOutputs }}out)
        </button>
      </div>

      <div class="control-group">
        <h3>Configuration Test</h3>
        <label>
          Max Nodes: 
          <input 
            v-model.number="maxNodes" 
            type="number" 
            min="1" 
            max="50"
            @change="updateConfig"
          />
        </label>
        <label>
          Max Edges: 
          <input 
            v-model.number="maxEdges" 
            type="number" 
            min="1" 
            max="100"
            @change="updateConfig"
          />
        </label>
      </div>

      <div class="control-group">
        <h3>Selection Info</h3>
        <div class="info-text">
          Selected Nodes: {{ selectedNodes.length }}
          <span v-if="selectedNodes.length > 0">
            ({{ selectedNodes.join(', ') }})
          </span>
        </div>
        <div class="info-text">
          Selected Edges: {{ selectedEdges.length }}
          <span v-if="selectedEdges.length > 0">
            ({{ selectedEdges.join(', ') }})
          </span>
        </div>
      </div>
    </div>

    <div class="graph-container">
      <PFGraphEditor
        ref="graphEditor"
        :width="900"
        :height="600"
        :config="graphConfig"
        @graph-updated="handleGraphUpdated"
        @node-selected="handleNodeSelected"
        @edge-selected="handleEdgeSelected"
      />
    </div>

    <div v-if="exportedGraph" class="export-output">
      <h3>Exported Graph JSON:</h3>
      <pre>{{ JSON.stringify(exportedGraph, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PFGraphEditor } from '../components'
import { useTheme } from '../composables'
import type { PFGraph, PFNode, PFEdge, PFGraphConfig } from '../types'

// Reactive state
const graphEditor = ref<InstanceType<typeof PFGraphEditor>>()
const selectedNodes = ref<string[]>([])
const selectedEdges = ref<string[]>([])
const exportedGraph = ref<PFGraph | null>(null)
const maxNodes = ref(10)
const maxEdges = ref(20)

// Test node creation state
const testNodeInputs = ref(2)
const testNodeOutputs = ref(1)

// Phase 5: Theme functionality
const { currentTheme, toggleTheme } = useTheme()

// Graph configuration
const graphConfig = ref<PFGraphConfig>({
  maxNodes: maxNodes.value,
  maxEdges: maxEdges.value,
  nodeDefaults: {
    width: 140,
    height: 90
  }
})

// Computed properties
const nodes = computed(() => graphEditor.value?.state.graph.nodes || [])

const canAddNode = computed(() => graphEditor.value?.canAddNode || false)
const canAddEdge = computed(() => graphEditor.value?.canAddEdge || false)

// Sample data generators
const nodeTypes = ['input', 'process', 'output', 'filter', 'transform']
const dataTypes = ['string', 'number', 'boolean', 'object', 'array']

function generateSampleNode(): Omit<PFNode, 'id'> {
  const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)]
  const nodeNumber = nodes.value.length + 1
  
  return {
    type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeNumber}`,
    x: Math.random() * 600 + 50,
    y: Math.random() * 400 + 50,
    width: 140,
    height: 90,
    ports: [
      {
        id: `port_in_${Date.now()}_1`,
        name: 'input',
        type: 'input',
        dataType: dataTypes[Math.floor(Math.random() * dataTypes.length)],
        required: true
      },
      {
        id: `port_in_${Date.now()}_2`,
        name: 'config',
        type: 'input',
        dataType: 'object',
        required: false
      },
      {
        id: `port_out_${Date.now()}_1`,
        name: 'output',
        type: 'output',
        dataType: dataTypes[Math.floor(Math.random() * dataTypes.length)]
      }
    ],
    properties: {
      description: `Sample ${type} node`,
      version: '1.0.0'
    }
  }
}

// Generate test node with specified number of input and output ports
function generateTestNode(inputCount: number, outputCount: number): Omit<PFNode, 'id'> {
  const nodeNumber = nodes.value.length + 1
  const timestamp = Date.now()
  
  // Generate input ports
  const inputPorts = Array.from({ length: inputCount }, (_, index) => ({
    id: `port_in_${timestamp}_${index + 1}`,
    name: `input${index + 1}`,
    type: 'input' as const,
    dataType: dataTypes[Math.floor(Math.random() * dataTypes.length)],
    required: index === 0 // First input is required, others are optional
  }))
  
  // Generate output ports
  const outputPorts = Array.from({ length: outputCount }, (_, index) => ({
    id: `port_out_${timestamp}_${index + 1}`,
    name: `output${index + 1}`,
    type: 'output' as const,
    dataType: dataTypes[Math.floor(Math.random() * dataTypes.length)]
  }))
  
  // Calculate node height based on port count
  const maxPorts = Math.max(inputCount, outputCount)
  const baseHeight = 90
  const portHeight = 20
  const calculatedHeight = Math.max(baseHeight, baseHeight + (maxPorts - 2) * portHeight)
  
  return {
    type: 'test',
    title: `Test Node ${nodeNumber}`,
    x: Math.random() * 600 + 50,
    y: Math.random() * 400 + 50,
    width: 140,
    height: calculatedHeight,
    ports: [...inputPorts, ...outputPorts],
    properties: {
      description: `Test node with ${inputCount} inputs and ${outputCount} outputs`,
      version: '1.0.0',
      inputCount,
      outputCount
    }
  }
}

function generateSampleGraph(): PFGraph {
  const sampleNodes: PFNode[] = [
    {
      id: 'node_1',
      type: 'input',
      title: 'Data Input',
      x: 100,
      y: 100,
      width: 140,
      height: 90,
      ports: [
        {
          id: 'node_1_out_1',
          name: 'data',
          type: 'output',
          dataType: 'object'
        }
      ],
      properties: { source: 'database' }
    },
    {
      id: 'node_2',
      type: 'process',
      title: 'Data Processor',
      x: 350,
      y: 100,
      width: 140,
      height: 90,
      ports: [
        {
          id: 'node_2_in_1',
          name: 'input',
          type: 'input',
          dataType: 'object',
          required: true
        },
        {
          id: 'node_2_in_2',
          name: 'config',
          type: 'input',
          dataType: 'object',
          required: false
        },
        {
          id: 'node_2_out_1',
          name: 'processed',
          type: 'output',
          dataType: 'object'
        }
      ],
      properties: { algorithm: 'transform' }
    },
    {
      id: 'node_3',
      type: 'output',
      title: 'Data Output',
      x: 600,
      y: 100,
      width: 140,
      height: 90,
      ports: [
        {
          id: 'node_3_in_1',
          name: 'data',
          type: 'input',
          dataType: 'object',
          required: true
        }
      ],
      properties: { destination: 'file' }
    },
    {
      id: 'node_4',
      type: 'filter',
      title: 'Data Filter',
      x: 350,
      y: 250,
      width: 140,
      height: 90,
      ports: [
        {
          id: 'node_4_in_1',
          name: 'input',
          type: 'input',
          dataType: 'object',
          required: true
        },
        {
          id: 'node_4_out_1',
          name: 'filtered',
          type: 'output',
          dataType: 'object'
        }
      ],
      properties: { criteria: 'active_only' }
    }
  ]

  const sampleEdges: PFEdge[] = [
    {
      id: 'edge_1',
      sourceNodeId: 'node_1',
      sourcePortId: 'node_1_out_1',
      targetNodeId: 'node_2',
      targetPortId: 'node_2_in_1'
    },
    {
      id: 'edge_2',
      sourceNodeId: 'node_2',
      sourcePortId: 'node_2_out_1',
      targetNodeId: 'node_3',
      targetPortId: 'node_3_in_1'
    },
    {
      id: 'edge_3',
      sourceNodeId: 'node_1',
      sourcePortId: 'node_1_out_1',
      targetNodeId: 'node_4',
      targetPortId: 'node_4_in_1'
    }
  ]

  return {
    nodes: sampleNodes,
    edges: sampleEdges,
    config: graphConfig.value
  }
}

// Event handlers
function addSampleNode(): void {
  if (!graphEditor.value) return
  
  const sampleNode = generateSampleNode()
  const nodeId = graphEditor.value.addNode(sampleNode)
  
  if (nodeId) {
    console.log('Added node:', nodeId)
  }
}

// Test node creation with selectable ports
function addTestNode(): void {
  if (!graphEditor.value) return
  
  const testNode = generateTestNode(testNodeInputs.value, testNodeOutputs.value)
  const nodeId = graphEditor.value.addNode(testNode)
  
  if (nodeId) {
    console.log(`Added test node with ${testNodeInputs.value} inputs and ${testNodeOutputs.value} outputs:`, nodeId)
  }
}

function addSampleEdge(): void {
  if (!graphEditor.value || nodes.value.length < 2) return
  
  // Find two random nodes with compatible ports
  const availableNodes = nodes.value.filter(node => 
    node.ports.some(port => port.type === 'output') || 
    node.ports.some(port => port.type === 'input')
  )
  
  if (availableNodes.length < 2) return
  
  const sourceNode = availableNodes.find(node => 
    node.ports.some(port => port.type === 'output')
  )
  const targetNode = availableNodes.find(node => 
    node.ports.some(port => port.type === 'input') && node.id !== sourceNode?.id
  )
  
  if (!sourceNode || !targetNode) return
  
  const outputPort = sourceNode.ports.find(port => port.type === 'output')
  const inputPort = targetNode.ports.find(port => port.type === 'input')
  
  if (!outputPort || !inputPort) return
  
  const edgeId = graphEditor.value.addEdge({
    sourceNodeId: sourceNode.id,
    sourcePortId: outputPort.id,
    targetNodeId: targetNode.id,
    targetPortId: inputPort.id
  })
  
  if (edgeId) {
    console.log('Added edge:', edgeId)
  }
}

function loadSampleGraph(): void {
  if (!graphEditor.value) return
  
  const sampleGraph = generateSampleGraph()
  graphEditor.value.loadGraph(sampleGraph)
  console.log('Loaded sample graph')
}

function exportCurrentGraph(): void {
  if (!graphEditor.value) return
  
  exportedGraph.value = graphEditor.value.exportGraph()
  console.log('Exported graph:', exportedGraph.value)
}

function updateConfig(): void {
  graphConfig.value = {
    ...graphConfig.value,
    maxNodes: maxNodes.value,
    maxEdges: maxEdges.value
  }
}

function handleGraphUpdated(): void {
  console.log('Graph updated')
}

function handleNodeSelected(nodeIds: string[]): void {
  selectedNodes.value = nodeIds
  console.log('Nodes selected:', nodeIds)
}

function handleEdgeSelected(edgeIds: string[]): void {
  selectedEdges.value = edgeIds
  console.log('Edges selected:', edgeIds)
}

// Initialize with sample data
onMounted(() => {
  // Add a small delay to ensure the component is fully mounted
  setTimeout(() => {
    loadSampleGraph()
  }, 100)
})
</script>

<style scoped>
.demo-app {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
}

.demo-header h1 {
  color: var(--text-primary);
  margin-bottom: 8px;
}

.demo-header p {
  color: var(--text-secondary);
  font-style: italic;
}

.demo-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
}

.control-group {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.control-group h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.control-group input[type="number"] {
  width: 80px;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  margin-left: 0.5rem;
}

.port-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.port-control {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.port-control label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  margin-bottom: 0;
}

.port-input {
  width: 70px;
  padding: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  text-align: center;
}

.btn {
  padding: 8px 16px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--accent-primary);
  color: white;
  border-color: var(--accent-secondary);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--accent-secondary);
}

.btn-secondary {
  background-color: var(--text-secondary);
  color: white;
  border-color: var(--text-secondary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--text-primary);
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
}

input[type="number"] {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid var(--border-primary);
  border-radius: 3px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.info-text {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 4px 0;
}

.graph-container {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
}

.export-output {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.export-output h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.export-output pre {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}
</style>

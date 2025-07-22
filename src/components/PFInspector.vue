<template>
  <div class="pf-inspector">
    <div class="inspector-header">
      <h3>Inspector</h3>
    </div>
    
    <div v-if="selectedNodes.length === 0" class="inspector-empty">
      <p>Select a node to edit its properties</p>
    </div>
    
    <div v-else-if="selectedNodes.length === 1" class="inspector-content">
      <div class="node-info">
        <h4>{{ selectedNode.title }}</h4>
        <p class="node-type">Type: {{ selectedNode.type }}</p>
      </div>
      
      <div class="properties-section">
        <h5>Properties</h5>
        <div v-if="!selectedNode.properties || Object.keys(selectedNode.properties).length === 0" class="no-properties">
          <p>No properties available</p>
        </div>
        <div v-else class="property-list">
          <div 
            v-for="(value, key) in selectedNode.properties" 
            :key="key"
            class="property-item"
          >
            <label :for="`prop-${key}`" class="property-label">{{ key }}</label>
            
            <!-- String property -->
            <input
              v-if="getPropertyType(value) === 'string'"
              :id="`prop-${key}`"
              v-model="selectedNode.properties[key]"
              type="text"
              class="property-input"
              @input="onPropertyChange(key, ($event.target as HTMLInputElement)?.value || '')"
            />
            
            <!-- Number/Integer/Float property -->
            <input
              v-else-if="['number', 'integer', 'float'].includes(getPropertyType(value))"
              :id="`prop-${key}`"
              v-model.number="selectedNode.properties[key]"
              type="number"
              :step="getPropertyType(value) === 'integer' ? '1' : '0.01'"
              class="property-input"
              @input="onPropertyChange(key, parseFloat(($event.target as HTMLInputElement)?.value || '0'))"
            />
            
            <!-- Boolean property -->
            <input
              v-else-if="getPropertyType(value) === 'boolean'"
              :id="`prop-${key}`"
              v-model="selectedNode.properties[key]"
              type="checkbox"
              class="property-checkbox"
              @change="onPropertyChange(key, ($event.target as HTMLInputElement)?.checked || false)"
            />
            
            <!-- Fallback for other types -->
            <input
              v-else
              :id="`prop-${key}`"
              v-model="selectedNode.properties[key]"
              type="text"
              class="property-input"
              @input="onPropertyChange(key, ($event.target as HTMLInputElement)?.value || '')"
            />
          </div>
        </div>
      </div>
      
      <!-- Image URL section -->
      <div class="image-section">
        <h5>Image</h5>
        <div class="property-item">
          <label for="node-image" class="property-label">Image URL</label>
          <input
            id="node-image"
            v-model="selectedNode.image"
            type="url"
            class="property-input"
            placeholder="Enter image URL"
            @input="onImageChange(($event.target as HTMLInputElement)?.value || '')"
          />
        </div>
        <div v-if="selectedNode.image" class="image-preview">
          <img 
            :src="selectedNode.image" 
            alt="Node image preview"
            @error="onImageError"
            @load="onImageLoad"
          />
        </div>
      </div>
    </div>
    
    <div v-else class="inspector-multi">
      <p>{{ selectedNodes.length }} nodes selected</p>
      <p class="multi-note">Multi-node editing not yet supported</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PFNode } from '../types'

interface Props {
  selectedNodes: PFNode[]
}

interface Emits {
  (e: 'property-changed', nodeId: string, propertyKey: string, value: any): void
  (e: 'image-changed', nodeId: string, imageUrl: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedNode = computed(() => props.selectedNodes[0])

function getPropertyType(value: any): string {
  if (typeof value === 'string') return 'string'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return 'integer'
    return 'float'
  }
  return 'string' // fallback
}

function onPropertyChange(key: string, value: any) {
  if (selectedNode.value) {
    emit('property-changed', selectedNode.value.id, key, value)
  }
}

function onImageChange(imageUrl: string) {
  if (selectedNode.value) {
    emit('image-changed', selectedNode.value.id, imageUrl)
  }
}

function onImageError() {
  console.warn('Failed to load image:', selectedNode.value?.image)
}

function onImageLoad() {
  console.log('Image loaded successfully:', selectedNode.value?.image)
}
</script>

<style scoped>
.pf-inspector {
  width: 300px;
  height: 100%;
  background: var(--inspector-bg);
  border-left: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.inspector-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.inspector-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.inspector-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-muted);
}

.inspector-content {
  padding: 16px;
  flex: 1;
}

.inspector-multi {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-muted);
}

.multi-note {
  font-size: 14px;
  margin-top: 8px;
}

.node-info {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-primary);
}

.node-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.node-type {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.properties-section,
.image-section {
  margin-bottom: 24px;
}

.properties-section h5,
.image-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-properties {
  color: var(--text-muted);
  font-style: italic;
  font-size: 14px;
}

.property-item {
  margin-bottom: 16px;
}

.property-label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.property-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.property-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 0.2rem rgba(74, 144, 226, 0.25);
}

.property-checkbox {
  width: auto;
  margin-right: 8px;
}

.image-preview {
  margin-top: 12px;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 120px;
  border-radius: 4px;
  border: 1px solid var(--border-primary);
}
</style>

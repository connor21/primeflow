<template>
  <div
    v-if="visible"
    class="pf-context-menu"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @click.stop
  >
    <div class="context-menu-item" @click="onDeleteNode">
      <span class="menu-icon">🗑️</span>
      Delete Node
    </div>
    <div class="context-menu-item" @click="onDuplicateNode">
      <span class="menu-icon">📋</span>
      Duplicate Node
    </div>
    <div class="context-menu-item" @click="onEditProperties">
      <span class="menu-icon">⚙️</span>
      Edit Properties
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  position: { x: number; y: number }
  nodeId: string
}

interface Emits {
  (e: 'delete-node', nodeId: string): void
  (e: 'duplicate-node', nodeId: string): void
  (e: 'edit-properties', nodeId: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function onDeleteNode() {
  emit('delete-node', props.nodeId)
  emit('close')
}

function onDuplicateNode() {
  emit('duplicate-node', props.nodeId)
  emit('close')
}

function onEditProperties() {
  emit('edit-properties', props.nodeId)
  emit('close')
}

function handleClickOutside() {
  if (props.visible) {
    emit('close')
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.visible) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<style scoped>
.pf-context-menu {
  position: fixed;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  min-width: 160px;
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.15s ease;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-item:first-child:hover {
  color: #dc2626;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}
</style>

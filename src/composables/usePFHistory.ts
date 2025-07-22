import { reactive, computed } from 'vue'
import type { PFGraph } from '../types'

export interface PFHistoryAction {
  id: string
  type: 'add_node' | 'remove_node' | 'add_edge' | 'remove_edge' | 'move_node' | 'update_property' | 'duplicate_node' | 'delete_selected'
  timestamp: number
  beforeState: PFGraph
  afterState: PFGraph
  description: string
}

export interface PFHistoryState {
  undoStack: PFHistoryAction[]
  redoStack: PFHistoryAction[]
  maxStackSize: number
  isUndoing: boolean
  isRedoing: boolean
}

const DEFAULT_MAX_STACK_SIZE = 20

export function usePFHistory(maxStackSize: number = DEFAULT_MAX_STACK_SIZE) {
  const state = reactive<PFHistoryState>({
    undoStack: [],
    redoStack: [],
    maxStackSize,
    isUndoing: false,
    isRedoing: false
  })

  // Computed properties
  const canUndo = computed(() => state.undoStack.length > 0 && !state.isUndoing && !state.isRedoing)
  const canRedo = computed(() => state.redoStack.length > 0 && !state.isUndoing && !state.isRedoing)
  const undoDescription = computed(() => state.undoStack.length > 0 ? state.undoStack[state.undoStack.length - 1].description : '')
  const redoDescription = computed(() => state.redoStack.length > 0 ? state.redoStack[state.redoStack.length - 1].description : '')

  function createAction(
    type: PFHistoryAction['type'],
    beforeState: PFGraph,
    afterState: PFGraph,
    description: string
  ): PFHistoryAction {
    return {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      beforeState: JSON.parse(JSON.stringify(beforeState)), // Deep clone
      afterState: JSON.parse(JSON.stringify(afterState)), // Deep clone
      description
    }
  }

  function pushAction(action: PFHistoryAction): void {
    // Don't record actions during undo/redo operations
    if (state.isUndoing || state.isRedoing) {
      return
    }

    // Add to undo stack
    state.undoStack.push(action)

    // Maintain stack size limit
    if (state.undoStack.length > state.maxStackSize) {
      state.undoStack.shift() // Remove oldest action
    }

    // Clear redo stack when new action is performed
    state.redoStack.length = 0
  }

  function recordAction(
    type: PFHistoryAction['type'],
    beforeState: PFGraph,
    afterState: PFGraph,
    description: string
  ): void {
    const action = createAction(type, beforeState, afterState, description)
    pushAction(action)
  }

  function undo(): PFHistoryAction | null {
    if (!canUndo.value) {
      return null
    }

    const action = state.undoStack.pop()
    if (!action) {
      return null
    }

    state.isUndoing = true
    
    // Move action to redo stack
    state.redoStack.push(action)

    // Maintain redo stack size limit
    if (state.redoStack.length > state.maxStackSize) {
      state.redoStack.shift()
    }

    state.isUndoing = false
    return action
  }

  function redo(): PFHistoryAction | null {
    if (!canRedo.value) {
      return null
    }

    const action = state.redoStack.pop()
    if (!action) {
      return null
    }

    state.isRedoing = true

    // Move action back to undo stack
    state.undoStack.push(action)

    // Maintain undo stack size limit
    if (state.undoStack.length > state.maxStackSize) {
      state.undoStack.shift()
    }

    state.isRedoing = false
    return action
  }

  function clearHistory(): void {
    state.undoStack.length = 0
    state.redoStack.length = 0
  }

  function getHistoryInfo() {
    return {
      undoCount: state.undoStack.length,
      redoCount: state.redoStack.length,
      maxStackSize: state.maxStackSize
    }
  }

  return {
    // State
    state,

    // Computed
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,

    // Methods
    recordAction,
    undo,
    redo,
    clearHistory,
    getHistoryInfo
  }
}

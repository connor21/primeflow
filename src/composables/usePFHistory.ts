import { reactive, computed } from 'vue'
import type { PFGraph } from '../types'

/**
 * Represents a single action that can be undone or redone
 * 
 * Each action captures the complete graph state before and after the operation,
 * allowing for perfect state restoration during undo/redo operations.
 */
export interface PFHistoryAction {
  /** Unique identifier for this action */
  id: string
  /** Type of operation that was performed */
  type: 'add_node' | 'remove_node' | 'add_edge' | 'remove_edge' | 'move_node' | 'update_property' | 'duplicate_node' | 'delete_selected'
  /** Timestamp when the action was recorded */
  timestamp: number
  /** Complete graph state before the action */
  beforeState: PFGraph
  /** Complete graph state after the action */
  afterState: PFGraph
  /** Human-readable description of the action */
  description: string
}

/**
 * Internal state for the history management system
 */
export interface PFHistoryState {
  /** Stack of actions that can be undone */
  undoStack: PFHistoryAction[]
  /** Stack of actions that can be redone */
  redoStack: PFHistoryAction[]
  /** Maximum number of actions to keep in each stack */
  maxStackSize: number
  /** Whether an undo operation is currently in progress */
  isUndoing: boolean
  /** Whether a redo operation is currently in progress */
  isRedoing: boolean
}

/** Default maximum number of actions to keep in history stacks */
const DEFAULT_MAX_STACK_SIZE = 20

/**
 * Composable for managing undo/redo functionality in the graph editor
 * 
 * Provides a complete history system with configurable stack size and
 * support for all graph operations. Actions are automatically managed
 * with deep cloning to ensure state integrity.
 * 
 * @param maxStackSize - Maximum number of actions to keep (default: 20)
 * @returns Object containing history state and control functions
 * 
 * @example
 * ```typescript
 * const history = usePFHistory(50) // Keep up to 50 actions
 * 
 * // Record an action
 * history.recordAction('add_node', beforeState, afterState, 'Add Filter Node')
 * 
 * // Undo/redo
 * if (history.canUndo.value) {
 *   const restoredState = history.undo()
 * }
 * ```
 */
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

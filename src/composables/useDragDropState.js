import { ref, readonly } from 'vue'

// List of IDs for the dragged item and its descendants
const draggedItemIds = ref(new Set())

// Dragging state
const isDragging = ref(false)

// Execution lock — drag is disabled while an entry is executing
const isExecuting = ref(false)

/**
 * Composable function for drag & drop state management
 * @returns {Object} Drag state and related methods
 */
export function useDragDropState() {
  /**
   * Activate dragging state
   */
  const activateDragging = () => {
    isDragging.value = true
  }
  
  /**
   * Deactivate dragging state and clear dragged item IDs
   */
  const deactivateDragging = () => {
    draggedItemIds.value.clear()
    isDragging.value = false
  }
  
  /**
   * Set the list of dragged item IDs and its descendants
   * @param {Array<string>} ids - Array of IDs
   */
  const setDraggedIds = (ids) => {
    draggedItemIds.value = new Set(ids)
  }
  
  /**
   * Check if the specified ID is in the dragged items list
   * @param {string} id - ID to check
   * @returns {boolean} Whether the ID is in the dragged items list
   */
  const hasDraggedIds = (id) => {
    return draggedItemIds.value.has(id)
  }

  /**
   * Set the execution lock state
   * @param {boolean} value - Whether an entry is currently executing
   */
  const setExecuting = (value) => {
    isExecuting.value = value
  }

  // Return public methods and state
  return {
    isDragging: readonly(isDragging),
    isExecuting: readonly(isExecuting),
    activateDragging,
    deactivateDragging,
    setDraggedIds,
    hasDraggedIds,
    setExecuting
  }
}


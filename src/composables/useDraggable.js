import { ref } from 'vue'

/**
 * Provides drag functionality as a composable function
 * @returns {Object} Drag-related state and methods
 */
export function useDraggable() {
  // Dragging state
  const isDragging = ref(false)
  
  // Custom callback for drag start event
  let OnDragStartCallBack = null
  
  /**
   * Set the callback for drag start event
   * @param {Function} callback - Callback function to execute on drag start
   */
  const setOnDragStartCallBack = (callback) => {
    OnDragStartCallBack = callback
  }
  
  /**
   * Handle drag start event
   * @param {DragEvent} event - The drag event
   */
  const onDragStart = (event) => {
    isDragging.value = true
    if (OnDragStartCallBack) {
      OnDragStartCallBack(event)
    }
  }
  
  /**
   * Handle drag end event
   */
  const onDragEnd = () => {
    isDragging.value = false
  }
  
  // Return public state and methods
  return {
    isDragging,
    setOnDragStartCallBack,
    onDragStart,
    onDragEnd
  }
}

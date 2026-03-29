import { ref, readonly, computed } from 'vue'

// Shared state (module-level singleton)
const selectedEntryId = ref(null)

/**
 * Composable for selection state management
 * Singleton pattern - state is shared across all components
 */
function useSelection() {
  /**
   * Set the selected entry
   * @param {Entry|null} entry - Entry to select, or null to clear
   */
  const setSelectedEntry = (entry) => {
    selectedEntryId.value = entry?.id || null
  }

  /**
   * Clear the selection
   */
  const clearSelection = () => {
    selectedEntryId.value = null
  }

  /**
   * Check if a specific entry is selected
   * @param {string} entryId - Entry ID to check
   * @returns {ComputedRef<boolean>}
   */
  const isSelected = (entryId) => {
    return computed(() => selectedEntryId.value === entryId)
  }

  /**
   * Get the selected entry ID (readonly)
   */
  const getSelectedEntryId = () => {
    return readonly(selectedEntryId)
  }

  return {
    setSelectedEntry,
    clearSelection,
    isSelected,
    getSelectedEntryId
  }
}

// Export singleton instance
export const selectionState = useSelection()

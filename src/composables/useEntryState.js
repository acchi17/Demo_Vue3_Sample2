import { ref, readonly, computed } from 'vue'

// Module-level singleton state
const selectedEntryId = ref(null)
const pendingConnection = ref(null) // null | { entryId, paramName, paramKind }

/**
 * Composable for entry selection and parameter connection waiting state.
 * Singleton pattern - state is shared across all components.
 */
function useEntryState() {
  // --- Selection ---

  const setSelectedEntry = (entry) => {
    selectedEntryId.value = entry?.id || null
  }

  const clearSelection = () => {
    selectedEntryId.value = null
  }

  const isSelected = (entryId) =>
    computed(() => selectedEntryId.value === entryId)

  const getSelectedEntryId = () => readonly(selectedEntryId)

  // --- Connection waiting ---

  const startConnection = (entryId, paramName, paramKind) => {
    pendingConnection.value = { entryId, paramName, paramKind }
  }

  const cancelConnection = () => {
    pendingConnection.value = null
  }

  const isConnectingParam = computed(() => pendingConnection.value !== null)

  const isConnectingParamFor = (entryId, paramName, paramKind) =>
    computed(() =>
      pendingConnection.value !== null &&
      pendingConnection.value.entryId === entryId &&
      pendingConnection.value.paramName === paramName &&
      pendingConnection.value.paramKind === paramKind
    )

  // When connecting: cancel connection only (keep selection)
  // When idle: clear selection (existing behavior)
  const clearState = () => {
    if (isConnectingParam.value) {
      cancelConnection()
    } else {
      clearSelection()
    }
  }

  return {
    // selection
    setSelectedEntry,
    clearSelection,
    isSelected,
    getSelectedEntryId,
    // connection
    startConnection,
    cancelConnection,
    isConnectingParam,
    isConnectingParamFor,
    // combined
    clearState,
  }
}

// Export singleton instance
export const entryState = useEntryState()

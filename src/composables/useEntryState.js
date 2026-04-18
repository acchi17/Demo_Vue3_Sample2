import { ref, readonly, computed, inject } from 'vue'

// Module-level singleton state
const selectedEntryId = ref(null)
const pendingConnection = ref(null) // null | { entryId, paramName, paramCategory, paramType }

/**
 * Composable for entry selection and parameter connection waiting state.
 * Singleton pattern - state is shared across all components.
 */
export function useEntryState() {
  const entryManager = inject('entryManager')

  const setSelectedEntry = (entry) => {
    selectedEntryId.value = entry?.id || null
  }

  const clearSelection = () => {
    selectedEntryId.value = null
  }

  const isSelected = (entryId) =>
    computed(() => selectedEntryId.value === entryId)

  const getSelectedEntryId = () => readonly(selectedEntryId)

  const startConnection = (entryId, paramName, paramCategory, paramType) => {
    pendingConnection.value = { entryId, paramName, paramCategory, paramType }
  }

  const cancelConnection = () => {
    pendingConnection.value = null
  }

  const isConnectingParam = computed(() => pendingConnection.value !== null)

  const isConnectingParamSrc = (entryId, paramName, paramCategory) =>
    computed(() =>
      pendingConnection.value !== null &&
      pendingConnection.value.entryId === entryId &&
      pendingConnection.value.paramName === paramName &&
      pendingConnection.value.paramCategory === paramCategory
    )

  const isConnectingParamDst = (entryId) =>
    computed(() => {
      if (!entryManager || pendingConnection.value === null) return false
      entryManager.updateTick.value // reactive dependency
      const srcId = pendingConnection.value.entryId
      const mySeq = entryManager.getSequenceNumber(entryId)
      const srcSeq = entryManager.getSequenceNumber(srcId)
      return mySeq !== null && srcSeq !== null && mySeq > srcSeq
    })

  const connectingParam = computed(() => pendingConnection.value)

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
    isConnectingParamSrc,
    isConnectingParamDst,
    connectingParam,
    // combined
    clearState,
  }
}


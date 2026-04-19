import { ref, readonly, computed, inject } from 'vue'

// Module-level singleton state
const selectedEntryId = ref(null)
const sourceConnection = ref(null) // null | { entryId, paramName, paramCategory, paramType }

/**
 * Composable for entry selection and parameter connection waiting state.
 * Singleton pattern - state is shared across all components.
 */
export function useEntryState() {
  const entryManager = inject('entryManager')
  const entryConnectionManager = inject('entryConnectionManager')

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
    sourceConnection.value = { entryId, paramName, paramCategory, paramType }
  }

  const cancelConnection = () => {
    sourceConnection.value = null
  }

  const completeConnection = (entryId, paramName, paramCategory, paramType) => {
    if (!sourceConnection.value) return
    const source = sourceConnection.value
    if (source.paramCategory === paramCategory) return

    const sourceEndpoint = { entryId: source.entryId, category: source.paramCategory, dataType: source.paramType, paramName: source.paramName }
    const otherEndpoint = { entryId: entryId, category: paramCategory, dataType: paramType, paramName: paramName }

    const [outputEndpoint, inputEndpoint] = source.paramCategory === 'output'
      ? [sourceEndpoint, otherEndpoint]
      : [otherEndpoint, sourceEndpoint]

    entryConnectionManager.addConnection(outputEndpoint, inputEndpoint)
    cancelConnection()
  }

  const isConnectingParam = computed(() => sourceConnection.value !== null)

  const isConnectingParamSrc = (entryId, paramName, paramCategory) =>
    computed(() =>
      sourceConnection.value !== null &&
      sourceConnection.value.entryId === entryId &&
      sourceConnection.value.paramName === paramName &&
      sourceConnection.value.paramCategory === paramCategory
    )

  const isConnectingParamDst = (entryId) =>
    computed(() => {
      if (!entryManager || sourceConnection.value === null) return false
      entryManager.updateTick.value // reactive dependency
      const srcId = sourceConnection.value.entryId
      const mySeq = entryManager.getSequenceNumber(entryId)
      const srcSeq = entryManager.getSequenceNumber(srcId)
      if (mySeq === null || srcSeq === null) return false
      // output src → expand entries before it (input targets)
      // input src  → expand entries after it (output targets)
      return sourceConnection.value.paramCategory === 'output'
        ? mySeq < srcSeq
        : mySeq > srcSeq
    })

  const connectingParam = computed(() => sourceConnection.value)

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
    completeConnection,
    isConnectingParam,
    isConnectingParamSrc,
    isConnectingParamDst,
    connectingParam,
    // combined
    clearState,
  }
}


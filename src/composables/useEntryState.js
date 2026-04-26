import { ref, computed, inject } from 'vue'

// Module-level singleton state
const selectedEntryId = ref(null)
const connectingSource = ref(null) // null | { entryId, paramName, paramCategory, paramType }

/**
 * Composable for entry selection and parameter connection waiting state.
 * Singleton pattern - state is shared across all components.
 */
export function useEntryState() {
  const entryManager = inject('entryManager')
  const entryConnectionManager = inject('entryConnectionManager')
  const entryParamManager = inject('entryParamManager')


  const isSelected = (entryId) =>
    computed(() => selectedEntryId.value === entryId)

  const getSelectedEntryId = computed(() => selectedEntryId.value)

  const setSelection = (entry) => {
    selectedEntryId.value = entry?.id || null
  }

  const clearSelection = () => {
    selectedEntryId.value = null
  }

  const isConnecting = computed(() => connectingSource.value !== null)

  const isConnectingSource = (entryId, paramName, paramCategory) =>
    computed(() =>
      connectingSource.value !== null &&
      connectingSource.value.entryId === entryId &&
      connectingSource.value.paramName === paramName &&
      connectingSource.value.paramCategory === paramCategory
    )

  const isConnectingTarget = (entryId) =>
    computed(() => {
      if (connectingSource.value === null) return false
      entryManager.updateTick.value // reactive dependency
      const srcId = connectingSource.value.entryId
      const srcSeq = entryManager.getSequenceNumber(srcId)
      const dstSeq = entryManager.getSequenceNumber(entryId)
      console.log(`Checking connection: ${srcId} -> ${entryId}, Seq: ${srcSeq} -> ${dstSeq}`)
      if (dstSeq === null || srcSeq === null) return false
      
      if (connectingSource.value.paramCategory === 'input') {
        // input src  → expand entries after it (output targets)
        if (!entryParamManager.hasOutputParam(entryId)) return false
        return dstSeq < srcSeq
      } else {
        // output src → expand entries before it (input targets)
        if (!entryParamManager.hasInputParam(entryId)) return false
        return dstSeq > srcSeq
      }
    })

  const isConnectedEndPoint = (entryId, paramName, paramCategory) =>
    computed(() =>
      entryConnectionManager
        ? entryConnectionManager.getConnectionsByEndpoint(entryId, paramCategory, paramName).length > 0
        : false
    )

  const getConnectingSource = computed(() => connectingSource.value)

  const startConnection = (entryId, paramName, paramCategory, paramType) => {
    connectingSource.value = { entryId, paramName, paramCategory, paramType }
  }

  const cancelConnection = () => {
    connectingSource.value = null
  }

  const endConnection = (entryId, paramName, paramCategory, paramType) => {
    if (!connectingSource.value) return
    const source = connectingSource.value
    if (source.paramCategory === paramCategory) return

    const sourceEndpoint = { entryId: source.entryId, category: source.paramCategory, dataType: source.paramType, paramName: source.paramName }
    const targetEndpoint = { entryId: entryId, category: paramCategory, dataType: paramType, paramName: paramName }
    
    const [outputEndpoint, inputEndpoint] = source.paramCategory === 'output'
      ? [sourceEndpoint, targetEndpoint]
      : [targetEndpoint, sourceEndpoint]

    entryConnectionManager.addConnection(outputEndpoint, inputEndpoint)
    cancelConnection()
  }

  // When connecting: cancel connection only (keep selection)
  // When idle: clear selection (existing behavior)
  const clearState = () => {
    if (isConnecting.value) {
      cancelConnection()
    } else {
      clearSelection()
    }
  }

  return {
    // selection
    isSelected,
    getSelectedEntryId,
    setSelection,
    clearSelection,
    // connection
    isConnecting,
    isConnectingSource,
    isConnectingTarget,
    isConnectedEndPoint,
    getConnectingSource,
    startConnection,
    cancelConnection,
    endConnection,
    // combined
    clearState,
  }
}


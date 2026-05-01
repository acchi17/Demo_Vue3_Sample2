import { inject } from 'vue'
import Block from '../classes/Block'
import Container from '../classes/Container'
import { useEntryState } from './useEntryState'

export function useEntryOperation() {
  const entryManager = inject('entryManager')
  const entryParamManager = inject('entryParamManager')
  const entryDefinitionService = inject('entryDefinitionService')
  const entryConnectionManager = inject('entryConnectionManager')
  const {
    getSelectedEntryId,
    clearSelection,
    cancelConnection
  } = useEntryState()

  const addBlock = (parentId, name, index) => {
    const newBlock = new Block(name)
    entryManager.addEntry(parentId, newBlock, index)
    const defaultParams = entryDefinitionService.getBlockParamDef(name)
    entryParamManager.setInputParamDef(newBlock.id, defaultParams.input)
    entryParamManager.setOutputParamDef(newBlock.id, defaultParams.output)
    return newBlock
  }

  const addContainer = (parentId, name, index) => {
    const newContainer = new Container(name)
    entryManager.addEntry(parentId, newContainer, index)
    return newContainer
  }

  const removeEntry = (id) => {
    const selectedId = getSelectedEntryId.value
    const descendantIds = entryManager.getAllDescendantIds(id)
    if (selectedId && (selectedId === id || descendantIds.includes(selectedId))) {
      clearSelection()
    }
    //;[id, ...descendantIds].forEach(eid => entryConnectionManager.removeConnectionsByEntryId(eid))
    [id, ...descendantIds].forEach(eid => entryConnectionManager.removeConnectionsByEntryId(eid))
    cancelConnection()
    entryManager.removeEntry(id)
  }

  const reorderEntry = (parentId, entryId, index) => {
    entryManager.reorderEntry(parentId, entryId, index)
  }

  const moveEntry = (entryId, targetParentId, index) => {
    entryManager.moveEntry(entryId, targetParentId, index)
  }

  const getAllDescendantIds = (id) => {
    return entryManager.getAllDescendantIds(id)
  }

  const getParentId = (id) => {
    return entryManager.getParentId(id)
  }

  return {
    addBlock,
    addContainer,
    removeEntry,
    reorderEntry,
    moveEntry,
    getAllDescendantIds,
    getParentId,
  }
}

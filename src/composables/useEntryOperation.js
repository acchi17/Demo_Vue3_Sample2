import { inject } from 'vue'
import Block from '../classes/Block'
import Container from '../classes/Container'
import { selectionState } from './useSelection'

export function useEntryOperation() {
  const entryManager = inject('entryManager')
  const entryParamManager = inject('entryParamManager')
  const entryDefinitionService = inject('entryDefinitionService')

  const addBlock = (parentId, name, index) => {
    const newBlock = new Block(name)
    entryManager.addEntry(parentId, newBlock, index)
    const defaultParams = entryDefinitionService.getBlockDefaultParams(name)
    entryParamManager.setInputParams(newBlock.id, defaultParams.input)
    entryParamManager.setOutputParams(newBlock.id, defaultParams.output)
    return newBlock
  }

  const addContainer = (parentId, name, index) => {
    const newContainer = new Container(name)
    entryManager.addEntry(parentId, newContainer, index)
    return newContainer
  }

  const removeEntry = (id) => {
    const selectedId = selectionState.getSelectedEntryId().value
    if (selectedId && (selectedId === id || entryManager.getAllDescendantIds(id).includes(selectedId))) {
      selectionState.clearSelection()
    }
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

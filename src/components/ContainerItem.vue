<template>
  <div
    class="container-item"
    :class="{ 'dragging': isDragging, 'selected': isSelected }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click.stop="onSelect"
  >
    <div class="container-content">
      <div class="container-header" :data-entry-id="entry.id">
        <div class="entry-text">{{ entry.name }}</div>
        <div class="entry-button entry-button-play"
             :class="{ 'entry-button--hidden': !isSelected }" @click.stop="onPlay"></div>
        <div class="entry-button entry-button-delete" @click.stop="onRemove"></div>
        <EntryParamsItem v-if="isSelected || isConnecting" :entry-id="entry.id" />
      </div>
      <div class="container-children">
        <ContainerChildItem
          :entry="entry"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'  
import { useEntryOperation } from '../composables/useEntryOperation'
import { useDraggable } from '../composables/useDraggable'
import { useEntryExecution } from '../composables/useEntryExecution'
import { useEntryState } from '../composables/useEntryState'
import EntryParamsItem from './EntryParamsItem.vue'
import ContainerChildItem from './ContainerChildItem.vue'

export default {
  name: 'ContainerItem',
  components: {
    EntryParamsItem,
    ContainerChildItem
  },
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  emits: ['remove'],

  setup(props, { emit }) {
    // Get composable
    const {
      isDragging,
      onDragStart,
      onDragEnd,
      setOnDragStartCallBack
    } = useDraggable()
    const { executeEntry, isExecuting } = useEntryExecution()
    const {
      getAllDescendantIds,
      getParentId,
    } = useEntryOperation()
    const { 
      getSelectedEntryId,
      isConnectingParamDst,
      setSelectedEntry
    } = useEntryState()

    // Selection handling
    const isSelected = computed(() => {
      const selectedId = getSelectedEntryId()
      return selectedId.value === props.entry.id
    })
    
    const isConnecting = isConnectingParamDst(props.entry.id)

    const onSelect = () => {
      setSelectedEntry(props.entry)
    }
    
    // Set callback for drag start
    setOnDragStartCallBack((event, dragDropState) => {
      // Get the list of IDs for this entry and all its descendants
      const allIds = getAllDescendantIds(props.entry.id)
      dragDropState.setDraggedIds(allIds)

      // Get parent ID
      const parentId = getParentId(props.entry.id)
      
      // Set data for transfer
      event.dataTransfer.setData('entryType', 'container')
      event.dataTransfer.setData('entryId', props.entry.id)
      event.dataTransfer.setData('sourceId', parentId || props.entry.id)
      
      event.stopPropagation()
    })

    /**
     * Process when the play button is clicked
     */
    const onPlay = async () => {
      // Skip if already executing
      if (isExecuting.value) {
        console.log('Another entry is currently executing, please wait')
        return
      }
      
      try {
        // Execute the entry using EntryExecutionService
        await executeEntry(props.entry)
        console.log('Container execution completed')
      } catch (error) {
        console.error('Error executing container:', error)
      }
    }

    /**
     * Process when the remove button is clicked
     */
    const onRemove = () => {
      emit('remove', props.entry.id)
    }

    // Return values and methods to use in <template>
    return {
      isDragging,
      isSelected,
      isConnecting,
      onDragStart,
      onDragEnd,
      onSelect,
      onPlay,
      onRemove,
    }
  }
}
</script>

<style scoped>
.container-item {
  width: fit-content;
  border-radius: 4px;
  background-color: var(--container-bg-color);
  box-shadow: var(--container-box-shadow);
  border: var(--container-border);
}

.container-item.dragging {
  opacity: 0.5;
}

.container-item.selected {
  border: var(--entry-select-border);
  box-shadow: var(--entry-select-box-shadow);
}

.container-content {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.container-header {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

/* Entry text styles */
.entry-text {
  font-size: var(--entry-text-font-size);
  color: var(--entry-text-color);
  white-space: var(--entry-text-white-space);
  overflow: var(--entry-text-overflow);
  text-overflow: var(--entry-text-text-overflow);
  padding: var(--entry-text-padding);
}

/* Entry button base styles */
.entry-button {
  width: var(--entry-button-size);
  height: var(--entry-button-size);
  border-radius: var(--entry-button-border-radius);
  background-color: var(--entry-button-background-color);
  background-size: var(--entry-button-background-size);
  background-position: var(--entry-button-background-position);
  background-repeat: var(--entry-button-background-repeat);
  cursor: var(--entry-button-cursor);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--entry-button-transition-duration) ease,
              filter var(--entry-button-transition-duration) ease;
}

/* Entry button on press animation */
.entry-button:active {
  transform: scale(var(--entry-button-press-scale));
  filter: brightness(var(--entry-button-press-brightness));
}

/* Play button styles */
.entry-button-play {
  background-image: var(--entry-button-play-image);
}

/* Delete button styles */
.entry-button-delete {
  background-image: var(--entry-button-delete-image);
}

.entry-button--hidden {
  visibility: hidden;
}

.container-children {
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>

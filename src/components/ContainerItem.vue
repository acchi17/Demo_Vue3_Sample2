<template>
  <div 
    class="container-item"
    :class="{ 'dragging': isDragging }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="container-content">
      <div class="container-header">
        <div :style="textStyle">{{ entry.name }}</div>
        <div class="entry-button-group">
          <div class="entry-button entry-button-play" @click="onPlay"></div>
          <div class="entry-button entry-button-delete" @click="onRemove"></div>
        </div>
      </div>
      <div class="container-children">
        <!-- First drop area (always displayed) -->
        <div class="drop-area" 
            :class="{'is-active': dropAllowed}"
            @drop="(event) => onDrop(event, 0)"
            @dragover="onDragOver"
        />
        <!-- Each entry (block or container) and its drop area below -->
        <template v-for="(child, index) in children" :key="child.id">
          <!-- Switch component based on entry type -->
          <component 
            :is="child.type === 'block' ? 'BlockItem' : 'ContainerItem'"
            :entry="child"
            @remove="removeChild"
          />
          <div class="drop-area"
              :class="{'is-active': dropAllowed}"
              @drop="(event) => onDrop(event, index + 1)"
              @dragover="onDragOver"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, inject } from 'vue'
import { useDraggable } from '../composables/useDraggable'
import { useDroppable } from '../composables/useDroppable'
import { useObjectStyle } from '../composables/useObjectStyle'
import { useEntryExecution } from '../composables/useEntryExecution'
import BlockItem from './BlockItem.vue'
import Block from '../classes/Block'
import Container from '../classes/Container'

export default {
  name: 'ContainerItem',
  components: {
    BlockItem
  },
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  emits: ['remove'],
  
  setup(props, { emit }) {
    // Get EntryManager instance from the application
    const entryManager = inject('entryManager')
    
    // Get composable
    const {
      isDragging,
      onDragStart,
      onDragEnd,
      setOnDragStartCallBack
    } = useDraggable()
    const { 
      isDroppable,
      onDragOver, 
      onDrop, 
      setOnDropCallBack,
    } = useDroppable()
    const { getEntryTextStyle } = useObjectStyle()
    const { executeEntry, isExecuting } = useEntryExecution()
    
    // Set callback for drag start
    setOnDragStartCallBack((event, dragDropState) => {
      // Get the list of IDs for this entry and all its descendants
      const allIds = entryManager.getAllDescendantIds(props.entry.id)
      dragDropState.setDraggedIds(allIds)

      // Get parent ID
      const parentId = entryManager.getParentId(props.entry.id)
      
      // Set data for transfer
      event.dataTransfer.setData('entryType', 'container')
      event.dataTransfer.setData('entryId', props.entry.id)
      event.dataTransfer.setData('sourceId', parentId || props.entry.id)
      
      event.stopPropagation()
    })

    // Set custom callbacks for drop event
    setOnDropCallBack((event, index) => {
      // Get data directly from event.dataTransfer
      const entryType = event.dataTransfer.getData('entryType')
      const entryName = event.dataTransfer.getData('entryName')
      const entryId = event.dataTransfer.getData('entryId')
      const sourceId = event.dataTransfer.getData('sourceId')

      if (!entryId) {
        // Create and insert a new element
        if (index !== null) {
          if (entryType === 'block') {
            const newBlock = new Block(entryName)
            // Use EntryManager to add child entry
            entryManager.addEntry(props.entry.id, newBlock, index)
          } else if (entryType === 'container') {
            const newContainer = new Container(entryName)
            // Use EntryManager to add child entry
            entryManager.addEntry(props.entry.id, newContainer, index)
          }
        }
      } else {
        if (sourceId === props.entry.id) {
          // Reorder within the same container
          entryManager.reorderEntry(props.entry.id, entryId, index)
        } else {
          // Drag & drop from another container
          entryManager.moveEntry(entryId, props.entry.id, index)
        }
      }
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

    /**
     * Remove a child entry
     * @param {string} id - ID of the child to remove
     */
    const removeChild = (id) => {
      entryManager.removeEntry(id)
    }

    // Array of children
    const children = computed(() => props.entry.children)

    // For determining whether to allow the drop
    const dropAllowed = isDroppable(props.entry.id)

    // Get text style
    const textStyle = getEntryTextStyle()
    
    // Return values and methods to use in <template>
    return {
      isDragging,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDrop,
      onPlay,
      onRemove,
      removeChild,
      children,
      dropAllowed,
      textStyle
    }
  }
}
</script>

<style scoped>
.container-item {
  width: fit-content;
  border-radius: 4px;
  background-color: var(--container-bg-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid #AAAAAA;
}

.container-item.dragging {
  opacity: 0.5;
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
  gap: 10px;
}

/* Entry button group styles */
.entry-button-group {
  display: flex;
  align-items: center;
  gap: 2px;
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

.container-children {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.drop-area {
  height: 10px;
  width: 100%;
  margin: 5px 0px;
  border: 2px dashed transparent;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.drop-area.is-active {
  height: 30px;
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}
</style>

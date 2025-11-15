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
        <div :style="textStyle">{{ entry.id }}</div>
        <div :style="buttonStyle" @click="onRemove">×</div>
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
    const { getEntryButtonStyle, getEntryTextStyle } = useObjectStyle()
    
    // Set callback for drag start
    setOnDragStartCallBack((event, dragDropState) => {
      // Get the list of IDs for this entry and all its descendants
      const allIds = entryManager.getAllDescendantIds(props.entry.id)
      dragDropState.setDraggedIds(allIds)

      // Get parent ID
      const parentId = entryManager.getParentId(props.entry.id)
      
      // Set data for transfer
      event.dataTransfer.setData('entryId', props.entry.id)
      event.dataTransfer.setData('entryType', 'container')
      event.dataTransfer.setData('sourceId', parentId || props.entry.id)
      
      event.stopPropagation()
    })

    // Set custom callbacks for drop event
    setOnDropCallBack((event, index) => {
      // Get data directly from event.dataTransfer
      const entryId = event.dataTransfer.getData('entryId')
      const entryType = event.dataTransfer.getData('entryType')
      const sourceId = event.dataTransfer.getData('sourceId')

      if (!entryId) {
        // Create and insert a new element
        // Do nothing if index is null (don't add to entries)
        if (index !== null) {
          if (entryType === 'block') {
            // Create a block
            const newBlock = new Block()
            // Use EntryManager to add child entry
            entryManager.addEntry(props.entry.id, newBlock, index)
          } else if (entryType === 'container') {
            // Create a container
            const newContainer = new Container()
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

    // Get button style
    const buttonStyle = getEntryButtonStyle()
    
    // Return values and methods to use in <template>
    return {
      isDragging,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDrop,
      onRemove,
      removeChild,
      children,
      dropAllowed,
      textStyle,
      buttonStyle
    }
  }
}
</script>

<style scoped>
.container-item {
  width: fit-content;
  border-radius: 4px;
  background-color: #8eec9a;
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
  gap: 20px;
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

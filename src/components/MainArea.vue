<template>
  <div 
    class="main-area"
  >
    <div class="main-container">
      <!-- First drop area (always displayed) -->
      <div class="drop-area" 
          :class="{'is-active': dropAllowed}"
          @drop="(event) => onDrop(event, 0)"
          @dragover="onDragOver"
      />
      <!-- Each entry (block or container) and its drop area below -->
      <template v-for="(entry, index) in children" :key="entry.id">
        <!-- Switch component based on entry type -->
        <component 
          :is="entry.type === 'block' ? 'BlockItem' : 'ContainerItem'"
          :entry="entry"
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
</template>

<script>
import { inject, computed } from 'vue'
import { useDroppable } from '../composables/useDroppable'
import BlockItem from './BlockItem.vue'
import ContainerItem from './ContainerItem.vue'
import Block from '../classes/Block'
import Container from '../classes/Container'

export default {
  name: 'MainArea',
  components: {
    BlockItem,
    ContainerItem
  },
  
  setup() {  
    // Get EntryManager instance from the application
    const entryManager = inject('entryManager')
    
    // Get composable
    const { 
      isDroppable,
      onDragOver, 
      onDrop, 
      setOnDropCallBack
    } = useDroppable()

    // Create a top-level container & register it in EntryManager
    const mainContainer = new Container('main-area')
    entryManager.addEntry(null, mainContainer, 0)
    
    /**
     * Remove a child entry
     * @param {string} id - ID of the child to remove
     */
    const removeChild = (id) => {
      entryManager.removeEntry(id)
    }
    
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
            // Use EntryManager to add to main container
            entryManager.addEntry(mainContainer.id, newBlock, index)
          } else if (entryType === 'container') {
            const newContainer = new Container(entryName)
            // Use EntryManager to add to main container
            entryManager.addEntry(mainContainer.id, newContainer, index)
          }
        }
      } else {
        if (!sourceId || sourceId === mainContainer.id) {
          // Reorder within MainArea
          entryManager.reorderEntry(mainContainer.id, entryId, index)
        } else {
          // Drag & drop from a container
          entryManager.moveEntry(entryId, mainContainer.id, index)
        }
      }
    })

    // Array of children
    const children = computed(() => mainContainer.children)

    // For determining whether to allow the drop
    const dropAllowed = isDroppable(mainContainer.id)
    
    // Return values and methods to use in <template>
    return {
      onDragOver,
      onDrop,
      removeChild,
      children,
      dropAllowed
    }
  }
}
</script>

<style scoped>
.main-area {
  min-width: 800px;
  height: 100vh;
  padding: 0px 100px;
  box-sizing: border-box;
  background-color: #f5f5f5;
  overflow: auto;
}

.main-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: left;
}

.drop-area {
  height: 10px;
  width: 100%;
  margin: 5px 0;
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

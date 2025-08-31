<template>
  <div 
    class="main-area"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <div class="main-container">
      <!-- First drop area (always displayed) -->
      <div class="drop-area" 
          :class="{'is-dragEntering': isDragEntering}"
          @drop="(event) => onDrop(event, 0)"
          @dragover="onDragOver"
      />
      <!-- Each block and its drop area below -->
      <template v-for="(entry, index) in entries" :key="entry.id">
        <BlockItem :entry="entry" @remove="removeEntry" />
        <div class="drop-area" 
            :class="{'is-dragEntering': isDragEntering}"
            @drop="(event) => onDrop(event, index + 1)"
            @dragover="onDragOver"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useDroppable } from '../composables/useDroppable'
import BlockItem from './BlockItem.vue'
import Block from '../classes/Block'

export default {
  name: 'MainArea',
  components: {
    BlockItem
  },
  
  setup() {  
    // Get composition API
    const { 
      isDragEntering,
      onDragEnter, 
      onDragLeave, 
      onDragOver, 
      onDrop, 
      setOnDropCallBack 
    } = useDroppable()

    // Array of entries
    const entries = ref([])
    
    /**
     * Reorder an entry
     * @param {string} entryId - ID of the entry to reorder
     * @param {number} dropIndex - Index of the area where it was dropped
     */
    const reorderEntry = (entryId, dropIndex) => {
      const currentIndex  = entries.value.findIndex(entry => entry.id === entryId)
      if (currentIndex  !== -1) {
        let targetIndex = dropIndex
        if (dropIndex > currentIndex) {
          targetIndex = targetIndex - 1
        }
        const block = entries.value.splice(currentIndex , 1)[0]
        entries.value.splice(targetIndex, 0, block)
      }
    }
    
    /**
     * Remove an entry
     * @param {string} id - ID of the entry to remove
     */
    const removeEntry = (id) => {
      const currentIndex = entries.value.findIndex(entry => entry.id === id)
      if (currentIndex !== -1) {
        entries.value.splice(currentIndex, 1)
      }
    }
    
    // Set custom callbacks for drop event
    setOnDropCallBack((event, index) => {
      // Get data directly from event.dataTransfer
      const entryId = event.dataTransfer.getData('entryId')
      const entryType = event.dataTransfer.getData('entryType')
      
      if (entryType === 'block' && !entryId) {
        // Create and insert a new block
        // Do nothing if index is null (don't add to entries)
        if (index !== null) {
          const newBlock = new Block()
          entries.value.splice(index, 0, newBlock)
        }
      } else if (entryId) {
        // Reorder existing block
        reorderEntry(entryId, index)
      }
    })
    
    // Return values and methods to use in <template>
    return {
      entries,
      isDragEntering,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
      removeEntry
    }
  }
}
</script>

<style scoped>
.main-area {
  width: 100%;
  height: 100vh;
  padding-left: 100px;
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
  width: 100%;
  height: 20px;
  margin: 5px 0;
  border: 2px dashed transparent;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.drop-area.is-dragEntering {
  height: 40px;
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}
</style>

<template>
  <div
    class="main-area"
    @click="entryState.clearState()"
  >
    <!-- Connection lines background panel: absolutely positioned behind entry-panel and connection-panel -->
    <div class="background-panel">
      <div
        v-for="[id, rect] in entryLayoutMap"
        :key="id"
        class="background-line"
        :style="{ top: rect.y + rect.height / 2 + 'px' }"
      />
    </div>
    <div class="entry-panel" ref="entryPanelRef">
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
    <div class="connection-panel">
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useDroppable } from '../composables/useDroppable'
import { useEntryOperation } from '../composables/useEntryOperation'
import { entryState } from '../composables/useEntryState'
import { useEntryRect } from '../composables/useEntryRect'
import BlockItem from './BlockItem.vue'
import ContainerItem from './ContainerItem.vue'

export default {
  name: 'MainArea',
  components: {
    BlockItem,
    ContainerItem
  },
  
  setup() {
    // Get composable
    const {
      isDroppable,
      onDragOver,
      onDrop,
      setOnDropCallBack
    } = useDroppable()
    const { 
      addBlock,
      addContainer,
      removeEntry,
      reorderEntry,
      moveEntry
    } = useEntryOperation()

    // Create a top-level container & register it in EntryManager
    const mainContainer = addContainer(null, 'main-area', 0)
    
    /**
     * Remove a child entry
     * @param {string} id - ID of the child to remove
     */
    const removeChild = (id) => {
      removeEntry(id)
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
            addBlock(mainContainer.id, entryName, index)
          } else if (entryType === 'container') {
            addContainer(mainContainer.id, entryName, index)
          }
        }
      } else {
        if (!sourceId || sourceId === mainContainer.id) {
          // Reorder within MainArea
          reorderEntry(mainContainer.id, entryId, index)
        } else {
          // Drag & drop from a container
          moveEntry(entryId, mainContainer.id, index)
        }
      }
    })

    // Array of children
    const children = computed(() => mainContainer.children)

    // For determining whether to allow the drop
    const dropAllowed = isDroppable(mainContainer.id)

    // Template ref for the entry panel
    const entryPanelRef = ref(null)
    const entryLayoutMap = useEntryRect(entryPanelRef)

    // Return values and methods to use in <template>
    return {
      onDragOver,
      onDrop,
      removeChild,
      children,
      dropAllowed,
      entryState,
      entryPanelRef,
      entryLayoutMap
    }
  }
}
</script>

<style scoped>
.main-area {
  position: relative;
  display: flex;
  flex-direction: row;
  /* align-items: flex-start; */
  min-width: 800px;
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background-color: #f5f5f5;
}

.background-panel {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.entry-panel {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 0px 40px;
  display: flex;
  flex-direction: column;
  align-items: left;
}

.connection-panel {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 0px 40px;
}

.background-line {
  position: absolute;
  left: 10px;
  right: 10px;
  height: 1px;
  background-color: #ccc;
  pointer-events: none;
}

.drop-area {
  height: 20px;
  width: 100%;
  border: 1px dashed transparent;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.drop-area.is-active {
  height: 20px;
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}
</style>

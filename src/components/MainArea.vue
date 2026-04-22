<template>
  <div
    class="main-area"
    @click="clearState"
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
      <ContainerChildItem
        :entry="mainContainer"
      />
    </div>
    <div class="connection-panel">
      <ConnectionView />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useEntryOperation } from '../composables/useEntryOperation'
import { useEntryState } from '../composables/useEntryState'
import { useEntryRect } from '../composables/useEntryRect'
import ContainerChildItem from './ContainerChildItem.vue'
import ConnectionView from './ConnectionView.vue'

export default {
  name: 'MainArea',
  components: {
    ContainerChildItem,
    ConnectionView
  },
  
  setup() {
    const { addContainer } = useEntryOperation()
    const { clearState } = useEntryState()

    // Create a top-level container & register it in EntryManager
    const mainContainer = addContainer(null, 'main-area', 0)

    // Template ref for the entry panel
    const entryPanelRef = ref(null)
    const entryLayoutMap = useEntryRect(entryPanelRef)

    // Return values and methods to use in <template>
    return {
      mainContainer,
      clearState,
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
</style>

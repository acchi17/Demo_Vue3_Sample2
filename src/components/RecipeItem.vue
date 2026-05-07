<template>
  <div
    class="recipe-item"
    @click="clearState"
  >
    <div class="recipe-header">
      <button class="recipe-btn" title="Run" @click.stop="executeRecipe">▷</button>
      <button class="recipe-btn" title="Settings">⚙</button>
    </div>
    <div class="recipe-content">
      <div class="background-panel">
        <div
          v-for="[id, rect] in entryLayoutMap"
          :key="id"
          class="background-line"
          :style="{ top: rect.y + rect.height / 2 + 'px' }"
        />
      </div>
      <div class="entry-panel" ref="entryPanelRef">
        <div class="main-container">
          <ContainerChildren
            :entry="mainContainer"
          />
          <div class="bottom-spacer" />
        </div>
      </div>
      <div class="connection-panel">
        <ConnectionView />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useEntryOperation } from '../composables/useEntryOperation'
import { useSystemState } from '../composables/useSystemState'
import { useEntryRect } from '../composables/useEntryRect'
import { useEntryExecution } from '../composables/useEntryExecution'
import ConnectionView from './ConnectionView.vue'
import ContainerChildren from './ContainerChildren.vue'

export default {
  name: 'RecipeItem',
  components: {
    ConnectionView,
    ContainerChildren
  },

  setup() {
    const { addContainer } = useEntryOperation()
    const { clearState } = useSystemState()
    const { executeEntry } = useEntryExecution()

    const mainContainer = addContainer(null, 'main-area', 0)

    const executeRecipe = () => {
      executeEntry(mainContainer)
    }

    const entryPanelRef = ref(null)
    const entryLayoutMap = useEntryRect(entryPanelRef)

    return {
      mainContainer,
      clearState,
      executeRecipe,
      entryPanelRef,
      entryLayoutMap
    }
  }
}
</script>

<style scoped>
.recipe-item {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: var(--recipe-bg-color);
}

.recipe-header {
  height: 24px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.recipe-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.recipe-content {
  position: relative;
  height: 100%;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow-y: auto;
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
  flex: 7;
  padding: 20px 40px;
}

.connection-panel {
  position: relative;
  z-index: 1;
  flex: 3;
}

.main-container {
  height: fit-content;
  width: fit-content;
  min-width: 200px;
}

.bottom-spacer {
  height: 200px;
}

.background-line {
  position: absolute;
  left: 10px;
  right: 10px;
  height: 1px;
  background-color: var(--recipe-bg-line-color);
  pointer-events: none;
}

.recipe-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  padding: 0;
}
</style>

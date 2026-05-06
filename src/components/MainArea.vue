<template>
  <div class="main-header">
    <button class="log-toggle-btn"
            :title="showLog ? 'Hide Log' : 'Show Log'"
            @click="showLog = !showLog">
      {{ showLog ? '»' : '«' }}
    </button>
  </div>
  <div class="main-area" :class="{ 'executing': isExecuting }">
    <div class="tab-bar">
      <div class="tab active">
        <span class="tab-label">Recipe</span>
        <button class="tab-btn" title="Run" @click="executeRecipe">▷</button>
        <button class="tab-btn" title="Settings">⚙</button>
      </div>
    </div>
    <RecipeItem class="recipe-content" />
    <div v-show="showLog" class="log-popup">
      <ExecutionLogView />
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import RecipeItem from './RecipeItem.vue'
import ExecutionLogView from './ExecutionLogView.vue'
import { useEntryExecution } from '../composables/useEntryExecution'
import { useSystemState } from '../composables/useSystemState'

export default {
  name: 'MainArea',
  components: {
    RecipeItem,
    ExecutionLogView
  },
  setup() {
    const entryManager = inject('entryManager')
    const { executeEntry } = useEntryExecution()
    const { isExecuting } = useSystemState()

    const executeRecipe = () => {
      const rootEntry = entryManager.getRootEntry()
      if (rootEntry) executeEntry(rootEntry)
    }

    return { executeRecipe, isExecuting }
  },
  data() {
    return {
      showLog: false
    }
  }
}
</script>

<style scoped>
.main-header {
  height: 24px;
  background-color: var(--main-bg-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.main-area {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--main-bg-color);
}

.main-area.executing {
  pointer-events: none;
  opacity: 0.5;
}

.tab-bar {
  display: flex;
  align-items: flex-end;
  height: 36px;
  padding: 0 8px;
  flex-shrink: 0;
  border-bottom: var(--main-tab-border);
}

.tab {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  min-width: 160px;
  max-width: 240px;
  padding: 0 10px;
  border-radius: 12px 12px 0 0;
  background-color: var(--main-bg-color);
}

.tab.active {
  margin-bottom: -1px;
  border: var(--main-tab-border);
  border-bottom: 1px solid var(--recipe-bg-color);
  background-color: var(--recipe-bg-color);
}

.tab-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--main-tab-font-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  padding: 0;
}

.tab-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.recipe-content {
  flex: 1;
}

.log-toggle-btn {
  margin-right: 4px;
  width: 20px;
  height: 20px;
  font-size: 14px;
  color: #555;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.log-toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.log-popup {
  position: absolute;
  top: -1px;
  right: 0;
  bottom: 0;
  z-index: 10;
  border: var(--common-outline-border);
  background-color: #fafafa;
}
</style>

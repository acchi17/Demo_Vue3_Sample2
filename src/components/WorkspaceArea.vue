<template>
  <div class="workspace-area">
    <div class="tab-bar">
      <div class="tab active">
        <span class="tab-label">Main Area</span>
        <button class="tab-btn" title="Run">▷</button>
        <button class="tab-btn" title="Settings">⚙</button>
      </div>
    </div>
    <RecipeItem class="workspace-content" />
  </div>
</template>

<script>
import RecipeItem from './RecipeItem.vue'

export default {
  name: 'WorkspaceArea',
  components: {
    RecipeItem
  }
}
</script>

<style scoped>
.workspace-area {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f0f0;
}

.tab-bar {
  display: flex;
  align-items: flex-end;
  height: 36px;
  padding: 0 8px;
  flex-shrink: 0;
  border-bottom: 1px solid #ccc;
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
  font-size: 13px;
  cursor: default;
  background-color: #c8c8c8;
}

.tab.active {
  position: relative;
  background-color: var(--main-bg-color);
  border: 1px solid #ccc;
  border-bottom: 1px solid var(--main-bg-color);
  margin-bottom: -1px;
}

.tab-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
  font-weight: 500;
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

.workspace-content {
  flex: 1;
}
</style>

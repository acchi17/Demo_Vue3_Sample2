<template>
  <div class="side-area">
    <div class="top-item">
      <BlockListView />
    </div>
    <div class="bottom-item">
      <EntryView />
    </div>
  </div>
</template>

<script>
import BlockListView from './BlockListView.vue';
import EntryView from './EntryView.vue';

export default {
  name: 'SideArea',
  components: {
    BlockListView,
    EntryView
  }
}
</script>

<style scoped>
.side-area {
  width: 300px;
  height: 100vh;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
}

.top-item {
  flex: 6;
  display: flex;
  overflow-y: auto;
}

.bottom-item {
  flex: 4;
  display: flex;
  overflow-y: auto;
  border-top: 1px solid #ccc;
}
</style>

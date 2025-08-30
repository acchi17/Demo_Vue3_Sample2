<template>
  <div class="side-area">
    <div class="rect-item">
      <div 
        class="rect-icon whitegray"
        draggable="true"
        @dragstart="onDragStartBlock"
      ></div>
    </div>
  </div>
</template>

<script>
import { useDraggable } from '../composables/useDraggable';

export default {
  name: 'SideArea',
  
  setup() {
    // Get composition API
    const { 
      onDragStart: onDragStartBlock, 
      setOnDragStartCallBack: setBlockDragStartCallback 
    } = useDraggable();

    // Set custom callbacks for drag start events
    setBlockDragStartCallback((event) => {
      event.dataTransfer.setData('entryType', 'block');
    });
    
    // Return values and methods to use in <template>
    return {
      onDragStartBlock
    };
  }
}
</script>

<style scoped>
.side-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  background: #f0f0f0;
  border-right: 1px solid #ccc;
}
.rect-item {
  margin-top: 32px;
  width: 50px;
  height: 50px;
}
.rect-icon {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: grab;
}

.rect-icon.whitegray {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
}
</style>

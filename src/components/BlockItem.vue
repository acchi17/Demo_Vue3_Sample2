<template>
  <div 
    class="block-item"
    :class="{ 'dragging': isDragging }"
    draggable="true"
    @dragstart="onDragStart"  
    @dragend="onDragEnd"
  >
    <div class="block-content">
      <div class="block-header">
        <div :style="textStyle">{{ entry.id }}</div>
        <div :style="buttonStyle" @click="onRemove">×</div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { useDraggable } from '../composables/useDraggable'
import { useObjectStyle } from '../composables/useObjectStyle'

export default {
  name: 'BlockItem',
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
    const { getEntryButtonStyle, getEntryTextStyle } = useObjectStyle()
    
    // Set callback for drag start
    setOnDragStartCallBack((event) => {
      // Get parent ID
      const parentId = entryManager.getParentId(props.entry.id)

      // Set data for transfer
      event.dataTransfer.setData('entryId', props.entry.id)
      event.dataTransfer.setData('entryType', 'block')
      event.dataTransfer.setData('sourceId', parentId || '')
      
      event.stopPropagation()
    })
    
    /**
     * Process when the remove button is clicked
     */
    const onRemove = () => {
      emit('remove', props.entry.id)
    }

    // Get text style
    const textStyle = getEntryTextStyle()

    // Get button style
    const buttonStyle = getEntryButtonStyle()
    
    // Return values and methods to use in <template>
    return {
      isDragging,
      onDragStart,
      onDragEnd,
      onRemove,
      textStyle,
      buttonStyle
    }
  }
}
</script>

<style scoped>
.block-item {
  height: 50px;
  width: fit-content;
  border-radius: 4px;
  background-color: #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid #AAAAAA;
}

.block-item.dragging {
  opacity: 0.5;
}

.block-content {
  height: 100%;
  width: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.block-header {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
}
</style>

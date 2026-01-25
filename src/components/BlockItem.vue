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
        <div class="entry-text">{{ entry.name }}</div>
        <div class="entry-button-group">
          <div class="entry-button entry-button-play" @click="onPlay"></div>
          <div class="entry-button entry-button-delete" @click="onRemove"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { useDraggable } from '../composables/useDraggable'
import { useEntryExecution } from '../composables/useEntryExecution'

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
    
    // Get composables
    const {
      isDragging,
      onDragStart,
      onDragEnd,
      setOnDragStartCallBack
    } = useDraggable()
    const { executeEntry, isExecuting } = useEntryExecution()
    
    // Set callback for drag start
    setOnDragStartCallBack((event) => {
      // Get parent ID
      const parentId = entryManager.getParentId(props.entry.id)

      // Set data for transfer
      event.dataTransfer.setData('entryType', 'block')
      event.dataTransfer.setData('entryId', props.entry.id)
      event.dataTransfer.setData('sourceId', parentId || '')
      
      event.stopPropagation()
    })

    /**
     * Process when the play button is clicked
     */
    const onPlay = async () => {
      // Skip if already executing
      if (isExecuting.value) {
        console.log('Another entry is currently executing, please wait')
        return
      }
      
      try {
        // Execute the entry using EntryExecutionService
        await executeEntry(props.entry)
        console.log('Block execution completed')
      } catch (error) {
        console.error('Error executing block:', error)
      }
    }
    
    /**
     * Process when the remove button is clicked
     */
    const onRemove = () => {
      emit('remove', props.entry.id)
    }
    
    // Return values and methods to use in <template>
    return {
      isDragging,
      onDragStart,
      onDragEnd,
      onPlay,
      onRemove
    }
  }
}
</script>

<style scoped>
.block-item {
  height: 50px;
  width: fit-content;
  border-radius: 4px;
  background-color: var(--block-bg-color);
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
  gap: 10px;
}

/* Entry button group styles */
.entry-button-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Entry button base styles */
.entry-button {
  width: var(--entry-button-size);
  height: var(--entry-button-size);
  border-radius: var(--entry-button-border-radius);
  background-color: var(--entry-button-background-color);
  background-size: var(--entry-button-background-size);
  background-position: var(--entry-button-background-position);
  background-repeat: var(--entry-button-background-repeat);
  cursor: var(--entry-button-cursor);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--entry-button-transition-duration) ease,
              filter var(--entry-button-transition-duration) ease;
}

/* Entry button on press animation */
.entry-button:active {
  transform: scale(var(--entry-button-press-scale));
  filter: brightness(var(--entry-button-press-brightness));
}

/* Play button styles */
.entry-button-play {
  background-image: var(--entry-button-play-image);
}

/* Delete button styles */
.entry-button-delete {
  background-image: var(--entry-button-delete-image);
}

/* Entry text styles */
.entry-text {
  font-size: var(--entry-text-font-size);
  color: var(--entry-text-color);
  white-space: var(--entry-text-white-space);
  overflow: var(--entry-text-overflow);
  text-overflow: var(--entry-text-text-overflow);
}
</style>

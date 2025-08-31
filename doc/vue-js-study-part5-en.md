# Vue.js Study Part 5: Drag-and-drop functionality for reordering UI objects using Vue.js

This article explains the functionality of reordering UI objects using drag and drop with Vue.js.

## An application covered in this article

- When you drag a white-gray icon from the left sidebar and drop it into the main area, rectangular blocks are arranged vertically in the main area.
- Blocks placed in the main area display a block-specific ID and a delete button.
- Blocks placed in the main area can be reordered by drag and drop.
- When you click the delete button on a block placed in the main area, the block is deleted.

Source code  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step1](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step1)

## Source code structure of the Vue application

The source structure of the above application is as follows:

```
public/
├── favicon.ico
└── index.html
src/
├── App.vue
├── main.js // Javascript entry point
├── classes/
│   ├── Block.js
│   └── Entry.js
├── components/
│   ├── BlockItem.vue
│   ├── MainArea.vue
│   └── SideArea.vue
└── composables/
    ├── useDraggable.js
    ├── useDroppable.js
    └── useObjectStyle.js
```

## Implementing the functionality

### 1. Shared drag-and-drop functionality

Implement drag-and-drop related functionality (mainly various event handlers) in useDraggable.js and useDroppable.js to make them available to other components. These reusable functionality files like useDraggable.js and useDroppable.js are called composables in Vue.js.

useDraggable.js

```javascript
import { ref } from 'vue'

/**
 * Provides drag functionality as a composable function
 * @returns {Object} Drag-related state and methods
 */
export function useDraggable() {
  // Dragging state
  const isDragging = ref(false)
  
  // Custom callback for drag start event
  let OnDragStartCallBack = null
  
  /**
   * Set the callback for drag start event
   * @param {Function} callback - Callback function to execute on drag start
   */
  const setOnDragStartCallBack = (callback) => {
    OnDragStartCallBack = callback
  }
  
  /**
   * Handle drag start event
   * @param {DragEvent} event - The drag event
   */
  const onDragStart = (event) => {
    isDragging.value = true
    if (OnDragStartCallBack) {
      OnDragStartCallBack(event)
    }
  }
  
  /**
   * Handle drag end event
   */
  const onDragEnd = () => {
    isDragging.value = false
  }
  
  // Return public state and methods
  return {
    isDragging,
    setOnDragStartCallBack,
    onDragStart,
    onDragEnd
  }
}
```

useDroppable.js

```javascript
import { ref } from 'vue'

/**
 * Provides drop functionality as a composable function
 * @returns {Object} Drop-related state and methods
 */
export function useDroppable() {
  // State indicating whether drag is entering the area
  const isDragEntering = ref(false)
  
  // Counter for drag enter events (supports nested elements)
  const dragEnterCount = ref(0)
  
  // Callback function to execute on drop
  let OnDropCallBack = null
  
  /**
   * Set the callback for drop event
   * @param {Function} callback - Callback function
   */
  const setOnDropCallBack = (callback) => {
    OnDropCallBack = callback
  }

  /**
   * Handle drag enter event
   * @param {DragEvent} event - The drag event
   */
  const onDragEnter = (event) => {
    event.preventDefault()
    dragEnterCount.value++
    if (dragEnterCount.value === 1) {
      isDragEntering.value = true
    }
  }
  
  /**
   * Handle drag over event
   * @param {DragEvent} event - The drag event
   */
  const onDragOver = (event) => {
    event.preventDefault()
  }
  
  /**
   * Handle drag leave event
   * @param {DragEvent} event - The drag event
   */
  const onDragLeave = (event) => {
    event.preventDefault()
    dragEnterCount.value--
    if (dragEnterCount.value === 0) {
      isDragEntering.value = false
    }
  }
  
  /**
   * Handle drop event
   * @param {DragEvent} event - The drag event
   * @param {number|null} index - Index of drop position
   */
  const onDrop = (event, index = null) => {
    event.preventDefault()
    isDragEntering.value = false
    dragEnterCount.value = 0
    if (OnDropCallBack) {
      OnDropCallBack(event, index)
    }
  }
  
  // Return public state and methods
  return {
    isDragEntering,
    setOnDropCallBack,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop
  }
}
```

### 2. Drag-and-drop functionality for moving icons from the left sidebar to the main area

Implement functionality to make icons in the left sidebar draggable and create new blocks when dropped in the main area. SideArea.vue uses the useDraggable composable to implement drag functionality, and MainArea.vue uses the useDroppable composable to implement drop functionality. When dragging starts, data is set in the DataTransfer object, and when dropped, that data is retrieved to create a new block.

SideArea.vue

```vue
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

<!-- Style section omitted -->
```

- In SideArea.vue, the `draggable="true"` attribute makes the icon draggable, and the `@dragstart` event handles the process when dragging begins.
- When dragging starts, `event.dataTransfer.setData('entryType', 'block')` is executed to set data indicating that the dragged item is a block type.

MainArea.vue

```vue
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
      // Implementation details omitted
    }
    
    // Remove an entry
    const removeEntry = (id) => {
      // Implementation details omitted
    }
    
    // Set custom callbacks for drop event
    setOnDropCallBack((event, index) => {
      // Get data directly from event.dataTransfer
      const entryId = event.dataTransfer.getData('entryId')
      const entryType = event.dataTransfer.getData('entryType')
      
      if (entryType === 'block' && !entryId) {
        // Create and insert a new block
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

<!-- Style section omitted -->
```

- In MainArea.vue, multiple drop areas (`.drop-area`) are placed, and each drop area has an `@drop` event handler set.
- When dropped, `event.dataTransfer.getData('entryType')` retrieves the type of the dragged item, and if it's 'block', a new Block instance is created and added to entries.
- During dragging, the style of the drop area changes according to the value of `isDragEntering`, providing visual feedback.
- By placing drop areas between each block, new blocks can be inserted at any position among the blocks.

### 3. Drag-and-drop functionality for reordering blocks within the main area

Implement functionality to make blocks placed in the main area draggable and reorder blocks by dropping them in different positions. BlockItem.vue uses the useDraggable composable to make blocks draggable, and MainArea.vue uses the useDroppable composable to implement drop functionality. When dragging starts, the block's ID is set in the DataTransfer object, and when dropped, that ID is retrieved to change the position of the target block.

BlockItem.vue

```vue
<template>
  <div 
    class="block-item"
    :class="{ 'dragging': isDragging }"
    draggable="true"
    @dragstart="onDragStart"  
    @dragend="onDragEnd"
  >
    <div class="block-content">
      <div :style="textStyle">{{ entry.id }}</div>
      <div :style="buttonStyle" @click="onRemove">×</div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
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
    // Get composition API
    const { isDragging, onDragStart, setOnDragStartCallBack, onDragEnd } = useDraggable()
    const { getEntryButtonStyle, getEntryTextStyle } = useObjectStyle()
    
    // Set callback for drag start
    setOnDragStartCallBack((event) => {
      event.dataTransfer.setData('entryId', props.entry.id)
      event.stopPropagation()
    })
    
    /**
     * Process when the remove button is clicked
     */
    const onRemove = () => {
      emit('remove', props.entry.id)
    }

    // Get text style
    const textStyle = computed(() => getEntryTextStyle())

    // Get button style
    const buttonStyle = computed(() => getEntryButtonStyle())
    
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

<!-- Style section omitted -->
```

- In BlockItem.vue, the `draggable="true"` attribute makes the block draggable, and the `@dragstart` and `@dragend` events handle the processes at the start and end of dragging.
- During dragging, the `.dragging` class is applied based on the value of `isDragging`, providing visual feedback by changing the block's opacity.
- When dragging starts, `event.dataTransfer.setData('entryId', props.entry.id)` is executed to set the ID of the dragged block in the DataTransfer object. This allows identifying which block was moved at the drop destination.
- `event.stopPropagation()` is used to stop event propagation, preventing drag events from firing on parent elements.

MainArea.vue

```vue
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

<!-- Style section omitted -->
```

- In MainArea.vue, `.drop-area` elements are placed between each block, allowing blocks to be dropped at any position among other blocks.
- Drop areas have `@drop` event handlers set, and when dropped, the index of that area (`index`) is passed to the `onDrop` function.
- The `reorderEntry` function uses the current position of the dragged block (`currentIndex`) and the drop destination position (`dropIndex`) to calculate the new position of the block.
- Particularly important is the process of decreasing the target index by 1 when the drop destination is after the drag source position (`dropIndex > currentIndex`). This is because the array indices change after removing the block.
- In the drop process, first `entryId` and `entryType` are retrieved from `event.dataTransfer`, distinguishing between moving existing blocks (when `entryId` exists) and creating new blocks (when `entryType === 'block' && !entryId`).
- In the case of moving existing blocks, the `reorderEntry` function is called to change the position of the block. Specifically, the block is removed from its current position (`splice(currentIndex, 1)`) and inserted at the new position (`splice(targetIndex, 0, block)`).

# Vue.js Study Part 6: Drag-and-drop UI builder with nestable objects using Vue.js

## An application covered in this article

- When you drag icons (white-gray, lime-green) from the left sidebar and drop them into the main area, blocks and containers are placed respectively.
- Other blocks and containers can be placed inside containers using drag & drop.
- Each element's position and parent-child relationship can be changed via drag & drop.
- Clicking the delete button on each element removes that element and its child elements.

**Source code:**  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2)

## Source code structure of the Vue application

The source structure of the above application is as follows.

```
public/
├── favicon.ico
└── index.html
src/
├── App.vue
├── main.js // Javascript entry point
├── classes/
│   ├── Block.js
│   ├── Container.js
│   ├── Entry.js
│   └── EntryManager.js
├── components/
│   ├── BlockItem.vue
│   ├── ContainerItem.vue
│   ├── MainArea.vue
│   └── SideArea.vue
└── composables/
    ├── useDragDropState.js
    ├── useDraggable.js
    ├── useDroppable.js
    └── useObjectStyle.js
```

## Implementing the functionality

### 1. Managing parent-child relationships between objects (blocks and containers)

In this application, a dedicated class called "EntryManager" is implemented to manage the parent-child relationships between blocks and containers. This class provides functionality for placing other blocks or containers inside a container and changing their positional relationships. The EntryManager enables efficient access and manipulation by registering all entries (blocks and containers) and managing their parent-child relationships with maps.

**EntryManager.js**

```javascript
/**
 * EntryManager class
 * Class that manages parent-child relationships between entries
 */
export default class EntryManager {
  constructor() {
    // Dictionary of entry IDs and objects
    this._entriesMap = new Map();
    
    // Dictionary of child IDs and their parent IDs
    this._parentChildMap = new Map();
  }

  /**
   * Register an entry (Internal use)
   * @param {Entry} entry - Entry to register
   * @returns {boolean} Whether the registration was successful
   * @private
   */
  _registerEntry(entry) {
    if (!entry || !entry.id) return false;
    
    // Overwrite if already registered
    this._entriesMap.set(entry.id, entry);
    return true;
  }

  /**
   * Detach an entry from its parent
   * @param {Entry} entry - Entry to detach from its parent
   * @returns {boolean} Whether the detach operation was successful
   * @private
   */
  _detachEntry(entry) {
    // Validate entry
    if (!entry || !entry.id) return false;
    
    const entryId = entry.id;
    
    // Get parent entry
    const parentId = this._parentChildMap.get(entryId);
    if (!parentId) return true;
    
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return false;
    
    // Remove from parent's children array
    const index = parentEntry.children.findIndex(child => child.id === entryId);
    if (index === -1) return false;
    
    parentEntry.children.splice(index, 1);
    
    // Delete parent-child relationship
    this._parentChildMap.delete(entryId);
    
    return true;
  }

  /**
   * Recursively remove all descendants of a entry
   * @param {Entry} entry - Entry whose descendants should be removed
   * @private
   */
  _removeDescendants(entry) {
    // Process all children of the container
    for (const child of entry.children) {
      // Remove parent-child relationship
      this._parentChildMap.delete(child.id);
      
      // If the child is a container, recursively process its descendants
      if (child.type === 'container') {
        this._removeDescendants(child);
      }
      
      // Remove from entries map
      this._entriesMap.delete(child.id);
    }
    
    // Clear the children array
    entry.children.length = 0;
  }

  /**
   * Get an entry
   * @param {string} entryId - ID of the entry to get
   * @returns {Entry|null} Retrieved entry or null
   */
  getEntry(entryId) {
    return this._entriesMap.get(entryId) || null;
  }

  /**
   * Get the parent of an entry
   * @param {string} entryId - ID of the child entry
   * @returns {Entry|null} Parent entry or null
   */
  getParentEntry(entryId) {
    const parentId = this._parentChildMap.get(entryId);
    if (!parentId) return null;
    
    return this._entriesMap.get(parentId) || null;
  }

  /**
   * Get the parent ID of an entry
   * @param {string} entryId - ID of the child entry
   * @returns {string|null} Parent entry ID or null
   */
  getParentId(entryId) {
    return this._parentChildMap.get(entryId) || null;
  }

  /**
   * Get the list of IDs for an entry and all its descendants
   * @param {string} entryId - Target entry ID
   * @returns {Array<string>} List of IDs for the entry and all its descendants
   */
  getAllDescendantIds(entryId) {
    const ids = new Set([entryId]);
    
    const entry = this._entriesMap.get(entryId);
    if (!entry || entry.type !== 'container') return Array.from(ids);
    
    // Recursively get child entries
    for (const childEntry of entry.children) {
      const childIds = this.getAllDescendantIds(childEntry.id);
      childIds.forEach(id => ids.add(id));
    }
    
    return Array.from(ids);
  }

  /**
   * Add an entry to a parent entry
   * If parentId is null, the entry is just registered without a parent
   * @param {string|null} parentId - ID of the parent entry, or null to just register
   * @param {Entry} entry - Entry to add
   * @param {number} index - Index position to add (ignored if parentId is null)
   * @returns {boolean} Whether the addition was successful
   */
  addEntry(parentId, entry, index) {
    // If parentId is null, just register the entry without a parent
    if (parentId === null) {
      return this._registerEntry(entry);
    }
    
    // Get parent entry
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return false;
    
    // Register child entry
    this._registerEntry(entry);
    
    // Set parent-child relationship
    this._parentChildMap.set(entry.id, parentId);
    
    // Add directly to parent's children array
    if (index >= 0 && index <= parentEntry.children.length) {
      parentEntry.children.splice(index, 0, entry);
      return true;
    }
    return false;
  }

  /**
   * Remove an entry from a parent entry
   * @param {string} entryId - ID of the entry to remove
   * @returns {boolean} Whether the removing was successful
   */
  removeEntry(entryId) {
    // Get parent entry
    const parentId = this._parentChildMap.get(entryId);
    if (!parentId) return false;
    
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return false;
    
    // Get child entry
    const childEntry = this._entriesMap.get(entryId);
    if (!childEntry) return false;
    
    // Remove from parent's children array
    const index = parentEntry.children.findIndex(child => child.id === entryId);
    if (index === -1) return false;
    
    parentEntry.children.splice(index, 1);
    
    // Delete parent-child relationship
    this._parentChildMap.delete(entryId);
    
    // If the entry is a container, recursively remove all its descendants
    if (childEntry.type === 'container') {
      this._removeDescendants(childEntry);
    }
    
    // Return true to indicate successful removal
    return true;
  }

  /**
   * Reorder an entry within a parent entry
   * @param {string} parentId - ID of the parent entry
   * @param {string} entryId - ID of the entry to reorder
   * @param {number} index - Target index position
   * @returns {boolean} Whether the reordering was successful
   */
  reorderEntry(parentId, entryId, index) {
    // Get parent entry
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return false;
    
    // Reorder within parent's children array
    const currentIndex = parentEntry.children.findIndex(child => child.id === entryId);
    if (currentIndex !== -1) {
      let targetIndex = index;
      if (index > currentIndex) {
        targetIndex = targetIndex - 1;
      }
      const child = parentEntry.children.splice(currentIndex, 1)[0];
      parentEntry.children.splice(targetIndex, 0, child);
      return true;
    }
    return false;
  }

  /**
   * Move an entry to a different parent
   * @param {string} entryId - ID of the child entry to move
   * @param {string|null} newParentId - ID of the new parent entry (null to set as parentless)
   * @param {number} index - Target index position
   * @returns {boolean} Whether the moving was successful
   */
  moveEntry(entryId, newParentId, index) {
    // Check if the entry exists
    const entry = this._entriesMap.get(entryId);
    if (!entry) return false;
    
    // Detach from the current parent
    this._detachEntry(entry);
    
    // Add to the new parent
    return this.addEntry(newParentId, entry, index);
  }
}
```

- The EntryManager class manages parent-child relationships using two main maps:
  - `_entriesMap`: A dictionary (Map) of entry IDs and entry objects
  - `_parentChildMap`: A dictionary (Map) of child entry IDs and parent entry IDs
- This class primarily provides the following functions:
  - Adding entries (`addEntry`) - Adding an entry at a specific position to a specific parent container
  - Removing entries (`removeEntry`) - Removing an entry from a parent container and disconnecting the parent-child relationship (recursively removing descendants for containers)
  - Reordering entries within the same container (`reorderEntry`) - Changing the position of an entry within the same parent container
  - Moving entries (`moveEntry`) - Moving an entry to a different parent container
- The `getAllDescendantIds` method, which recursively retrieves descendant entry IDs, is used to identify entries being dragged.

### 2. Container component capable of holding child objects

The container component functions as a vessel that can hold other blocks or containers through drag & drop. It uses Vue.js's Provide/Inject pattern to share the EntryManager instance and manage parent-child relationships between components.

**main.js**

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import EntryManager from './classes/EntryManager'

const app = createApp(App)

// Provide EntryManager as a provider
const entryManager = new EntryManager()
app.provide('entryManager', entryManager)

app.mount('#app')
```

- In `main.js`, `app.provide('entryManager', entryManager)` is used to share the EntryManager throughout the application.
- This method makes the EntryManager instance, which is responsible for managing parent-child relationships, available to all components.

**Container.js**

```javascript
/**
 * Container class
 * Class that inherits from Entry class and corresponds to a lime-colored rectangle
 * Container can contain other entries (Block or Container) inside
 */
import { reactive } from 'vue';
import Entry from './Entry';

export default class Container extends Entry {
  /**
   * Constructor
   * @param {string|null} id - Unique ID of the container (auto-generated if null)
   */
  constructor(id = null) {
    super(id);
    this.type = 'container';  // Container type
    this.children = reactive([]); // Array of child elements
  }
}
```

- The Container class extends the basic Entry class to implement a special entry type that can hold child elements.
- It uses Vue's `reactive` function to define the `children` array, enabling automatic UI updates when child elements change.
- Setting the container type to 'container' allows UI components to determine what type of entry they're dealing with.
- Unlike blocks, containers can nest other blocks or containers inside them, allowing for the expression of a hierarchical UI structure.

**ContainerItem.vue**

```vue
<template>
  <div 
    class="container-item"
    :class="{ 'dragging': isDragging }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="container-content">
      <div class="container-header">
        <div :style="textStyle">{{ entry.id }}</div>
        <div :style="buttonStyle" @click="onRemove">×</div>
      </div>
      <div class="container-children">
        <!-- First drop area (always displayed) -->
        <div class="drop-area" 
            :class="{'is-active': dropAllowed}"
            @drop="(event) => onDrop(event, 0)"
            @dragover="onDragOver"
        />
        <!-- Each entry (block or container) and its drop area below -->
        <template v-for="(child, index) in children" :key="child.id">
          <!-- Switch component based on entry type -->
          <component 
            :is="child.type === 'block' ? 'BlockItem' : 'ContainerItem'"
            :entry="child"
            @remove="removeChild"
          />
          <div class="drop-area"
              :class="{'is-active': dropAllowed}"
              @drop="(event) => onDrop(event, index + 1)"
              @dragover="onDragOver"
          />
</template>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, inject } from 'vue'
import { useDraggable } from '../composables/useDraggable'
import { useDroppable } from '../composables/useDroppable'
import { useObjectStyle } from '../composables/useObjectStyle'
import BlockItem from './BlockItem.vue'
import Block from '../classes/Block'
import Container from '../classes/Container'

export default {
  name: 'ContainerItem',
  components: {
    BlockItem
  },
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
    const { 
      isDroppable,
      onDragOver, 
      onDrop, 
      setOnDropCallBack,
    } = useDroppable()
    const { getEntryButtonStyle, getEntryTextStyle } = useObjectStyle()
    
    // Set callback for drag start
    setOnDragStartCallBack((event, dragDropState) => {
      // Get the list of IDs for this entry and all its descendants
      const allIds = entryManager.getAllDescendantIds(props.entry.id)
      dragDropState.setDraggedIds(allIds)

      // Get parent ID
      const parentId = entryManager.getParentId(props.entry.id)
      
      // Set data for transfer
      event.dataTransfer.setData('entryId', props.entry.id)
      event.dataTransfer.setData('entryType', 'container')
      event.dataTransfer.setData('sourceId', parentId || props.entry.id)
      
      event.stopPropagation()
    })

    // Set custom callbacks for drop event
    setOnDropCallBack((event, index) => {
      // Get data directly from event.dataTransfer
      const entryId = event.dataTransfer.getData('entryId')
      const entryType = event.dataTransfer.getData('entryType')
      const sourceId = event.dataTransfer.getData('sourceId')

      if (!entryId) {
        // Create and insert a new element
        // Do nothing if index is null (don't add to entries)
        if (index !== null) {
          if (entryType === 'block') {
            // Create a block
            const newBlock = new Block()
            // Use EntryManager to add child entry
            entryManager.addEntry(props.entry.id, newBlock, index)
          } else if (entryType === 'container') {
            // Create a container
            const newContainer = new Container()
            // Use EntryManager to add child entry
            entryManager.addEntry(props.entry.id, newContainer, index)
          }
        }
      } else {
        if (sourceId === props.entry.id) {
          // Reorder within the same container
          entryManager.reorderEntry(props.entry.id, entryId, index)
        } else {
          // Drag & drop from another container
          entryManager.moveEntry(entryId, props.entry.id, index)
        }
      }
    })
    
    /**
     * Process when the remove button is clicked
     */
    const onRemove = () => {
      emit('remove', props.entry.id)
    }

    /**
     * Remove a child entry
     * @param {string} id - ID of the child to remove
     */
    const removeChild = (id) => {
      entryManager.removeEntry(id)
    }

    // Array of children
    const children = computed(() => props.entry.children)

    // For determining whether to allow the drop
    const dropAllowed = isDroppable(props.entry.id)

    // Get text style
    const textStyle = getEntryTextStyle()

    // Get button style
    const buttonStyle = getEntryButtonStyle()
    
    // Return values and methods to use in <template>
    return {
      isDragging,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDrop,
      onRemove,
      removeChild,
      children,
      dropAllowed,
      textStyle,
      buttonStyle
    }
  }
}
</script>
```

- Inside the container, a drop area is always displayed at the beginning, and drop areas are placed below each child element, allowing new elements to be inserted at any position within the container.
- Using `<component :is="child.type === 'block' ? 'BlockItem' : 'ContainerItem'">`, the component dynamically renders the appropriate component based on the child element's type, enabling a nested structure.
- When dropping, three cases are handled:
  - Creating and inserting new elements (blocks or containers)
  - Reordering elements within the same container
  - Moving elements from different containers

**MainArea.vue**

```javascript
// Create a top-level container & register it in EntryManager
const mainContainer = new Container('main-area')
entryManager.addEntry(null, mainContainer, 0)
```

- MainArea.vue holds an instance of the Container class internally, serving as the parent or ancestor of all other entries (blocks and containers).

### 3. Global drag state management

In this application, a mechanism for global drag state management is implemented to share the state during drag & drop operations across multiple components. Using dedicated composable functions that leverage Vue.js Composition API, it manages the state during dragging and information about the elements being dragged, ensuring consistent behavior between components.

**useDragDropState.js**

```javascript
import { ref, readonly } from 'vue'

// List of IDs for the dragged item and its descendants
const draggedItemIds = ref(new Set())

// Dragging state
const isDragging = ref(false)

/**
 * Composable function for drag & drop state management
 * @returns {Object} Drag state and related methods
 */
function useDragDropState() {
  /**
   * Activate dragging state
   */
  const activateDragging = () => {
    isDragging.value = true
  }
  
  /**
   * Deactivate dragging state and clear dragged item IDs
   */
  const deactivateDragging = () => {
    draggedItemIds.value.clear()
    isDragging.value = false
  }
  
  /**
   * Set the list of dragged item IDs and its descendants
   * @param {Array<string>} ids - Array of IDs
   */
  const setDraggedIds = (ids) => {
    draggedItemIds.value = new Set(ids)
  }
  
  /**
   * Check if the specified ID is in the dragged items list
   * @param {string} id - ID to check
   * @returns {boolean} Whether the ID is in the dragged items list
   */
  const hasDraggedIds = (id) => {
    return draggedItemIds.value.has(id)
  }
  
  // Return public methods and state
  return {
    isDragging: readonly(isDragging),
    activateDragging,
    deactivateDragging,
    setDraggedIds,
    hasDraggedIds
  }
}

// Export a singleton instance at the module level
// This allows state sharing between components
export const dragDropState = useDragDropState()
```

- This file provides a singleton instance to manage drag & drop state across the entire application
- By exporting as a singleton at the module level, state is shared between components
- Storing dragged element IDs as a Set object enables fast search and existence checks
- Using `readonly()` prevents direct modification from outside and allows state changes only through dedicated methods

**useDraggable.js**

```javascript
// Handle drag start event
const onDragStart = (event) => {
  isDragging.value = true
  dragDropState.activateDragging()
  if (OnDragStartCallBack) {
    OnDragStartCallBack(event, dragDropState)
  }
}
```

- By passing dragDropState as an argument to OnDragStartCallBack, the global drag state can be referenced and updated within the callback.

**useDroppable.js**

```javascript
// Computed property that determines if the entry can accept drops
const isDroppable = (entryId) => {
  return computed(() => {
    // Not droppable if no dragging is occurring
    if (!dragDropState.isDragging.value) {
      return false
    }
    // Cannot drop onto itself or its descendants
    const canDrop = !dragDropState.hasDraggedIds(entryId)
    return canDrop
  })
}
```

- The `isDroppable` function provides logic to prevent dropping onto the element being dragged itself or its descendant elements.

**ContainerItem.vue**

```javascript
// Set callback for drag start
setOnDragStartCallBack((event, dragDropState) => {
  // Get the list of IDs for this entry and all its descendants
  const allIds = entryManager.getAllDescendantIds(props.entry.id)
  dragDropState.setDraggedIds(allIds)

  // Get parent ID
  const parentId = entryManager.getParentId(props.entry.id)
  
  // Set data for transfer
  event.dataTransfer.setData('entryId', props.entry.id)
  event.dataTransfer.setData('entryType', 'container')
  event.dataTransfer.setData('sourceId', parentId || props.entry.id)
  
  event.stopPropagation()
})
```

- Using `getAllDescendantIds`, it collects the IDs of the container itself and all its descendant elements when dragging, and sets them in dragDropState. This creates a mechanism to prevent dropping onto the container being dragged or its descendant elements.

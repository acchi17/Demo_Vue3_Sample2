# Vue.js Study Part 6: Drag-and-drop UI builder with nestable objects using Vue.js

## An application covered in this article

- 左サイドバーのアイコン（ホワイトグレー、ライムグリーン）をドラッグしてメインエリアにドロップすると、それぞれブロックとコンテナが配置されます。
- コンテナ内には他のブロックやコンテナをドラッグ＆ドロップで配置できます。
- 各要素はドラッグ＆ドロップにより、配置順や親子関係を変更できます。
- 各要素の削除ボタンをクリックすると、その要素と子要素が削除されます。

**ソースコード：**  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2)

## Source code structure of the Vue application

上記アプリケーションのソース構成は以下の通りです。 

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

このアプリケーションでは、ブロックとコンテナの間の親子関係を管理するために、専用のクラス「EntryManager」を実装しています。このクラスは、コンテナ内に他のブロックやコンテナを配置したり、それらの位置関係を変更したりするための機能を提供します。EntryManagerは、すべてのエントリー（ブロックとコンテナ）を登録し親子関係をマップで管理することで、効率的なアクセスと操作を可能にしています。

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
   * @returns {Entry|null} Removed entry or null
   */
  removeEntry(entryId) {
    // Get parent entry
    const parentId = this._parentChildMap.get(entryId);
    if (!parentId) return null;
    
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return null;
    
    // Get child entry
    const childEntry = this._entriesMap.get(entryId);
    if (!childEntry) return null;
    
    // Remove from parent's children array
    const index = parentEntry.children.findIndex(child => child.id === entryId);
    if (index === -1) return null;
    
    parentEntry.children.splice(index, 1);
    
    // Delete parent-child relationship
    this._parentChildMap.delete(entryId);
    
    // If the entry is a container, recursively remove all its descendants
    if (childEntry.type === 'container') {
      this._removeDescendants(childEntry);
    }
    
    return childEntry;
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
   * @returns {Entry|null} Moved entry or null (if move failed)
   */
  moveEntry(entryId, newParentId, index) {
    // Get and remove the entry from its original parent
    const childEntry = this.removeEntry(entryId);
    if (!childEntry) {
      // If no parent (MainArea entry), just get the entry
      const entry = this._entriesMap.get(entryId);
      if (!entry) return null;
      
      // If no parent-child relationship, return the entry
      if (!this._parentChildMap.has(entryId)) {
        return entry;
      }
      
      return null;
    }
    
    if (newParentId === null) {
      // Set as parentless (move to MainArea)
      // Just delete the parent-child relationship, MainArea component will handle adding it
      return childEntry;
    } else {
      // Add to new parent
      const success = this.addEntry(newParentId, childEntry, index);
      return success ? childEntry : null;
    }
  }
}
```

- EntryManagerクラスは、2つの主要なマップを使用して親子関係を管理しています。
  - `_entriesMap`：エントリーIDとエントリーオブジェクトの辞書（Map）
  - `_parentChildMap`：子エントリーIDと親エントリーIDの辞書（Map）
- このクラスは主に以下の機能を提供します。
  - エントリーの追加（`addEntry`）- 特定の親コンテナに特定の位置にエントリーを追加
  - エントリーの削除（`removeEntry`）- 親コンテナからエントリーを削除し、親子関係も解除（コンテナの場合は子孫も再帰的に削除）
  - エントリーの同一コンテナ内での並び替え（`reorderEntry`）- 同じ親コンテナ内でのエントリーの位置変更
  - エントリーの移動（`moveEntry`）- 異なる親コンテナへエントリーを移動
- 再帰的な処理を用いて子孫エントリーIDを取得する`getAllDescendantIds`メソッドは、ドラッグ中のエントリを識別するために使用されます。

### 2. Container component capable of holding child objects

コンテナコンポーネントは、他のブロックやコンテナをドラッグ＆ドロップで配置できる入れ物として機能します。Vue.jsのProvide/Injectパターンを使用してEntryManagerインスタンスを共有し、コンポーネント間で親子関係を管理しています。

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

- `main.js`では、アプリケーション全体でEntryManagerを共有するために`app.provide('entryManager', entryManager)`を使用しています。
- この方法により、親子関係の管理を担当するEntryManagerインスタンスが全てのコンポーネントから利用可能になります。

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

- Containerクラスは基本的なEntryクラスを継承して、子要素を持つことができる特別なエントリータイプを実装しています。
- Vueの`reactive`関数を使用して`children`配列を定義することで、子要素の変更を検出してUIの自動更新を実現しています。
- コンテナタイプを'container'に設定することで、UIコンポーネントがどのタイプのエントリーであるかを判別できます。
- コンテナはブロックと異なり、自身の中に他のブロックやコンテナを入れ子状に配置できるため、UIの階層構造を表現できます。

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

- コンテナ内部には先頭に常に表示されるドロップエリアとそれぞれの子要素の下にドロップエリアを配置し、コンテナ内の任意の位置に新しい要素を挿入できるようにしています。
- `<component :is="child.type === 'block' ? 'BlockItem' : 'ContainerItem'">`により、子要素の型に応じて適切なコンポーネントを動的にレンダリングし、ネスト構造を実現しています。
- ドロップ時には3つのケースに対応しています。
  - 新しい要素（ブロックまたはコンテナ）の作成と挿入
  - 同じコンテナ内での要素の並び替え
  - 異なるコンテナからの要素の移動

**MainArea.vue**

```javascript
// Create a top-level container & register it in EntryManager
const mainContainer = new Container('main-area')
entryManager.addEntry(null, mainContainer, 0)
```

- MainArea.vueは内部でContainerクラスのインスタンスを保持し、他のすべてのエントリ（ブロックやコンテナ）の親または祖先となります。

### 3. Global drag state management

このアプリケーションでは、ドラッグ＆ドロップ操作中の状態を複数のコンポーネント間で共有するために、グローバルなドラッグ状態管理の仕組みを実装しています。Vue.js Composition APIを活用した専用のコンポーザブル関数を使用して、ドラッグ中の状態やドラッグされている要素の情報を管理し、コンポーネント間で一貫した挙動を実現しています。

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

- このファイルはアプリケーション全体でのドラッグ&ドロップ状態を管理するシングルトンインスタンスを提供しています
- モジュールレベルでシングルトンとしてエクスポートすることで、コンポーネント間で状態を共有しています
- ドラッグ中の要素IDをSetオブジェクトとして保持することで、高速な検索と存在チェックを実現しています
- `readonly()`を使用して外部からの直接変更を防止し、専用メソッドを通じてのみ状態変更を可能にしています

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

- OnDragStartCallBackの引数にdragDropStateを渡すことで、コールバック内でグローバルなドラッグ状態を参照・更新可能にしています。

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

- `isDroppable`関数により、現在ドラッグ中の要素自身やその子孫要素へのドロップを防止する論理を提供しています

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

- `getAllDescendantIds`を使用して、ドラッグ時にコンテナ自身とすべての子孫要素のIDを収集し、dragDropStateに設定しています。これにより、ドラッグ中のコンテナ自身やその子孫要素へのドロップを防止する仕組みを実現しています。

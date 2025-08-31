# Vue.js Study Part 5: Drag-and-drop functionality for reordering UI objects using Vue.j

Vue.jsを使用した、UIオブジェクトをドラッグ＆ドロップで並べ替える機能について説明します。

## An application covered in this article

- 左サイドバーのホワイトグレーのアイコンをドラッグしてメインエリアにドロップすると、メインエリアに長方形のブロックが縦方向に配置されます。
- メインエリアに配置されたブロックにはブロック固有のIDと削除ボタンが表示されます。
- メインエリアに配置されたブロックはドラッグドロップにより、配置順を入れ替えることができます。
- メインエリアに配置されたブロックの削除ボタンをクリックすると、ブロックが削除されます。

Source code  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step1](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step1)

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

ドラッグアンドドロップに関わる機能(主に各種イベントハンドラ)をuseDraggable.jsとuseDroppable.jsに実装し他のコンポーネントから利用可能にする。このような再利用可能な機能を持つuseDraggable.jsやuseDroppable.jsはVue.jsにおいてcomposableと呼ばれる。

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

左サイドバーのアイコンをドラッグ可能にし、メインエリアにドロップすると新しいブロックが作成される機能を実装します。SideArea.vueではuseDraggable composableを使用してドラッグ機能を実装し、MainArea.vueではuseDroppable composableを使用してドロップ機能を実装します。ドラッグ開始時にDataTransferオブジェクトにデータを設定し、ドロップ時にそのデータを取得して新しいブロックを作成します。

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

<!-- スタイル部分は省略 -->
```

- SideArea.vueでは、`draggable="true"`属性を設定することでアイコンをドラッグ可能にし、`@dragstart`イベントでドラッグ開始時の処理を行います。
- ドラッグ開始時に`event.dataTransfer.setData('entryType', 'block')`を実行し、ドラッグしているのがブロック型であることを示すデータを設定します。

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
      // 実装詳細は省略
    }
    
    // Remove an entry
    const removeEntry = (id) => {
      // 実装詳細は省略
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

<!-- スタイル部分は省略 -->
```

- MainArea.vueでは、複数のドロップエリア（`.drop-area`）を配置し、各ドロップエリアに`@drop`イベントハンドラを設定します。
- ドロップ時には`event.dataTransfer.getData('entryType')`でドラッグされたアイテムの種類を取得し、'block'の場合は新しいBlockインスタンスを作成してentriesに追加します。
- ドラッグ中は`isDragEntering`の値に応じてドロップエリアのスタイルを変更し、視覚的フィードバックを提供します。
- 各ブロックの間にドロップエリアを配置することで、ブロックの任意の位置に新しいブロックを挿入できるようにしています。

### 3. Drag-and-drop functionality for reordering blocks within the main area.

メインエリア内に配置されたブロックをドラッグ可能にし、別の位置にドロップすることでブロックの順序を入れ替える機能を実装します。BlockItem.vueではuseDraggable composableを使用してブロックをドラッグ可能にし、MainArea.vueではuseDroppable composableを使用してドロップ機能を実装します。ドラッグ開始時にDataTransferオブジェクトにブロックのIDを設定し、ドロップ時にそのIDを取得して対象ブロックの位置を変更します。

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

<!-- スタイル部分は省略 -->
```

- BlockItem.vueでは、`draggable="true"`属性を設定することでブロックをドラッグ可能にし、`@dragstart`と`@dragend`イベントでドラッグの開始と終了時の処理を行います。
- ドラッグ中は`isDragging`の値に基づいて`.dragging`クラスが適用され、ブロックの透明度が変わることでビジュアルフィードバックを提供します。
- ドラッグ開始時に`event.dataTransfer.setData('entryId', props.entry.id)`を実行し、ドラッグしているブロックのIDをDataTransferオブジェクトに設定します。これにより、ドロップ先でどのブロックが移動されたかを識別できます。
- `event.stopPropagation()`を使用して、イベントの伝播を停止し、親要素のドラッグイベントが発火するのを防いでいます。

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

<!-- スタイル部分は省略 -->
```

- MainArea.vueでは、各ブロックの間に`.drop-area`要素を配置し、ブロックの任意の位置に他のブロックをドロップできるようにしています。
- ドロップエリアには`@drop`イベントハンドラが設定され、ドロップ時にはそのエリアのインデックス（`index`）が`onDrop`関数に渡されます。
- `reorderEntry`関数は、ドラッグされたブロックの現在位置（`currentIndex`）とドロップ先の位置（`dropIndex`）を使用して、ブロックの新しい位置を計算します。
- 特に重要なのは、ドロップ先がドラッグ元より後ろの位置（`dropIndex > currentIndex`）の場合、ターゲットインデックスを1つ減らす処理です。これは、ブロックを取り除いた後に配列のインデックスが変わるためです。
- ドロップ処理では、まず`event.dataTransfer`から`entryId`と`entryType`を取得し、既存ブロックの移動（`entryId`がある場合）と新規ブロックの作成（`entryType === 'block' && !entryId`の場合）を区別しています。
- 既存ブロックの移動の場合は`reorderEntry`関数を呼び出し、ブロックの位置を変更します。具体的には、現在の位置からブロックを取り除き（`splice(currentIndex, 1)`）、新しい位置に挿入（`splice(targetIndex, 0, block)`）します。

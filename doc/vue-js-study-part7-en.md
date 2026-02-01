# Vue.js Study Part 7: Execution of UI objects using Vue.js

## An application covered in this article

- When you drag named blocks labeled "Hello" and "World" (white-gray icons) from the left sidebar and drop them into the main area or into containers, named blocks that can execute corresponding scripts are placed.
- When you drag containers (lime-green icons) and drop them into the main area or into containers, containers that can hold child elements are placed.
- Each entry (block or container) placed in the main area or inside containers displays an execution button (play button) and a delete button.
- When you click the execution button, if it's a block, the script corresponding to that block's name (such as public/scripts/Hello.js or World.js) is executed, and if it's a container, its child elements are executed sequentially.
- On the right side, the execution log view displays the execution history of entries in a hierarchical structure (sandwich-style), recording the execution status, entry name, execution result, error message, execution time, and other information.

**Source code:**  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2)

## Source code structure of the Vue application

The source structure of the above application is as follows.

```
public/
├── favicon.ico
├── index.html
└── scripts/
    ├── Hello.js
    └── World.js
src/
├── App.vue
├── main.js // Javascript entry point
├── assets/
│   ├── images/
│   │   ├── close-button-navy-96.png
│   │   └── play-button-navy-96.png
│   └── styles/
│       └── variables.css
├── classes/
│   ├── Block.js
│   ├── Container.js
│   ├── Entry.js
│   └── EntryManager.js
├── components/
│   ├── BlockItem.vue
│   ├── ContainerItem.vue
│   ├── ExecutionLogView.vue
│   ├── MainArea.vue
│   └── SideArea.vue
├── composables/
│   ├── useDragDropState.js
│   ├── useDraggable.js
│   ├── useDroppable.js
│   └── useEntryExecution.js
├── config/
│   └── app-config.js
└── services/
    ├── entry_execution/
    │   └── EntryExecutionService.js
    ├── log/
    │   └── ExecutionLogService.js
    └── script_execution/
        ├── IScriptExecutionEngine.js
        ├── JavaScriptExecutionEngine.js
        ├── JavaScriptExecutionWorker.js
        ├── ScriptExecutionFactory.js
        └── ScriptExecutionService.js
```

## Implementing the functionality

### 1. Entry execution service

#### 1.1 Class composition and relationships

The entry execution functionality consists of 6 classes with the following hierarchical dependency relationships:

```
EntryExecutionService (EntryExecutionService.js)
  └── ScriptExecutionService (ScriptExecutionService.js)
      └── ScriptExecutionFactory (ScriptExecutionFactory.js)
          └── JavaScriptExecutionEngine (JavaScriptExecutionEngine.js)
              └── Worker script (JavaScriptExecutionWorker.js)
```

**Note**: Basically, the filename is the same as the class name. JavaScriptExecutionWorker.js is not a class but a script file executed in the Web Worker environment.

#### 1.2 Flow from entry execution to script execution

1. **Entry execution begins**
   - `EntryExecutionService.executeEntry()` is called and determines the type of Entry (Block or Container)

2. **Case of Block execution**
   - The `_executeBlock()` method retrieves the block's script name
   - Script execution is delegated to `ScriptExecutionService.executeScript()`

3. **Case of Container execution**
   - The `_executeContainer()` method processes child elements sequentially
   - `executeEntry()` is recursively called for each child element

4. **Script execution processing**
   - `ScriptExecutionService` initializes the engine using `ScriptExecutionFactory`
   - The generated `JavaScriptExecutionEngine` receives the script execution request

5. **Actual script execution**
   - When Worker is available: Send request via postMessage to `JavaScriptExecutionWorker.js`
   - When Worker is unavailable: Execute directly on the main thread with `_executeDirectly()`
   - Dynamically import script files from `public/scripts/` (such as Hello.js or World.js) and execute the execute function within them

6. **Return of execution result**
   - The execution result is passed back through each layer in reverse order and ultimately returned to the caller

#### 1.3 Functionality of each class

**EntryExecutionService (EntryExecutionService.js)**
A service class that oversees the execution of entries (Block or Container). It executes scripts through ScriptExecutionService for Blocks and executes child elements sequentially for Containers. It is responsible for managing execution state, generating execution IDs, and coordinating with the logging service.

**ScriptExecutionService (ScriptExecutionService.js)**
A class that provides a unified interface for script execution. Based on configuration, it uses ScriptExecutionFactory to generate engine instances and delegates script execution requests to the engine.

**ScriptExecutionFactory (ScriptExecutionFactory.js)**
A factory class that generates script execution engine instances based on the specified language. Currently supports the JavaScript engine, and is designed to allow adding other language engines (such as Python) in the future.

**IScriptExecutionEngine (IScriptExecutionEngine.js)**
An interface class for script execution engines. All engine implementation classes must implement the initialize, executeScript, and terminate methods.

**JavaScriptExecutionEngine (JavaScriptExecutionEngine.js)**
An implementation class of the JavaScript script execution engine. It supports both parallel execution using Web Workers and fallback direct execution, allowing scripts to be executed without blocking the main thread.

**Worker script (JavaScriptExecutionWorker.js)**
A worker script that executes JavaScript scripts within a Worker. It dynamically imports script files and executes the exported execute function, returning the results to the main thread.

### 2. Named block

Named block icons ("Hello" and "World") are placed on the left sidebar. These can be placed in the main area or inside containers through drag & drop. When dragging begins, the block's name is set in the DataTransfer object as entryName. When dropping, the name is retrieved and a new Block instance is created with that name. Since the block's name is set when the block is created, the created blocks are identified by their names and function as the script names to be executed.

#### SideArea.vue

```vue
<template>
  <div class="side-area">
    <div class="rect-item">
      <div 
        class="rect-icon whitegray"
        draggable="true"
        @dragstart="onDragStartBlock"
        @dragend="onDragEndBlock"
      >Hello</div>
    </div>
    <div class="rect-item">
      <div 
        class="rect-icon whitegray"
        draggable="true"
        @dragstart="onDragStartBlock"
        @dragend="onDragEndBlock"
      >World</div>
    </div>
    <div class="rect-item">
      <div 
        class="rect-icon lime"
        draggable="true"
        @dragstart="onDragStartContainer"
        @dragend="onDragEndContainer"
      ></div>
    </div>
  </div>
</template>

<script>
import { useDraggable } from '../composables/useDraggable';

export default {
  name: 'SideArea',
  
  setup() {

    // Set custom callbacks for drag start events
    setBlockDragStartCallback((event) => {
      event.dataTransfer.setData('entryType', 'block');
      event.dataTransfer.setData('entryName', event.target.textContent);
      event.dataTransfer.setData('sourceId', undefined);
    });
    
    setContainerDragStartCallback((event) => {
      event.dataTransfer.setData('entryType', 'container');
      event.dataTransfer.setData('entryName', 'Container');
      event.dataTransfer.setData('sourceId', undefined);
    });
    
    // ... Other composable initialization and return statements are omitted ...
  }
}
</script>

<!-- Style section is omitted -->
```

- In SideArea.vue, multiple block icons are placed in the template, each with the draggable attribute set.
  - Two named blocks "Hello" and "World" (whitegray icons) and a container (lime icon) are defined.
  - setBlockDragStartCallback retrieves `event.target.textContent` and sets it as entryName in the DataTransfer.
- By setting entryType, entryName, and sourceId in the DataTransfer object at the start of dragging, the drop destination can identify the block type and name.

#### MainArea.vue

```javascript
// Set custom callbacks for drop event
setOnDropCallBack((event, index) => {
  // Get data directly from event.dataTransfer
  const entryType = event.dataTransfer.getData('entryType')
  const entryName = event.dataTransfer.getData('entryName')
  const entryId = event.dataTransfer.getData('entryId')
  const sourceId = event.dataTransfer.getData('sourceId')
  
  if (!entryId) {
    // Create and insert a new element
    if (index !== null) {
      if (entryType === 'block') {
        const newBlock = new Block(entryName)
        // Use EntryManager to add to main container
        entryManager.addEntry(mainContainer.id, newBlock, index)
      } else if (entryType === 'container') {
        const newContainer = new Container(entryName)
        // Use EntryManager to add to main container
        entryManager.addEntry(mainContainer.id, newContainer, index)
      }
    }
  } else {
    if (!sourceId || sourceId === mainContainer.id) {
      // Reorder within MainArea
      entryManager.reorderEntry(mainContainer.id, entryId, index)
    } else {
      // Drag & drop from a container
      entryManager.moveEntry(entryId, mainContainer.id, index)
    }
  }
})
```

- In MainArea.vue's setOnDropCallBack, entryName is retrieved from DataTransfer and used to create a named block with `new Block(entryName)`.
  - entryName is the name set by SideArea.vue, such as "Hello" or "World".
  - The created Block retains the name as a property and uses it as the script name during later execution.
- The presence or absence of entryId determines whether it's a new creation or an existing entry move, and the appropriate EntryManager method is called.

#### ContainerItem.vue

ContainerItem.vue similarly retrieves entryName in setOnDropCallBack and creates a named block with `new Block(entryName)`. This allows named blocks to be added to containers through drag & drop as well.

### 3. UI for entry execution

Execution buttons (play buttons) are placed on the UI components of Blocks and Containers. When users click these buttons, the EntryExecutionService is called through the useEntryExecution composable. During execution, an isExecuting flag is used to prevent duplicate executions. The button styles are centrally managed using CSS variables, ensuring unified appearance and animation effects.

#### useEntryExecution.js

```javascript
import { ref, readonly, inject } from 'vue';

/**
 * Provides entry execution functionality as a composable function
 * @return {Object} Object containing executeEntry function and reactive state
 */
export function useEntryExecution() {
  const entryExecutionService = inject('entryExecutionService');
  const executionLogService = inject('executionLogService');
  const isExecuting = ref(false);
  
  /**
   * Execute an entry (Block or Container)
   * @param {Entry} entry Entry to execute
   */
  const executeEntry = async (entry) => {
    if (!entry) return;
    
    isExecuting.value = true;
    try {
      await entryExecutionService.executeEntry(entry);
    } finally {
      isExecuting.value = false;
    }
  };

  /**
   * Get execution logs from the ExecutionLogService
   * Returns a reactive reference to the logs
   * @return {Object} Reactive reference containing logs
   */
  const getLogs = () => {
    return executionLogService.getLogs();
  };

  /**
   * Clear all execution logs from the ExecutionLogService
   */
  const clearLogs = () => {
    executionLogService.clearLogs();
  };

  // Return public API
  return {
    executeEntry,
    isExecuting: readonly(isExecuting),
    getLogs,
    clearLogs
  };
}
```

- The useEntryExecution composable is implemented using Vue 3's Composition API and provides the functionality required for entry execution.
  - It uses inject to retrieve services provided at the application level.
  - The executeEntry function is asynchronous; it sets the isExecuting flag to true during execution and returns it to false after completion.
- isExecuting is readonly to prevent direct modification from outside while maintaining reactivity and managing the execution state.
- The getLogs and clearLogs methods are wrappers for the ExecutionLogService and are used in the entry execution log UI functionality explained in the following sections.

#### BlockItem.vue

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
      <div class="block-header">
        <div :style="textStyle">{{ entry.name }}</div>
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
    // Get composables
    const { executeEntry, isExecuting } = useEntryExecution()
    
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
    
    // ... Other composable initialization and callback settings are omitted ...
    
    // Return values and methods to use in <template>
    return {
      onPlay,
      // Return other required values as well
    }
  }
}
</script>

<style scoped>
/* ... Styles for block-item, block-content, block-header, etc. are omitted ... */

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
</style>
```

- In BlockItem.vue, the play button click is handled by the onPlay method, which checks the execution state with isExecuting.value.
  - If another entry is currently executing, it returns to prevent duplicate execution.
  - The executeEntry function is called to delegate the Block's execution.
- The entry-button class leverages CSS variables to centrally manage size, background image, animation effects, and more.
  - The :active selector implements scaling and brightness changes on button press to provide visual feedback to users.

#### ContainerItem.vue

ContainerItem.vue similarly implements the play button using the useEntryExecution composable. The implementation of the onPlay method and button style definition are nearly identical to BlockItem.vue, and the entry-button related styles are also shared.

#### variables.css

```css
:root {
  /* Block-related colors */
  --block-bg-color: #f0f0f0;
  --block-hover-bg-color: #e8e8e8;
  
  /* Container-related colors */
  --container-bg-color: #8eec9a;
  --container-hover-bg-color: #7ee089;
  
  /* Entry button base styles */
  --entry-button-size: 24px;
  --entry-button-border-radius: 50%;
  --entry-button-background-color: rgba(255, 255, 255, 0.3);
  --entry-button-background-size: contain;
  --entry-button-background-position: center;
  --entry-button-background-repeat: no-repeat;
  --entry-button-cursor: pointer;
  
  /* Entry button animation */
  --entry-button-press-scale: 0.9;
  --entry-button-transition-duration: 0.1s;
  --entry-button-press-brightness: 0.8;
  
  /* Entry button images */
  --entry-button-play-image: url('@/assets/images/play-button-navy-96.png');
  --entry-button-delete-image: url('@/assets/images/close-button-navy-96.png');
}
```

- In variables.css, all style attributes related to entry buttons are defined as CSS variables and referenced from BlockItem.vue and ContainerItem.vue.
  - Button size, background color, background image, cursor, and animation effects are centrally managed.
- --entry-button-press-scale and --entry-button-press-brightness control the animation effects on button press, providing visual feedback for user interactions.
- Color definitions (--block-bg-color, --container-bg-color, etc.) are also managed in the same file, providing theme unity flexibility.

### 4. Entry execution log service

An ExecutionLogService is implemented that manages the execution history of entries in a hierarchical structure and provides functionality for adding, updating, retrieving, and clearing execution logs. When executing blocks or child elements within containers, execution logs with parent-child relationships are stored in a tree structure, allowing complex execution flows to be tracked.

#### ExecutionLogService.js

```javascript
import { ref, readonly } from 'vue';

/**
 * Execution Log Service
 * Manages execution history for entry executions (Block or Container)
 */
export default class ExecutionLogService {
  /**
   * Constructor
   */
  constructor() {
    // Hierarchical structure of execution logs
    this._executionsTree = ref({
      rootExecutions: [], // Top-level executions
      executionsByParent: {} // Dictionary of execution IDs and their parent IDs
    });
    // Maximum number of logs to keep
    this._maxLogs = 1000;
    // Number of logs to remove in batch when cleanup is triggered
    this._cleanupBatchSize = 100;
  }

  /**
   * Clear all execution logs
   * Removes all entries from the log history and clears the hierarchy structure
   */
  clearLogs() {
    try {
      this._executionsTree.value = {
        rootExecutions: [],
        executionsByParent: {}
      };
    } catch (error) {
      console.error(`[${this.constructor.name}] clearLogs() failed: ${error.message}`);
    }
  }

  /**
   * Get execution logs
   * @returns {Object} Readonly reactive reference to the execution tree
   */
  getLogs() {
    // Return the internal execution tree as a readonly reactive reference
    return readonly(this._executionsTree);
  }

  /**
   * Add a execution log and build hierarchy structure
   * @param {Entry} entry Entry instance (Block or Container)
   * @param {string} executionId Execution ID (received from EntryExecutionService)
   * @param {string} parentExecutionId Parent entry's execution ID (optional)
   * @returns {string} Execution ID that can be used later to update the log
   */
  addLog(entry, executionId, parentExecutionId = null) {
    try {
      // Create execution log 
      const execution = {
        executionId: executionId,
        parentExecutionId: parentExecutionId,
        timestamp: new Date(),
        entryId: entry.id,
        entryName: entry.name,
        entryType: entry.type,
        result: null, 
        execTime: null,
        startTime: performance.now()
      };

      // Build hierarchy structure immediately
      if (parentExecutionId) {
        // Add to parent's children
        if (!this._executionsTree.value.executionsByParent[parentExecutionId]) {
          this._executionsTree.value.executionsByParent[parentExecutionId] = [];
        }
        this._executionsTree.value.executionsByParent[parentExecutionId].push(execution);
      } else {
        // Add to root executions
        this._executionsTree.value.rootExecutions.push(execution);
      }

      // Maintain maximum execution limit
      const totalCount = this._getExecutionCount();
      if (totalCount > this._maxLogs) {
        // Remove batch size logs when exceeding maximum
        this._cleanupExecutions(this._cleanupBatchSize);
      }
    } catch (error) {
      console.error(`[${this.constructor.name}] addLog() failed: ${error.message}`);
    }
  }

  /**
   * Update a execution log
   * This method is called when an entry completes execution
   * It updates the log with the execution result
   * @param {string} executionId Execution ID
   * @param {Object} result Execution result data
   */
  updateLog(executionId, result) {
    try {
      // Find and update the execution entry in hierarchy structure
      const execution = this._findExecution(executionId);
      if (execution) {
        const execTime = performance.now() - execution.startTime;
        execution.result = result;
        execution.execTime = execTime;
      }
    } catch (error) {
      console.error(`[${this.constructor.name}] updateLog() failed: ${error.message}`);
    }
  }
}
```

- ExecutionLogService manages logs using a hierarchical structure called `_executionsTree`.
  - The `rootExecutions` array stores top-level entry execution logs.
  - The `executionsByParent` dictionary stores, with the parent's execution ID as the key, an array of child execution logs for that parent.
  - This structure allows nested executions (such as child executions in Containers) to be managed while preserving parent-child relationships.
- The `addLog()` method is called from EntryExecutionService and creates a log entry to add to the hierarchy structure when entry execution begins.
  - The `parentExecutionId` parameter determines whether the log is top-level or a child execution, placing it in the appropriate location.
- The `updateLog()` method is called from EntryExecutionService when entry execution completes and records the execution result and execution time in the log.
  - The execution time is calculated from the difference between the `performance.now()` value at execution start and completion, stored in the `execTime` field.

### 5. UI for entry execution log

An ExecutionLogView.vue component is implemented that displays execution logs managed in a hierarchical structure by ExecutionLogService in table format. It provides log retrieval and clearing functionality through the useEntryExecution composable, and transforms the hierarchical structure into a flat array in a transformedLogs computed property, displaying it in sandwich-style to visually represent the parent-child relationships of complex container executions.

#### ExecutionLogView.vue

```vue
<template>
  <div class="execution-log-view">
    <!-- Header section with title and clear button -->
    <div class="log-header">
      <h4>Execution Log</h4>
      <button @click="clearLogs" class="clear-button">Clear</button>
    </div>

    <!-- Empty state message -->
    <div v-if="transformedLogs.length === 0" class="empty-panel">
      No execution logs
    </div>

    <!-- Log table with sandwich-style hierarchy display -->
    <div v-else class="log-panel">
      <table class="log-table">
        <thead>
          <tr class="table-header">
            <th class="col-start-time">Start Time</th>
            <th class="col-status">Status</th>
            <th class="col-name">Entry Name</th>
            <th class="col-result">Result</th>
            <th class="col-error-msg">Error Message</th>
            <th class="col-exec-time">Exec. Time</th>
            <th class="col-id">ID</th>
          </tr>
        </thead>
        <tbody>
          <!-- Render processed log entries (sandwich-style) -->
          <template v-for="item in transformedLogs" :key="item.key">
            <!-- Regular entry row -->
            <tr v-if="item.type === 'entry'" :class="entryRowClass(item.data)">
              <td class="col-start-time">{{ formatTimestamp(item.data.timestamp) }}</td>
              <td class="col-status">
                <span :class="item.data.result?.success ? 'status-success' : 'status-error'">
                  {{ item.data.result?.success ? 'Success' : 'Failed' }}
                </span>
              </td>             
              <td class="col-name">{{ item.data.entryName}}</td>
              <td class="col-result">{{ formatResult(item.data.result) }}</td>
              <td class="col-error-msg">{{ item.data.result?.errorMessage }}</td>
              <td class="col-exec-time">{{ formatExecutionTime(item.data.execTime) }}ms</td>
              <td class="col-id">{{ item.data.entryId }}</td>
            </tr>

            <!-- Container group footer row -->
            <tr v-else-if="item.type === 'container-end'" class="container-group-footer">
              <td colspan="7"></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useEntryExecution } from '../composables/useEntryExecution';

// Get functions from the composables
const { getLogs, clearLogs } = useEntryExecution();

// Get logs from the service
const logs = getLogs();

/**
 * Recursively add child executions to the result array
 * Helper function to handle nested container executions
 * @param {string} parentId The parent execution ID
 * @param {Object} executionsTree The execution tree structure
 * @param {Array} result the array to add child executions to
 */
function addChildExecutions(parentId, executionsTree, result) {
  const children = executionsTree.executionsByParent[parentId] || [];
  
  children.forEach(childExecution => {
    // Add the child execution entry
    result.push({
      type: 'entry',
      key: `entry_${childExecution.executionId}`,
      data: childExecution
    });
    
    // If the child execution is a container, add its children recursively
    if (childExecution.entryType === 'container') {
      // Recursive call to handle nested containers
      addChildExecutions(childExecution.executionId, executionsTree, result);
      
      // Container end marker
      result.push({
        type: 'container-end',
        key: `end_${childExecution.executionId}`,
        containerName: childExecution.entryName
      });
    }
  });
}

/**
 * Transform hierarchical execution tree into a flat array with special
 * marker entries to indicate container relationships (sandwich-style display)
 * @returns {Array} Flat array of entries with container grouping markers
 */
const transformedLogs = computed(() => {
  const result = [];
  try {
    const executionsTree = logs.value;
    
    // Process root executions in reverse order (newest first)
    for (let i = executionsTree.rootExecutions.length - 1; i >= 0; i--) {
      const execution = executionsTree.rootExecutions[i];
      // Add the execution entry
      result.push({
        type: 'entry',
        key: `entry_${execution.executionId}`,
        data: execution
      });
      
      // If the execution is a container, add container grouping markers
      if (execution.entryType === 'container') {
        // Recursively add child executions
        addChildExecutions(execution.executionId, executionsTree, result);
        
        // Container end marker
        result.push({
          type: 'container-end',
          key: `end_${execution.executionId}`,
          containerName: execution.entryName
        });
      }
    }
  } catch (error) {
    console.error(`transformedLogs() failed: ${error.message}`);
  }
  return result;
});
</script>

<!-- Style section is omitted -->
```

- The useEntryExecution composable is used to retrieve the getLogs and clearLogs methods for integration with ExecutionLogService.
- The transformedLogs computed property converts the hierarchical structure of ExecutionLogService into a flat array and displays it in sandwich-style.
  - Processing executions from newest to oldest, and for Containers, recursively adding child elements with the addChildExecutions function and finally inserting a container-end marker to visually represent the execution range of the Container.
  - The addChildExecutions function retrieves child executions from ExecutionLogService's `executionsByParent` dictionary for the specified parent's execution ID and handles nested containers recursively.

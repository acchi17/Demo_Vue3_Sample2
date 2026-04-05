# Vue.js Study Part 8: Execution of UI objects with input parameters using Vue.js

## An application covered in this article

- When you drag named blocks (arithmetic operations such as "Add", "Sub", "Mul", "DivMod") from the left sidebar and drop them into the main area or containers, blocks pre-configured with their defined input/output parameters are placed.
- Clicking a block placed in the main area or inside a container selects it, and the right panel displays its editable input parameters and read-only output parameters.
- Input parameters (integers, real numbers, booleans) can be edited using spinner controls and checkboxes in the right panel before execution.
- When you click the execution button on a block, the script corresponding to that block's name is executed with the configured input parameters, and the results are displayed in the output parameters section.
- When you click the execution button on a container, its child blocks are executed sequentially, with each block receiving its configured input parameters and the output parameters updating automatically.

**Source code:**  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step4](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step4)

## Source code structure of the Vue application

The source code structure of the above application is as follows.

```
public/
├── favicon.ico
├── index.html
├── scripts/
│   ├── Add.js
│   ├── DivMod.js
│   ├── Hello.js
│   ├── Mul.js
│   ├── Sub.js
│   └── World.js
└── settings/
    └── BlockDefinitions.json
src/
├── App.vue
├── main.js
├── assets/
│   ├── images/
│   │   ├── close-button-gray-96.png
│   │   ├── cyan-gray-integer-type-256.png
│   │   └── play-button-gray-96.png
│   └── styles/
│       └── variables.css
├── classes/
│   ├── Block.js
│   ├── Container.js
│   ├── Entry.js
│   ├── EntryManager.js
│   └── EntryParamManager.js
├── components/
│   ├── BlockItem.vue
│   ├── BlockListView.vue
│   ├── CheckEdit.vue
│   ├── ContainerItem.vue
│   ├── EntryView.vue
│   ├── ExecutionLogView.vue
│   ├── IntSpinEdit.vue
│   ├── MainArea.vue
│   ├── RealSpinEdit.vue
│   └── SideArea.vue
├── composables/
│   ├── useDragDropState.js
│   ├── useDraggable.js
│   ├── useDroppable.js
│   ├── useEntryExecution.js
│   ├── useEntryOperation.js
│   └── useSelection.js
├── config/
│   └── app-config.js
└── services/
    ├── entry_definition/
    │   └── EntryDefinitionService.js
    ├── entry_execution/
    │   └── EntryExecutionService.js
    ├── file/
    │   └── FileService.js
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

### 1. Entry selection state

This section implements the `useSelection` composable to manage the selection state of entries (Block and Container), and adds selection functionality to `BlockItem.vue` and `ContainerItem.vue`. `useSelection` uses a module-level singleton pattern to share the selection state across all components. The selected entry is visually highlighted, and the play button is only shown for the currently selected entry.

#### useSelection.js

```javascript
import { ref, readonly, computed } from 'vue'

// Shared state (module-level singleton)
const selectedEntryId = ref(null)

function useSelection() {
  const setSelectedEntry = (entry) => {
    selectedEntryId.value = entry?.id || null
  }

  const clearSelection = () => {
    selectedEntryId.value = null
  }

  const isSelected = (entryId) => {
    return computed(() => selectedEntryId.value === entryId)
  }

  const getSelectedEntryId = () => {
    return readonly(selectedEntryId)
  }

  return {
    setSelectedEntry,
    clearSelection,
    isSelected,
    getSelectedEntryId
  }
}

// Export singleton instance
export const selectionState = useSelection()
```

- `useSelection` declares `selectedEntryId` as a module-level ref, following the same singleton pattern as `useDragDropState.js`. By placing the ref outside the function, state is shared across all component instances that import `selectionState`.
  - `export const selectionState = useSelection()` exports a single shared instance, so each component imports and uses this instance directly rather than calling `useSelection()` themselves.
- `isSelected(entryId)` accepts an entry ID and returns a `ComputedRef<boolean>`, making the result reactive to any change in `selectedEntryId`.
  - The comparison `selectedEntryId.value === entryId` determines whether the given entry is currently selected.
- `getSelectedEntryId()` wraps the ref with `readonly()` before returning it, preventing external code from directly modifying the selection state.

#### BlockItem.vue

```vue
<template>
  <div
    class="block-item"
    :class="{ 'dragging': isDragging, 'selected': isSelected }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click.stop="onSelect"
  >
    <div class="block-content">
      <div class="block-header">
        <div class="entry-text">{{ entry.name }}</div>
        <div class="entry-button-group">
          <div v-if="isSelected" class="entry-button entry-button-play" @click.stop="onPlay"></div>
          <div class="entry-button entry-button-delete" @click.stop="onRemove"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { selectionState } from '../composables/useSelection'

export default {
  // ...
  setup(props, { emit }) {
    // Selection handling
    const isSelected = selectionState.isSelected(props.entry.id)

    const onSelect = () => {
      selectionState.setSelectedEntry(props.entry)
    }

    // Other composable initialization and callback setup omitted

    return {
      isSelected,
      onSelect,
      // Other return values omitted
    }
  }
}
</script>

<style scoped>
.block-item.selected {
  border: var(--entry-select-border);
  box-shadow: var(--entry-select-box-shadow);
}
</style>
```

- In the template, `:class="{ 'selected': isSelected }"` applies the selected CSS class reactively, and `@click.stop="onSelect"` triggers the selection handler on click.
  - The `.stop` modifier stops click event propagation, preventing the click from bubbling up to a parent `ContainerItem` and accidentally selecting it instead.
- `v-if="isSelected"` controls the visibility of the play button so it only appears on the currently selected entry.
- `selectionState.isSelected(props.entry.id)` returns a `ComputedRef<boolean>`, so when another entry is selected, this entry's `isSelected` automatically updates to `false`.
- The `.block-item.selected` style uses CSS variables `--entry-select-border` and `--entry-select-box-shadow` defined in `variables.css` to render the selection highlight.

#### ContainerItem.vue

`ContainerItem.vue` implements the selection feature in the same way as `BlockItem.vue`, importing `selectionState` directly. The template `:class` binding, `@click.stop="onSelect"`, `v-if="isSelected"` play button control, and the `.container-item.selected` style definition are virtually identical to those in `BlockItem.vue`.

### 2. Managing entry parameters

This section implements parameter management for entries. `EntryParamManager` stores input and output parameters separately for each entry. When a block is added via `useEntryOperation.addBlock()`, default parameters from the block definition are registered into `EntryParamManager`. When `EntryExecutionService` executes a block, it reads the current input parameters, passes them to the script, and writes the results back into the output parameters. The UI reactivity for output parameters is achieved by wrapping the output map with Vue's `reactive()`.

#### EntryParamManager.js

```javascript
import { reactive } from 'vue'

export default class EntryParamManager {
  constructor() {
    // Dictionary of entry IDs and their input parameters
    this._inputParamsMap = new Map(); // entryId -> inputs
    // Dictionary of entry IDs and their output parameters (reactive for UI updates)
    this._outputParamsMap = reactive(new Map()); // entryId -> outputs
  }

  getInputParams(entryId) {
    return this._inputParamsMap.get(entryId) || {};
  }
  
  getOutputParams(entryId) {
    return this._outputParamsMap.get(entryId) || {};
  }

  getInputParamNames(entryId) {
    return Object.keys(this._inputParamsMap.get(entryId) || {});
  }

  getOutputParamNames(entryId) {
    return Object.keys(this._outputParamsMap.get(entryId) || {});
  }

  setInputParams(entryId, inputParams = {}) {
    if (!entryId) return false;
    this._inputParamsMap.set(entryId, inputParams);
    return true;
  }

  setOutputParams(entryId, outputParams = {}) {
    if (!entryId) return false;
    // Set output parameters to the reactive map
    this._outputParamsMap.set(entryId, outputParams);
    return true;
  }

  setInputParam(entryId, paramName, value) {
    if (!entryId || !paramName) return false;
    if (!this._inputParamsMap.has(entryId)) {
      this._inputParamsMap.set(entryId, {});
    }
    const params = this._inputParamsMap.get(entryId);
    params[paramName] = value;
    return true;
  }
  
  setOutputParam(entryId, paramName, value) {
    if (!entryId || !paramName) return false;
    // Create entry in reactive map if it doesn't exist
    if (!this._outputParamsMap.has(entryId)) {
      this._outputParamsMap.set(entryId, {});
    }
    this._outputParamsMap.get(entryId)[paramName] = value;
    return true;
  }
}
```

- Input and output parameters are managed in separate maps: `_inputParamsMap` is a plain `Map`, while `_outputParamsMap` is wrapped with `reactive()`.
  - Only output parameters need reactivity because they are updated by script execution and must trigger UI re-rendering automatically. Input parameters are edited directly by the user through form controls, so Vue's form binding handles their reactivity independently.
- `setOutputParam` mutates the object already stored in the reactive map (`this._outputParamsMap.get(entryId)[paramName] = value`) rather than replacing it.
  - Replacing the stored object with a new one (`this._outputParamsMap.set(entryId, { ...newObj })`) would break any existing reactive references to it. Mutating in place preserves Vue's dependency tracking.

#### EntryExecutionService.js

```javascript
async executeEntry(entry, traceId = null) {
  let result = {};
  try {
    this._executionStack.push(entry.id);
    const executionId = this._generateExecutionId(entry.id);
    // Fetch input parameters before execution
    const inputParams = this.entryParamManager ? this.entryParamManager.getInputParams(entry.id) : {};
    if (this.executionLogService) {
      this.executionLogService.addLog(entry, inputParams, executionId, traceId);
    }
    if (entry.type === 'block') {
      result = await this._executeBlock(entry, inputParams);
    } else if (entry.type === 'container') {
      result = await this._executeContainer(entry, executionId);
    }
    if (this.executionLogService) {
      this.executionLogService.updateLog(executionId, result);
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    this._executionStack.pop();
  }
  return result;
}

async _executeBlock(block, inputParams = {}) {
  let result = {};
  try {
    result = await this.scriptExecutionService.executeScript(block.name, inputParams);
    // Write script results back into output parameters
    if (this.entryParamManager) {
      const outputParamNames = this.entryParamManager.getOutputParamNames(block.id);
      for (const key of outputParamNames) {
        if (key in result) {
          this.entryParamManager.setOutputParam(block.id, key, result[key]);
        }
      }
    }
  } catch (error) {
    result.success = false;
    result.errorMessage = error.message;
  }
  if (result.success === undefined) {
    result.success = false;
  }
  return result;
}
```

- In `executeEntry`, `entryParamManager.getInputParams(entry.id)` is called before script execution, capturing any values the user edited in the UI prior to clicking the run button.
  - The same `inputParams` snapshot is also passed to `executionLogService.addLog()`, so the log records the exact values used for that execution.
- In `_executeBlock`, after the script returns, only keys that already exist in the output parameter definition are written back (`key in result` guard).
  - This prevents unexpected keys returned by the script from polluting the output map and ensures the parameter schema defined in `BlockDefinitions.json` remains the authoritative structure.

#### useEntryOperation.js

```javascript
const addBlock = (parentId, name, index) => {
  const newBlock = new Block(name)
  entryManager.addEntry(parentId, newBlock, index)
  const defaultParams = entryDefinitionService.getBlockDefaultParams(name)
  entryParamManager.setInputParams(newBlock.id, defaultParams.input)
  entryParamManager.setOutputParams(newBlock.id, defaultParams.output)
  return newBlock
}

const addContainer = (parentId, name, index) => {
  const newContainer = new Container(name)
  entryManager.addEntry(parentId, newContainer, index)
  return newContainer
}
```

- When a block is dropped into the workflow, `entryDefinitionService.getBlockDefaultParams(name)` retrieves the default parameter structure defined for that block type in `BlockDefinitions.json`.
  - `setInputParams` and `setOutputParams` are called separately with `defaultParams.input` and `defaultParams.output`, initializing the two maps in `EntryParamManager` with the correct initial values and structure for that block type.
- `addContainer` does not call `entryParamManager` at all — containers have no parameters of their own and only serve as structural groupings that execute their children sequentially.

### 3. UI for editing entry parameters

This section implements `EntryView.vue`, the right-panel detail view that displays editable input parameters and read-only output parameters for the currently selected entry. `SideArea.vue` is updated to host `EntryView` in its lower portion. `EntryView` reads the selected entry ID from `selectionState`, retrieves parameter definitions from `entryDefinitionService`, and renders the appropriate control component (`IntSpinEdit`, `RealSpinEdit`, or `CheckEdit`) dynamically using Vue's `<component :is>` binding based on each parameter's `ctrlType`. Input parameters are managed through a local reactive copy that writes back to `EntryParamManager` on change, while output parameters read directly from `EntryParamManager`'s reactive output map, updating automatically whenever script execution writes new values.

#### SideArea.vue

```vue
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
}
</style>
```

- `SideArea.vue` is split vertically into two flex areas: `.top-item` (flex: 6) holds `BlockListView` for the block palette, and `.bottom-item` (flex: 4) holds `EntryView` for parameter editing.

#### EntryView.vue

```vue
<template>
  <div class="entry-view">
    <div v-if="selectedEntry">
      <div class="entry-header">{{ selectedEntry?.name }}</div>
      <div class="section-divider" />
      <div v-if="inputParamDefs.length > 0">
        <div class="entry-param-header">Input</div>
        <div class="entry-param-content">
          <div v-for="paramDef in inputParamDefs" :key="paramDef.name" class="entry-param-row">
            <component
              :is="paramComponents[paramDef.ctrlType]"
              :name="paramDef.name"
              :min="paramDef.min"
              :max="paramDef.max"
              :step="paramDef.step"
              :value="localInputParams[paramDef.name]"
              @update:value="onParamChange(paramDef.name, $event)"
            />
          </div>
        </div>
      </div>
      <div v-if="outputParamDefs.length > 0">
        <div class="section-divider" />
        <div class="entry-param-header">Output</div>
        <div class="entry-param-content">
          <div v-for="paramDef in outputParamDefs" :key="paramDef.name" class="entry-param-row">
            <component
              :is="paramComponents[paramDef.ctrlType]"
              :name="paramDef.name"
              :min="paramDef.min"
              :max="paramDef.max"
              :step="paramDef.step"
              :value="localOutputParams[paramDef.name]"
              :disabled="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, computed, ref, watch } from 'vue'
import { selectionState } from '../composables/useSelection'
import IntSpinEdit from './IntSpinEdit.vue'
import RealSpinEdit from './RealSpinEdit.vue'
import CheckEdit from './CheckEdit.vue'

export default {
  name: 'EntryView',
  components: { IntSpinEdit, RealSpinEdit, CheckEdit },

  setup() {
    const paramComponents = {
      integer_spinner: IntSpinEdit,
      real_spinner:    RealSpinEdit,
      checkbox:        CheckEdit,
    }
    const entryManager = inject('entryManager')
    const entryParamManager = inject('entryParamManager')
    const entryDefinitionService = inject('entryDefinitionService')

    const selectedEntryId = selectionState.getSelectedEntryId()

    const selectedEntry = computed(() => {
      if (!selectedEntryId.value) return null
      return entryManager.getEntry(selectedEntryId.value)
    })

    const inputParamDefs = computed(() => {
      if (!selectedEntry.value || selectedEntry.value.type !== 'block') return []
      const blockDef = entryDefinitionService.blockDefinitions[selectedEntry.value.name]
      return blockDef ? blockDef.parameters.input : []
    })

    const outputParamDefs = computed(() => {
      if (!selectedEntry.value || selectedEntry.value.type !== 'block') return []
      const blockDef = entryDefinitionService.blockDefinitions[selectedEntry.value.name]
      return blockDef ? blockDef.parameters.output : []
    })

    const localInputParams = ref({})

    const localOutputParams = computed(() => {
      const id = selectedEntryId.value
      return id ? entryParamManager.getOutputParams(id) : {}
    })

    watch(selectedEntryId, (id) => {
      localInputParams.value = id ? { ...entryParamManager.getInputParams(id) } : {}
    }, { immediate: true })

    const onParamChange = (paramName, value) => {
      const id = selectedEntryId.value
      if (!id) return
      localInputParams.value[paramName] = value
      entryParamManager.setInputParam(id, paramName, value)
    }

    return {
      selectedEntry,
      inputParamDefs,
      outputParamDefs,
      localInputParams,
      localOutputParams,
      onParamChange,
      paramComponents,
    }
  }
}
</script>
```

- `paramComponents` maps each `ctrlType` string from `BlockDefinitions.json` to a concrete component class. `<component :is="paramComponents[paramDef.ctrlType]">` selects the correct control (`IntSpinEdit`, `RealSpinEdit`, or `CheckEdit`) at render time without an explicit `v-if`/`v-else` chain. (`RealSpinEdit` and `CheckEdit` are currently unused)
  - All three control components share a common prop interface (`name`, `min`, `max`, `step`, `value`, `disabled`) so they can be substituted interchangeably via `:is`.
- `inputParamDefs` and `outputParamDefs` are computed from `entryDefinitionService.blockDefinitions`, returning an empty array for containers (which have no parameters) and when no entry is selected.
  - The `v-if="inputParamDefs.length > 0"` and `v-if="outputParamDefs.length > 0"` guards prevent rendering empty sections when the selected entry has no parameters of that type.
- Input parameters use a local `ref` (`localInputParams`) initialized as a shallow copy of the stored values. This copy is refreshed by a `watch` on `selectedEntryId` so switching selection always shows the values for the newly selected entry.
  - The `{ immediate: true }` option ensures the watch callback runs on first render, avoiding an empty panel when the component mounts with an already-selected entry.
  - `onParamChange` writes to both `localInputParams` (for immediate UI feedback) and `entryParamManager.setInputParam` (to persist the value for script execution).
- Output parameters use a `computed` (`localOutputParams`) that reads directly from `entryParamManager.getOutputParams(id)`.
  - Because `EntryParamManager._outputParamsMap` is wrapped with `reactive()`, any update written by `_executeBlock` propagates to `localOutputParams` and re-renders the output controls automatically without any additional watcher.
  - Output controls receive `:disabled="true"`, making them read-only in the UI.

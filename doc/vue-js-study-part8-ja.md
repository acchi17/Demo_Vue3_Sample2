# Vue.js学習 Part 8: Vue.jsを使った入力パラメータによるUIオブジェクトの実行

## 本記事で扱うアプリケーション

- 左サイドバーから名前付きブロック（「Add」「Sub」「Mul」「DivMod」などの算術演算）をドラッグしてメインエリアやコンテナにドロップすると、定義された入出力パラメータがあらかじめ設定されたブロックが配置される。
- メインエリアやコンテナ内に配置されたブロックをクリックすると選択状態になり、右パネルに編集可能な入力パラメータと読み取り専用の出力パラメータが表示される。
- 入力パラメータ（整数、実数、ブール値）は、実行前に右パネルのスピナーコントロールやチェックボックスで編集できる。
- ブロックの実行ボタンをクリックすると、設定された入力パラメータでそのブロック名に対応するスクリプトが実行され、結果が出力パラメータに表示される。
- コンテナの実行ボタンをクリックすると、子ブロックが順次実行され、各ブロックは設定された入力パラメータを受け取り、出力パラメータが自動的に更新される。

**ソースコード:**  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step4](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step4)

## Vueアプリケーションのソースコード構成

上記アプリケーションのソースコード構成は以下のとおりです。

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

## 機能の実装

### 1. エントリの選択状態

このセクションでは、エントリ（BlockおよびContainer）の選択状態を管理する `useSelection` コンポーザブルを実装し、`BlockItem.vue` と `ContainerItem.vue` に選択機能を追加します。`useSelection` はモジュールレベルのシングルトンパターンを使用して、すべてのコンポーネント間で選択状態を共有します。選択されたエントリは視覚的にハイライト表示され、再生ボタンは現在選択されているエントリにのみ表示されます。

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

- `useSelection` は `useDragDropState.js` と同じシングルトンパターンに従い、`selectedEntryId` をモジュールレベルの ref として宣言しています。関数の外に ref を置くことで、`selectionState` をインポートするすべてのコンポーネントインスタンス間で状態が共有されます。
  - `export const selectionState = useSelection()` は単一の共有インスタンスをエクスポートするため、各コンポーネントは自分で `useSelection()` を呼び出すのではなく、このインスタンスを直接インポートして使用します。
- `isSelected(entryId)` はエントリIDを受け取り `ComputedRef<boolean>` を返すため、`selectedEntryId` が変更されると結果がリアクティブに更新されます。
  - `selectedEntryId.value === entryId` の比較により、指定されたエントリが現在選択されているかどうかを判定します。
- `getSelectedEntryId()` は ref を `readonly()` でラップして返すことで、外部コードが選択状態を直接変更できないようにしています。

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
    // 選択処理
    const isSelected = selectionState.isSelected(props.entry.id)

    const onSelect = () => {
      selectionState.setSelectedEntry(props.entry)
    }

    // その他のコンポーザブルの初期化とコールバック設定は省略

    return {
      isSelected,
      onSelect,
      // その他の戻り値は省略
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

- テンプレートでは `:class="{ 'selected': isSelected }"` でCSSクラスをリアクティブに適用し、`@click.stop="onSelect"` でクリック時に選択ハンドラを呼び出します。
  - `.stop` 修飾子によりクリックイベントの伝播を止め、親の `ContainerItem` にバブルアップして誤って親が選択されてしまうことを防ぎます。
- `v-if="isSelected"` により再生ボタンの表示を制御し、現在選択されているエントリにのみ表示されます。
- `selectionState.isSelected(props.entry.id)` は `ComputedRef<boolean>` を返すため、別のエントリが選択されると、このエントリの `isSelected` は自動的に `false` に更新されます。
- `.block-item.selected` スタイルは `variables.css` で定義されたCSSカスタムプロパティ `--entry-select-border` と `--entry-select-box-shadow` を使用して選択ハイライトを描画します。

#### ContainerItem.vue

`ContainerItem.vue` は `BlockItem.vue` と同じ方法で選択機能を実装し、`selectionState` を直接インポートします。テンプレートの `:class` バインディング、`@click.stop="onSelect"`、`v-if="isSelected"` による再生ボタン制御、および `.container-item.selected` スタイル定義は `BlockItem.vue` とほぼ同一です。

### 2. エントリパラメータの管理

このセクションでは、エントリのパラメータ管理を実装します。`EntryParamManager` は各エントリの入力パラメータと出力パラメータを別々に保存します。`useEntryOperation.addBlock()` でブロックが追加されると、ブロック定義のデフォルトパラメータが `EntryParamManager` に登録されます。`EntryExecutionService` がブロックを実行する際、現在の入力パラメータを読み取ってスクリプトに渡し、結果を出力パラメータに書き戻します。出力パラメータのUIリアクティビティは、出力マップをVueの `reactive()` でラップすることで実現しています。

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

- 入力パラメータと出力パラメータは別々のマップで管理されます。`_inputParamsMap` は通常の `Map` で、`_outputParamsMap` は `reactive()` でラップされています。
  - 出力パラメータだけがリアクティビティを必要とするのは、スクリプト実行によって更新され、UIの再レンダリングを自動的にトリガーする必要があるためです。入力パラメータはフォームコントロールを通じてユーザーが直接編集するため、Vueのフォームバインディングが独立してリアクティビティを処理します。
- `setOutputParam` は新しいオブジェクトに置き換えるのではなく、reactiveマップにすでに格納されているオブジェクトをその場で変更します（`this._outputParamsMap.get(entryId)[paramName] = value`）。
  - 格納されたオブジェクトを新しいオブジェクト（`this._outputParamsMap.set(entryId, { ...newObj })`）に置き換えると、既存のリアクティブ参照が壊れてしまいます。その場での変更によってVueの依存関係トラッキングが保持されます。

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

- `executeEntry` では、スクリプト実行前に `entryParamManager.getInputParams(entry.id)` を呼び出して、実行ボタンをクリックする前にユーザーがUIで編集した値を取得します。
  - 同じ `inputParams` のスナップショットは `executionLogService.addLog()` にも渡されるため、ログにはその実行に使用された正確な値が記録されます。
- `_executeBlock` では、スクリプトが返った後、出力パラメータ定義にすでに存在するキーのみが書き戻されます（`key in result` のガード）。
  - これにより、スクリプトが返した予期しないキーが出力マップを汚染することを防ぎ、`BlockDefinitions.json` で定義されたパラメータスキーマが権威ある構造として維持されます。

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

- ブロックがワークフローにドロップされると、`entryDefinitionService.getBlockDefaultParams(name)` が `BlockDefinitions.json` でそのブロックタイプに定義されたデフォルトのパラメータ構造を取得します。
  - `setInputParams` と `setOutputParams` が `defaultParams.input` と `defaultParams.output` でそれぞれ呼び出され、そのブロックタイプの正しい初期値と構造で `EntryParamManager` の2つのマップが初期化されます。
- `addContainer` は `entryParamManager` を呼び出しません。コンテナ自体にはパラメータがなく、子を順次実行する構造的なグループとしてのみ機能します。

### 3. エントリパラメータ編集UI

このセクションでは、現在選択されているエントリの編集可能な入力パラメータと読み取り専用の出力パラメータを表示する右パネルの詳細ビュー `EntryView.vue` を実装します。`SideArea.vue` は下部に `EntryView` をホストするように更新されます。`EntryView` は `selectionState` から選択されたエントリIDを読み取り、`entryDefinitionService` からパラメータ定義を取得し、各パラメータの `ctrlType` に基づいてVueの `<component :is>` バインディングを使用して適切なコントロールコンポーネント（`IntSpinEdit`、`RealSpinEdit`、または `CheckEdit`）を動的にレンダリングします。入力パラメータは変更時に `EntryParamManager` に書き戻すローカルのリアクティブコピーで管理され、出力パラメータは `EntryParamManager` のリアクティブな出力マップから直接読み取り、スクリプト実行が新しい値を書き込むたびに自動的に更新されます。

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

- `SideArea.vue` は縦方向に2つのフレックスエリアに分割されています。`.top-item`（flex: 6）はブロックパレット用の `BlockListView` を保持し、`.bottom-item`（flex: 4）はパラメータ編集用の `EntryView` を保持します。

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

- `paramComponents` は `BlockDefinitions.json` の各 `ctrlType` 文字列を具体的なコンポーネントクラスにマッピングします。`<component :is="paramComponents[paramDef.ctrlType]">` により、明示的な `v-if`/`v-else` チェーンなしに、レンダリング時に正しいコントロール（`IntSpinEdit`、`RealSpinEdit`、または `CheckEdit`）が選択されます（`RealSpinEdit` と `CheckEdit` は現在未使用）。
  - 3つのコントロールコンポーネントはすべて共通のプロップインターフェース（`name`、`min`、`max`、`step`、`value`、`disabled`）を共有しているため、`:is` を通じて相互に置き換えられます。
- `inputParamDefs` と `outputParamDefs` は `entryDefinitionService.blockDefinitions` から算出され、パラメータを持たないコンテナやエントリが選択されていない場合は空配列を返します。
  - `v-if="inputParamDefs.length > 0"` と `v-if="outputParamDefs.length > 0"` のガードにより、選択されたエントリがそのタイプのパラメータを持たない場合に空のセクションがレンダリングされることを防ぎます。
- 入力パラメータはローカルの `ref`（`localInputParams`）を使用し、格納された値のシャローコピーとして初期化されます。このコピーは `selectedEntryId` の `watch` によってリフレッシュされるため、選択を切り替えると常に新しく選択されたエントリの値が表示されます。
  - `{ immediate: true }` オプションにより、コンポーネントのマウント時にウォッチコールバックが最初のレンダリング時に実行され、すでに選択済みのエントリがある場合にパネルが空になることを防ぎます。
  - `onParamChange` は `localInputParams`（即時のUIフィードバック用）と `entryParamManager.setInputParam`（スクリプト実行のための値の永続化用）の両方に書き込みます。
- 出力パラメータは `entryParamManager.getOutputParams(id)` から直接読み取る `computed`（`localOutputParams`）を使用します。
  - `EntryParamManager._outputParamsMap` が `reactive()` でラップされているため、`_executeBlock` によって書き込まれた更新は追加のウォッチャーなしに `localOutputParams` に伝播し、出力コントロールが自動的に再レンダリングされます。
  - 出力コントロールには `:disabled="true"` が設定されており、UIでは読み取り専用になっています。

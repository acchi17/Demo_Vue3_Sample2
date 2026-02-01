# Vue.js Study Part 7: Execution of UI objects using Vue.js

## An application covered in this article

- 左サイドバーの"Hello"と"World"の名前付きブロック（ホワイトグレーアイコン）をドラッグしてメインエリアにドロップすると、対応するスクリプトを実行できるブロックが配置されます。
- コンテナ（ライムグリーンアイコン）をドラッグしてメインエリアやコンテナ内にドロップすると、子要素を含められるコンテナが配置されます。
- メインエリアやコンテナ内に配置された各エントリ（ブロック、コンテナ）には実行ボタン（playボタン）と削除ボタンが表示されます。
- 実行ボタンをクリックすると、ブロックの場合はそのブロックの名前に対応するスクリプト（public/scripts/Hello.js、World.jsなど）が実行され、コンテナの場合は子要素が順次実行されます。
- 右側の実行ログビューには、エントリの実行履歴が階層構造（サンドイッチスタイル）で表示され、実行ステータス、エントリ名、実行結果、エラーメッセージ、実行時間などが記録されます。

**ソースコード：**  
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2)

## Source code structure of the Vue application

上記アプリケーションのソース構成は以下の通りです。

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

#### 1.1 クラス構成と関係性

エントリ実行機能は6つのクラスで構成され、以下の階層的な依存関係を持ちます。

```
EntryExecutionService (EntryExecutionService.js)
  └── ScriptExecutionService (ScriptExecutionService.js)
      └── ScriptExecutionFactory (ScriptExecutionFactory.js)
          └── JavaScriptExecutionEngine (JavaScriptExecutionEngine.js)
              └── Workerスクリプト (JavaScriptExecutionWorker.js)
```

**注記**：基本的にファイル名はクラス名と同一です。JavaScriptExecutionWorker.jsはクラスではなく、Web Worker環境で実行されるスクリプトファイルです。

#### 1.2 エントリ実行からスクリプト実行までの流れ

1. **エントリ実行の開始**
   - `EntryExecutionService.executeEntry()` が呼び出され、Entryの種類（BlockまたはContainer）を判定します

2. **Block実行の場合**
   - `_executeBlock()` メソッドでBlockのスクリプト名を取得
   - `ScriptExecutionService.executeScript()` にスクリプト実行を委譲

3. **Container実行の場合**
   - `_executeContainer()` メソッドで子要素を順次処理
   - 各子要素に対して `executeEntry()` を再帰的に呼び出し

4. **スクリプト実行の処理**
   - `ScriptExecutionService` が `ScriptExecutionFactory` を使用してエンジンを初期化
   - 生成された `JavaScriptExecutionEngine` がスクリプト実行リクエストを受け取る

5. **実際のスクリプト実行**
   - Worker利用可能時：`JavaScriptExecutionWorker.js` にpostMessageでリクエスト送信
   - Worker利用不可時：`_executeDirectly()` でメインスレッドで直接実行
   - `public/scripts/`内のスクリプトファイル（Hello.js、World.jsなど）を動的にインポートし、その中のexecute関数を実行

6. **実行結果の返却**
   - 実行結果が各層を逆順に遡り、最終的に呼び出し元に返却されます

#### 1.3 各クラスの機能

**EntryExecutionService (EntryExecutionService.js)**
Entry（BlockまたはContainer）の実行を統括するサービスクラス。BlockはScriptExecutionServiceを介してスクリプトを実行し、Containerは子要素を順次実行します。実行状態の管理、実行IDの生成、ログサービスとの連携を担当します。

**ScriptExecutionService (ScriptExecutionService.js)**
スクリプト実行の統一インターフェースを提供するクラス。設定に基づきScriptExecutionFactoryを使用してエンジンインスタンスを生成し、スクリプト実行リクエストをエンジンに委譲します。

**ScriptExecutionFactory (ScriptExecutionFactory.js)**
指定された言語に応じた実行エンジンインスタンスを生成するファクトリークラス。現在はJavaScriptエンジンをサポートし、将来的に他の言語エンジン（Python等）を追加可能な設計となっています。

**IScriptExecutionEngine (IScriptExecutionEngine.js)**
スクリプト実行エンジンのインターフェースクラス。すべてのエンジン実装クラスは、initialize、executeScript、terminateメソッドを実装する必要があります。

**JavaScriptExecutionEngine (JavaScriptExecutionEngine.js)**
JavaScriptスクリプトの実行エンジン実装クラス。Web Workerを使用した並列実行と、フォールバック用の直接実行の両方をサポートし、メインスレッドをブロックせずにスクリプトを実行します。

**Workerスクリプト (JavaScriptExecutionWorker.js)**
Worker内でJavaScriptスクリプトを実行するWorkerスクリプト。スクリプトファイルを動的にインポートし、エクスポートされたexecute関数を実行して結果をメインスレッドに返します。

### 2. Named block

左サイドバーに名前付きブロック（"Hello"、"World"）のアイコンを配置し、ドラッグ＆ドロップでメインエリアやコンテナ内に配置できる機能を実装します。ドラッグ開始時にDataTransferオブジェクトにentryNameとしてブロックの名前を設定し、ドロップ時にその名前を取得して新しいBlockインスタンスを作成します。ブロック作成時に名前が設定されるため、作成されたブロックはそれぞれの名前で識別され、実行対象となるスクリプト名として機能します。

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
    
    // ... 他のcomposableの初期化やreturnなどは省略 ...
  }
}
</script>

<!-- スタイル部分は省略 -->
```

- SideArea.vueではテンプレート内に複数のブロックアイコンを配置し、それぞれにdraggable属性を設定しています。
  - "Hello"と"World"の2つの名前付きブロック（whitegrayアイコン）と、コンテナ（limeアイコン）が定義されています。
  - setBlockDragStartCallbackで`event.target.textContent`を取得し、entryNameとしてDataTransferに設定します。
- ドラッグ開始時に、entryType、entryName、sourceIdをDataTransferオブジェクトに設定することで、ドロップ先でブロックの種類と名前を識別できるようにしています。

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

- MainArea.vueのsetOnDropCallBackではentryNameをDataTransferから取得し、`new Block(entryName)`で名前付きブロックを作成します。
  - entryNameはSideArea.vueから設定される"Hello"または"World"といった名前です。
  - 作成されたBlockは名前をプロパティとして保持し、後の実行時にそのスクリプト名として使用されます。
- entryIdの有無で、新規作成か既存エントリの移動かを判定し、適切なEntryManagerメソッドを呼び出します。

#### ContainerItem.vue

ContainerItem.vueもMainArea.vueと同様に、setOnDropCallBackでentryNameを取得して、`new Block(entryName)`で名前付きブロックを作成します。これにより、コンテナ内にもドラッグ＆ドロップで名前付きブロックを追加できるようになっています。

### 3. UI for entry execution

BlockとContainerのUIコンポーネントに実行ボタン（playボタン）を配置し、ユーザーがボタンをクリックするとuseEntryExecution composableを通じてEntryExecutionServiceが呼び出される仕組みを実装します。実行中は重複実行を防ぐためisExecutingフラグで制御します。ボタンのスタイルはCSS変数で一元管理されており、ボタンの外観や動作アニメーションが統一されています。

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

- useEntryExecution composableはVue 3のComposition APIで実装されており、エントリ実行に必要な機能を提供します。
  - injectを使用してアプリケーションレベルで提供されるサービスを取得します。
  - executeEntry関数は非同期処理で、実行中はisExecutingフラグをtrueに設定し、実行完了後にfalseに戻します。
- isExecutingはreadonlyで外部からの直接修正を防ぎ、反応性を保ちながら実行状態を管理します。
- getLogs、clearLogsメソッドはExecutionLogServiceのラッパーであり、以降の節で解説するエントリ実行ログのUI機能で使用されます。

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
    
    // ... 他のcomposableの初期化やコールバック設定などは省略 ...
    
    // Return values and methods to use in <template>
    return {
      onPlay,
      // 他の必要な値も返却
    }
  }
}
</script>

<style scoped>
/* ... block-item、block-content、block-headerなどのスタイルは省略 ... */

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

- BlockItem.vueではplayボタンのクリックをonPlayメソッドでハンドルし、isExecuting.valueで実行状態をチェックしています。
  - 別のエントリが実行中の場合はリターンして重複実行を防ぎます。
  - executeEntry関数を呼び出してBlockの実行を委譲します。
- entry-buttonクラスはCSS変数を活用し、サイズ、背景画像、アニメーション効果などを統一管理しています。
  - :activeセレクタでボタン押下時のスケーリングと明度変化を実装し、ユーザーフィードバックを提供します。

#### ContainerItem.vue

ContainerItem.vueもBlockItem.vueと同様に、useEntryExecution composableを利用してplayボタンの実装を行っています。onPlayメソッドの実装とボタンのスタイル定義はBlockItem.vueとほぼ同一であり、entry-button関連のスタイルも共通で使用されています。

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

- variables.cssではエントリボタンに関するすべてのスタイル属性をCSS変数として定義し、ButtonItem.vueとContainerItem.vueから参照されます。
  - ボタンのサイズ、背景色、背景画像、カーソル、アニメーション効果などが一元管理されています。
- --entry-button-press-scaleと--entry-button-press-brightnessはボタン押下時のアニメーション効果を制御し、ユーザーインタラクションの視覚的フィードバックを実現します。
- 色定義（--block-bg-color、--container-bg-colorなど）も同一ファイルで管理され、テーマ統一の柔軟性を提供します。

### 4. Entry execution log service

エントリの実行履歴を階層構造で管理し、実行ログの追加・更新・取得・クリア機能を提供するExecutionLogServiceを実装します。Block実行時やContainer内の子要素実行時に、親子関係を持つ実行ログがツリー構造で保存されるため、複雑な実行流を追跡できます。

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

- ExecutionLogServiceは`_executionsTree`という階層構造を使用してログを管理しています。
  - `rootExecutions`配列には、最上位レベルのエントリ実行ログが保存されます。
  - `executionsByParent`辞書には、親の実行ID をキーとして、その親の子実行ログの配列が保存されます。
  - この構造により、ネストされた実行（Containerの子実行など）を親子関係を保持したまま管理できます。
- `addLog()`メソッドはEntryExecutionServiceから呼び出され、エントリの実行が開始されたときにログエントリを作成して階層構造に追加します。
  - `parentExecutionId`パラメータによって、ログが最上位か子実行かを判定し、適切な場所に配置されます。
- `updateLog()`メソッドはエントリの実行完了時にEntryExecutionServiceから呼び出され、実行結果と実行時間をログに記録します。
  - 実行開始時の`performance.now()`と完了時の値の差分から実行時間を計算し、`execTime`フィールドに格納します。

### 5. UI for entry execution log

ExecutionLogServiceで階層構造で管理された実行ログを、テーブル形式でUIに表示するExecutionLogView.vueコンポーネントを実装します。useEntryExecution composableを通じてログの取得とクリア機能を提供し、transformedLogs computedで階層構造を平坦配列に変換してサンドイッチスタイルで表示することで、複雑なコンテナ実行の親子関係を視覚的に表現します。

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

<!-- スタイル部分は省略 -->
```

- useEntryExecution composableを通じてgetLogs、clearLogsメソッドを取得し、ExecutionLogServiceと連携しています。
- transformedLogs computedで、ExecutionLogServiceの階層構造をフラット配列に変換してサンドイッチスタイルで表示します。
  - 最新の実行から順に処理し、Containerの場合は子要素をaddChildExecutions関数で再帰的に追加し、最後にcontainer-endマーカーを挿入することで、Containerの実行範囲を視覚的に表現します。
  - addChildExecutions関数は、指定された親の実行IDに対してExecutionLogServiceの`executionsByParent`辞書から子実行を取得し、ネストされたコンテナに対応するため再帰的に処理します。

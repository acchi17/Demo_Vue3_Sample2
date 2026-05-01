# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run serve    # Start dev server with hot reload
npm run build    # Build for production (output: dist/)
npm run lint     # Run ESLint (Vue 3 essential config)
```

No automated test runner is configured. For UI verification, use the MCP server capabilities or manual testing via `npm run serve`.

## Project Overview

A Vue 3 drag-and-drop UI builder where users construct nested workflows by dragging blocks and containers. Blocks execute scripts; containers hold and execute child entries sequentially. The application loads block definitions from JSON and executes JavaScript scripts via Web Workers.

## Core Architecture

### Entities

- **Entry** (base class): Represents any draggable element with `id`, `name`, `type`, and `children`
- **Block** (extends Entry): Leaf node that executes a single script
- **Container** (extends Entry): Can hold nested Blocks/Containers, executes children sequentially

**EntryManager** (`src/classes/EntryManager.js`): Centralized manager for all parent-child relationships
- Uses two maps: `_entriesById` (entry objects) and `_parentIdById` (child→parent lookup)
- Key methods: `addEntry()`, `removeEntry()`, `moveEntry()`, `reorderEntry()`, `getAllDescendantIds()`
- All structural changes (add/move/remove/reorder) must go through EntryManager

**EntryParamManager** (`src/classes/EntryParamManager.js`): Manages input/output parameters for each entry, enabling data flow between blocks in a workflow.

**EntryLayoutManager** (`src/classes/EntryLayoutManager.js`): Stores measured Y position and height of each entry's header in a reactive Map; used to align connection lines in the connection panel with entry headers.

**EntryConnectionManager** (`src/classes/EntryConnectionManager.js`): Manages directed connections between entry output and input parameter endpoints.

### Components

- **App.vue**: 3-column layout (SideArea | MainArea | ExecutionLogView)
- **MainArea.vue**: Holds the root container (`id: 'main-area'`) registered in EntryManager without a parent
- **SideArea.vue**: Drag sources for creating new blocks and containers
- **BlockItem.vue**: Renders individual blocks
- **ContainerItem.vue**: Recursive component rendering nested entries with drop zones
- **EntryParamsRow.vue**: Displays an In/Out toggle and parameter name badges inside a selected entry rectangle; used by both BlockItem and ContainerItem
- **EntryParamItem.vue**: Clickable badge displaying a parameter name; toggles pending connection state via `useEntryState`.
- **EntryView.vue**: Detail panel for the selected entry; shows its name and editable input parameters via `EntryParamManager`
- **ExecutionLogView.vue**: Displays execution logs from ExecutionLogService
- **ContainerChildren.vue**: Renders a container's child list with drop zones between entries, dispatching drop events to add/reorder/move entries.
- **ConnectionView.vue**: SVG overlay rendering all parameter connections as `ConnectionItem`s, with lane indices assigned via greedy interval packing to prevent overlap.
- **ConnectionItem.vue**: SVG `<g>` drawing a single connection line between two entry headers at a computed lane X, with parameter name badges at each endpoint.

### Composables

- **useDragDropState.js**: Module-level singleton tracking `isDragging` and `draggedItemIds`; shared across components to prevent dropping onto self or descendants.
- **useDraggable.js**: Provides `onDragStart`/`onDragEnd` handlers for draggable elements, updating `useDragDropState` on drag lifecycle.
- **useDroppable.js**: Provides `onDragOver`/`onDrop`/`isDroppable()` for drop zones; calls a registered callback with the drop event and target index.
- **useEntryExecution.js**: Bridges UI to `EntryExecutionService`, exposing `executeEntry()`, `isExecuting`, `getLogs()`, and `clearLogs()`.
- **useEntryOperation.js**: Bridges UI to `EntryManager`, exposing add/remove/move/reorder operations with automatic selection cleanup on removal.
- **useEntryRect.js**: Measures Y position and height of each entry's header and writes them into `EntryLayoutManager` for connection-line alignment; re-measures on structural changes.
- **useEntryState.js**: Module-level singleton managing entry selection (`selectedEntryId`) and parameter connection waiting state (`pendingConnection`) across all components.

### Entry Execution System

**Execution Flow:**
1. User triggers execution on a block or container (via `useEntryExecution` composable)
2. `EntryExecutionService.executeEntry(entry, traceId)` is called
   - Pushes the entry ID onto `_executionStack` to prevent concurrent re-execution
   - Generates a unique `executionId` (format: `{sessionId}_{sequence}_{entryId}`)
   - Logs execution start via `ExecutionLogService.addLog()`
3. Dispatch by entry type:
   - **Block** → `_executeBlock()` → `ScriptExecutionService.executeScript(blockName, inputParams)`
   - **Container** → `_executeContainer()` → recursively calls `executeEntry()` on each child in order
4. `ExecutionLogService.updateLog()` records the result and elapsed time
5. Entry ID is popped from `_executionStack` (in a `finally` block)

**Script Execution Pipeline** (`src/services/script_execution/`):
- `ScriptExecutionService`: Unified interface; delegates to an engine created by `ScriptExecutionFactory`
- `ScriptExecutionFactory`: Factory that instantiates the appropriate engine (currently JavaScript only)
- `IScriptExecutionEngine`: Abstract base defining the engine contract (`initialize`, `executeScript`, `terminate`)
- `JavaScriptExecutionEngine`: Runs scripts in a Web Worker for main-thread isolation; falls back to direct dynamic import if the Worker fails
- `JavaScriptExecutionWorker.js`: Worker code — dynamically imports `/public/scripts/{scriptName}.js` and calls `module.execute(inputParams)`

**Execution Log Hierarchy** (`src/services/log/ExecutionLogService.js`):
- Root executions are stored in `rootExecutions`; child executions are linked via `parentExecutionId`
- `addLog()` builds the tree; `updateLog()` fills in result and exec time after completion
- Auto-cleans oldest entries when the total exceeds the configured max (default 1000)

### Configuration (src/config/app-config.js)

Centralized configuration for:
- `block.definitionsFile`: Path to block definitions JSON
- `script.engineName`: Script execution engine (default: 'javascript')
- `script.scriptsDir`: Directory for script files

## Typical Use Case

### Place entries & Execution Flow

1. User drags blocks/containers from SideArea into MainArea
2. EntryManager maintains the hierarchical structure
3. When user triggers execution, EntryExecutionService:
   - For containers: recursively executes each child
   - For blocks: calls ScriptExecutionService with the block's name
4. ScriptExecutionService loads script from `public/scripts/{blockName}.js` and executes via JavaScriptExecutionEngine (Web Worker)
5. EntryParamManager manages parameter passing between blocks
6. ExecutionLogService records results with hierarchical tracing

### Parameter Connection Flow

1. User clicks an `EntryParamItem` badge → `useEntryState.startConnection()` stores the source endpoint (`entryId`, `paramName`, `paramCategory`, `paramType`) in the module-level `connectingSource` ref
2. While connecting, `isConnectingTarget` computes eligible target entries by comparing sequence numbers via `EntryManager.getSequenceNumber()`: output sources accept input badges on later entries; input sources accept output badges on earlier entries
3. User clicks a badge on an eligible target entry → `useEntryState.endConnection()` normalises the two endpoints into `(outputEndpoint, inputEndpoint)` order and calls `EntryConnectionManager.addConnection()`
4. Clicking the active source badge cancels the pending connection via `cancelConnection()`
5. `ConnectionView` reactively reads all connections from `EntryConnectionManager` and Y positions from `EntryLayoutManager` to render `ConnectionItem` lines in the SVG overlay

## Coding Conventions

- **Indentation**: 2 spaces
- **Quotes**: Single quotes in JS
- **Naming**:
  - Components: PascalCase (e.g., `MainArea.vue`)
  - Composables: `useSomething` (e.g., `useDraggable.js`)
  - Classes: PascalCase (e.g., `EntryManager`)
  - Services: PascalCase with "Service" suffix (e.g., `FileService`)
- **Vue Style**: Match the existing Options API or Composition API style in the file being edited

## Important Patterns

### When Modifying Entry Structure
Always use EntryManager methods, never manipulate `children` arrays or parent relationships directly. The manager maintains internal maps that must stay synchronized.

### Cleanup on Unmount
`EntryExecutionService.terminate()` must be called to clean up Web Workers. App.vue handles this on `beforeunload` and `onBeforeUnmount`.

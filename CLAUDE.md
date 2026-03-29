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

### Entry Hierarchy & Management

- **Entry** (base class): Represents any draggable element with `id`, `name`, `type`, and `children`
- **Block** (extends Entry): Leaf node that executes a single script
- **Container** (extends Entry): Can hold nested Blocks/Containers, executes children sequentially

**EntryManager** (`src/classes/EntryManager.js`): Centralized manager for all parent-child relationships
- Uses two maps: `_entriesById` (entry objects) and `_parentIdById` (child→parent lookup)
- Key methods: `addEntry()`, `removeEntry()`, `moveEntry()`, `reorderEntry()`, `getAllDescendantIds()`
- All structural changes (add/move/remove/reorder) must go through EntryManager

**EntryParamManager** (`src/classes/EntryParamManager.js`): Manages input/output parameters for each entry, enabling data flow between blocks in a workflow.

**useEntryOperation** (`src/composables/useEntryOperation.js`): Responsible for providing the entry operation interface (add, remove, move, reorder) to components, acting as the bridge between UI interactions and EntryManager.

### Drag-and-Drop System

**Singleton State Management** (`src/composables/useDragDropState.js`):
- Module-level singleton pattern shares drag state across all components
- Tracks `isDragging` and `draggedItemIds` (Set of IDs for dragged item + descendants)
- Used to prevent dropping an element onto itself or its children

**Composables**:
- `useDraggable.js`: Provides `onDragStart`, `onDragEnd`, callbacks for draggable elements
- `useDroppable.js`: Provides `onDragOver`, `onDrop`, `isDroppable()` for drop zones
- Both access the singleton `dragDropState` for coordination

**Drop Areas**: ContainerItem.vue places drop zones before the first child and after each child, enabling insertion at any position.

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

**useEntryExecution** (`src/composables/useEntryExecution.js`): Composable that bridges UI components to `EntryExecutionService`, exposing `executeEntry()` and `getLogs()` to templates.

### Configuration (src/config/app-config.js)

Centralized configuration for:
- `block.definitionsFile`: Path to block definitions JSON
- `script.engineName`: Script execution engine (default: 'javascript')
- `script.scriptsDir`: Directory for script files

### Component Structure

- **App.vue**: 3-column layout (SideArea | MainArea | ExecutionLogView)
- **MainArea.vue**: Holds the root container (`id: 'main-area'`) registered in EntryManager without a parent
- **SideArea.vue**: Drag sources for creating new blocks and containers
- **ContainerItem.vue**: Recursive component rendering nested entries with drop zones
- **BlockItem.vue**: Renders individual blocks
- **ExecutionLogView.vue**: Displays execution logs from ExecutionLogService
- **EntryView.vue**: Detail panel for the selected entry; shows its name and editable input parameters via `EntryParamManager`

### Data Flow & Execution

1. User drags blocks/containers from SideArea into MainArea
2. EntryManager maintains the hierarchical structure
3. When user triggers execution, EntryExecutionService:
   - For containers: recursively executes each child
   - For blocks: calls ScriptExecutionService with the block's name
4. ScriptExecutionService loads script from `public/scripts/{blockName}.js` and executes via JavaScriptExecutionEngine (Web Worker)
5. EntryParamManager manages parameter passing between blocks
6. ExecutionLogService records results with hierarchical tracing

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

## MCP Server Usage

### Available Servers
- `chrome-devtools`: UI testing and browser automation

### Automatic Testing Triggers
When I say "ready to test" or "check this", you should:
1. Run the test suite with `npm test`
2. Start chrome-devtools testing at http://localhost:3000
3. Verify the specific feature I just asked you to build
4. Report any errors or issues found

# Design Plan: Display Connected ParamBadgeItems in Connection Panel

## 1. Overview

After a parameter connection is established (i.e., after `addConnection()` is called inside
`completeConnection()` in `useEntryState.js`), the two connected `ParamBadgeItem`s should
be rendered in the `connection-panel` inside `MainArea.vue`. Each connection is displayed as
a horizontal line with the output badge on the left end and the input badge on the right end.
When the two connected entries sit at different vertical positions, the line bends to bridge
both Y levels (step-connector shape).

---

## 2. Current State

| Item | File | Current Behaviour |
|---|---|---|
| Connection storage | `src/classes/EntryConnectionManager.js` | `_connectionsById` is a plain `Map` — **not reactive**. Vue cannot observe additions. |
| Connection panel | `src/components/MainArea.vue` lines 20-21 | Empty `<div class="connection-panel">` — placeholder only. |
| Layout data | `src/classes/EntryLayoutManager.js` | Stores `{ y, height }` per entry header. Already reactive (`reactive(new Map())`). |
| Layout access | `src/composables/useEntryRect.js` | Returns the reactive `layoutMap` to `MainArea.vue` via `entryLayoutMap`. |
| Badge component | `src/components/ParamBadgeItem.vue` | Renders a pill with param name and handles connection toggle. |

---

## 3. Requirements

1. When `addConnection()` succeeds, the connection-panel must update automatically (reactivity).
2. Each established connection is displayed as a row containing:
   - An **output badge** (left side) showing the output param name, visually styled as an output param badge.
   - An **input badge** (right side) showing the input param name, visually styled as an input param badge.
   - A **connecting line** (SVG step-connector) linking the two badges.
3. Each badge is vertically centred at the same Y level as the corresponding entry's header
   (aligned with the background horizontal lines already drawn in `background-panel`).
4. The connection-panel is read-only in this phase — clicking badges here does **not** start a new connection.

---

## 4. Design

### 4.1 Reactivity Gap: Make `EntryConnectionManager` Reactive

**Problem:** `_connectionsById` is a plain `Map`. `addConnection()` mutates it, but Vue 3's
reactivity system cannot track plain `Map` mutations.

**Solution:** Wrap the internal map in Vue's `reactive()`.

```js
// EntryConnectionManager.js
import { reactive } from 'vue'

constructor() {
  this._connectionsById = reactive(new Map())   // was: new Map()
}
```

Because `_connectionsById` is now a reactive `Map`, any template or computed that reads
`_connectionsById.size` or iterates over it will automatically re-render when entries are
added or removed.

Add a convenience getter that exposes the reactive map for read-only access:

```js
get connectionsMap() {
  return this._connectionsById
}
```

### 4.2 New Component: `ConnectionPanelItem.vue`

**Location:** `src/components/ConnectionPanelItem.vue`

**Responsibility:** Render a single connection — the output badge, the input badge, and the
SVG step-connector line between them.

#### Props

| Prop | Type | Description |
|---|---|---|
| `connection` | `Object` | `{ id, output: Endpoint, input: Endpoint }` where `Endpoint = { entryId, category, dataType, paramName }` |
| `outputLayout` | `Object` | `{ y: number, height: number }` — layout of the output entry header from `EntryLayoutManager` |
| `inputLayout` | `Object` | `{ y: number, height: number }` — layout of the input entry header from `EntryLayoutManager` |
| `panelHeight` | `Number` | Total height of the connection-panel container (used to size the SVG canvas) |

#### Computed Values

```js
const outputCY = computed(() => props.outputLayout.y + props.outputLayout.height / 2)
const inputCY  = computed(() => props.inputLayout.y  + props.inputLayout.height  / 2)
```

#### Template Structure

```html
<template>
  <!-- Absolutely positioned layer covering full panel width/height -->
  <div class="connection-panel-item">

    <!-- Output badge: left edge, vertically centred at outputCY -->
    <div
      class="badge-anchor badge-anchor--output"
      :style="{ top: outputCY - BADGE_HALF_HEIGHT + 'px' }"
    >
      <span class="param-badge param-badge--output">
        {{ connection.output.paramName }}
      </span>
    </div>

    <!-- SVG step-connector spanning the full panel height -->
    <svg
      class="connection-svg"
      :width="SVG_WIDTH"
      :height="panelHeight"
    >
      <path
        :d="stepPath"
        fill="none"
        stroke="#888"
        stroke-width="1.5"
      />
    </svg>

    <!-- Input badge: right edge, vertically centred at inputCY -->
    <div
      class="badge-anchor badge-anchor--input"
      :style="{ top: inputCY - BADGE_HALF_HEIGHT + 'px' }"
    >
      <span class="param-badge param-badge--input">
        {{ connection.input.paramName }}
      </span>
    </div>

  </div>
</template>
```

#### SVG Step-Connector Path

The SVG covers the full width of the connection-panel. The path is a three-segment
step-connector:

```
(x1, outputCY) → horizontal → (midX, outputCY) → vertical → (midX, inputCY) → horizontal → (x2, inputCY)
```

Where:
- `x1` = right edge of the output badge (e.g. badge width + left margin ≈ 80 px)
- `x2` = left edge of the input badge (e.g. panel width − badge width − right margin)
- `midX` = `(x1 + x2) / 2`

```js
const stepPath = computed(() => {
  const x1   = OUTPUT_BADGE_WIDTH + MARGIN
  const x2   = SVG_WIDTH - INPUT_BADGE_WIDTH - MARGIN
  const midX = (x1 + x2) / 2
  const y1   = outputCY.value
  const y2   = inputCY.value
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`
})
```

#### CSS Positioning

```css
.connection-panel-item {
  position: absolute;
  inset: 0;         /* stretch to fill the connection-panel */
  pointer-events: none;
}

.badge-anchor {
  position: absolute;
  pointer-events: auto;
}

.badge-anchor--output { left: 0; }
.badge-anchor--input  { right: 0; }

.connection-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
```

### 4.3 Modify `MainArea.vue`

1. **Inject** `entryConnectionManager`.
2. **Compute** a reactive connections array:

   ```js
   const connections = computed(() =>
     Array.from(entryConnectionManager.connectionsMap.values())
   )
   ```

   Because `connectionsMap` is `reactive(new Map())`, this computed re-evaluates whenever
   `addConnection()` / `removeConnection()` is called.

3. **Compute** `panelHeight` (height of the connection-panel element) so `ConnectionPanelItem`
   can size its SVG. Use a `ref` on the panel div and read `clientHeight` in a `ResizeObserver`
   or derive from `entryLayoutMap`:

   ```js
   // Simplest approach: track via ResizeObserver on the connection-panel ref
   const connectionPanelRef = ref(null)
   const panelHeight = ref(0)
   // ... watch connectionPanelRef to set up ResizeObserver
   ```

4. **Template** — render `ConnectionPanelItem` for each valid connection (both endpoints have
   layout data):

   ```html
   <div class="connection-panel" ref="connectionPanelRef">
     <ConnectionPanelItem
       v-for="conn in validConnections"
       :key="conn.id"
       :connection="conn"
       :output-layout="entryLayoutMap.get(conn.output.entryId)"
       :input-layout="entryLayoutMap.get(conn.input.entryId)"
       :panel-height="panelHeight"
     />
   </div>
   ```

   Where `validConnections` filters out connections whose entries do not yet have layout data:

   ```js
   const validConnections = computed(() =>
     connections.value.filter(
       c => entryLayoutMap.get(c.output.entryId) && entryLayoutMap.get(c.input.entryId)
     )
   )
   ```

5. **Register** `ConnectionPanelItem` in the `components` option of `MainArea.vue`.

---

## 5. Visual Layout

```
┌──────────────────────────────┬──────────────────────────────┐
│         entry-panel          │       connection-panel        │
│                              │                               │
│  ── background-line (Y=80) ─ │ [output badge] ──────────────│── Y=80
│  ┌─────────────────────────┐ │               │              │
│  │ BlockA  [Out: "result"] │ │               │ (vert. seg.) │
│  └─────────────────────────┘ │               │              │
│                              │               ──────── [input│badge] ── Y=160
│  ── background-line (Y=160)─ │                              │
│  ┌─────────────────────────┐ │                              │
│  │ BlockB  [In:  "value" ] │ │                              │
│  └─────────────────────────┘ │                              │
└──────────────────────────────┴──────────────────────────────┘
```

Each row in the connection-panel corresponds to one established connection. The badges are
vertically aligned with the background-lines drawn in the `background-panel`.

---

## 6. Implementation Steps

| # | Task | File(s) |
|---|---|---|
| 1 | Wrap `_connectionsById` with `reactive()`, add `connectionsMap` getter | `EntryConnectionManager.js` |
| 2 | Create `ConnectionPanelItem.vue` with props, SVG path logic, and CSS | `src/components/ConnectionPanelItem.vue` (new) |
| 3 | In `MainArea.vue`: inject `entryConnectionManager`, compute `connections` / `validConnections`, add `connectionPanelRef` + `panelHeight`, render `ConnectionPanelItem` | `MainArea.vue` |
| 4 | Import and register `ConnectionPanelItem` in `MainArea.vue` | `MainArea.vue` |

---

## 7. Data Flow

```
addConnection() called in completeConnection()
    ↓
EntryConnectionManager._connectionsById (reactive Map) — mutation
    ↓ Vue reactivity
MainArea: connections computed re-evaluates
    ↓
ConnectionPanelItem renders for each connection
    ↓ reads
EntryLayoutManager.layoutMap (reactive Map)
    → outputLayout (y, height) for output entry
    → inputLayout  (y, height) for input entry
    ↓
SVG path and badge positions computed
    ↓
DOM update — badges and connecting line appear in connection-panel
```

---

## 8. Edge Cases

| Scenario | Handling |
|---|---|
| Connection added before entries are laid out | `validConnections` filter skips these; they appear once `useEntryRect` measures them. |
| Both entries at the same Y | Step-connector degenerates to a straight horizontal line (`V y2` is a no-op). |
| Entry removed while connection exists | `entryLayoutMap` will not have the entry's layout, so `validConnections` hides the item. Ideally `removeConnectionsByEntryId()` is called in `useEntryOperation.removeEntry()`. |
| Multiple connections on the same entry | Each connection is a separate `ConnectionPanelItem`; they stack independently. |

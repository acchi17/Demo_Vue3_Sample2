# Plan: Preventing ConnectionItem Overlap (Revised)

## 1. Problem Statement

In `ConnectionItem.vue`, all connections share fixed coordinates:

```js
const x1 = 0
const x2 = 160
```

With a Bézier path `M x1 y1 C cx y1, cx y2, x2 y2`, connections that share a
source or target entry overlap because they start and end at identical points.

After reviewing the actual rendering model, the correct solution is not to adjust
the Bézier coordinates but to adopt a **vertical lane** rendering structure where
each connection occupies a unique horizontal column (lane) in the connection panel.

---

## 2. Rendering Model

Each `ConnectionItem` represents one connection as:

- A **vertical line** from `(laneX, y1)` to `(laneX, y2)`
- An **output param badge** at `(laneX, y_output_entry_center)`
- An **input param badge** at `(laneX, y_input_entry_center)`

Where:

| Variable | Value |
|---|---|
| `y1` | Output entry's layout Y center — `layout.y + layout.height / 2` (unchanged) |
| `y2` | Input entry's layout Y center — `layout.y + layout.height / 2` (unchanged) |
| `laneX` | `laneIndex × LANE_WIDTH` — assigned by `ConnectionView` |

Connection constraints (confirmed):
- An **input** parameter connects to at most one output (1:1)
- An **output** parameter can connect to multiple inputs (1:many)

---

## 3. Lane Assignment Algorithm

`ConnectionView` assigns a `laneIndex` to each connection before rendering,
using **greedy interval packing**:

### Sort order (applied once per render)

```
primary:   min(y_output_entry, y_input_entry)   ascending
secondary: connection.id                         ascending (lexicographic)
```

Using top-Y as the primary sort key makes lane assignment a **pure function of
(connections, entry positions)**. The same file always restores to the same
visual layout regardless of the order connections were loaded — safe for future
file persistence.

### Assignment loop

```
laneAssignments = {}

for each connection in sorted order:
  yMin = min(y_output_entry, y_input_entry)
  yMax = max(y_output_entry, y_input_entry)

  occupied = {
    laneAssignments[c] for every already-assigned connection c
    whose Y-range [yMin_c, yMax_c] overlaps [yMin, yMax]
  }

  laneIndex = smallest non-negative integer NOT in occupied
  laneAssignments[connection.id] = laneIndex
```

**Complexity:** O(n²) — appropriate for typical connection counts.

**Result:** Connections whose Y ranges do not overlap reuse the same lane index,
keeping the panel compact (e.g. a Block4→Block5 connection reuses lane 0 even
though lane 0 is occupied by a Block1→Block3 connection, because their Y ranges
do not intersect).

---

## 4. What Changes

| File | Change |
|---|---|
| `src/components/ConnectionView.vue` | Add lane assignment computation (sort + greedy packing); pass `laneIndex` as prop to each `ConnectionItem` |
| `src/components/ConnectionItem.vue` | Replace Bézier path with vertical line; add input/output badge rendering at `(laneX, y_entry_center)`; accept `laneIndex` prop; compute `laneX = laneIndex × LANE_WIDTH` |

## 5. What Stays the Same

| Component / Class | Reason |
|---|---|
| `EntryLayoutManager` | Entry-center Y is sufficient; no per-parameter Y needed |
| `EntryParamManager` | Parameter index metadata not required |
| `EntryConnectionManager` | Connection data model unchanged |
| Y coordinate calculation | `y = layout.y + layout.height / 2` — no change |

---

## 6. Verification

1. `npm run serve`
2. Connect Block3.output3A → Block1.input1A and Block3.output3A → Block1.input1B — same Y range, must occupy different lanes
3. Connect Block5.output5A → Block4.input4A — Y range [Block4, Block5] does not overlap [Block1, Block3]; should reuse lane 0
4. Save state to file, reload — lane assignments must be identical to the pre-save state

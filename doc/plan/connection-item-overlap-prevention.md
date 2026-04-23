# Plan: Preventing ConnectionItem Overlap

## 1. Problem Statement

In `ConnectionItem.vue`, the horizontal coordinates are hardcoded constants:

```js
const x1 = 0
const x2 = 160
```

The SVG Bézier path is:

```
M ${x1} ${y1}  C ${cx} ${y1}, ${cx} ${y2},  ${x2} ${y2}
```

`y1` and `y2` are derived from `EntryLayoutManager` using the **entry-level center**
(`y + height / 2`), not the individual parameter position. This means:

- All connections from the **same entry** start at the identical point `(0, y_entry_center)`.
- All connections to the **same entry** end at the identical point `(160, y_entry_center)`.
- Two paths that share a start point and have the same control-point formula will overlap
  visually until their `y2` values diverge.

### Concrete Overlap Cases

| Case | Description |
|---|---|
| **A** | Entry with multiple output params each connected to different inputs — all start at `(0, same_y)`. |
| **B** | Multiple connections terminating at the same input entry — all end at `(160, same_y)`. |
| **C** | Two connections between the same pair of entries (different params) — paths are identical. |
| **D** | Two entries at the same vertical position in the layout — `y1 == y2` and both are equal across connections. |

---

## 2. Design Goals

1. No two `ConnectionItem` paths should visually overlap (or be indistinguishable).
2. Each connection should remain clearly associated with its specific output/input parameter.
3. Implementation should be additive — not require restructuring existing services.
4. Prefer simpler changes where they achieve the same result.

---

## 3. Proposed Plans

### Plan A: Parameter-Index Y Offset  *(Recommended — simplest)*

**Core idea:** Instead of anchoring connections to the entry-center Y, offset `y1` and `y2`
by a small amount based on the **index of the parameter** within the entry's parameter list.

```
y1 = entryCenter_y + (outputParamIndex - outputParamCount / 2) * PARAM_SPACING
y2 = entryCenter_y + (inputParamIndex  - inputParamCount  / 2) * PARAM_SPACING
```

Where `PARAM_SPACING` is a constant (e.g., `10` px) small enough to stay within the entry
row height.

#### What changes

| Component / Class | Change |
|---|---|
| `ConnectionItem.vue` | Accept `outputParamIndex`, `outputParamCount`, `inputParamIndex`, `inputParamCount` as props and apply the offset formula. |
| `ConnectionView.vue` | Query `entryParamManager` to resolve parameter index and count for each connection endpoint before passing props to `ConnectionItem`. |
| `EntryParamManager` | Add a helper `getOutputParamIndex(entryId, paramName)` and `getOutputParamCount(entryId)` (and `Input` equivalents) that return the positional index and total count. |

#### Visual result

```
Entry A (out: "x", "y")       Entry B (in: "val")
  ─────────────────── y_center - 5  →  conn(A.x → B.val)
  ─────────────────── y_center + 5  →  conn(A.y → B.val)
```

#### Trade-offs

| Pro | Con |
|---|---|
| Minimal code change | Offset is approximate; heavy nesting can push y outside row bounds |
| No DOM measurement needed | Parameter order must be stable (insertion-ordered) |
| Naturally separates params within the same entry | Offset constant needs tuning to match UI row height |

---

### Plan B: Per-Endpoint X Spread (Fan Out)

**Core idea:** Keep `y1`/`y2` at entry-center, but spread `x1` (and correspondingly `x2`)
horizontally per connection index among all connections that share the same output entry.

```
x1 = BASE_X1 + outputConnectionIndex * X_STEP
x2 = BASE_X2 - inputConnectionIndex  * X_STEP
```

Where `outputConnectionIndex` is the 0-based index of this connection among all connections
whose output `entryId` matches.

#### What changes

| Component / Class | Change |
|---|---|
| `ConnectionItem.vue` | Accept `x1Offset` and `x2Offset` props; apply to path. |
| `ConnectionView.vue` | Group connections by output `entryId`, assign index within group; group by input `entryId`, assign index; pass offsets to `ConnectionItem`. |

#### Visual result

```
All from Entry A (3 connections):
  x1=0   ─────╮
  x1=5   ──────╮  (fanned start points)
  x1=10  ───────╮
```

#### Trade-offs

| Pro | Con |
|---|---|
| No change needed in param managers | `x1`/`x2` are no longer aligned with badge positions |
| Works even when param order is unknown | Visual result is less intuitive (offsets look like rendering artifacts) |
| — | Connection-to-parameter mapping becomes harder to read |

---

### Plan C: Per-Parameter DOM Anchor (Precise Alignment)

**Core idea:** Extend `EntryLayoutManager` to store **per-parameter** Y positions (measured
from the DOM badge elements), replacing the entry-center heuristic entirely.

#### Extended layout schema

```js
// EntryLayoutManager stores:
{
  entryId: {
    y: number,         // entry header top (existing)
    height: number,    // entry header height (existing)
    params: {
      output: { paramName: { y: number } },  // NEW
      input:  { paramName: { y: number } }   // NEW
    }
  }
}
```

#### What changes

| Component / Class | Change |
|---|---|
| `EntryLayoutManager` | Extend `setLayout()` or add `setParamLayout(entryId, category, paramName, y)`. |
| `useEntryRect.js` | After measuring entry headers, also query `[data-param-id]` badge elements and call `setParamLayout()` for each. |
| `EntryParamItem.vue` | Add a `data-param-id` attribute (format: `{entryId}:{category}:{paramName}`) so `useEntryRect` can find them. |
| `ConnectionItem.vue` | Use `paramLayout.params.output[paramName].y` for `y1` and `paramLayout.params.input[paramName].y` for `y2`. |

#### Visual result

Each connection's curve starts and ends at the **exact Y position** of its parameter badge
in the UI — perfect alignment with `EntryParamItem` rows.

#### Trade-offs

| Pro | Con |
|---|---|
| Most accurate — no layout approximation | More DOM queries in `useEntryRect` |
| Scales to any number of params per entry | Badge must be rendered before connection can display |
| Aligns visually with param badges in `EntryParamsRow` | `EntryLayoutManager` schema change touches multiple files |

---

### Plan D: Separate Connection Lane per Connection (Parallel Routing)

**Core idea:** Assign each connection a unique horizontal "swim lane" index within the
`connection-panel`. The lane determines a unique `midX` for the Bézier control point,
spreading the middle section of overlapping paths apart.

```
midX = LANE_BASE + connectionLaneIndex * LANE_WIDTH
```

#### What changes

| Component / Class | Change |
|---|---|
| `ConnectionView.vue` | Sort connections and assign a stable `laneIndex` to each (e.g., index in `getConnections()` array). |
| `ConnectionItem.vue` | Accept `laneIndex` prop; compute `cx = LANE_BASE + laneIndex * LANE_WIDTH` instead of `(x1 + x2) / 2`. |

#### Visual result

```
Two connections between A→B (same y1, y2):
  conn0: curves through midX=80
  conn1: curves through midX=90   ← shifted midpoint
```

#### Trade-offs

| Pro | Con |
|---|---|
| Guaranteed no path overlap regardless of y values | `laneIndex` can change as connections are added/removed |
| No param metadata needed | Wide panels needed for many connections |
| Simple index assignment | Doesn't visually communicate which param is connected |

---

## 4. Comparison Matrix

| Criterion | Plan A | Plan B | Plan C | Plan D |
|---|---|---|---|---|
| Eliminates overlap | ✓ (param spacing) | ✓ | ✓ | ✓ |
| Aligns with param badges | ✓ (approximate) | ✗ | ✓ (exact) | ✗ |
| DOM measurement needed | No | No | Yes | No |
| Changes to EntryLayoutManager | No | No | Yes | No |
| Changes to EntryParamManager | Getter only | No | No | No |
| Implementation complexity | Low | Low | Medium | Low |

---

## 5. Recommendation

**Start with Plan A** as the quickest path to eliminate the most common overlap cases.
The parameter-index Y offset requires only:

1. A parameter-index getter in `EntryParamManager`
2. Extended props on `ConnectionItem`
3. Index resolution logic in `ConnectionView`

If the resulting visual alignment needs to be more precise (e.g., connection lines must
visually originate from the exact badge position), **migrate to Plan C** as a follow-up.
Plan C is the long-term ideal but requires DOM-level measurement infrastructure.

---

## 6. Implementation Steps for Plan A

| # | Task | File(s) |
|---|---|---|
| 1 | Add `getOutputParamIndex(entryId, paramName)`, `getOutputParamCount(entryId)`, `getInputParamIndex(entryId, paramName)`, `getInputParamCount(entryId)` to `EntryParamManager` | `src/classes/EntryParamManager.js` |
| 2 | Inject `entryParamManager` in `ConnectionView.vue`; resolve param index/count for each endpoint when computing the connections array | `src/components/ConnectionView.vue` |
| 3 | Add props `outputParamIndex`, `outputParamCount`, `inputParamIndex`, `inputParamCount` (all `Number`) to `ConnectionItem`; apply Y offset formula | `src/components/ConnectionItem.vue` |
| 4 | Define `PARAM_SPACING` constant (e.g., `10`) in `ConnectionItem` | `src/components/ConnectionItem.vue` |

## 7. Implementation Steps for Plan C

| # | Task | File(s) |
|---|---|---|
| 1 | Add `setParamLayout(entryId, category, paramName, y)` and `getParamLayout(entryId, category, paramName)` to `EntryLayoutManager` | `src/classes/EntryLayoutManager.js` |
| 2 | Add `data-param-category` and `data-param-name` attributes to `EntryParamItem.vue` root element | `src/components/EntryParamItem.vue` |
| 3 | In `useEntryRect.js`, after measuring entry headers, query `[data-param-category][data-param-name]` elements within each entry and call `setParamLayout()` | `src/composables/useEntryRect.js` |
| 4 | Update `ConnectionItem.vue` to read param-level y from `entryLayoutManager.getParamLayout()` for `y1`/`y2`, falling back to entry-center if not available | `src/components/ConnectionItem.vue` |

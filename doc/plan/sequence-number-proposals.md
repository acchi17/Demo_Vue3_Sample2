# Sequence Number Feature: Implementation Proposals

## Overview

This document describes proposals for associating each entry with an integer that indicates its visual position in the Main area (1, 2, 3, … from the top).

The sequence number reflects the **depth-first traversal (DFS) order** of the entry tree, which matches the top-to-bottom visual rendering order in the UI.

**Example:**

```
Container A  → seq: 1
  Block B    → seq: 2
  Block C    → seq: 3
Block D      → seq: 4
Container E  → seq: 5
  Container F→ seq: 6
    Block G  → seq: 7
```

The `main-area` root container itself does not receive a sequence number. Numbering starts from its direct children.

---

## Proposal A: On-Demand DFS Traversal (No Caching)

### Concept

`getSequenceNumber(entryId)` performs a DFS traversal of the entry tree each time it is called and returns the 1-based position of the target entry.

### Implementation

Add the following method to `EntryManager`:

```js
/**
 * Get the sequence number (1-based visual position) of an entry.
 * Returns null if the entry is not found or is the root container.
 * @param {string} rootId - ID of the root container (e.g. main-area container ID)
 * @param {string} targetId - ID of the entry to look up
 * @returns {number|null}
 */
getSequenceNumber(rootId, targetId) {
  const root = this._entriesById.get(rootId);
  if (!root || root.type !== 'container') return null;

  let counter = 0;

  const traverse = (children) => {
    for (const child of children) {
      counter++;
      if (child.id === targetId) return counter;
      if (child.type === 'container') {
        const found = traverse(child.children);
        if (found !== null) return found;
      }
    }
    return null;
  };

  return traverse(root.children);
}
```

### Pros

- Simple and always returns the correct value without any cache invalidation logic.
- No additional state to maintain in `EntryManager`.
- Safe to call at any time.

### Cons

- O(n) time per call, where n is the total number of entries.
- Inefficient if called frequently (e.g., for every rendered entry on each re-render).
- Requires the caller to supply `rootId`.

### Caller Signature

```js
const seq = entryManager.getSequenceNumber(mainContainerId, entryId);
```

---

## Proposal B: Cached Sequence Map (Rebuilt on Structural Change)

### Concept

`EntryManager` maintains an internal `Map<entryId, sequenceNumber>` that is rebuilt after every structural change (`addEntry`, `removeEntry`, `moveEntry`, `reorderEntry`). `getSequenceNumber(entryId)` is then an O(1) lookup.

### Implementation

1. **Add state and a private rebuild method:**

```js
constructor() {
  this._entriesById = new Map();
  this._parentIdById = new Map();
  this._sequenceNumbers = new Map(); // entryId → sequence number
  this._rootId = null;               // ID of the root container
}

/**
 * Set the root container for sequence number computation.
 * Must be called once after the root container is registered.
 * @param {string} rootId
 */
setRoot(rootId) {
  this._rootId = rootId;
  this._rebuildSequenceNumbers();
}

/**
 * Rebuild the sequence number map using DFS from the root.
 * @private
 */
_rebuildSequenceNumbers() {
  this._sequenceNumbers.clear();
  if (!this._rootId) return;

  const root = this._entriesById.get(this._rootId);
  if (!root || root.type !== 'container') return;

  let counter = 0;
  const traverse = (children) => {
    for (const child of children) {
      this._sequenceNumbers.set(child.id, ++counter);
      if (child.type === 'container') {
        traverse(child.children);
      }
    }
  };
  traverse(root.children);
}
```

2. **Call `_rebuildSequenceNumbers()` at the end of each mutating method:**

```js
addEntry(parentId, entry, index) {
  // ... existing logic ...
  this._rebuildSequenceNumbers();
  return true;
}

removeEntry(entryId) {
  // ... existing logic ...
  this._rebuildSequenceNumbers();
  return true;
}

moveEntry(entryId, newParentId, index) {
  // ... existing logic ...
  this._rebuildSequenceNumbers();
  return true;
}

reorderEntry(parentId, entryId, index) {
  // ... existing logic ...
  this._rebuildSequenceNumbers();
  return true;
}
```

3. **Add the public getter:**

```js
/**
 * Get the sequence number (1-based visual position) of an entry.
 * @param {string} entryId
 * @returns {number|null} Sequence number or null if not found
 */
getSequenceNumber(entryId) {
  return this._sequenceNumbers.get(entryId) ?? null;
}
```

4. **Register the root in `MainArea.vue`:**

```js
// After addContainer(null, 'main-area', 0):
entryManager.setRoot(mainContainer.id);
```

### Pros

- O(1) lookup per call — efficient for display in all rendered components.
- Sequence numbers are always in sync with the tree after any mutation.
- Single call signature with no `rootId` argument needed by callers.

### Cons

- Every structural change triggers a full O(n) rebuild. This is acceptable for typical workflow sizes (tens to hundreds of entries).
- Requires `setRoot()` to be called once during app initialization (in `MainArea.vue`).
- Slightly increases `EntryManager` state complexity.

### Caller Signature

```js
const seq = entryManager.getSequenceNumber(entryId);
```

---

## Proposal C: Vue Reactive Composable (External to EntryManager)

### Concept

Rather than modifying `EntryManager`, implement a Vue composable `useSequenceNumbers.js` that computes a reactive `Map<entryId, sequenceNumber>` from the entry tree using Vue's `computed()`. Components can then look up any entry's sequence number reactively.

### Implementation

Create `src/composables/useSequenceNumbers.js`:

```js
import { computed, inject } from 'vue';

/**
 * Returns a reactive map of entryId → sequence number.
 * Sequence numbers are 1-based and reflect DFS visual order.
 */
export function useSequenceNumbers(rootEntry) {
  const sequenceMap = computed(() => {
    const map = new Map();
    if (!rootEntry || !rootEntry.children) return map;

    let counter = 0;
    const traverse = (children) => {
      for (const child of children) {
        map.set(child.id, ++counter);
        if (child.type === 'container') {
          traverse(child.children);
        }
      }
    };
    traverse(rootEntry.children);
    return map;
  });

  const getSequenceNumber = (entryId) => {
    return sequenceMap.value.get(entryId) ?? null;
  };

  return { sequenceMap, getSequenceNumber };
}
```

Usage in `MainArea.vue` (provide to all descendants):

```js
import { useSequenceNumbers } from '../composables/useSequenceNumbers';

// Inside setup():
const { getSequenceNumber, sequenceMap } = useSequenceNumbers(mainContainer);
provide('getSequenceNumber', getSequenceNumber);
```

Usage in `BlockItem.vue` or `ContainerItem.vue`:

```js
const getSequenceNumber = inject('getSequenceNumber');
const seq = computed(() => getSequenceNumber(props.entry.id));
```

### Pros

- Fully reactive: sequence numbers update automatically when the entry tree changes (because `mainContainer.children` is reactive via Vue's reactivity system).
- No changes required to `EntryManager`.
- Clean separation of concerns: display logic stays in the composable layer.

### Cons

- `getSequenceNumber` is not available via `entryManager` directly (deviates from the issue's suggested API).
- Requires Vue's reactivity context; cannot be used outside of Vue components/composables.
- The `computed` recalculates the entire map on any tree change, similar in cost to Proposal B's rebuild.

---

## Comparison Summary

| | Proposal A | Proposal B | Proposal C |
|---|---|---|---|
| **Location** | `EntryManager` | `EntryManager` | Vue composable |
| **Lookup cost** | O(n) per call | O(1) | O(1) via reactive map |
| **Rebuild cost** | None (on-demand) | O(n) per mutation | O(n) on reactive change |
| **Matches suggested API** | Partial (needs rootId) | Yes (`getSequenceNumber(id)`) | No (composable-based) |
| **State added to EntryManager** | None | `_sequenceNumbers`, `_rootId` | None |
| **Vue dependency** | None | None | Required |
| **Initialization required** | No | Yes (`setRoot()`) | Yes (`provide`) |

---

## Recommendation

**Proposal B (Cached Sequence Map)** is recommended because:

1. It satisfies the proposed API signature `EntryManager.getSequenceNumber(entryId)` without requiring a `rootId` argument at each call site.
2. O(1) lookups make it suitable for display in every rendered entry component.
3. The rebuild overhead on mutation is negligible for typical workflow sizes.
4. It keeps sequence number logic self-contained within `EntryManager`, consistent with the existing architecture where all structural state is centralized there.

Proposal A is a valid simpler starting point if the feature is used rarely (e.g., only in a detail panel rather than rendered on every entry card). Proposal C is worth considering if the team wants to avoid modifying `EntryManager` and prefers keeping display-oriented logic in the composable layer.

import { watchEffect, onMounted, onUnmounted, nextTick, inject } from 'vue'

/**
 * Measures the Y position and height of each entry's header element in the entry panel
 * and writes them into EntryLayoutManager. Used to align horizontal lines in the
 * connection panel with entry headers.
 *
 * @param {Ref<HTMLElement>} entryPanelRef - Ref to the entry panel (.entry-panel)
 * @param {Object} rootContainer - The root container whose children tree is reactive
 */
export function useEntryRect(entryPanelRef, rootContainer) {
  const entryLayoutManager = inject('entryLayoutManager')

  function measureEntries() {
    if (!entryPanelRef.value) return

    const panelRect = entryPanelRef.value.getBoundingClientRect()

    const nodes = entryPanelRef.value.querySelectorAll('[data-entry-id]')
    entryLayoutManager.clearAll()
    for (const node of nodes) {
      const rect = node.getBoundingClientRect()
      entryLayoutManager.setLayout(
        node.dataset.entryId,
        rect.top - panelRect.top,
        rect.height
      )
    }
  }

  // Re-measure on structural changes (add/remove/reorder entries)
  watchEffect(() => {
    function traverse(children) {
      for (const child of children) {
        if (child.children) traverse(child.children)
      }
    }
    traverse(rootContainer.children)
    nextTick(() => measureEntries())
  })

  // Re-measure on size changes (container expands/collapses)
  let ro
  onMounted(() => {
    ro = new ResizeObserver(() => nextTick(() => measureEntries()))
    ro.observe(entryPanelRef.value)
  })
  onUnmounted(() => ro?.disconnect())
}

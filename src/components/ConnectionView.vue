<template>
  <svg
    class="connection-view"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
  >
    <path
      v-for="conn in connectionPaths"
      :key="conn.id"
      :d="conn.d"
      class="connection-path"
    />
  </svg>
</template>

<script>
import { computed, inject } from 'vue'

export default {
  name: 'ConnectionView',

  setup() {
    const entryConnectionManager = inject('entryConnectionManager')
    const entryLayoutManager = inject('entryLayoutManager')

    const connectionPaths = computed(() => {
      const connections = entryConnectionManager.getConnections()
      const layoutMap = entryLayoutManager.layoutMap

      return connections.flatMap(conn => {
        const outLayout = layoutMap.get(conn.output.entryId)
        const inLayout = layoutMap.get(conn.input.entryId)
        if (!outLayout || !inLayout) return []

        const y1 = outLayout.y + outLayout.height / 2
        const y2 = inLayout.y + inLayout.height / 2
        const x1 = 0
        const x2 = 160
        const cx = (x1 + x2) / 2

        return [{
          id: conn.id,
          d: `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`,
        }]
      })
    })

    return { connectionPaths }
  }
}
</script>

<style scoped>
.connection-view {
  display: block;
  overflow: visible;
}

.connection-path {
  fill: none;
  stroke: #5a9fd4;
  stroke-width: 2;
  stroke-linecap: round;
}
</style>

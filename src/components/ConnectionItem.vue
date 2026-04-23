<template>
  <path
    v-if="pathD"
    :d="pathD"
    class="connection-path"
  />
</template>

<script>
import { computed, inject } from 'vue'

export default {
  name: 'ConnectionItem',

  props: {
    output: {
      type: Object,
      required: true
    },
    input: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const entryLayoutManager = inject('entryLayoutManager')

    const pathD = computed(() => {
      const layoutMap = entryLayoutManager.layoutMap
      const outLayout = layoutMap.get(props.output.entryId)
      const inLayout = layoutMap.get(props.input.entryId)
      if (!outLayout || !inLayout) return null

      const y1 = outLayout.y + outLayout.height / 2
      const y2 = inLayout.y + inLayout.height / 2
      const x1 = 0
      const x2 = 160
      const cx = (x1 + x2) / 2

      return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
    })

    return { pathD }
  }
}
</script>

<style scoped>
.connection-path {
  fill: none;
  stroke: #5a9fd4;
  stroke-width: 2;
  stroke-linecap: round;
}
</style>

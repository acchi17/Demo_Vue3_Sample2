<template>
  <svg
    class="connection-view"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
  >
    <ConnectionItem
      v-for="conn in connections"
      :key="conn.id"
      :output="conn.output"
      :input="conn.input"
    />
  </svg>
</template>

<script>
import { computed, inject } from 'vue'
import ConnectionItem from './ConnectionItem.vue'

export default {
  name: 'ConnectionView',
  components: { ConnectionItem },

  setup() {
    const entryConnectionManager = inject('entryConnectionManager')

    const connections = computed(() => entryConnectionManager.getConnections())

    return { connections }
  }
}
</script>

<style scoped>
.connection-view {
  display: block;
  overflow: visible;
}
</style>

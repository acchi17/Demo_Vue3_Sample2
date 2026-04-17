<template>
  <div class="drop-area"
      :class="{'is-active': dropAllowed}"
      @drop="(event) => $emit('drop', event, 0)"
      @dragover="(event) => $emit('dragover', event)"
  />
  <template v-for="(child, index) in children" :key="child.id">
    <component
      :is="child.type === 'block' ? 'BlockItem' : 'ContainerItem'"
      :entry="child"
      @remove="$emit('remove', $event)"
    />
    <div class="drop-area"
        :class="{'is-active': dropAllowed}"
        @drop="(event) => $emit('drop', event, index + 1)"
        @dragover="(event) => $emit('dragover', event)"
    />
  </template>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import BlockItem from './BlockItem.vue'

export default {
  name: 'ContainerChildItem',
  components: {
    BlockItem,
    ContainerItem: defineAsyncComponent(() => import('./ContainerItem.vue'))
  },
  props: {
    children: {
      type: Array,
      required: true
    },
    dropAllowed: {
      type: Boolean,
      required: true
    }
  },
  emits: ['drop', 'dragover', 'remove']
}
</script>

<style scoped>
.drop-area {
  height: 20px;
  width: 100%;
  border: 1px dashed transparent;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.drop-area.is-active {
  height: 20px;
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}
</style>

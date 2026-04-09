<template>
  <span
    class="param-badge"
    :class="{ pending: isPending }"
    @click.stop="onToggle"
  >{{ name }}</span>
</template>

<script>
import { computed } from 'vue'
import { entryState } from '../composables/useEntryState'

export default {
  name: 'ParamBadgeItem',

  props: {
    entryId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    paramKind: {
      type: String,
      required: true
    },
    dataType: {
      type: String,
      default: null
    }
  },

  setup(props) {
    const isPending = computed(
      () => entryState.isConnectingParamFor(props.entryId, props.name, props.paramKind).value
    )

    const onToggle = () => {
      if (isPending.value) {
        entryState.cancelConnection()
      } else {
        entryState.startConnection(props.entryId, props.name, props.paramKind, props.dataType)
      }
    }

    return { isPending, onToggle }
  }
}
</script>

<style scoped>
.param-badge {
  font-size: 10px;
  color: #fff;
  background-color: var(--param-badge-bg-color);
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
  cursor: pointer;
}

.param-badge.pending {
  outline: 2px solid #fff;
  opacity: 0.8;
}
</style>

<template>
  <span
    class="param-badge"
    :class="{ pending: isPending }"
    @click.stop="onToggle"
  >{{ name }}</span>
</template>

<script>
import { computed } from 'vue'
import { useEntryState } from '../composables/useEntryState'

export default {
  name: 'EntryParamItem',

  props: {
    entryId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    paramCategory: {
      type: String,
      required: true
    },
    paramType: {
      type: String,
      default: null
    }
  },

  setup(props) {
    const {
      isConnectingParam,
      isConnectingParamSrc,
      isConnectingParamDst,
      startConnection,
      cancelConnection,
      completeConnection,
    } = useEntryState()

    const isPending = computed(
      () => isConnectingParamSrc(props.entryId, props.name, props.paramCategory).value
    )
    const isConnectingDst = isConnectingParamDst(props.entryId)

    const onToggle = () => {
      if (isPending.value) {
        cancelConnection()
      } else if (isConnectingParam.value && isConnectingDst.value) {
        completeConnection(props.entryId, props.name, props.paramCategory, props.paramType)
      } else {
        startConnection(props.entryId, props.name, props.paramCategory, props.paramType)
      }
    }

    return { isPending, onToggle }
  }
}
</script>

<style scoped>
.param-badge {
  font-size: var(--param-badge-font-size);
  color: var(--param-badge-color);
  background-color: var(--param-badge-bg-color);
  padding: 2px 6px;
  border-radius: var(--param-badge-border-radius);
  white-space: nowrap;
  cursor: pointer;
}

.param-badge.pending {
  outline: 2px solid #fff;
  opacity: 0.8;
}
</style>

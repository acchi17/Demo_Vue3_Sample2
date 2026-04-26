<template>
  <span
    class="param-badge"
    :class="{ 'connecting-src': isConnectingSrc, 'connected': isConnected }"
    @click.stop="onToggle"
  >{{ isConnected ? (paramCategory === 'output' ? '→ ' : '← ') : '' }}{{ name }}</span>
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
    },
    isDisabledAction: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const {
      isConnecting,
      isConnectingSource,
      isConnectingTarget,
      isConnectedEndPoint,
      startConnection,
      cancelConnection,
      endConnection,
    } = useEntryState()

    const isConnectingSrc = computed(
      () => !props.isDisabledAction && isConnectingSource(props.entryId, props.name, props.paramCategory).value
    )
    const isConnectingTgt = computed(
      () => !props.isDisabledAction && isConnectingTarget(props.entryId).value
    )
    const isConnected = computed(
      () => !props.isDisabledAction && isConnectedEndPoint(props.entryId, props.name, props.paramCategory).value
    )

    const onToggle = () => {
      if (props.isDisabledAction) return
      if (isConnectingSrc.value) {
        cancelConnection()
      } else if (isConnecting.value && isConnectingTgt.value) {
        endConnection(props.entryId, props.name, props.paramCategory, props.paramType)
      } else {
        startConnection(props.entryId, props.name, props.paramCategory, props.paramType)
      }
    }

    return { isConnectingSrc, isConnectingTgt, isConnected, onToggle }
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

.param-badge.connecting-src {
  outline: 2px solid #fff;
  opacity: 0.8;
}

.param-badge.connected {
  outline: 2px solid #fff;
  font-weight: 600;
}
</style>

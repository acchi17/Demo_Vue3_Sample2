<template>
  <div
    class="param-badge"
    :class="{ 'connecting-src': isConnectingSrc, 'connected': isConnected }"
    @click.stop="onToggle"
  >
    <span>123</span>
    <span class="element-partition"/>
    <span class="param-name">{{ name }}</span>
    <span class="element-partition"/>
    <span class="link-button">{{ isConnected ? (paramCategory === 'output' ? '→' : '←') : '' }}</span>
  </div>
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
  height: var(--param-badge-height);
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: var(--param-badge-font-size);
  color: var(--param-badge-color);
  border: var(--param-badge-border);
  border-radius: var(--param-badge-border-radius);
  background-color: var(--param-badge-bg-color);
}

.param-badge.connecting-src {
  outline: 2px solid #fff;
  opacity: 0.8;
}

.param-badge.connected {
  outline: 2px solid #fff;
  font-weight: 600;
}

.element-partition {
  height: var(--param-badge-partition-height);
  width: var(--param-badge-partition-width);
  margin: var(--param-badge-partition-margin);
  background-color: var(--param-badge-partition-color);
}

.param-name {
  white-space: nowrap;
}

.link-button {
  width: var(--param-badge-button-size);
  height: var(--param-badge-button-size);
  cursor: var(--param-badge-button-cursor);
}
</style>

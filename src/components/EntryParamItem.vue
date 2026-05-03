<template>
  <div
    class="param-badge"
    :class="[{ 'connecting-src': isConnectingSrc }, paramTypeClass]"
    @click.stop="isParamLinkVisible && onConnect()"
  >
    <template v-if="isParamTypeVisible">
      <span class="param-type">123</span>
      <span class="element-partition"/>
    </template>
    <template v-if="isParamLinkVisible">
      <span class="link-button" :class="{ 'connected': isConnected }"/>
      <span class="element-partition"/>
    </template>
    <span
      class="param-name"
      :class="{
        'restricted': !isParamTypeVisible && isParamLinkVisible,
        'fixed': !isParamTypeVisible && !isParamLinkVisible
      }"
    >{{ paramName }}</span>
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
    paramName: {
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
    isParamTypeVisible: {
      type: Boolean,
      default: true
    },
    isParamLinkVisible: {
      type: Boolean,
      default: true
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
      () => isConnectingSource(props.entryId, props.paramName, props.paramCategory).value
    )
    const isConnectingTgt = computed(
      () => isConnectingTarget(props.entryId).value
    )
    const isConnected = computed(
      () => isConnectedEndPoint(props.entryId, props.paramName, props.paramCategory).value
    )

    const onConnect = () => {
      if (isConnectingSrc.value) {
        cancelConnection()
      } else if (isConnecting.value && isConnectingTgt.value) {
        endConnection(props.entryId, props.paramName, props.paramCategory, props.paramType)
      } else {
        startConnection(props.entryId, props.paramName, props.paramCategory, props.paramType)
      }
    }

    const paramTypeClass = computed(() => {
      if (!props.paramType) return null
      return `type-${props.paramType}`
    })

    return { isConnectingSrc, isConnectingTgt, isConnected, onConnect, paramTypeClass }
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
  font-weight: var(--param-badge-font-weight);
  color: var(--param-badge-color);
  border: var(--param-badge-border);
  border-radius: var(--param-badge-border-radius);
}

.param-badge.type-integer {
  background-color: var(--param-badge-bg-color-integer);
}

.param-badge.type-real {
  background-color: var(--param-badge-bg-color-real);
}

.param-badge.type-boolean {
  background-color: var(--param-badge-bg-color-boolean);
}

.param-badge.type-string {
  background-color: var(--param-badge-bg-color-string);
}

.param-badge.type-image {
  background-color: var(--param-badge-bg-color-image);
}

.param-badge.connecting-src {
  outline: 2px solid #fff;
  opacity: 0.8;
}

.element-partition {
  height: var(--param-badge-partition-height);
  width: var(--param-badge-partition-width);
  margin: var(--param-badge-partition-margin);
  background-color: var(--param-badge-partition-color);
}

.param-name {
  text-align: center;
  white-space: nowrap;
}

.param-name.restricted {
  max-width: var(--param-badge-name-max-width);
  font-size: var(--param-badge-name-compact-font-size);
  overflow: hidden;
  text-overflow: ellipsis;
}

.param-name.fixed {
  width: var(--param-badge-name-fixed-width);
  font-size: var(--param-badge-name-compact-font-size);
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-button {
  width: var(--param-badge-button-size);
  height: var(--param-badge-button-size);
  cursor: pointer;
  border-radius: 4px;
  background-image: var(--param-badge-button-unlinked-image);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.link-button.connected {
  background-image: var(--param-badge-button-linked-image);
  background-color: var(--param-badge-button-linked-color);
}
</style>

<template>
  <template v-if="hasParams">
    <div class="param-toggle">
      <button
        class="param-toggle-btn"
        :class="{ active: paramKind === 'input' }"
        @click.stop="paramKind = 'input'"
      >In</button>
      <button
        class="param-toggle-btn"
        :class="{ active: paramKind === 'output' }"
        @click.stop="paramKind = 'output'"
      >Out</button>
    </div>
    <div class="param-badges">
      <span
        v-for="pName in paramNames"
        :key="pName"
        class="param-badge"
        :class="{ 'pending': isBadgeConnecting(pName).value }"
        @click.stop="onBadgeToggle(pName)"
      >{{ pName }}</span>
    </div>
  </template>
</template>

<script>
import { ref, computed, inject } from 'vue'
import { entryState } from '../composables/useEntryState'

export default {
  name: 'EntryParamsItem',

  props: {
    entryId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const entryParamManager = inject('entryParamManager')

    const hasParams = computed(() =>
      (entryParamManager.getInputParamNames(props.entryId) || []).length > 0 ||
      (entryParamManager.getOutputParamNames(props.entryId) || []).length > 0
    )

    const paramKind = ref('input')

    const paramNames = computed(() =>
      paramKind.value === 'input'
        ? (entryParamManager.getInputParamNames(props.entryId) || [])
        : (entryParamManager.getOutputParamNames(props.entryId) || [])
    )

    const isBadgeConnecting = (paramName) =>
      entryState.isConnectingParamFor(props.entryId, paramName, paramKind.value)

    const onBadgeToggle = (paramName) => {
      if (isBadgeConnecting(paramName).value) {
        entryState.cancelConnection()
      } else {
        entryState.startConnection(props.entryId, paramName, paramKind.value)
      }
    }

    return {
      hasParams,
      paramKind,
      paramNames,
      isBadgeConnecting,
      onBadgeToggle,
    }
  }
}
</script>

<style scoped>
.param-toggle {
  display: flex;
  align-items: center;
}

.param-toggle-btn {
  font-size: 10px;
  padding: 2px 5px;
  cursor: pointer;
  line-height: 1.4;
  border: 1px solid var(--param-badge-bg-color);
  background: transparent;
  color: var(--param-badge-bg-color);
}

.param-toggle-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.param-toggle-btn:last-child {
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.param-toggle-btn.active {
  background: var(--param-badge-bg-color);
  color: #fff;
}

.param-badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

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

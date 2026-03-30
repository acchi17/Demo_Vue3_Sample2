<template>
  <div class="entry-view">
    <div v-if="selectedEntry">
      <div class="entry-header">{{ selectedEntry?.name }}</div>
      <div v-if="inputParamDefs.length > 0" class="entry-param">
        <div class="entry-param-title">Input</div>
        <div v-for="paramDef in inputParamDefs" :key="paramDef.name" class="param-row">
          <component
            :is="paramComponents[paramDef.ctrlType]"
            :name="paramDef.name"
            :numberType="paramDef.ctrlType === 'real_spinner' ? 'real' : 'integer'"
            :min="paramDef.min"
            :max="paramDef.max"
            :step="paramDef.step"
            :value="localParams[paramDef.name]"
            @update:value="onParamChange(paramDef.name, $event)"
          />
        </div>
      </div>
    </div>
    <div v-else>
      <p class="empty-content">No entry selected</p>
    </div>
  </div>
</template>

<script>
import { inject, computed, ref, watch } from 'vue'
import { selectionState } from '../composables/useSelection'
import SpinEdit from './SpinEdit.vue'
import CheckEdit from './CheckEdit.vue'

export default {
  name: 'EntryView',
  components: { SpinEdit, CheckEdit },

  setup() {
    const paramComponents = {
      integer_spinner: SpinEdit,
      real_spinner:    SpinEdit,
      checkbox:        CheckEdit,
    }
    const entryManager = inject('entryManager')
    const entryParamManager = inject('entryParamManager')
    const entryDefinitionService = inject('entryDefinitionService')

    const selectedEntryId = selectionState.getSelectedEntryId()

    const selectedEntry = computed(() => {
      if (!selectedEntryId.value) return null
      return entryManager.getEntry(selectedEntryId.value)
    })

    // Input parameter definitions from block definition (empty for containers)
    const inputParamDefs = computed(() => {
      if (!selectedEntry.value || selectedEntry.value.type !== 'block') return []
      const blockDef = entryDefinitionService.blockDefinitions[selectedEntry.value.name]
      return blockDef ? blockDef.parameters.input : []
    })

    // Local copy of param values for reactive display
    const localParams = ref({})

    // Reload local params when selected entry changes
    watch(selectedEntryId, (id) => {
      localParams.value = id ? { ...entryParamManager.getInputParams(id) } : {}
    }, { immediate: true })

    const onParamChange = (paramName, value) => {
      const id = selectedEntryId.value
      if (!id) return
      localParams.value[paramName] = value
      entryParamManager.setInputParam(id, paramName, value)
    }

    return {
      selectedEntry,
      inputParamDefs,
      localParams,
      onParamChange,
      paramComponents
    }
  }
}
</script>

<style scoped>
.entry-view {
  width: 100%;
  padding: 14px;
  background: #fafafa;
}

.empty-content {
  color: #999;
  font-size: 13px;
}

.entry-header {
  font-size: 22px;
  font-weight: bold;
  color: #555;
  margin-bottom: 5px;
}

.entry-param {
  padding-top: 5px;
  margin-bottom: 5px;
  border-top: 1px solid #ddd;
}

.entry-param-title {
  font-size: 16px;
  font-weight: bold;
  color: #555;
  margin-bottom: 8px;
}

.param-row {
  margin-bottom: 6px;
}
</style>

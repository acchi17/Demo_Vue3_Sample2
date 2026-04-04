<template>
  <div class="entry-view">
    <div v-if="selectedEntry">
      <div class="entry-header">{{ selectedEntry?.name }}</div>
      <div class="section-divider" />
      <div v-if="inputParamDefs.length > 0">
        <div class="entry-param-header">Input</div>
        <div class="entry-param-content">
          <div v-for="paramDef in inputParamDefs" :key="paramDef.name" class="entry-param-row">
            <component
              :is="paramComponents[paramDef.ctrlType]"
              :name="paramDef.name"
              :min="paramDef.min"
              :max="paramDef.max"
              :step="paramDef.step"
              :value="localInputParams[paramDef.name]"
              @update:value="onParamChange(paramDef.name, $event)"
            />
          </div>
        </div>
      </div>
      <div v-if="outputParamDefs.length > 0">
        <div class="section-divider" />
        <div class="entry-param-header">Output</div>
        <div class="entry-param-content">
          <div v-for="paramDef in outputParamDefs" :key="paramDef.name" class="entry-param-row">
            <component
              :is="paramComponents[paramDef.ctrlType]"
              :name="paramDef.name"
              :min="paramDef.min"
              :max="paramDef.max"
              :step="paramDef.step"
              :value="localOutputParams[paramDef.name]"
              :disabled="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, computed, ref, watch } from 'vue'
import { selectionState } from '../composables/useSelection'
import IntSpinEdit from './IntSpinEdit.vue'
import RealSpinEdit from './RealSpinEdit.vue'
import CheckEdit from './CheckEdit.vue'

export default {
  name: 'EntryView',
  components: { IntSpinEdit, RealSpinEdit, CheckEdit },

  setup() {
    const paramComponents = {
      integer_spinner: IntSpinEdit,
      real_spinner:    RealSpinEdit,
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

    // Output parameter definitions from block definition (empty for containers)
    const outputParamDefs = computed(() => {
      if (!selectedEntry.value || selectedEntry.value.type !== 'block') return []
      const blockDef = entryDefinitionService.blockDefinitions[selectedEntry.value.name]
      return blockDef ? blockDef.parameters.output : []
    })

    // Local copy of input param values for reactive display
    const localInputParams = ref({})

    // Computed output params reads directly from the reactive EntryParamManager map,
    // so it updates automatically when values change during execution
    const localOutputParams = computed(() => {
      const id = selectedEntryId.value
      return id ? entryParamManager.getOutputParams(id) : {}
    })

    // Reload local input params when selected entry changes
    watch(selectedEntryId, (id) => {
      localInputParams.value = id ? { ...entryParamManager.getInputParams(id) } : {}
    }, { immediate: true })

    const onParamChange = (paramName, value) => {
      const id = selectedEntryId.value
      if (!id) return
      localInputParams.value[paramName] = value
      entryParamManager.setInputParam(id, paramName, value)
    }

    return {
      selectedEntry,
      inputParamDefs,
      outputParamDefs,
      localInputParams,
      localOutputParams,
      onParamChange,
      paramComponents,
    }
  }
}
</script>

<style scoped>
.entry-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.entry-header {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  padding-bottom: 10px;
}

.section-divider {
  height: 1px;
  background-color: #ddd;
}

.entry-param-header {
  font-size: 18px;
  color: #333;
  padding: 5px 0px;
}

.entry-param-content {
  display: flex;
  flex-direction: column;
  padding: 10px 10px;
}

.entry-param-row {
  margin-bottom: 10px;
}
</style>

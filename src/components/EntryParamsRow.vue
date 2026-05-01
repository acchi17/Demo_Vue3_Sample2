<template>
  <div class="entry-params-row">
    <div v-if="!isConnectingTgt" class="param-toggle">
      <button
        class="param-toggle-btn"
        :class="{ active: paramCategory === 'input' }"
        @click.stop="paramCategory = 'input'"
      >In</button>
      <button
        class="param-toggle-btn"
        :class="{ active: paramCategory === 'output' }"
        @click.stop="paramCategory = 'output'"
      >Out</button>
    </div>
    <div class="param-badges">
      <EntryParamItem
        v-for="param in paramItems"
        :key="param.name"
        :entry-id="entryId"
        :name="param.name"
        :param-category="param.category"
        :param-type="param.type"
        :is-disabled-action="false"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue'
import EntryParamItem from './EntryParamItem.vue'
import { useEntryState } from '../composables/useEntryState'

export default {
  name: 'EntryParamsRow',

  components: { EntryParamItem },

  props: {
    entryId: {
      type: String,
      required: true
    },
    isConnectingTgt: {
      type: Boolean,
      required: true
    }
  },

  setup(props) {
    const entryParamManager = inject('entryParamManager')
    const { getConnectingSource } = useEntryState()

    const paramCategory = ref('input')

    const paramCategoryDyn = computed(() => {
      if (!props.isConnectingTgt) return paramCategory.value
      return getConnectingSource.value?.paramCategory === 'output' ? 'input' : 'output'
    })

    const paramItems = computed(() => {
      const category = paramCategoryDyn.value
      const types = category === 'input'
        ? entryParamManager.getInputParamTypes(props.entryId)
        : entryParamManager.getOutputParamTypes(props.entryId)
      return Object.entries(types).map(([name, type]) => ({ name, type, category }))
    })

    return {
      paramCategory,
      paramItems,
    }
  }
}
</script>

<style scoped>
.entry-params-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

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
</style>

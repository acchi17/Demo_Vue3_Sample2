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
      <ParamBadgeItem
        v-for="param in paramItems"
        :key="param.name"
        :entry-id="entryId"
        :name="param.name"
        :param-kind="paramKind"
        :data-type="param.type"
      />
    </div>
  </template>
</template>

<script>
import { ref, computed, inject } from 'vue'
import ParamBadgeItem from './ParamBadgeItem.vue'

export default {
  name: 'EntryParamsItem',

  components: { ParamBadgeItem },

  props: {
    entryId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const entryParamManager = inject('entryParamManager')

    const hasParams = computed(() =>
      Object.keys(entryParamManager.getInputParamTypes(props.entryId)).length > 0 ||
      Object.keys(entryParamManager.getOutputParamTypes(props.entryId)).length > 0
    )

    const paramKind = ref('input')

    const paramItems = computed(() => {
      const types = paramKind.value === 'input'
        ? entryParamManager.getInputParamTypes(props.entryId)
        : entryParamManager.getOutputParamTypes(props.entryId)
      return Object.entries(types).map(([name, type]) => ({ name, type }))
    })

    return {
      hasParams,
      paramKind,
      paramItems,
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
</style>

<template>
  <g>
    <line
      :x1="laneX"
      :y1="y1"
      :x2="laneX"
      :y2="y2"
      class="connection-line"
      :class="lineTypeClass"
    />
    <foreignObject :x="laneX - 100" :y="y1 - 15" width="200" height="30">
      <div class="badge-container">
        <EntryParamItem
          :entryId="outputEntryId"
          :name="outputParamName"
          :paramCategory="outputParamCategory"
          :paramType="outputParamType"
          :isParamTypeVisible="false"
          :isParamLinkVisible="false"
        />
      </div>
    </foreignObject>
    <foreignObject :x="laneX - 100" :y="y2 - 15" width="200" height="30">
      <div class="badge-container">
        <EntryParamItem
          :entryId="inputEntryId"
          :name="inputParamName"
          :paramCategory="inputParamCategory"
          :paramType="inputParamType"
          :isParamTypeVisible="false"
          :isParamLinkVisible="false"
        />
      </div>
    </foreignObject>
  </g>
</template>

<script>
import { computed } from 'vue'
import EntryParamItem from './EntryParamItem.vue'

const LANE_WIDTH = 80

export default {
  name: 'ConnectionItem',
  components: { EntryParamItem },

  props: {
    laneIndex: {
      type: Number,
      required: true,
      validator: v => Number.isInteger(v) && v >= 0
    },
    y1: {
      type: Number,
      required: true
    },
    y2: {
      type: Number,
      required: true
    },
    outputParamName: {
      type: String,
      required: true
    },
    outputEntryId: {
      type: String,
      required: true
    },
    outputParamCategory: {
      type: String,
      required: true
    },
    outputParamType: {
      type: String,
      default: null
    },
    inputParamName: {
      type: String,
      required: true
    },
    inputEntryId: {
      type: String,
      required: true
    },
    inputParamCategory: {
      type: String,
      required: true
    },
    inputParamType: {
      type: String,
      default: null
    },
  },

  setup(props) {
    const laneX = computed(() => (props.laneIndex + 0.5) * LANE_WIDTH)
    const lineTypeClass = computed(() =>
      props.outputParamType ? `type-${props.outputParamType}` : null
    )

    return { laneX, lineTypeClass }
  }
}
</script>

<style scoped>
.connection-line {
  fill: none;
  stroke: #5a9fd4;
  stroke-width: 2;
}

.connection-line.type-boolean {
  stroke: var(--param-badge-bg-color-boolean);
}

.connection-line.type-integer {
  stroke: var(--param-badge-bg-color-integer);
}

.connection-line.type-real {
  stroke: var(--param-badge-bg-color-real);
}

.connection-line.type-string {
  stroke: var(--param-badge-bg-color-string);
}

.connection-line.type-image {
  stroke: var(--param-badge-bg-color-image);
}

.badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
}
</style>

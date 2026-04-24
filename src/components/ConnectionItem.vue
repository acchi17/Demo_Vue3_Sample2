<template>
  <g v-if="y1 != null && y2 != null">
    <line
      :x1="laneX"
      :y1="y1"
      :x2="laneX"
      :y2="y2"
      class="connection-line"
    />
    <g class="connection-badge">
      <rect
        :x="laneX - 30"
        :y="y1 - 10"
        width="60"
        height="20"
        rx="3"
      />
      <text
        :x="laneX"
        :y="y1 + 4"
        text-anchor="middle"
      >{{ outputParamName }}</text>
    </g>
    <g class="connection-badge">
      <rect
        :x="laneX - 30"
        :y="y2 - 10"
        width="60"
        height="20"
        rx="3"
      />
      <text
        :x="laneX"
        :y="y2 + 4"
        text-anchor="middle"
      >{{ inputParamName }}</text>
    </g>
  </g>
</template>

<script>
import { computed } from 'vue'

const LANE_WIDTH = 80

export default {
  name: 'ConnectionItem',

  props: {
    laneIndex: {
      type: Number,
      required: true
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
    inputParamName: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const laneX = computed(() => props.laneIndex * LANE_WIDTH)

    return { laneX }
  }
}
</script>

<style scoped>
.connection-line {
  fill: none;
  stroke: #5a9fd4;
  stroke-width: 2;
}

.connection-badge rect {
  fill: #1e2a3a;
  stroke: #5a9fd4;
  stroke-width: 1;
}

.connection-badge text {
  fill: #a0c8e8;
  font-size: 10px;
}
</style>

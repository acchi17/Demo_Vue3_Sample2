<template>
  <div class="spin-edit">
    <span class="spin-edit-icon"></span>
    <label class="spin-edit-label">{{ name }}</label>
    <input
      type="number"
      class="spin-edit-input"
      :min="min"
      :max="max"
      :step="effectiveStep"
      :value="value"
      :disabled="disabled"
      @change="onChange($event.target)"
    />
  </div>
</template>

<script>
export default {
  name: 'IntSpinEdit',

  props: {
    name:     { type: String, required: true },
    min:      { type: Number, default: null },
    max:      { type: Number, default: null },
    step:     { type: Number, default: null },
    value:    { type: Number, default: 0 },
    disabled: { type: Boolean, default: false }
  },

  computed: {
    effectiveStep() {
      return this.step !== null ? this.step : 1;
    }
  },

  methods: {
    onChange(target) {
      let val = parseInt(target.value, 10);
      if (this.min !== null) val = Math.max(Number(this.min), val);
      if (this.max !== null) val = Math.min(Number(this.max), val);
      target.value = val;
      this.$emit('update:value', val);
    }
  },

  emits: ['update:value']
}
</script>

<style scoped>
.spin-edit {
  display: flex;
  align-items: center;
  gap: 20px;
}

.spin-edit-icon {
  width: 28px;
  height: 28px;
  background-image: var(--scalar-int-param-icon);
  background-size: contain;
  background-repeat: no-repeat;
  flex-shrink: 0;
}

.spin-edit-label {
  min-width: 60px;
  font-size: 14px;
  color: #555;
}

.spin-edit-input {
  width: 90px;
  padding: 4px 4px;
  font-size: 14px;
  color: #555;
  border: 1px solid #bbb;
  border-radius: 3px;
}
</style>

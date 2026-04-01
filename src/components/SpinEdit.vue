<template>
  <div class="spin-edit">
    <label class="spin-edit-label">{{ name }}</label>
    <input
      type="number"
      class="spin-edit-input"
      :min="min"
      :max="max"
      :step="effectiveStep"
      :value="value"
      :disabled="disabled"
      @change="$emit('update:value', numberType === 'integer' ? parseInt($event.target.value, 10) : parseFloat($event.target.value))"
    />
  </div>
</template>

<script>
export default {
  name: 'SpinEdit',

  props: {
    name:       { type: String, required: true },
    numberType: { type: String, default: 'integer' }, // 'integer' or 'real'
    min:        { type: [Number, String], default: null },
    max:        { type: [Number, String], default: null },
    step:       { type: [Number, String], default: null },
    value:      { type: Number, default: 0 },
    disabled:   { type: Boolean, default: false }
  },

  computed: {
    effectiveStep() {
      if (this.step !== null) return this.step;
      return this.numberType === 'real' ? 0.1 : 1;
    }
  },

  emits: ['update:value']
}
</script>

<style scoped>
.spin-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spin-edit-label {
  min-width: 60px;
  font-size: 13px;
  color: #333;
}

.spin-edit-input {
  width: 90px;
  padding: 2px 4px;
  font-size: 13px;
  border: 1px solid #bbb;
  border-radius: 3px;
}
</style>
